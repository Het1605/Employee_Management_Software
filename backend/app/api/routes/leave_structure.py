"""
Leave Structure & Assignment API Routes
========================================
Endpoints:
  POST   /leave-structures                   — Create a leave structure
  GET    /leave-structures                   — List all structures
  GET    /leave-structures/{id}              — Get single structure
  PUT    /leave-structures/{id}              — Update structure name / details
  DELETE /leave-structures/{id}              — Delete (only if unassigned)
  POST   /leave-assignments                  — Assign structure to user
  GET    /leave-assignments/{user_id}        — Get user's active assignment
  PUT    /leave-assignments/{user_id}        — Reassign to a different structure
  DELETE /leave-assignments/{user_id}        — Remove assignment + balances
  GET    /leave-balances/{user_id}           — Full balance history
  GET    /leave-balances/{user_id}/current   — Current-period balances
  POST   /leave-balances/deduct             — Deduct approved leave
  POST   /leave-balances/reverse            — Reverse a deduction

Cron trigger endpoints (Admin-only):
  POST   /leave-cron/monthly-allocation      — Trigger monthly allocation
  POST   /leave-cron/year-end-reset         — Trigger year-end reset
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User
from app.api.dependencies.auth import get_current_user
from app.models.leave_structure import LeaveAssignment
from app.schemas.leave_structure import (
    LeaveAssignmentCreate,
    LeaveAssignmentOut,
    LeaveAssignmentUpdate,
    LeaveBalanceOut,
    LeaveDeductRequest,
    LeaveDayType,
    LeaveStructureCreate,
    LeaveStructureOut,
    LeaveStructureUpdate,
)
from app.services.leave_structure_service import (
    LeaveStructureService,
    run_monthly_leave_allocation,
    run_year_end_reset,
)


# ─────────────────────────────────────────────────────────────
# Routers
# ─────────────────────────────────────────────────────────────

router = APIRouter(tags=["Leave Structures"])


# ─────────────────────────────────────────────────────────────
# Leave Structures
# ─────────────────────────────────────────────────────────────

@router.post(
    "/leave-structures",
    response_model=LeaveStructureOut,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new leave structure (Admin / HR only)",
)
def create_leave_structure(
    payload: LeaveStructureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Creates a named leave structure that groups PL, CL, and SL rules.
    - **name** must be unique.
    - **details** must contain exactly one entry for each of PL, CL, SL.
    - **total_days** must be > 0.
    """
    if current_user.role not in ("ADMIN", "HR"):
        raise HTTPException(status_code=403, detail="Only ADMIN or HR can create leave structures.")

    try:
        structure = LeaveStructureService.create_structure(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return structure


@router.get(
    "/leave-structures",
    response_model=List[LeaveStructureOut],
    summary="List all leave structures",
)
def list_leave_structures(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return LeaveStructureService.get_all_structures(db)


@router.get(
    "/leave-structures/{structure_id}",
    response_model=LeaveStructureOut,
    summary="Get a single leave structure by ID",
)
def get_leave_structure(
    structure_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    structure = LeaveStructureService.get_structure_by_id(db, structure_id)
    if not structure:
        raise HTTPException(status_code=404, detail="Leave structure not found.")
    return structure


@router.put(
    "/leave-structures/{structure_id}",
    response_model=LeaveStructureOut,
    summary="Update a leave structure (Admin / HR only)",
)
def update_leave_structure(
    structure_id: int,
    payload: LeaveStructureUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a leave structure's **name** and/or **leave-type details**.

    - If `name` is omitted, it is left unchanged.
    - If `details` is provided it must include all three types: PL, CL, SL.
    - Existing leave balances are **never modified** by this endpoint;
      only future cron allocations will use the new `total_days` / `allocation_type`.
    """
    if current_user.role not in ("ADMIN", "HR"):
        raise HTTPException(status_code=403, detail="Only ADMIN or HR can update leave structures.")

    try:
        structure = LeaveStructureService.update_structure(db, structure_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return structure


@router.delete(
    "/leave-structures/{structure_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a leave structure (Admin / HR only)",
)
def delete_leave_structure(
    structure_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Permanently delete a leave structure.

    **Rejected** if the structure is currently assigned to any user.
    Remove all user assignments first, then retry.
    """
    if current_user.role not in ("ADMIN", "HR"):
        raise HTTPException(status_code=403, detail="Only ADMIN or HR can delete leave structures.")

    try:
        LeaveStructureService.delete_structure(db, structure_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# ─────────────────────────────────────────────────────────────
# Leave Assignments
# ─────────────────────────────────────────────────────────────

@router.post(
    "/leave-assignments",
    response_model=LeaveAssignmentOut,
    status_code=status.HTTP_201_CREATED,
    summary="Assign a leave structure to a user (Admin / HR only)",
)
def assign_leave_structure(
    payload: LeaveAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Assigns a leave structure to a user.
    - Overwrites any previously assigned structure.
    - Automatically initialises leave_balance rows for the current period.
    """
    if current_user.role not in ("ADMIN", "HR"):
        raise HTTPException(status_code=403, detail="Only ADMIN or HR can assign leave structures.")

    try:
        assignment = LeaveStructureService.assign_structure(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return assignment


@router.get(
    "/leave-assignments/{user_id}",
    response_model=LeaveAssignmentOut,
    summary="Get the active leave assignment for a user",
)
def get_user_assignment(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assignment = db.query(LeaveAssignment).filter_by(user_id=user_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail=f"No leave structure assigned to user {user_id}.")
    return assignment


@router.put(
    "/leave-assignments/{user_id}",
    response_model=LeaveAssignmentOut,
    summary="Reassign a user to a different leave structure (Admin / HR only)",
)
def update_leave_assignment(
    user_id: int,
    payload: LeaveAssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Change the leave structure assigned to a user.

    - The user's **current-period** balance rows are updated in-place:
      `total_allocated` is set to the new structure's value and
      `remaining` is recalculated as `max(0, new_allocated - used)`.
    - **Historical** balance rows (prior months / years) are untouched.
    - Already-taken leave days (`used`) are always preserved.
    """
    if current_user.role not in ("ADMIN", "HR"):
        raise HTTPException(status_code=403, detail="Only ADMIN or HR can update leave assignments.")

    try:
        assignment = LeaveStructureService.update_assignment(db, user_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return assignment


@router.delete(
    "/leave-assignments/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove a user's leave assignment and balances (Admin / HR only)",
)
def delete_leave_assignment(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Removes the user's leave structure assignment and **all** their
    `leave_balances` rows.

    Past `leave_requests` records are **not** affected — leave history
    is preserved permanently in that table.
    """
    if current_user.role not in ("ADMIN", "HR"):
        raise HTTPException(status_code=403, detail="Only ADMIN or HR can delete leave assignments.")

    try:
        LeaveStructureService.delete_assignment(db, user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# ─────────────────────────────────────────────────────────────
# Leave Balances
# ─────────────────────────────────────────────────────────────

@router.get(
    "/leave-balances/{user_id}",
    response_model=List[LeaveBalanceOut],
    summary="Get full leave balance history for a user",
)
def get_user_leave_balances(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns all leave balance rows for the user across all years/months.
    Accessible by:
      - The user themselves
      - ADMIN / HR / MANAGER roles
    """
    if current_user.id != user_id and current_user.role not in ("ADMIN", "HR", "MANAGER"):
        raise HTTPException(status_code=403, detail="Not authorized to view this user's balances.")

    return LeaveStructureService.get_balances(db, user_id)


@router.get(
    "/leave-balances/{user_id}/current",
    response_model=List[LeaveBalanceOut],
    summary="Get current-period leave balances for a user",
)
def get_user_current_balances(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns only the active (current year + current month) balance rows.
    Useful for leave application forms and dashboards.
    """
    if current_user.id != user_id and current_user.role not in ("ADMIN", "HR", "MANAGER"):
        raise HTTPException(status_code=403, detail="Not authorized to view this user's balances.")

    return LeaveStructureService.get_current_balances(db, user_id)


# ─────────────────────────────────────────────────────────────
# Internal / Integration: Leave Deduction
# ─────────────────────────────────────────────────────────────

@router.post(
    "/leave-balances/deduct",
    response_model=LeaveBalanceOut,
    summary="Deduct leave days from a user's balance (used by Leave Management module)",
)
def deduct_leave_balance(
    payload: LeaveDeductRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Deducts approved leave days from the user's active balance.
    Called internally by the leave approval flow after a leave is approved.

    **Half-day example:**
    ```json
    { "user_id": 1, "leave_category": "CL", "leave_day_type": "HALF_DAY", "days": 0.5 }
    ```

    **Full-day example (3 days):**
    ```json
    { "user_id": 1, "leave_category": "PL", "leave_day_type": "FULL_DAY", "days": 3 }
    ```

    Rejects the request if:
    - The user has no leave structure assigned.
    - The remaining balance is below 0.5 (minimum unit).
    - The remaining balance is less than the requested days.

    Only ADMIN / HR / MANAGER can trigger deductions.
    """
    if current_user.role not in ("ADMIN", "HR", "MANAGER"):
        raise HTTPException(status_code=403, detail="Not authorized to deduct leave balance.")

    try:
        balance = LeaveStructureService.deduct_leave(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return balance


@router.post(
    "/leave-balances/reverse",
    response_model=LeaveBalanceOut,
    summary="Reverse a leave deduction (on rejection / cancellation)",
)
def reverse_leave_deduction(
    payload: LeaveDeductRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Adds back previously deducted days (e.g. when a leave is rejected after approval).
    """
    if current_user.role not in ("ADMIN", "HR", "MANAGER"):
        raise HTTPException(status_code=403, detail="Not authorized to reverse leave balance.")

    try:
        balance = LeaveStructureService.reverse_deduction(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return balance


# ─────────────────────────────────────────────────────────────
# CRON Trigger Endpoints  (Admin-only; designed for manual testing
#                          or webhook-based schedulers)
# ─────────────────────────────────────────────────────────────

cron_router = APIRouter(prefix="/leave-cron", tags=["Leave Cron"])


@cron_router.post(
    "/monthly-allocation",
    summary="Trigger monthly leave allocation (Admin only)",
)
def trigger_monthly_allocation(
    current_user: User = Depends(get_current_user),
):
    """
    Manually triggers the monthly leave credit job.
    Normally scheduled to run on the 1st of each month.
    """
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only ADMIN can trigger cron jobs.")

    try:
        run_monthly_leave_allocation()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Cron job failed: {exc}")

    return {"message": "Monthly leave allocation completed successfully."}


@cron_router.post(
    "/year-end-reset",
    summary="Trigger year-end leave reset (Admin only)",
)
def trigger_year_end_reset(
    year: Optional[int] = Query(None, description="Target year to reset (defaults to current year)"),
    current_user: User = Depends(get_current_user),
):
    """
    Manually triggers the year-end leave reset.
    Handles ENCASH / EXTEND / VOID policies per structure.
    Returns encashment records that the salary module can consume.
    """
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Only ADMIN can trigger cron jobs.")

    try:
        result = run_year_end_reset(target_year=year)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Year-end reset failed: {exc}")

    return result
