from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date, timedelta
import calendar
from app.db.database import get_db
from app.db.models import LeaveRequest, User, UserCompanyMapping, LeaveCategory, LeaveDurationType
from app.models.calendar import WorkingDaysConfig, Holidays, CalendarOverrides, OverrideType
from app.api.dependencies.auth import get_current_user
from app.schemas.leave_request import LeaveRequestCreate, LeaveRequestUpdate, LeaveRequestEdit, LeaveRequestOut, LeaveCalendarSummary
from app.services.calendar_service import CalendarService

router = APIRouter(prefix="/leave-requests", tags=["Leave Management"])

def _calculate_total_days(db: Session, company_id: int, start_date: date, end_date: date, duration_type: LeaveDurationType) -> float:
    total = 0.0
    curr = start_date
    while curr <= end_date:
        status_info = CalendarService.get_day_status(db, company_id, curr)
        # Exclude holidays and "off" (weekly off) days
        if status_info.status not in ["holiday", "off"]:
            if duration_type == LeaveDurationType.HALF_DAY:
                total += 0.5
            else:
                total += 1.0
        curr += timedelta(days=1)
    return total

@router.post("", response_model=LeaveRequestOut)
def apply_for_leave(request: LeaveRequestCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    mapping = db.query(UserCompanyMapping).filter_by(user_id=current_user.id).first()
    if not mapping:
        raise HTTPException(status_code=400, detail="User does not belong to any company")

    # Overlap check
    existing = db.query(LeaveRequest).filter(
        LeaveRequest.user_id == current_user.id,
        LeaveRequest.status != "rejected",
        LeaveRequest.start_date <= request.end_date,
        LeaveRequest.end_date >= request.start_date
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Leave request overlaps with an existing request on these dates")

    total_days = _calculate_total_days(db, mapping.company_id, request.start_date, request.end_date, request.leave_duration_type)

    if total_days == 0:
        raise HTTPException(status_code=400, detail="The selected date range contains no working days")

    db_request = LeaveRequest(
        user_id=current_user.id,
        company_id=mapping.company_id,
        start_date=request.start_date,
        end_date=request.end_date,
        total_days=total_days,
        reason=request.reason,
        status="pending",
        leave_category=request.leave_category,
        leave_duration_type=request.leave_duration_type
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
        LeaveRequest.company_id == mapping.company_id
    )
    return query.order_by(LeaveRequest.applied_at.desc()).all()

@router.get("", response_model=List[LeaveRequestOut])
def get_all_leaves(company_id: int = Query(..., description="ID of the selected company"), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["ADMIN", "HR", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Not authorized to view all leaves")
        
    leaves = db.query(LeaveRequest).filter(
        LeaveRequest.company_id == company_id
    ).order_by(LeaveRequest.applied_at.desc()).all()
    return leaves

@router.put("/{leave_id}", response_model=LeaveRequestOut)
def approve_reject_leave(leave_id: int, request: LeaveRequestUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["ADMIN", "HR", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Not authorized to approve or reject leaves")
        
    db_request = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Leave request not found")

    db_request.status = request.status
    db_request.reviewed_by = current_user.id
    db_request.reviewed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_request)
    return db_request

@router.patch("/{leave_id}/edit", response_model=LeaveRequestOut)
def employee_edit_leave(
    leave_id: int,
    request: LeaveRequestEdit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_request = db.query(LeaveRequest).filter(
        LeaveRequest.id == leave_id,
        LeaveRequest.user_id == current_user.id
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

    # Recalculate days
    total_days = _calculate_total_days(db, db_request.company_id, request.start_date, request.end_date, request.leave_duration_type)
    if total_days == 0:
        raise HTTPException(status_code=400, detail="The selected date range contains no working days")

    # Update fields
    db_request.leave_category = request.leave_category
    db_request.leave_duration_type = request.leave_duration_type
    db_request.start_date = request.start_date
    db_request.end_date = request.end_date
    db_request.total_days = total_days

    if request.reason is not None:
        db_request.reason = request.reason

    # Overlap check
    overlap = db.query(LeaveRequest).filter(
        LeaveRequest.user_id == current_user.id,
        LeaveRequest.id != leave_id,
        LeaveRequest.status != "rejected",
        LeaveRequest.start_date <= db_request.end_date,
        LeaveRequest.end_date >= db_request.start_date
    ).first()

    if overlap:
        raise HTTPException(status_code=400, detail="Updated dates overlap with an existing leave request")

    db.commit()
    db.refresh(db_request)
    return db_request

@router.delete("/{leave_id}", response_model=dict)
def delete_leave(
    leave_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Hard-delete a leave request.
    - Employees can delete their own pending requests.
    - Admins can delete any request except PENDING (must reject first to ensure flow).
    """
    db_request = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Leave request not found")

    is_admin = current_user.role in ["ADMIN", "HR", "MANAGER"]
    is_owner = db_request.user_id == current_user.id

    if not is_admin and not is_owner:
        raise HTTPException(status_code=403, detail="Not authorized to delete this leave request")

    if is_admin:
        # Admin restriction: cannot delete pending
        if db_request.status == "pending":
            raise HTTPException(status_code=400, detail="Cannot delete a pending leave request. Reject it first.")
    else:
        # Owner restriction: can only delete their own
        pass

    db.delete(db_request)
    db.commit()
    return {"message": "Leave request permanently deleted"}

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

    start_date = date(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    end_date = date(year, month, last_day)

    leaves = db.query(LeaveRequest).filter(
        LeaveRequest.company_id == company_id,
        LeaveRequest.status == "approved",
        LeaveRequest.start_date <= end_date,
        LeaveRequest.end_date >= start_date
    ).all()

    summary = []
    for day in range(1, last_day + 1):
        curr_date = date(year, month, day)
        status_info = CalendarService.get_day_status(db, company_id, curr_date)
        is_off = status_info.status in ["holiday", "off"]

        if is_off:
            continue

        count = sum(1 for leave in leaves if leave.start_date <= curr_date <= leave.end_date)
        if count > 0:
            summary.append({"date": curr_date, "leave_count": count})

    return summary
    return summary
