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
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional

from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import User
from app.models.leave_structure import (
    AllocationType,
    LeaveAssignment,
    LeaveBalance,
    LeaveStructure,
    LeaveStructureDetail,
    LeaveType,
    ResetPolicy,
)
from app.schemas.leave_structure import (
    LeaveAssignmentCreate,
    LeaveAssignmentUpdate,
    LeaveDeductRequest,
    LeaveStructureCreate,
    LeaveStructureUpdate,
)


# ─────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────

def _now_utc() -> datetime:
    return datetime.now(tz=timezone.utc)


# Smallest deductible leave unit — prevents sub-half-day deductions
_MIN_LEAVE_UNIT = Decimal("0.5")


def _monthly_value(total_days: int) -> Decimal:
    """
    Compute monthly credit using pure Decimal arithmetic to avoid float drift.
    Formula: total_days / 12, rounded to 2 decimal places.
    Examples: 12 days → 1.00 | 15 days → 1.25 | 7 days → 0.58
    """
    return (Decimal(str(total_days)) / Decimal("12")).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )


def _get_current_year_month() -> tuple[int, int]:
    now = _now_utc()
    return now.year, now.month


def _get_or_create_balance(
    db: Session,
    user_id: int,
    leave_type: LeaveType,
    year: int,
    month: Optional[int],
) -> LeaveBalance:
    """Fetch existing balance row, creating one (un-committed) if absent."""
    balance = (
        db.query(LeaveBalance)
        .filter_by(user_id=user_id, leave_type=leave_type, year=year, month=month)
        .first()
    )
    if not balance:
        balance = LeaveBalance(
            user_id=user_id,
            leave_type=leave_type,
            year=year,
            month=month,
            total_allocated=Decimal("0"),
            used=Decimal("0"),
            remaining=Decimal("0"),
        )
        db.add(balance)
    return balance


# ─────────────────────────────────────────────────────────────
# 1. Create Leave Structure
# ─────────────────────────────────────────────────────────────

