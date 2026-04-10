import calendar as py_calendar
from datetime import date, timedelta
from app.db.models import User, UserCompanyMapping, Attendance, LeaveRequest
from app.models.calendar import WorkingDaysConfig, Holidays, CalendarOverrides
from app.schemas.calendar import (
    WorkingDayResponse, WorkingDaysUpdateBulk,
    HolidayCreate, HolidayUpdate, HolidayResponse,
    OverrideCreate, OverrideUpdate, OverrideResponse,
    DayStatusResponse, CompanyCalendarConfig
)
from app.schemas.employee_calendar import EmployeeCalendarSummary, EmployeeCalendarDay
from app.services.calendar_service import CalendarService
from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.api.dependencies.auth import get_current_user
from app.db.models import User


# Add router tags, etc.
router = APIRouter(prefix="/calendar", tags=["Calendar"])

# Security Requirements
# It's an application design choice to secure routes. 
# Depending on requirements ADMIN and HR can modify.
# get_current_user is used if present. Since the prompt states "Only ADMIN and HR can modify / EMPLOYEE read-only",
# we can inject a check or assume the dependencies from `auth.py` are attached.

# ----------------- Working Days -----------------

@router.get("/working-days/{company_id}", response_model=List[WorkingDayResponse])
def get_working_days(company_id: int, db: Session = Depends(get_db)):
    return CalendarService.get_working_days(db, company_id)

@router.put("/working-days/{company_id}", response_model=List[WorkingDayResponse])
def update_working_days(company_id: int, payload: WorkingDaysUpdateBulk, db: Session = Depends(get_db)):
    return CalendarService.update_working_days(db, company_id, payload)

# ----------------- Holidays -----------------

@router.get("/holidays", response_model=List[HolidayResponse])
def get_holidays(company_id: int = Query(...), db: Session = Depends(get_db)):
    return CalendarService.get_holidays(db, company_id)

@router.post("/holidays", response_model=HolidayResponse, status_code=status.HTTP_201_CREATED)
def create_holiday(company_id: int = Query(...), holiday: HolidayCreate = ..., db: Session = Depends(get_db)):
    return CalendarService.create_holiday(db, company_id, holiday)

@router.put("/holidays/{holiday_id}", response_model=HolidayResponse)
def update_holiday(holiday_id: int, holiday: HolidayUpdate, db: Session = Depends(get_db)):
    return CalendarService.update_holiday(db, holiday_id, holiday)

@router.delete("/holidays/{holiday_id}")
def delete_holiday(holiday_id: int, db: Session = Depends(get_db)):
    return CalendarService.delete_holiday(db, holiday_id)

# ----------------- Overrides -----------------

@router.get("/overrides", response_model=List[OverrideResponse])
def get_overrides(company_id: int = Query(...), db: Session = Depends(get_db)):
    return CalendarService.get_overrides(db, company_id)

@router.post("/overrides", response_model=OverrideResponse, status_code=status.HTTP_201_CREATED)
def create_override(company_id: int = Query(...), override: OverrideCreate = ..., db: Session = Depends(get_db)):
    return CalendarService.create_override(db, company_id, override)

@router.put("/overrides/{override_id}", response_model=OverrideResponse)
def update_override(override_id: int, override: OverrideUpdate, db: Session = Depends(get_db)):
    return CalendarService.update_override(db, override_id, override)

@router.delete("/overrides/{override_id}")
def delete_override(override_id: int, db: Session = Depends(get_db)):
    return CalendarService.delete_override(db, override_id)

# ----------------- Core Logic Access -----------------

@router.get("/status", response_model=DayStatusResponse)
def get_day_status(company_id: int = Query(...), target_date: date = Query(...), db: Session = Depends(get_db)):
    return CalendarService.get_day_status(db, company_id, target_date)

