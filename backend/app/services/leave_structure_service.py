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

        # Initialise balances
        LeaveStructureService._initialize_balances(db, payload.company_id, payload.user_id, structure)

        db.commit()
        db.refresh(assignment)
        return assignment

    # ──────────────────────────────────────────
    # Internal: balance initialisation
    # ──────────────────────────────────────────

    @staticmethod
    def _initialize_balances(
        db: Session, company_id: int, user_id: int, structure: LeaveStructure
    ) -> None:
        year, month = _get_current_year_month()

        for detail in structure.details:
            if detail.allocation_type == AllocationType.YEARLY:
                # Single row per year; month = NULL
                balance = _get_or_create_balance(
                    db, user_id, detail.leave_type, year, month=None
                )
                balance.company_id = company_id
                alloc = detail.total_days
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
                balance.company_id = company_id
                if balance.total_allocated == Decimal("0"):
                    balance.total_allocated = monthly
                    balance.remaining = monthly

    # ──────────────────────────────────────────
    # 4. Get User Leave Balances
    # ──────────────────────────────────────────

    @staticmethod
    def get_balances(db: Session, user_id: int, company_id: Optional[int] = None) -> List[LeaveBalance]:
        """
        Returns ALL balance rows for the user.
        """
        query = db.query(LeaveBalance).filter_by(user_id=user_id)
        if company_id is not None:
            query = query.filter_by(company_id=company_id)
        
        return (
            query
            .order_by(LeaveBalance.leave_type, LeaveBalance.year, LeaveBalance.month)
            .all()
        )

    @staticmethod
    def get_current_balances(db: Session, user_id: int, company_id: Optional[int] = None) -> List[LeaveBalance]:
        """Returns only the current year/month balances."""
        year, month = _get_current_year_month()

        from sqlalchemy import or_

        query = db.query(LeaveBalance).filter(
            LeaveBalance.user_id == user_id,
            LeaveBalance.year == year,
            or_(
                LeaveBalance.month.is_(None),
                LeaveBalance.month == month,
            ),
        )
        if company_id is not None:
            query = query.filter_by(company_id=company_id)

        return (
            query
            .order_by(LeaveBalance.leave_type)
            .all()
        )

    @staticmethod
    def get_all_assignments(db: Session, company_id: Optional[int] = None) -> List[LeaveAssignment]:
        """Returns all leave assignments."""
        query = db.query(LeaveAssignment)
        if company_id is not None:
            query = query.filter_by(company_id=company_id)
        return query.order_by(LeaveAssignment.assigned_at.desc()).all()

    # ──────────────────────────────────────────
    # 5. Leave Deduction
    # ──────────────────────────────────────────

    @staticmethod
    def deduct_leave(db: Session, request: LeaveDeductRequest) -> LeaveBalance:
        """
        Deduct `days` from the user's active balance.
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
                company_id=assignment.company_id
            )
            .first()
        )
        if not balance:
            raise ValueError(
                f"No balance record found for user {request.user_id} period."
            )

        # Guard 1: user must hold at least the minimum leave unit (0.5)
        if balance.remaining < _MIN_LEAVE_UNIT:
            raise ValueError(f"No {request.leave_category.value} balance remaining.")

        # Guard 2: remaining must cover the full requested amount
        if balance.remaining < request.days:
            raise ValueError(f"Insufficient {request.leave_category.value} balance.")

        days = request.days.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        balance.used      = (balance.used + days).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        balance.remaining = (balance.remaining - days).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        db.commit()
        db.refresh(balance)
        return balance

    # ──────────────────────────────────────────
    # 6. Reverse Deduction
    # ──────────────────────────────────────────

    @staticmethod
    def reverse_deduction(db: Session, request: LeaveDeductRequest) -> LeaveBalance:
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
            raise ValueError(f"Leave type {request.leave_category.value} not found.")

        target_month = month if detail.allocation_type == AllocationType.MONTHLY else None

        balance = (
            db.query(LeaveBalance)
            .filter_by(
                user_id=request.user_id,
                leave_type=request.leave_category,
                year=year,
                month=target_month,
                company_id=assignment.company_id
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

    # ──────────────────────────────────────────
    # 9. Update Assignment
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
        db.flush()

        # Update current-period balances
        LeaveStructureService._reinitialize_current_balances(
            db, assignment.company_id, user_id, new_structure
        )

        db.commit()
        db.refresh(assignment)
        return assignment

    @staticmethod
    def _reinitialize_current_balances(
        db: Session, company_id: int, user_id: int, structure: LeaveStructure
    ) -> None:
        year, month = _get_current_year_month()

        for detail in structure.details:
            if detail.allocation_type == AllocationType.YEARLY:
                target_month = None
                new_alloc    = detail.total_days
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
                    company_id=company_id
                )
                .first()
            )
            if balance:
                balance.total_allocated = new_alloc
                balance.remaining = max(
                    Decimal("0"),
                    (new_alloc - balance.used).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
                )
            else:
                db.add(
                    LeaveBalance(
                        company_id=company_id,
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
        assignment = db.query(LeaveAssignment).filter_by(user_id=user_id).first()
        if not assignment:
            raise ValueError(f"No assignment found for user {user_id}.")

        db.query(LeaveBalance).filter_by(
            user_id=user_id, 
            company_id=assignment.company_id
        ).delete(synchronize_session=False)

        db.delete(assignment)
        db.commit()


# ─────────────────────────────────────────────────────────────
# CRON Trigger Helpers
# ─────────────────────────────────────────────────────────────

def run_monthly_leave_allocation() -> None:
    db: Session = SessionLocal()
    try:
        year, month = _get_current_year_month()
        assignments = db.query(LeaveAssignment).all()
        for assignment in assignments:
            structure = db.query(LeaveStructure).filter_by(id=assignment.structure_id).first()
            if not structure: continue
            for detail in structure.details:
                if detail.allocation_type != AllocationType.MONTHLY: continue
                monthly = _monthly_value(detail.total_days)
                balance = db.query(LeaveBalance).filter_by(
                    user_id=assignment.user_id,
                    leave_type=detail.leave_type,
                    year=year,
                    month=month,
                    company_id=assignment.company_id
                ).first()
                if not balance:
                    db.add(LeaveBalance(
                        user_id=assignment.user_id,
                        company_id=assignment.company_id,
                        leave_type=detail.leave_type,
                        year=year,
                        month=month,
                        total_allocated=monthly,
                        used=Decimal("0"),
                        remaining=monthly,
                    ))
        db.commit()
    finally:
        db.close()

def run_year_end_reset(target_year: Optional[int] = None) -> dict:
    db: Session = SessionLocal()
    encashment_records = []
    try:
        year = target_year or _now_utc().year
        new_year = year + 1
        assignments = db.query(LeaveAssignment).all()
        for assignment in assignments:
            structure = db.query(LeaveStructure).filter_by(id=assignment.structure_id).first()
            if not structure: continue
            for detail in structure.details:
                if detail.allocation_type != AllocationType.YEARLY: continue
                balance = db.query(LeaveBalance).filter_by(
                    user_id=assignment.user_id,
                    leave_type=detail.leave_type,
                    year=year,
                    month=None,
                    company_id=assignment.company_id
                ).first()
                if not balance: continue
                remaining = balance.remaining
                if detail.reset_policy == ResetPolicy.ENCASH:
                    encashment_records.append({"user_id": assignment.user_id, "company_id": assignment.company_id, "leave_type": detail.leave_type.value, "year": year, "days": round(float(remaining), 2)})
                    balance.remaining = Decimal("0")
                elif detail.reset_policy == ResetPolicy.EXTEND:
                    new_balance = _get_or_create_balance(db, assignment.user_id, detail.leave_type, new_year, month=None)
                    new_balance.company_id = assignment.company_id
                    new_balance.total_allocated += remaining
                    new_balance.remaining       += remaining
                    balance.remaining = Decimal("0")
                elif detail.reset_policy == ResetPolicy.VOID:
                    balance.remaining = Decimal("0")
        db.commit()
        return {"status": "ok", "year": year, "encashments": encashment_records}
    finally:
        db.close()