class LeaveStructureService:

    @staticmethod
    def create_structure(db: Session, payload: LeaveStructureCreate) -> LeaveStructure:
        """
        Persist a new leave structure + 3 detail rows (PL, CL, SL).
        Raises ValueError on duplicate name.
        """
        existing = db.query(LeaveStructure).filter_by(name=payload.name).first()
        if existing:
            raise ValueError(f"Leave structure '{payload.name}' already exists.")

        structure = LeaveStructure(name=payload.name)
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
    def get_all_structures(db: Session) -> List[LeaveStructure]:
        return db.query(LeaveStructure).order_by(LeaveStructure.created_at.desc()).all()

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

        # Validate structure exists
        structure = db.query(LeaveStructure).filter_by(id=payload.structure_id).first()
        if not structure:
            raise ValueError(f"Leave structure {payload.structure_id} not found.")

        # Remove existing assignment (one active per user)
        existing = db.query(LeaveAssignment).filter_by(user_id=payload.user_id).first()
        if existing:
            db.delete(existing)
            db.flush()

        # Create new assignment
        assignment = LeaveAssignment(
            user_id=payload.user_id,
            structure_id=payload.structure_id,
        )
        db.add(assignment)
        db.flush()

        # Initialise balances
        LeaveStructureService._initialize_balances(db, payload.user_id, structure)

        db.commit()
        db.refresh(assignment)
        return assignment

    # ──────────────────────────────────────────
    # Internal: balance initialisation
    # ──────────────────────────────────────────

    @staticmethod
    def _initialize_balances(
        db: Session, user_id: int, structure: LeaveStructure
    ) -> None:
        year, month = _get_current_year_month()

        for detail in structure.details:
            if detail.allocation_type == AllocationType.YEARLY:
                # Single row per year; month = NULL
                balance = _get_or_create_balance(
                    db, user_id, detail.leave_type, year, month=None
                )
                alloc = Decimal(str(detail.total_days))
                # Only set if not already allocated (idempotent re-assignment)
                if balance.total_allocated == Decimal("0"):
                    balance.total_allocated = alloc
                    balance.remaining = alloc

            elif detail.allocation_type == AllocationType.MONTHLY:
                # Credit the current month's slice
                monthly = _monthly_value(detail.total_days)
                balance = _get_or_create_balance(
                    db, user_id, detail.leave_type, year, month=month
                )
                if balance.total_allocated == Decimal("0"):
                    balance.total_allocated = monthly
                    balance.remaining = monthly

    # ──────────────────────────────────────────
    # 4. Get User Leave Balances
    # ──────────────────────────────────────────

    @staticmethod
    def get_balances(db: Session, user_id: int) -> List[LeaveBalance]:
        """
        Returns ALL balance rows for the user (all years, all months).
        Callers may filter further (e.g. current year only).
        """
        return (
            db.query(LeaveBalance)
            .filter_by(user_id=user_id)
            .order_by(LeaveBalance.leave_type, LeaveBalance.year, LeaveBalance.month)
            .all()
        )

    @staticmethod
    def get_current_balances(db: Session, user_id: int) -> List[LeaveBalance]:
        """Returns only the current year/month balances (convenience helper)."""
        year, month = _get_current_year_month()

        # We want YEARLY rows (month=NULL for current year) + MONTHLY row for this month
        from sqlalchemy import or_, and_

        return (
            db.query(LeaveBalance)
            .filter(
                LeaveBalance.user_id == user_id,
                LeaveBalance.year == year,
                or_(
                    LeaveBalance.month.is_(None),
                    LeaveBalance.month == month,
                ),
            )
            .order_by(LeaveBalance.leave_type)
            .all()
        )

    @staticmethod
    def get_all_assignments(db: Session) -> List[LeaveAssignment]:
        """Returns all leave assignments in the system."""
        return db.query(LeaveAssignment).order_by(LeaveAssignment.assigned_at.desc()).all()

    # ──────────────────────────────────────────
    # 5. Leave Deduction
    # ──────────────────────────────────────────

    @staticmethod
    def deduct_leave(db: Session, request: LeaveDeductRequest) -> LeaveBalance:
        """
        Deduct `days` from the user's active balance for the given leave category.
        Raises ValueError if insufficient balance.

        Deduction priority:
          - For MONTHLY leave types → deduct from current month's row
          - For YEARLY leave types  → deduct from the current year row (month=NULL)
        """
        year, month = _get_current_year_month()

        # Determine which row to deduct from
        assignment = db.query(LeaveAssignment).filter_by(user_id=request.user_id).first()
        if not assignment:
            raise ValueError(f"User {request.user_id} has no leave structure assigned.")

        detail = (
            db.query(LeaveStructureDetail)
            .filter_by(
                structure_id=assignment.structure_id,
                leave_type=request.leave_category,
            )
            .first()
        )
        if not detail:
            raise ValueError(
                f"Leave type {request.leave_category.value} not found in assigned structure."
            )

        target_month = month if detail.allocation_type == AllocationType.MONTHLY else None

        balance = (
            db.query(LeaveBalance)
            .filter_by(
                user_id=request.user_id,
                leave_type=request.leave_category,
                year=year,
                month=target_month,
            )
            .first()
        )
        if not balance:
            raise ValueError(
                f"No balance record found for user {request.user_id} / "
                f"{request.leave_category.value} for this period."
            )

        # Guard 1: user must hold at least the minimum leave unit (0.5)
        if balance.remaining < _MIN_LEAVE_UNIT:
            raise ValueError(
                f"No {request.leave_category.value} balance remaining. "
                f"Minimum required: {_MIN_LEAVE_UNIT} day(s), "
                f"available: {balance.remaining}"
            )

        # Guard 2: remaining must cover the full requested amount
        if balance.remaining < request.days:
            raise ValueError(
                f"Insufficient {request.leave_category.value} balance. "
                f"Available: {balance.remaining}, requested: {request.days}"
            )

        days = request.days.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        balance.used      = (balance.used + days).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        balance.remaining = (balance.remaining - days).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        db.commit()
        db.refresh(balance)
        return balance

    # ──────────────────────────────────────────
    # 6. Reverse Deduction (on leave rejection / cancellation)
    # ──────────────────────────────────────────

    @staticmethod
    def reverse_deduction(db: Session, request: LeaveDeductRequest) -> LeaveBalance:
        """
        Add back `days` to the user's balance.  Called when a leave is rejected
        or cancelled AFTER having been approved-and-deducted.
        """
        year, month = _get_current_year_month()

        assignment = db.query(LeaveAssignment).filter_by(user_id=request.user_id).first()
        if not assignment:
            raise ValueError(f"User {request.user_id} has no leave structure assigned.")

        detail = (
            db.query(LeaveStructureDetail)
            .filter_by(
                structure_id=assignment.structure_id,
                leave_type=request.leave_category,
            )
            .first()
        )
        if not detail:
            raise ValueError(
                f"Leave type {request.leave_category.value} not found in assigned structure."
            )

        target_month = month if detail.allocation_type == AllocationType.MONTHLY else None

        balance = (
            db.query(LeaveBalance)
            .filter_by(
                user_id=request.user_id,
                leave_type=request.leave_category,
                year=year,
                month=target_month,
            )
            .first()
        )
        if not balance:
            raise ValueError("Balance record not found for reversal.")

        days = request.days.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        balance.used = max(
            Decimal("0"),
            (balance.used - days).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
        )
        balance.remaining = (balance.remaining + days).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        db.commit()
        db.refresh(balance)
        return balance

    # ──────────────────────────────────────────
    # 7. Update Leave Structure
    # ──────────────────────────────────────────

    @staticmethod
    def update_structure(
        db: Session, structure_id: int, payload: LeaveStructureUpdate
    ) -> LeaveStructure:
        """
        Update a leave structure's name and/or per-leave-type rules.

        Safety guarantee:
          Existing leave_balances are NEVER touched by this operation.
          Only future allocations (cron jobs / new assignments) will pick
          up the updated total_days / allocation_type / reset_policy.
        """
        structure = db.query(LeaveStructure).filter_by(id=structure_id).first()
        if not structure:
            raise ValueError(f"Leave structure {structure_id} not found.")

        # Rename if requested — check uniqueness
        if payload.name is not None:
            clash = (
                db.query(LeaveStructure)
                .filter(
                    LeaveStructure.name == payload.name,
                    LeaveStructure.id != structure_id,
                )
                .first()
            )
            if clash:
                raise ValueError(
                    f"Leave structure name '{payload.name}' is already in use."
                )
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
        """
        Delete a leave structure and its detail rows (cascade).
        Raises ValueError if any user is currently assigned to this structure.
        """
        structure = db.query(LeaveStructure).filter_by(id=structure_id).first()
        if not structure:
            raise ValueError(f"Leave structure {structure_id} not found.")

        assigned_count = (
            db.query(LeaveAssignment)
            .filter_by(structure_id=structure_id)
            .count()
        )
        if assigned_count > 0:
            raise ValueError(
                f"Cannot delete leave structure '{structure.name}': "
                f"it is currently assigned to {assigned_count} user(s). "
                "Remove all assignments first."
            )

        db.delete(structure)  # cascade removes leave_structure_details
        db.commit()

    # ──────────────────────────────────────────
    # 9. Update Assignment (change structure)
    # ──────────────────────────────────────────

    @staticmethod
    def update_assignment(
        db: Session, user_id: int, payload: LeaveAssignmentUpdate
    ) -> LeaveAssignment:
        """
        Change the leave structure assigned to a user.

        Current-period balance rows are updated in place:
          - total_allocated  → new structure's value
          - remaining        → max(0, new_allocated - already_used)
          - used             → preserved (represents actual taken days)

        Historical balance rows (prior periods) are left completely untouched.
        """
        assignment = db.query(LeaveAssignment).filter_by(user_id=user_id).first()
        if not assignment:
            raise ValueError(f"No leave assignment found for user {user_id}.")

        new_structure = db.query(LeaveStructure).filter_by(id=payload.structure_id).first()
        if not new_structure:
            raise ValueError(f"Leave structure {payload.structure_id} not found.")

        assignment.structure_id = payload.structure_id
        db.flush()

        # Update or create current-period balances with the new structure's rules
        LeaveStructureService._reinitialize_current_balances(db, user_id, new_structure)

        db.commit()
        db.refresh(assignment)
        return assignment

    @staticmethod
    def _reinitialize_current_balances(
        db: Session, user_id: int, structure: LeaveStructure
    ) -> None:
        """
        For each leave type in the structure, update or create the current-period
        balance row to reflect the structure's rules.

        `used` is always preserved. `remaining` is recalculated as:
            max(0, new_total_allocated - used)
        """
        year, month = _get_current_year_month()

        for detail in structure.details:
            if detail.allocation_type == AllocationType.YEARLY:
                target_month = None
                new_alloc    = Decimal(str(detail.total_days))
            else:  # MONTHLY
                target_month = month
                new_alloc    = _monthly_value(detail.total_days)

            balance = (
                db.query(LeaveBalance)
                .filter_by(
                    user_id=user_id,
                    leave_type=detail.leave_type,
                    year=year,
                    month=target_month,
                )
                .first()
            )
            if balance:
                # Preserve used; recalculate allocated + remaining
                balance.total_allocated = new_alloc
                balance.remaining = max(
                    Decimal("0"),
                    (new_alloc - balance.used).quantize(
                        Decimal("0.01"), rounding=ROUND_HALF_UP
                    ),
                )
            else:
                # Fresh row — no prior usage
                db.add(
                    LeaveBalance(
                        user_id=user_id,
                        leave_type=detail.leave_type,
                        year=year,
                        month=target_month,
                        total_allocated=new_alloc,
                        used=Decimal("0"),
                        remaining=new_alloc,
                    )
                )

    # ──────────────────────────────────────────
    # 10. Delete Assignment
    # ──────────────────────────────────────────

    @staticmethod
    def delete_assignment(db: Session, user_id: int) -> None:
        """
        Remove a user's leave assignment and all their leave balance records.

        Note: past LeaveRequest rows are NOT deleted — they live in the
        leave_requests table and represent the permanent attendance history.
        """
        assignment = db.query(LeaveAssignment).filter_by(user_id=user_id).first()
        if not assignment:
            raise ValueError(f"No leave assignment found for user {user_id}.")

        # Wipe all balance rows for this user (no active structure = no valid buckets)
        db.query(LeaveBalance).filter_by(user_id=user_id).delete(
            synchronize_session=False
        )

        db.delete(assignment)
        db.commit()


