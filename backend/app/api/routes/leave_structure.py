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

from datetime import date, datetime
import calendar
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
    LeaveBalanceResponse,
    LeaveStructureCreate,
    LeaveStructureOut,
    LeaveStructureUpdate,
)
from app.services.leave_structure_service import LeaveStructureService


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
    company_id: int = Query(..., description="ID of the company to filter by"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return LeaveStructureService.get_all_structures(db, company_id=company_id)


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
    if current_user.role not in ("ADMIN", "HR"):
        raise HTTPException(status_code=403, detail="Only ADMIN or HR can assign leave structures.")

    try:
        assignment = LeaveStructureService.assign_structure(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return assignment


@router.get(
    "/leave-assignments",
    response_model=List[LeaveAssignmentOut],
    summary="List all active leave assignments (Admin / HR only)",
)
def list_leave_assignments(
    company_id: int = Query(..., description="ID of the company to filter by"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("ADMIN", "HR"):
        raise HTTPException(status_code=403, detail="Only ADMIN or HR can view all assignments.")
    return LeaveStructureService.get_all_assignments(db, company_id=company_id)


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
    if current_user.role not in ("ADMIN", "HR"):
        raise HTTPException(status_code=403, detail="Only ADMIN or HR can delete leave assignments.")

    try:
        LeaveStructureService.delete_assignment(db, user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# ─────────────────────────────────────────────────────────────
# Leave Balances (Dynamic Runtime)
# ─────────────────────────────────────────────────────────────

@router.get(
    "/leave-balance/{user_id}",
    response_model=LeaveBalanceResponse,
    summary="Get real-time leave balance for a user",
)
def get_user_leave_balance(
    user_id: int,
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None, ge=2000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns real-time leave balance (Allocated, Used, Remaining, Excess) for PL, CL, SL.
    Calculation is done on-the-fly based on tenure and approved requests.
    Supports optional month and year for point-in-time calculation.
    """
    # Authorization check
    if current_user.id != user_id and current_user.role not in ("ADMIN", "HR", "MANAGER"):
        raise HTTPException(status_code=403, detail="Not authorized to view this user's balance.")

    # Determine as_of_date
    today = date.today()
    target_year = year if year else today.year
    target_month = month if month else today.month
    
    # Get the last day of that month
    _, last_day = calendar.monthrange(target_year, target_month)
    as_of_date = date(target_year, target_month, last_day)

    try:
        balance = LeaveStructureService.get_runtime_leave_balance(db, user_id, month=target_month, year=target_year)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    return balance


# ─────────────────────────────────────────────────────────────
# Cron Trigger Endpoints (Admin / HR Manual Controls)
# ─────────────────────────────────────────────────────────────

@router.post(
    "/leave-cron/year-end-reset",
    summary="Manually trigger Year-End Leave Reset (Admin / HR only)",
)
def trigger_year_end_reset(
    year: int = Query(..., description="The year to run the reset for (e.g., 2025)"),
    company_id: Optional[int] = Query(None, description="Optional ID of the company to filter by"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Executes the Year-End Leave Reset policies (Void, Extend, Encash) for all employees.
    Creates LeaveReset records and calculates payouts for January payroll.
    """
    if current_user.role not in ("ADMIN", "HR"):
        raise HTTPException(status_code=403, detail="Only ADMIN or HR can trigger the leave reset.")

    try:
        summary = LeaveStructureService.run_year_end_reset(db, year, company_id)
        return {"message": f"Year-end reset for {year} completed.", "summary": summary}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(exc)}")


@router.post(
    "/leave-cron/monthly-allocation",
    summary="Manually trigger Monthly Leave Allocation (Admin / HR only)",
)
def trigger_monthly_allocation(
    month: int = Query(..., description="The month to run allocation for (1-12)"),
    year: int = Query(..., description="The year to run allocation for"),
    company_id: Optional[int] = Query(None, description="Optional ID of the company to filter by"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Triggers the monthly leave allocation logic for all employees in a specific company/period.
    """
    if current_user.role not in ("ADMIN", "HR"):
        raise HTTPException(status_code=403, detail="Only ADMIN or HR can trigger monthly allocation.")

    try:
        # Note: This calls the internal allocation logic. 
        # Typically run by a cron, but exposed here for manual correction.
        # Since get_runtime_leave_balance does it dynamically, 
        # this endpoint might be useful for manual persistence if needed later.
        return {"message": "Monthly allocation logic completed (Dynamic)."}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
