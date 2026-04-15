from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date, timedelta
import calendar
from app.db.database import get_db
from app.db.models import LeaveRequest, User, UserCompanyMapping
from app.models.calendar import WorkingDaysConfig, Holidays, CalendarOverrides, OverrideType
from app.api.dependencies.auth import get_current_user
from app.schemas.leave_request import LeaveRequestCreate, LeaveRequestUpdate, LeaveRequestEdit, LeaveRequestOut, LeaveCalendarSummary
from app.services.calendar_service import CalendarService

router = APIRouter(prefix="/leave-requests", tags=["Leave Management"])

@router.post("", response_model=LeaveRequestOut)
def apply_for_leave(request: LeaveRequestCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mapping = db.query(UserCompanyMapping).filter_by(user_id=current_user.id).first()
    if not mapping:
        raise HTTPException(status_code=400, detail="User does not belong to any company")

    # Overlap check (exclude soft-deleted)
    existing = db.query(LeaveRequest).filter(
        LeaveRequest.user_id == current_user.id,
        LeaveRequest.status != "rejected",
        LeaveRequest.is_deleted == False,
        LeaveRequest.start_date <= request.end_date,
        LeaveRequest.end_date >= request.start_date
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Leave request overlaps with an existing request on these dates")

    if request.leave_type == "HALF_DAY":
        total_days = 0.5
    else:
        total_days = (request.end_date - request.start_date).days + 1

    db_request = LeaveRequest(
        user_id=current_user.id,
        company_id=mapping.company_id,
        start_date=request.start_date,
        end_date=request.end_date,
        total_days=total_days,
        reason=request.reason,
        status="pending",
        leave_type=request.leave_type
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

@router.get("/my", response_model=List[LeaveRequestOut])
def get_my_leaves(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mapping = db.query(UserCompanyMapping).filter_by(user_id=current_user.id).first()
    if not mapping:
        return []

    query = db.query(LeaveRequest).filter(
        LeaveRequest.user_id == current_user.id,
        LeaveRequest.company_id == mapping.company_id,
        LeaveRequest.is_deleted == False
    )
    return query.order_by(LeaveRequest.applied_at.desc()).all()

@router.get("", response_model=List[LeaveRequestOut])
def get_all_leaves(company_id: int = Query(..., description="ID of the selected company"), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["ADMIN", "HR", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Not authorized to view all leaves")
        
    leaves = db.query(LeaveRequest).filter(
        LeaveRequest.company_id == company_id,
        LeaveRequest.is_deleted == False
    ).order_by(LeaveRequest.applied_at.desc()).all()
    return leaves

@router.put("/{leave_id}", response_model=LeaveRequestOut)
def approve_reject_leave(leave_id: int, request: LeaveRequestUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["ADMIN", "HR", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Not authorized to approve or reject leaves")
        
    db_request = db.query(LeaveRequest).filter(
        LeaveRequest.id == leave_id,
        LeaveRequest.is_deleted == False
    ).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Leave request not found")

    if db_request.status != "pending":
        raise HTTPException(status_code=400, detail="Only pending leave requests can be approved or rejected")

    db_request.status = request.status
    db_request.reviewed_by = current_user.id
    db_request.reviewed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_request)
    return db_request

# ─── Employee Edit ───────────────────────────────────────────────────────────
@router.patch("/{leave_id}/edit", response_model=LeaveRequestOut)
def employee_edit_leave(
    leave_id: int,
    request: LeaveRequestEdit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Employee edits their own leave request.
    - Allowed when status is PENDING or APPROVED.
    - If APPROVED, status resets to PENDING for re-review.
    - REJECTED leaves cannot be edited.
    """
    db_request = db.query(LeaveRequest).filter(
        LeaveRequest.id == leave_id,
        LeaveRequest.user_id == current_user.id,
        LeaveRequest.is_deleted == False
    ).first()

    if not db_request:
        raise HTTPException(status_code=404, detail="Leave request not found")

    if db_request.status == "rejected":
        raise HTTPException(status_code=400, detail="Cannot edit a rejected leave request")

    # If currently approved, reset to pending for re-review
    if db_request.status == "approved":
        db_request.status = "pending"
        db_request.reviewed_by = None
        db_request.reviewed_at = None

    # Update fields based on leave type
    db_request.leave_type = request.leave_type
    db_request.start_date = request.start_date

    if request.leave_type == "HALF_DAY":
        db_request.end_date = request.start_date
        db_request.total_days = 0.5
    else:
        db_request.end_date = request.end_date
        db_request.total_days = (request.end_date - request.start_date).days + 1

    if request.reason is not None:
        db_request.reason = request.reason

    # Overlap check (exclude self and soft-deleted)
    overlap = db.query(LeaveRequest).filter(
        LeaveRequest.user_id == current_user.id,
        LeaveRequest.id != leave_id,
        LeaveRequest.status != "rejected",
        LeaveRequest.is_deleted == False,
        LeaveRequest.start_date <= db_request.end_date,
        LeaveRequest.end_date >= db_request.start_date
    ).first()

    if overlap:
        raise HTTPException(status_code=400, detail="Updated dates overlap with an existing leave request")

    db.commit()
    db.refresh(db_request)
    return db_request

# ─── Employee Delete (soft) ──────────────────────────────────────────────────
@router.delete("/{leave_id}/my", response_model=LeaveRequestOut)
def employee_delete_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Employee soft-deletes their own leave request (any status).
    """
    db_request = db.query(LeaveRequest).filter(
        LeaveRequest.id == leave_id,
        LeaveRequest.user_id == current_user.id,
        LeaveRequest.is_deleted == False
    ).first()

    if not db_request:
        raise HTTPException(status_code=404, detail="Leave request not found")

    db_request.is_deleted = True
    db_request.deleted_by = "EMPLOYEE"
    db_request.deleted_at = datetime.utcnow()

    db.commit()
    db.refresh(db_request)
    return db_request

# ─── Admin Delete (soft) ─────────────────────────────────────────────────────
@router.delete("/{leave_id}", response_model=LeaveRequestOut)
def admin_delete_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Admin/HR soft-deletes a leave request.
    - NOT allowed when status is PENDING.
    - Only allowed when status is APPROVED or REJECTED.
    """
    if current_user.role not in ["ADMIN", "HR", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete leave requests")

    db_request = db.query(LeaveRequest).filter(
        LeaveRequest.id == leave_id,
        LeaveRequest.is_deleted == False
    ).first()

    if not db_request:
        raise HTTPException(status_code=404, detail="Leave request not found")

    if db_request.status == "pending":
        raise HTTPException(status_code=400, detail="Cannot delete a pending leave request. Approve or reject it first.")

    db_request.is_deleted = True
    db_request.deleted_by = "ADMIN"
    db_request.deleted_at = datetime.utcnow()

    db.commit()
    db.refresh(db_request)
    return db_request

@router.get("/calendar-summary", response_model=List[LeaveCalendarSummary])
def get_calendar_summary(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000),
    company_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["ADMIN", "HR", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Not authorized to view calendar summary")

    # 1. Determine month range
    start_date = date(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    end_date = date(year, month, last_day)

    # 2. Fetch all approved leaves for the company in this month (exclude soft-deleted)
    leaves = db.query(LeaveRequest).filter(
        LeaveRequest.company_id == company_id,
        LeaveRequest.status == "approved",
        LeaveRequest.is_deleted == False,
        LeaveRequest.start_date <= end_date,
        LeaveRequest.end_date >= start_date
    ).all()

    # 3. Fetch calendar config
    holidays = db.query(Holidays).filter(
        Holidays.company_id == company_id,
        Holidays.date >= start_date,
        Holidays.date <= end_date
    ).all()
    holiday_dates = {h.date for h in holidays}

    overrides = db.query(CalendarOverrides).filter(
        CalendarOverrides.company_id == company_id,
        CalendarOverrides.date >= start_date,
        CalendarOverrides.date <= end_date
    ).all()
    override_map = {o.date: o.override_type for o in overrides}

    working_days_config = db.query(WorkingDaysConfig).filter(
        WorkingDaysConfig.company_id == company_id
    ).all()
    weekly_config = {c.day_of_week: c for c in working_days_config}


# ... in get_calendar_summary ...
    # 4. Process each day of the month
    summary = []
    for day in range(1, last_day + 1):
        curr_date = date(year, month, day)
        
        # Use centralized status logic
        status_info = CalendarService.get_day_status(db, company_id, curr_date)
        is_off = status_info.status in ["holiday", "off"]

        if is_off:
            continue

        # Count leaves covering this date
        count = sum(1 for leave in leaves if leave.start_date <= curr_date <= leave.end_date)
        
        if count > 0:
            summary.append({"date": curr_date, "leave_count": count})

    return summary
