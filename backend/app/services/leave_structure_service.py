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
    def get_runtime_leave_balance(db: Session, user_id: int, as_of_date: Optional[date] = None) -> dict:
        """
        Calculates leave balance in real-time, respecting Year-End Resets.
        1. Find assignment.
        2. For each category, find the LATEST LeaveReset record.
        3. If reset exists, calculation start = Jan 1 of (reset_year + 1), 
           initial balance = reset.carried_forward_amount.
        4. Else, start = assignment.assigned_at, initial = 0.
        5. Sum allocation from start to target_date.
        6. Sum usage where start_date >= start and start_date <= target_date.
        """
        from app.db.models import LeaveRequest
        from app.models.leave_structure import LeaveReset
        from sqlalchemy import desc

        assignment = db.query(LeaveAssignment).filter_by(user_id=user_id).first()
        if not assignment:
            empty = {"allocated": 0, "used": 0.0, "remaining": 0.0, "excess": 0.0}
            return {"PL": empty, "CL": empty, "SL": empty}

        structure = db.query(LeaveStructure).filter_by(id=assignment.structure_id).first()
        if not structure:
             empty = {"allocated": 0, "used": 0.0, "remaining": 0.0, "excess": 0.0}
             return {"PL": empty, "CL": empty, "SL": empty}

        target_date = as_of_date if as_of_date else date.today()
        
        response = {}
        for detail in structure.details:
            category = detail.leave_type.value
            
            # --- Reset Boundary Logic ---
            latest_reset = db.query(LeaveReset).filter(
                LeaveReset.user_id == user_id,
                LeaveReset.leave_type == detail.leave_type,
                LeaveReset.reset_year < target_date.year
            ).order_by(desc(LeaveReset.reset_year)).first()

            if latest_reset:
                calc_start = date(latest_reset.reset_year + 1, 1, 1)
                # Only EXTEND policy results in an initial carried-forward balance
                initial_balance = float(latest_reset.affected_days) if latest_reset.policy_action == ResetPolicy.EXTEND else 0.0
            else:
                # Normalize to date to avoid TypeError when comparing with target_date
                calc_start = assignment.assigned_at.date() if hasattr(assignment.assigned_at, 'date') else assignment.assigned_at
                initial_balance = 0.0

            # 3. Allocation Logic (since calc_start)
            yearly_total = float(detail.total_days)
            allocated = initial_balance

            if target_date >= calc_start:
                if detail.allocation_type == AllocationType.YEARLY:
                    # Full allocation if within the same year as target_date or later
                    allocated += yearly_total
                else:
                    # MONTHLY: Sum from calc_start to target_date
                    curr_y, curr_m = calc_start.year, calc_start.month
                    while (curr_y < target_date.year) or (curr_y == target_date.year and curr_m <= target_date.month):
                        month_alloc = float(_get_monthly_allocation(yearly_total, curr_m))
                        allocated += month_alloc
                        curr_m += 1
                        if curr_m > 12:
                            curr_m = 1
                            curr_y += 1

            # 5. Used Leaves (since calc_start)
            from app.db.models import LeaveRequest, LeaveDurationType, LeaveCategory
            
            approved_requests = db.query(LeaveRequest).filter(
                LeaveRequest.user_id == user_id,
                LeaveRequest.leave_category == LeaveCategory[detail.leave_type.value],
                LeaveRequest.status == "approved",
                LeaveRequest.start_date >= calc_start,
                LeaveRequest.start_date <= target_date
            ).all()

            used = 0.0
            for l in approved_requests:
                if l.leave_duration_type == LeaveDurationType.HALF_DAY:
                    used += float(l.total_days) * 0.5
                else:
                    used += float(l.total_days)

            remaining = float(allocated - used)
            excess = 0.0
            if remaining < 0:
                excess = abs(remaining)
                remaining = 0.0
                
            response[category] = {
                "allocated": allocated,
                "used": used,
                "remaining": remaining,
                "excess": excess
            }

        return response

    @staticmethod
    def run_year_end_reset(db: Session, year: int, company_id: Optional[int] = None) -> dict:
        """
        Finalizes the year for all assigned users.
        Triggered on Dec 31st.
        1. Fetch all users with LeaveAssignment.
        2. For each user/category, get balance as of Dec 31st.
        3. Apply ResetPolicy:
           - EXTEND: carried_forward = remaining
           - VOID: voided = remaining, carried_forward = 0
           - ENCASH: encashed = remaining, carried_forward = 0, calc payout
        4. Save LeaveReset record.
        """
        from app.models.leave_structure import LeaveReset, ResetPolicy, LeaveType
        from app.db.models import UserSalaryStructure, SalaryStructureDetail, ComponentType
        from app.services.document_service import DocumentService

        target_date = date(year, 12, 31)
        query = db.query(LeaveAssignment)
        if company_id:
            query = query.filter_by(company_id=company_id)
        assignments = query.all()
        results = {"total_processed": 0, "encashments_created": 0}

        for ass in assignments:
            user_id = ass.user_id
            balances = LeaveStructureService.get_runtime_leave_balance(db, user_id, target_date)
            structure = ass.structure
            
            # Find Basic Salary for encashment formula
            basic_monthly = Decimal('0')
            salary_ass = db.query(UserSalaryStructure).filter_by(user_id=user_id).first()
            if salary_ass:
                for d in salary_ass.structure.details:
                    if "basic" in d.component.name.lower():
                        basic_monthly = (d.percentage / Decimal('100')) * salary_ass.ctc / Decimal('12')
                        break

            # Calculate December Working Days (Denominator for encashment)
            from app.services.calendar_service import CalendarService
            dec_working_days = CalendarService.get_working_days_count(db, ass.company_id, year, 12)
            if dec_working_days == 0:
                dec_working_days = 30 # absolute safety fallback

            for category_str, bal in balances.items():
                cat_enum = LeaveType[category_str]
                # Find policy for this category
                detail = next((d for d in structure.details if d.leave_type == cat_enum), None)
                if not detail: continue

                policy = detail.reset_policy
                rem = Decimal(str(bal["remaining"]))
                
                reset_rec = LeaveReset(
                    user_id=user_id,
                    company_id=ass.company_id,
                    leave_type=cat_enum,
                    reset_year=year,
                    reset_date=target_date,
                    policy_action=policy,
                    affected_days=rem
                )

                if policy == ResetPolicy.ENCASH and rem > 0 and basic_monthly > 0:
                    per_day_basic = basic_monthly / Decimal(str(dec_working_days))
                    reset_rec.payout_amount = rem * per_day_basic
                    results["encashments_created"] += 1

                db.add(reset_rec)
            
            results["total_processed"] += 1

        db.commit()
        return results

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
