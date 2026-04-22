"""
Leave Structure Service
=======================
Contains all business logic for:
  - Creating leave structures
  - Assigning structures to users  →  initializes leave_balances
  - Monthly allocation cron        →  run_monthly_leave_allocation()
  - Year-end reset cron            →  run_year_end_reset()
  - Leave deduction helper         →  deduct_leave()

Design principles:
  - All DB mutations use the supplied Session; callers manage commit/rollback.
  - Cron helpers are designed to be called from APScheduler / Celery / any
    external scheduler — they open and close their own sessions.
  - No salary logic lives here.
"""

from __future__ import annotations

import math
import logging
import calendar as pycal
from datetime import date, datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional

from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import User
from app.models.leave_structure import (
    AllocationType,
    LeaveAssignment,
    LeaveStructure,
    LeaveStructureDetail,
    LeaveType,
    ResetPolicy,
)
from app.schemas.leave_structure import (
    LeaveAssignmentCreate,
    LeaveAssignmentUpdate,
    LeaveStructureCreate,
    LeaveStructureUpdate,
)

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────

def _now_utc() -> datetime:
    return datetime.now(tz=timezone.utc)


# Smallest deductible leave unit — prevents sub-half-day deductions
_MIN_LEAVE_UNIT = Decimal("0.5")


def _get_monthly_allocation(total_days: float, month_index: int) -> Decimal:
    """
    Calculate allocation for a specific month (1-12).
    - base = total // 12
    - extra = total % 12
    - If month_index <= extra, return base + 1, else return base.
    
    If total_days is not an integer (e.g., 15.5), the remainder is accounted for
    in the month_index logic if possible, or we maintain float precision.
    """
    base = float(total_days) // 12
    extra = float(total_days) % 12
    
    alloc = base
    if 1 <= month_index <= extra:
        alloc += 1
    elif month_index == 12 and extra > 0 and extra < 1:
        # Special case: if there's a fractional remainder < 1, add it to the last month
        alloc += extra
        
    return Decimal(str(alloc))


def _get_current_year_month() -> tuple[int, int]:
    now = _now_utc()
    return now.year, now.month


# _get_or_create_balance removed as balance table is no longer used


# ─────────────────────────────────────────────────────────────
# 1. Create Leave Structure
# ─────────────────────────────────────────────────────────────

