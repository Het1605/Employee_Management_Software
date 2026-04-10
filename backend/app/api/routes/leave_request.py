from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date, timedelta
import calendar
from app.db.database import get_db
from app.db.models import LeaveRequest, User, UserCompanyMapping
from app.models.calendar import WorkingDaysConfig, Holidays, CalendarOverrides, OverrideType
from app.api.dependencies.auth import get_current_user
from app.schemas.leave_request import LeaveRequestCreate, LeaveRequestUpdate, LeaveRequestOut, LeaveCalendarSummary

router = APIRouter(prefix="/leave-requests", tags=["Leave Management"])

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

    query = db.query(LeaveRequest).filter(LeaveRequest.user_id == current_user.id, LeaveRequest.company_id == mapping.company_id)
    return query.order_by(LeaveRequest.applied_at.desc()).all()

@router.get("", response_model=List[LeaveRequestOut])
def get_all_leaves(company_id: int = Query(..., description="ID of the selected company"), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["ADMIN", "HR", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Not authorized to view all leaves")
        
    leaves = db.query(LeaveRequest).filter(LeaveRequest.company_id == company_id).order_by(LeaveRequest.applied_at.desc()).all()
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

    # 2. Fetch all approved leaves for the company in this month
    leaves = db.query(LeaveRequest).filter(
        LeaveRequest.company_id == company_id,
        LeaveRequest.status == "approved",
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

    # 4. Process each day of the month
    summary = []
    for day in range(1, last_day + 1):
        curr_date = date(year, month, day)
        
        # Determine if it's an off-day
        is_off = False
        
        # Check override
        if curr_date in override_map:
            if override_map[curr_date] == OverrideType.HOLIDAY:
                is_off = True
        # Check holiday
        elif curr_date in holiday_dates:
            is_off = True
        # Check weekly config
        else:
            day_of_week = (curr_date.weekday() + 1) % 7 # 0=Sunday
            config = weekly_config.get(day_of_week)
            if not config or not config.is_working:
                is_off = True

        if is_off:
            continue

        # Count leaves covering this date
        count = sum(1 for leave in leaves if leave.start_date <= curr_date <= leave.end_date)
        
        if count > 0:
            summary.append({"date": curr_date, "leave_count": count})

    return summary
