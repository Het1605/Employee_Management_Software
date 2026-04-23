from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, date, timedelta
import calendar
from app.db.database import get_db
from app.db.models import LeaveRequest, User, UserCompanyMapping, LeaveCategory, LeaveDurationType
from app.models.calendar import WorkingDaysConfig, Holidays, CalendarOverrides, OverrideType
from app.api.dependencies.auth import get_current_user
from app.schemas.leave_request import (
    LeaveRequestCreate, LeaveRequestUpdate, LeaveRequestEdit, 
    LeaveRequestOut, LeaveCalendarSummary, LeaveActivityLogOut
)
from app.services.calendar_service import CalendarService
from app.services.leave_structure_service import LeaveStructureService
from app.db.models import LeaveActivityLog
import calendar as pycal
from app.services import attendance_service

router = APIRouter(prefix="/leave-requests", tags=["Leave Management"])

def _calculate_total_days(db: Session, company_id: int, start_date: date, end_date: date, duration_type: LeaveDurationType) -> float:
    total = 0.0
    curr = start_date
    while curr <= end_date:
        status_info = CalendarService.get_day_status(db, company_id, curr)
        # Exclude holidays and "off" (weekly off) days
        if status_info.status not in ["holiday", "off"]:
            # We store the raw count of working days.
            # The 0.5 multiplier for HALF_DAY is handled during balance calculation.
            total += 1.0
        curr += timedelta(days=1)
    return total