# ─────────────────────────────────────────────────────────────
# CRON: Monthly Leave Allocation
# ─────────────────────────────────────────────────────────────

def run_monthly_leave_allocation() -> None:
    """
    Cron-ready function — call at the start of every month.
    For every user with an active leave assignment:
      - For each MONTHLY leave type, credit (total_days / 12) to the current month.
      - Ensures no duplicate credit for the same month.

    Opens and closes its own DB session.
    """
    db: Session = SessionLocal()
    try:
        year, month = _get_current_year_month()
        print(f"[leave-cron] run_monthly_leave_allocation: {year}-{month:02d}")

        assignments = db.query(LeaveAssignment).all()
        credited_count = 0

        for assignment in assignments:
            structure = (
                db.query(LeaveStructure)
                .filter_by(id=assignment.structure_id)
                .first()
            )
            if not structure:
                continue

            for detail in structure.details:
                if detail.allocation_type != AllocationType.MONTHLY:
                    continue

                monthly = _monthly_value(detail.total_days)

                # Check if already credited this month (idempotent)
                balance = (
                    db.query(LeaveBalance)
                    .filter_by(
                        user_id=assignment.user_id,
                        leave_type=detail.leave_type,
                        year=year,
                        month=month,
                    )
                    .first()
                )
                if balance:
                    # Already exists — skip (no double credit)
                    continue

                # Create new month balance
                new_balance = LeaveBalance(
                    user_id=assignment.user_id,
                    leave_type=detail.leave_type,
                    year=year,
                    month=month,
                    total_allocated=monthly,
                    used=Decimal("0"),
                    remaining=monthly,
                )
                db.add(new_balance)
                credited_count += 1

        db.commit()
        print(
            f"[leave-cron] Monthly allocation done. "
            f"Created {credited_count} balance entries."
        )
    except Exception as exc:
        db.rollback()
        print(f"[leave-cron] ERROR in run_monthly_leave_allocation: {exc}")
        raise
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────
# CRON: Year-End Reset
# ─────────────────────────────────────────────────────────────