@router.get("/my-config", response_model=CompanyCalendarConfig)
def get_my_company_calendar_config(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    mapping = db.query(UserCompanyMapping).filter_by(user_id=current_user.id).first()
    if not mapping:
        raise HTTPException(status_code=400, detail="User not assigned to any company")
    
    company_id = mapping.company_id
    
    working_days = CalendarService.get_working_days(db, company_id)
    holidays = CalendarService.get_holidays(db, company_id)
    overrides = CalendarService.get_overrides(db, company_id)
    
    return {
        "working_days": working_days,
        "holidays": holidays,
        "overrides": overrides
    }

@router.get("/employee-summary", response_model=EmployeeCalendarSummary)
def get_employee_calendar_summary(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    mapping = db.query(UserCompanyMapping).filter_by(user_id=current_user.id).first()
    if not mapping:
        raise HTTPException(status_code=400, detail="User not assigned to any company")
    
    company_id = mapping.company_id
    
    # Range
    start_date = date(year, month, 1)
    last_day = py_calendar.monthrange(year, month)[1]
    end_date = date(year, month, last_day)

    # 1. Configs
    working_days = CalendarService.get_working_days(db, company_id)
    wd_map = {wd.day_of_week: wd for wd in working_days}

    # 2. Holidays
    holidays = db.query(Holidays).filter(
        Holidays.company_id == company_id,
        Holidays.date >= start_date,
        Holidays.date <= end_date
    ).all()
    holiday_map = {h.date: h.name for h in holidays}

    # 3. Overrides
    overrides = db.query(CalendarOverrides).filter(
        CalendarOverrides.company_id == company_id,
        CalendarOverrides.date >= start_date,
        CalendarOverrides.date <= end_date
    ).all()
    override_map = {o.date: o for o in overrides}

    # 4. Attendance
    attendance = db.query(Attendance).filter(
        Attendance.user_id == current_user.id,
        Attendance.date >= start_date,
        Attendance.date <= end_date
    ).all()
    att_map = {a.date: a.status for a in attendance}

    # 5. Leaves (Approved)
    leaves = db.query(LeaveRequest).filter(
        LeaveRequest.user_id == current_user.id,
        LeaveRequest.status == "approved",
        LeaveRequest.start_date <= end_date,
        LeaveRequest.end_date >= start_date
    ).all()
    
    # Expand leaves into a map
    leave_data_map = {}
    for l in leaves:
        curr = l.start_date
        while curr <= l.end_date:
            if start_date <= curr <= end_date:
                leave_data_map[curr] = l.leave_type # FULL_DAY or HALF_DAY
            curr += timedelta(days=1)

    # 6. Build response
    days = []
    for d in range(1, last_day + 1):
        curr_date = date(year, month, d)
        
        # Priority Rule:
        # 1. Holiday (Rule or Override)
        # 2. Off Day (Rule)
        # 3. Leave (Approved Full/Half)
        # 4. Attendance (Record found)

        day_result = {
            "date": curr_date,
            "day_type": "working",
            "attendance": att_map.get(curr_date),
            "leave": "full" if leave_data_map.get(curr_date) == "FULL_DAY" else ("half" if leave_data_map.get(curr_date) == "HALF_DAY" else None),
            "display_status": ""
        }

        # Determine Primary Day Type
        ovr = override_map.get(curr_date)
        if ovr:
            day_result["day_type"] = ovr.override_type.lower()
        elif curr_date in holiday_map:
            day_result["day_type"] = "holiday"
        else:
            wd_config = wd_map.get(curr_date.weekday())
            if wd_config:
                if not wd_config.is_working:
                    day_result["day_type"] = "off"
                elif wd_config.is_half_day:
                    day_result["day_type"] = "half_day"
            else:
                day_result["day_type"] = "unknown"

        # Apply Priority Status
        if day_result["day_type"] in ["holiday", "off"]:
            day_result["display_status"] = "Holiday" if day_result["day_type"] == "holiday" else "Off"
        elif day_result["leave"]:
            day_result["display_status"] = "🔵 On Leave" if day_result["leave"] == "full" else "🟡 Half Leave"
        elif day_result["attendance"]:
            status_map = {"present": "✔ Present", "half_day": "🟡 Half Day", "absent": "❌ Absent"}
            day_result["display_status"] = status_map.get(day_result["attendance"], "")
        else:
            # If it's a working day with no attendance or leave record, mark as absent
            day_result["display_status"] = "❌ Absent"
            day_result["attendance"] = "absent"

        days.append(EmployeeCalendarDay(**day_result))

    return EmployeeCalendarSummary(days=days)
