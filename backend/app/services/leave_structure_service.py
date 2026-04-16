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
from decimal import Decimal
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
    LeaveDeductRequest,
    LeaveStructureCreate,
)


# ─────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────

def _now_utc() -> datetime:
    return datetime.now(tz=timezone.utc)


def _monthly_value(total_days: int) -> Decimal:
    """Round (total_days / 12) to 2 d.p."""
    return Decimal(str(round(total_days / 12, 2)))


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

        if balance.remaining < request.days:
            raise ValueError(
                f"Insufficient {request.leave_category.value} balance. "
                f"Available: {balance.remaining}, requested: {request.days}"
            )

        balance.used      += request.days
        balance.remaining -= request.days
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

        balance.used      = max(Decimal("0"), balance.used - request.days)
        balance.remaining += request.days
        db.commit()
        db.refresh(balance)
        return balance


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
                            "days":       float(remaining),
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
