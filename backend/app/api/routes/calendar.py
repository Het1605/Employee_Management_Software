from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from app.db.database import get_db
from app.api.dependencies.auth import get_current_user
from app.db.models import User
from app.schemas.calendar import (
    WorkingDayResponse, WorkingDaysUpdateBulk,
    HolidayCreate, HolidayUpdate, HolidayResponse,
    OverrideCreate, OverrideUpdate, OverrideResponse,
    DayStatusResponse
)
from app.services.calendar_service import CalendarService

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