@router.post("", response_model=LeaveRequestOut)
def apply_for_leave(request: LeaveRequestCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Security Check: Does user belong to THIS specific company?
    mapping = db.query(UserCompanyMapping).filter_by(
        user_id=current_user.id, 
        company_id=request.company_id
    ).first()
    
    if not mapping:
        raise HTTPException(
            status_code=403, 
            detail=f"You are not authorized to apply for leave in company ID {request.company_id}"
        )

    # Overlap check (Siloed per company)
    existing = db.query(LeaveRequest).filter(
        LeaveRequest.user_id == current_user.id,
        LeaveRequest.company_id == request.company_id,
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
        company_id=request.company_id,
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
def get_my_leaves(
    company_id: int = Query(..., description="ID of the company to filter by"),
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Security Check
    mapping = db.query(UserCompanyMapping).filter_by(
        user_id=current_user.id, 
        company_id=company_id
    ).first()
    if not mapping:
        raise HTTPException(status_code=403, detail="Not authorized for this company")

    query = db.query(LeaveRequest).filter(
        LeaveRequest.user_id == current_user.id,
        LeaveRequest.company_id == company_id,
        LeaveRequest.hidden_for_employee == False
    )
    return query.order_by(LeaveRequest.applied_at.desc()).all()

@router.get("", response_model=List[LeaveRequestOut])
def get_all_leaves(company_id: int = Query(..., description="ID of the selected company"), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["ADMIN", "HR", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Not authorized to view all leaves")
        
    leaves = db.query(LeaveRequest).filter(
        LeaveRequest.company_id == company_id,
        LeaveRequest.hidden_for_admin == False
    ).order_by(LeaveRequest.applied_at.desc()).all()
    return leaves

@router.put("/{request_id}", response_model=LeaveRequestOut)
def update_leave_request(
    request_id: int, 
    data: LeaveRequestEdit, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Fetch existing
    db_request = db.query(LeaveRequest).filter(LeaveRequest.id == request_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Leave request not found")

    # Permission check: Owner or Admin/HR/Manager
    is_privileged = current_user.role in ['ADMIN', 'HR', 'MANAGER']
    if db_request.user_id != current_user.id and not is_privileged:
        raise HTTPException(status_code=403, detail="You do not have permission to edit this request")

    # Overlap check (excluding current request)
    existing = db.query(LeaveRequest).filter(
        LeaveRequest.user_id == db_request.user_id,
        LeaveRequest.id != request_id,
        LeaveRequest.status != "rejected",
        LeaveRequest.start_date <= data.end_date,
        LeaveRequest.end_date >= data.start_date
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Updated dates overlap with another existing leave request")

    # Recalculate total days
    total_days = _calculate_total_days(db, db_request.company_id, data.start_date, data.end_date, data.leave_duration_type)
    if total_days == 0:
        raise HTTPException(status_code=400, detail="The selected date range contains no working days")

    # Reset status if already reviewed
    if db_request.status != "pending":
        db_request.status = "pending"
        db_request.reviewed_by = None
        db_request.reviewed_at = None

    # Update fields
    db_request.leave_category = data.leave_category
    db_request.leave_duration_type = data.leave_duration_type
    db_request.start_date = data.start_date
    db_request.end_date = data.end_date
    db_request.reason = data.reason
    db_request.total_days = total_days

    db.commit()
    db.refresh(db_request)
    return db_request

@router.put("/{leave_id}/approve-reject", response_model=LeaveRequestOut)
def approve_reject_leave(leave_id: int, request: LeaveRequestUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["ADMIN", "HR", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Not authorized to approve or reject leaves")
        
    db_request = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Leave request not found")

    # --- ADVANCED MULTI-MONTH AUDIT LOGGING ---
    cat_key = db_request.leave_category.value
    balance_changes = []
    
    # 1. Identify all unique months spanned by this leave
    months_spanned = []
    curr = date(db_request.start_date.year, db_request.start_date.month, 1)
    end_limit = date(db_request.end_date.year, db_request.end_date.month, 1)
    while curr <= end_limit:
        months_spanned.append((curr.month, curr.year))
        if curr.month == 12:
            curr = date(curr.year + 1, 1, 1)
        else:
            curr = date(curr.year, curr.month + 1, 1)

    # 2. Capture 'BEFORE' snapshot for all involved months
    # We do this while the request is still in its OLD status
    before_snapshots = {}
    for m, y in months_spanned:
        rb = LeaveStructureService.get_runtime_leave_balance(
            db, db_request.user_id, company_id=db_request.company_id, month=m, year=y
        )
        before_snapshots[(m, y)] = float(rb.get(cat_key, {}).get("remaining", 0.0))

    # 3. Apply the Status Change and Attendance Sync
    old_status = db_request.status
    db_request.status = request.status
    db_request.reviewed_by = current_user.id
    db_request.reviewed_at = datetime.utcnow()
    
    if request.status == "approved":
        attendance_service.sync_leave_to_attendance(
            db, db_request.user_id, db_request.company_id,
            db_request.start_date, db_request.end_date,
            db_request.leave_duration_type.value, is_approved=True
        )
    elif old_status == "approved" and request.status != "approved":
        attendance_service.sync_leave_to_attendance(
            db, db_request.user_id, db_request.company_id,
            db_request.start_date, db_request.end_date,
            db_request.leave_duration_type.value, is_approved=False
        )
    
    db.flush() # Ensure the status change is visible to the next runtime calculation

    # 4. Capture 'AFTER' snapshot for all involved months
    # Now that status is updated, get the new remaining balances
    for m, y in months_spanned:
        rb = LeaveStructureService.get_runtime_leave_balance(
            db, db_request.user_id, company_id=db_request.company_id, month=m, year=y
        )
        after_val = float(rb.get(cat_key, {}).get("remaining", 0.0))
        before_val = before_snapshots[(m, y)]
        
        # Only record if there was a change or it's the primary month
        if before_val != after_val or (m == db_request.start_date.month and y == db_request.start_date.year):
            balance_changes.append({
                "month": f"{pycal.month_name[m]} {y}",
                "before": before_val,
                "after": after_val
            })

    # 5. Save the Audit Log
    audit_action = "APPROVED" if request.status == "approved" else "REJECTED"
    audit_log = LeaveActivityLog(
        user_id=db_request.user_id,
        company_id=db_request.company_id,
        leave_type=cat_key,
        action=audit_action,
        action_by=current_user.id,
        action_by_role=current_user.role,
        balance_changes=balance_changes,
        details={
            "start_date": str(db_request.start_date),
            "end_date": str(db_request.end_date),
            "total_days": float(db_request.total_days),
            "request_id": db_request.id
        }
    )
    db.add(audit_log)
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

    # If currently approved, reset to pending for re-review and cleanup attendance
    if db_request.status == "approved":
        attendance_service.sync_leave_to_attendance(
            db,
            db_request.user_id,
            db_request.company_id,
            db_request.start_date,
            db_request.end_date,
            db_request.leave_duration_type.value,
            is_approved=False
        )
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
    Role-based delete for leave requests.
    - Admin/HR deleting others: Soft delete (hides for admin), only on approved/rejected.
    - Employee/Owner deleting own: Hard delete if pending, soft delete (hides for employee) if approved/rejected.
    """
    db_request = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Leave request not found")

    is_admin = current_user.role in ["ADMIN", "HR", "MANAGER"]
    is_owner = db_request.user_id == current_user.id

    if not is_admin and not is_owner:
        raise HTTPException(status_code=403, detail="Not authorized to delete this leave request")

    if is_admin and not is_owner:
        # Admin / HR Delete
        if db_request.status == "pending":
            raise HTTPException(status_code=400, detail="Cannot delete a pending leave request. Reject it first.")
        else:
            db_request.hidden_for_admin = True
            msg = "Leave request hidden from admin view"
    else:
        # Employee / Intern Delete (Owner)
        if db_request.status == "pending":
            # HARD DELETE
            db.delete(db_request)
            msg = "Leave request permanently deleted"
        else:
            # SOFT DELETE
            db_request.hidden_for_employee = True
            
            # If the owner is ALSO an admin, hiding it for themselves should also hide it from the admin view
            if is_admin:
                db_request.hidden_for_admin = True
                
            msg = "Leave request hidden from your view"

    db.commit()
    return {"message": msg}

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

@router.get("/activity-logs", response_model=List[LeaveActivityLogOut])
def get_leave_activity_logs(
    company_id: int = Query(..., description="ID of the company"),
    user_id: Optional[int] = Query(None, description="Filter by user"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["ADMIN", "HR", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Not authorized to view activity logs")

    from app.db.models import User, UserCompanyMapping
    
    query = db.query(LeaveActivityLog).options(
        joinedload(LeaveActivityLog.user),
        joinedload(LeaveActivityLog.admin)
    ).join(
        User, LeaveActivityLog.user_id == User.id
    ).join(
        UserCompanyMapping, User.id == UserCompanyMapping.user_id
    ).filter(
        UserCompanyMapping.company_id == company_id
    )

    if user_id:
        query = query.filter(LeaveActivityLog.user_id == user_id)

    logs = query.order_by(LeaveActivityLog.timestamp.desc()).all()
    return logs