class LeaveStructureService:

    @staticmethod
    def create_structure(db: Session, payload: LeaveStructureCreate) -> LeaveStructure:
        """
        Persist a new leave structure + 3 detail rows (PL, CL, SL).
        Raises ValueError on duplicate name within the same company.
        """
        existing = db.query(LeaveStructure).filter_by(
            company_id=payload.company_id, 
            name=payload.name
        ).first()
        if existing:
            raise ValueError(f"Leave structure '{payload.name}' already exists for this company.")

        structure = LeaveStructure(
            company_id=payload.company_id,
            name=payload.name
        )
        db.add(structure)
        db.flush()  # obtain structure.id before adding details

        for item in payload.details:
            detail = LeaveStructureDetail(
                structure_id=structure.id,
                leave_type=item.leave_type,
                total_days=item.total_days,
                allocation_type=item.allocation_type,
                reset_policy=item.reset_policy,
            )
            db.add(detail)

        db.commit()
        db.refresh(structure)
        return structure

    # ──────────────────────────────────────────
    # 2. Get All Structures
    # ──────────────────────────────────────────

    @staticmethod
    def get_all_structures(db: Session, company_id: Optional[int] = None) -> List[LeaveStructure]:
        query = db.query(LeaveStructure)
        if company_id is not None:
            query = query.filter_by(company_id=company_id)
        return query.order_by(LeaveStructure.created_at.desc()).all()

    @staticmethod
    def get_structure_by_id(db: Session, structure_id: int) -> Optional[LeaveStructure]:
        return db.query(LeaveStructure).filter_by(id=structure_id).first()

    # ──────────────────────────────────────────
    # 3. Assign Structure to User + Initialize Balances
    # ──────────────────────────────────────────

    @staticmethod
    def assign_structure(db: Session, payload: LeaveAssignmentCreate) -> LeaveAssignment:
        """
        Assign a leave structure to a user.
        - If the user has a previous assignment, it is overwritten.
        - Initialises leave_balance rows for the current period.
        """
        # Validate user exists
        user = db.query(User).filter_by(id=payload.user_id).first()
        if not user:
            raise ValueError(f"User {payload.user_id} not found.")

        # Validate structure exists and belongs to the company
        structure = db.query(LeaveStructure).filter_by(
            id=payload.structure_id, 
            company_id=payload.company_id
        ).first()
        if not structure:
            raise ValueError(f"Leave structure {payload.structure_id} not found for this company.")

        # Remove existing assignment (one active per user)
        existing = db.query(LeaveAssignment).filter_by(user_id=payload.user_id).first()
        if existing:
            db.delete(existing)
            db.flush()

        # Create new assignment
        assignment = LeaveAssignment(
            company_id=payload.company_id,
            user_id=payload.user_id,
            structure_id=payload.structure_id,
        )
        db.add(assignment)
        db.flush()

        # Assignment created; balances are now calculated at runtime.

        db.commit()
        db.refresh(assignment)
        return assignment

    # ──────────────────────────────────────────
    # 4. Get Runtime Leave Balance (DYNAMIC)
    # ──────────────────────────────────────────

    @staticmethod
    def get_runtime_leave_balance(db: Session, user_id: int, month: Optional[int] = None, year: Optional[int] = None) -> dict:
        """
        Calculates leave balance in real-time.
        Implements rigorous Remaining Carry-Forward logic per month.
        """
        from app.db.models import LeaveRequest, LeaveDurationType, LeaveCategory, LeaveBalance
        from app.models.leave_structure import AllocationType, ResetPolicy
        from datetime import date

        assignment = db.query(LeaveAssignment).filter_by(user_id=user_id).first()
        empty = {"allocated": 0, "used": 0.0, "remaining": 0.0, "excess": 0.0, "encashable": 0.0, "has_snapshot": False}
        
        if not assignment:
            return {"PL": empty.copy(), "CL": empty.copy(), "SL": empty.copy()}

        structure = db.query(LeaveStructure).filter_by(id=assignment.structure_id).first()
        if not structure:
             return {"PL": empty.copy(), "CL": empty.copy(), "SL": empty.copy()}

        today = date.today()
        target_year = year if year else today.year
        target_month = month if month else today.month
        
        response = {}
        for detail in structure.details:
            category = detail.leave_type.value
            yearly_total = float(detail.total_days)
            
            # Deterministic Integer Distribution
            base_allocation = int(detail.total_days) // 12
            extra_allocation = int(detail.total_days) % 12
            policy = detail.reset_policy
            
            snapshot = db.query(LeaveBalance).filter_by(user_id=user_id, leave_type=category).first()
            has_snapshot = snapshot is not None
            
            if snapshot:
                # If target is STRICTLY before snapshot, return empty
                if target_year < snapshot.set_year or (target_year == snapshot.set_year and target_month < snapshot.set_month):
                    response[category] = empty.copy()
                    continue
                    
                start_year = snapshot.set_year
                start_month = snapshot.set_month
                carry_forward = float(snapshot.balance)
            else:
                start_year = target_year
                start_month = 1
                carry_forward = 0.0

            encashable_days = 0.0
            
            y = start_year
            m = start_month
            
            final_allocated = 0.0
            final_used = 0.0
            final_remaining = 0.0
            final_excess = 0.0
            
            while True:
                # Filter usage strictly bounded to month `m` of year `y`
                m_start = date(y, m, 1)
                m_end = date(y, m, pycal.monthrange(y, m)[1])
                
                requests = db.query(LeaveRequest).filter(
                    LeaveRequest.user_id == user_id,
                    LeaveRequest.leave_category == LeaveCategory[category],
                    LeaveRequest.status == "approved",
                    LeaveRequest.start_date >= m_start,
                    LeaveRequest.start_date <= m_end
                ).all()
                
                m_used = 0.0
                for req in requests:
                    mod = 0.5 if req.leave_duration_type == LeaveDurationType.HALF_DAY else 1.0
                    m_used += float(req.total_days) * mod

                if detail.allocation_type == AllocationType.MONTHLY:
                    m_allocated = float(base_allocation + 1) if m <= extra_allocation else float(base_allocation)
                    
                    if snapshot and y == snapshot.set_year and m == snapshot.set_month:
                        m_available = carry_forward # Baseline snapshot IS the available pool for that month
                    else:
                        m_available = carry_forward + m_allocated
                else:
                    # YEARLY SL
                    is_pool_injected = (m == 1) or (snapshot and y == snapshot.set_year and m == snapshot.set_month)
                    m_allocated = yearly_total if is_pool_injected else 0.0
                    if snapshot and y == snapshot.set_year and m == snapshot.set_month:
                        m_available = carry_forward
                    else:
                        m_available = carry_forward + m_allocated
                
                m_remaining = max(0.0, m_available - m_used)
                m_excess = max(0.0, m_used - m_available)
                
                # Check target breaking condition
                if y == target_year and m == target_month:
                    final_allocated = m_allocated
                    final_used = m_used
                    final_remaining = m_remaining
                    final_excess = m_excess
                    # We can break here since we reached the target point
                    break
                    
                # Post-Month Advancement (Rollover)
                if m < 12:
                    carry_forward = m_remaining
                    m += 1
                else:
                    # Year Boundary
                    if policy == ResetPolicy.EXTEND:
                        carry_forward = m_remaining
                    elif policy == ResetPolicy.ENCASH:
                        carry_forward = 0.0
                        if y == target_year - 1:
                            encashable_days = m_remaining
                    else:
                        carry_forward = 0.0
                    y += 1
                    m = 1
                    
                if y > target_year:
                    break

            response[category] = {
                "allocated": round(final_allocated, 2),
                "used": round(final_used, 2),
                "remaining": round(final_remaining, 2),
                "excess": round(final_excess, 2),
                "encashable": round(encashable_days, 2),
                "has_snapshot": has_snapshot
            }

        return response

    # ──────────────────────────────────────────
    # Set Manual Snapshot Balance
    # ──────────────────────────────────────────

    @staticmethod
    def set_manual_balance(db: Session, user_id: int, balances, action_by_id: int) -> List[str]:
        from app.db.models import LeaveBalance, LeaveActivityLog
        
        user = db.query(User).filter_by(id=user_id).first()
        if not user:
            raise ValueError(f"User {user_id} not found.")
            
        today = date.today()
        current_month = today.month
        current_year = today.year
        
        balance_dict = balances.dict() if hasattr(balances, "dict") else balances
        updated_types = []

        for leave_type, new_balance in balance_dict.items():
            if new_balance is None: continue
            
            existing = db.query(LeaveBalance).filter_by(user_id=user_id, leave_type=leave_type).first()
            
            # Skip if balance is unchanged to avoid duplicate audit logs
            new_bal_dec = Decimal(str(new_balance))
            if existing and existing.balance == new_bal_dec:
                continue
                
            old_balance = existing.balance if existing else None
            
            # Audit row
            audit = LeaveActivityLog(
                user_id=user_id,
                leave_type=leave_type,
                old_balance=old_balance,
                new_balance=new_balance,
                action="BALANCE_SET",
                action_by=action_by_id,
                impact_month=f"{pycal.month_name[current_month].upper()} {current_year}"
            )
            db.add(audit)
            
            # Upsert
            if existing:
                existing.balance = new_balance
                existing.set_month = current_month
                existing.set_year = current_year
            else:
                new_record = LeaveBalance(
                    user_id=user_id,
                    leave_type=leave_type,
                    balance=new_balance,
                    set_month=current_month,
                    set_year=current_year
                )
                db.add(new_record)
                
            updated_types.append(leave_type)
            
        db.commit()
        return updated_types


    @staticmethod
    def get_all_assignments(db: Session, company_id: Optional[int] = None) -> List[LeaveAssignment]:
        """Returns all leave assignments."""
        query = db.query(LeaveAssignment)
        if company_id is not None:
            query = query.filter_by(company_id=company_id)
        return query.order_by(LeaveAssignment.assigned_at.desc()).all()

    # ──────────────────────────────────────────
    # 5. Update Assignment
    # ──────────────────────────────────────────

    @staticmethod
    def update_assignment(
        db: Session, user_id: int, payload: LeaveAssignmentUpdate
    ) -> LeaveAssignment:
        assignment = db.query(LeaveAssignment).filter_by(user_id=user_id).first()
        if not assignment:
            raise ValueError(f"No leave assignment found for user {user_id}.")

        new_structure = db.query(LeaveStructure).filter_by(
            id=payload.structure_id,
            company_id=assignment.company_id
        ).first()
        if not new_structure:
            raise ValueError(f"Leave structure {payload.structure_id} not found.")

        assignment.structure_id = payload.structure_id
        db.commit()
        db.refresh(assignment)
        return assignment

    # ──────────────────────────────────────────
    # 6. Delete Assignment
    # ──────────────────────────────────────────

    @staticmethod
    def delete_assignment(db: Session, user_id: int) -> None:
        assignment = db.query(LeaveAssignment).filter_by(user_id=user_id).first()
        if not assignment:
            raise ValueError(f"No assignment found for user {user_id}.")

        db.delete(assignment)
        db.commit()

    # ──────────────────────────────────────────
    # 7. Update Leave Structure
    # ──────────────────────────────────────────

    @staticmethod
    def update_structure(
        db: Session, structure_id: int, payload: LeaveStructureUpdate
    ) -> LeaveStructure:
        structure = db.query(LeaveStructure).filter_by(id=structure_id).first()
        if not structure:
            raise ValueError(f"Leave structure {structure_id} not found.")

        # Rename if requested — check uniqueness within the same company
        if payload.name is not None:
            clash = (
                db.query(LeaveStructure)
                .filter(
                    LeaveStructure.name == payload.name,
                    LeaveStructure.id != structure_id,
                    LeaveStructure.company_id == structure.company_id
                )
                .first()
            )
            if clash:
                raise ValueError(f"Name '{payload.name}' already in use in this company.")
            structure.name = payload.name

        # Update detail rows if provided
        if payload.details is not None:
            detail_map = {d.leave_type: d for d in payload.details}
            for detail in structure.details:
                if detail.leave_type in detail_map:
                    item = detail_map[detail.leave_type]
                    detail.total_days      = item.total_days
                    detail.allocation_type = item.allocation_type
                    detail.reset_policy    = item.reset_policy

        db.commit()
        db.refresh(structure)
        return structure

    # ──────────────────────────────────────────
    # 8. Delete Leave Structure
    # ──────────────────────────────────────────

    @staticmethod
    def delete_structure(db: Session, structure_id: int) -> None:
        structure = db.query(LeaveStructure).filter_by(id=structure_id).first()
        if not structure:
            raise ValueError(f"Leave structure {structure_id} not found.")

        assigned_count = (
            db.query(LeaveAssignment)
            .filter_by(structure_id=structure_id)
            .count()
        )
        if assigned_count > 0:
            raise ValueError("Structure is currently assigned to users.")

        db.delete(structure)
        db.commit()