def run_year_end_reset(target_year: Optional[int] = None) -> dict:
    """
    Cron-ready function — call at year-end (e.g. Dec 31).
    Processes all YEARLY-allocation leave balances based on reset_policy:

      ENCASH  → record remaining for salary module; zero out remaining
      EXTEND  → remaining carries forward into new year row
      VOID    → zero out remaining silently

    Returns a summary dict useful for the salary encashment pipeline.

    Opens and closes its own DB session.
    """
    db: Session = SessionLocal()
    encashment_records: list[dict] = []

    try:
        now = _now_utc()
        year = target_year or now.year
        new_year = year + 1

        print(f"[leave-cron] run_year_end_reset for year {year}")

        assignments = db.query(LeaveAssignment).all()

        for assignment in assignments:
            structure = (
                db.query(LeaveStructure)
                .filter_by(id=assignment.structure_id)
                .first()
            )
            if not structure:
                continue

            for detail in structure.details:
                if detail.allocation_type != AllocationType.YEARLY:
                    continue

                balance = (
                    db.query(LeaveBalance)
                    .filter_by(
                        user_id=assignment.user_id,
                        leave_type=detail.leave_type,
                        year=year,
                        month=None,
                    )
                    .first()
                )
                if not balance:
                    continue

                remaining = balance.remaining

                if detail.reset_policy == ResetPolicy.ENCASH:
                    encashment_records.append(
                        {
                            "user_id":    assignment.user_id,
                            "leave_type": detail.leave_type.value,
                            "year":       year,
                            "days":       round(float(remaining), 2),
                        }
                    )
                    balance.remaining = Decimal("0")

                elif detail.reset_policy == ResetPolicy.EXTEND:
                    # Create / top-up new-year balance
                    new_balance = _get_or_create_balance(
                        db, assignment.user_id, detail.leave_type, new_year, month=None
                    )
                    new_balance.total_allocated += remaining
                    new_balance.remaining       += remaining
                    balance.remaining = Decimal("0")

                elif detail.reset_policy == ResetPolicy.VOID:
                    balance.remaining = Decimal("0")

        db.commit()
        print(
            f"[leave-cron] Year-end reset done. "
            f"Encashment records: {len(encashment_records)}"
        )
        return {"status": "ok", "year": year, "encashments": encashment_records}

    except Exception as exc:
        db.rollback()
        print(f"[leave-cron] ERROR in run_year_end_reset: {exc}")
        raise
    finally:
        db.close()
