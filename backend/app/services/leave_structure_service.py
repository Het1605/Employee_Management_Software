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
import calendar
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
        Calculates leave balance in real-time, respecting Year-End Resets (EXTEND/VOID/ENCASH).
        Fully dynamic: RE-PLAYS historical years to find accurate carry-forwards.
        """
        from app.db.models import LeaveRequest, LeaveDurationType, LeaveCategory
        from datetime import date
        import calendar as pycal

        assignment = db.query(LeaveAssignment).filter_by(user_id=user_id).first()
        if not assignment:
            empty = {"allocated": 0, "used": 0.0, "remaining": 0.0, "excess": 0.0, "encashable": 0.0}
            return {"PL": empty, "CL": empty, "SL": empty}

        structure = db.query(LeaveStructure).filter_by(id=assignment.structure_id).first()
        if not structure:
             empty = {"allocated": 0, "used": 0.0, "remaining": 0.0, "excess": 0.0, "encashable": 0.0}
             return {"PL": empty, "CL": empty, "SL": empty}

        # Resolve target date
        today = date.today()
        target_year = year if year else today.year
        target_month = month if month else today.month
        
        assigned_date = assignment.assigned_at.date() if hasattr(assignment.assigned_at, 'date') else assignment.assigned_at
        start_year = assigned_date.year

        response = {}
        for detail in structure.details:
            category = detail.leave_type.value
            policy = detail.reset_policy
            yearly_total = float(detail.total_days)

            # --- simulation state ---
            total_carry_forward = 0.0
            encashable_days = 0.0
            
            # Final output placeholders for the target month
            final_allocated = 0.0
            final_used = 0.0
            final_remaining = 0.0
            final_excess = 0.0

            # --- Loop Years from Start to Target ---
            for y in range(start_year, target_year + 1):
                y_m_start = assigned_date.month if y == start_year else 1
                # For historical years we simulate till Dec, for target year till target_month
                y_m_end = 12 if y < target_year else target_month
                
                if detail.allocation_type == AllocationType.MONTHLY:
                    # MONTHLY Rolling accumulation
                    current_y_balance = total_carry_forward
                    
                    for m in range(y_m_start, y_m_end + 1):
                        monthly_quota = float(_get_monthly_allocation(yearly_total, m))
                        
                        # Usage for this specific month
                        m_start = date(y, m, 1)
                        _, last_d = pycal.monthrange(y, m)
                        m_end = date(y, m, last_d)
                        
                        m_requests = db.query(LeaveRequest).filter(
                            LeaveRequest.user_id == user_id,
                            LeaveRequest.leave_category == LeaveCategory[detail.leave_type.value],
                            LeaveRequest.status == "approved",
                            LeaveRequest.start_date >= m_start,
                            LeaveRequest.start_date <= m_end
                        ).all()
                        
                        m_used = 0.0
                        for l in m_requests:
                            if l.leave_duration_type == LeaveDurationType.HALF_DAY:
                                m_used += float(l.total_days) * 0.5
                            else:
                                m_used += float(l.total_days)
                        
                        before_m = current_y_balance + monthly_quota
                        after_m = before_m - m_used
                        excess_m = abs(min(0, after_m))
                        after_m = max(0, after_m) # Reset after excess
                        
                        # DEBUG LOGS for simulation
                        print(f"[MONTHLY FLOW] User:{user_id} Type:{category} Month:{m}/{y}")
                        print(f"  Prev: {current_y_balance} | Added: {monthly_quota} | Used: {m_used} | New: {after_m} | Excess: {excess_m}")
                        
                        # Capture target metrics
                        if y == target_year and m == target_month:
                            final_allocated = before_m
                            final_used = m_used
                            final_remaining = after_m
                            final_excess = excess_m
                            
                        current_y_balance = after_m
                        
                    # Year-End Transition
                    if y < target_year:
                        if policy == ResetPolicy.EXTEND:
                            total_carry_forward = current_y_balance
                        elif policy == ResetPolicy.ENCASH:
                            total_carry_forward = 0.0
                            if y == target_year - 1: encashable_days = current_y_balance
                        else: # VOID
                            total_carry_forward = 0.0
                    else:
                        # For the return dictionary
                        pass

                else:
                    # YEARLY Fixed Pool (with pro-rating for start year)
                    # 1. Total pool for year y (sum of all monthly allotments from start_m to 12)
                    y_total_quota = 0.0
                    for m in range(y_m_start, 13):
                        y_total_quota += float(_get_monthly_allocation(yearly_total, m))
                        
                    # 2. Cumulative usage till end of y or target_month
                    y_usage_start = date(y, 1, 1) if y > start_year else assigned_date
                    curr_y_limit = date(y, y_m_end, pycal.monthrange(y, y_m_end)[1])
                    
                    y_requests = db.query(LeaveRequest).filter(
                        LeaveRequest.user_id == user_id,
                        LeaveRequest.leave_category == LeaveCategory[detail.leave_type.value],
                        LeaveRequest.status == "approved",
                        LeaveRequest.start_date >= y_usage_start,
                        LeaveRequest.start_date <= curr_y_limit
                    ).all()
                    
                    y_used_total = 0.0
                    for l in y_requests:
                        if l.leave_duration_type == LeaveDurationType.HALF_DAY:
                            y_used_total += float(l.total_days) * 0.5
                        else:
                            y_used_total += float(l.total_days)
                            
                    y_rem = max(0, y_total_quota + total_carry_forward - y_used_total)
                    
                    if y == target_year:
                        # For the monthly slice in the API:
                        # allocated = remaining before current month usage
                        # used = current month usage
                        m_start = date(y, target_month, 1)
                        m_end = date(y, target_month, pycal.monthrange(y, target_month)[1])
                        m_requests = db.query(LeaveRequest).filter(
                            LeaveRequest.user_id == user_id,
                            LeaveRequest.leave_category == LeaveCategory[detail.leave_type.value],
                            LeaveRequest.status == "approved",
                            LeaveRequest.start_date >= m_start,
                            LeaveRequest.start_date <= m_end
                        ).all()
                        m_used = sum(float(l.total_days) * (0.5 if l.leave_duration_type == LeaveDurationType.HALF_DAY else 1.0) for l in m_requests)
                        
                        allocated_before = max(0, y_total_quota + total_carry_forward - (y_used_total - m_used))
                        final_allocated = allocated_before
                        final_used = m_used
                        final_remaining = max(0, allocated_before - m_used)
                        final_excess = abs(min(0, allocated_before - m_used))
                        
                        print(f"[YEARLY FLOW] User:{user_id} Type:{category}")
                        print(f"  Total: {y_total_quota} | Used Till Now: {y_used_total} | Remaining: {y_rem}")
                    
                    # Year-End Transition (only on Dec 31)
                    if y < target_year:
                        y_usage_full = 0.0
                        y_full_end = date(y, 12, 31)
                        y_full_requests = db.query(LeaveRequest).filter(
                            LeaveRequest.user_id == user_id,
                            LeaveRequest.leave_category == LeaveCategory[detail.leave_type.value],
                            LeaveRequest.status == "approved",
                            LeaveRequest.start_date >= y_usage_start,
                            LeaveRequest.start_date <= y_full_end
                        ).all()
                        y_usage_full = sum(float(l.total_days) * (0.5 if l.leave_duration_type == LeaveDurationType.HALF_DAY else 1.0) for l in y_full_requests)
                        
                        y_final_rem = max(0, y_total_quota + total_carry_forward - y_usage_full)
                        if policy == ResetPolicy.EXTEND:
                            total_carry_forward = y_final_rem
                        elif policy == ResetPolicy.ENCASH:
                            total_carry_forward = 0.0
                            if y == target_year - 1: encashable_days = y_final_rem
                        else:
                            total_carry_forward = 0.0

            response[category] = {
                "allocated": round(final_allocated, 2),
                "used": round(final_used, 2),
                "remaining": round(final_remaining, 2),
                "excess": round(final_excess, 2),
                "encashable": round(encashable_days, 2)
            }

        return response


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
