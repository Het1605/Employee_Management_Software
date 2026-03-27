from pydantic import BaseModel, Field, conint, field_validator
from datetime import date, datetime
import datetime as dt
from typing import Optional, List
from app.models.calendar import HolidayType, HolidaySource, OverrideType

# ----------------- Working Days Schemas -----------------

class WorkingDayBase(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6, description="0=Monday, 6=Sunday")
    is_working: bool
    is_half_day: bool

class WorkingDayCreate(WorkingDayBase):
    pass

class WorkingDayUpdate(WorkingDayBase):
    pass

class WorkingDayResponse(WorkingDayBase):
    id: int
    company_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class WorkingDaysUpdateBulk(BaseModel):
    days: List[WorkingDayUpdate]

    @field_validator('days')
    def validate_seven_days(cls, v):
        if len(v) != 7:
            raise ValueError('Exactly 7 days must be provided')
        days_provided = set([day.day_of_week for day in v])
        if len(days_provided) != 7:
            raise ValueError('All 7 days of the week (0-6) must be distinct')
        return v

# ----------------- Holidays Schemas -----------------

class HolidayBase(BaseModel):
    date: date
    name: str
    type: HolidayType
    description: Optional[str] = None
    source: HolidaySource = HolidaySource.MANUAL


class HolidayCreate(HolidayBase):
    force: bool = False

class HolidayUpdate(BaseModel):
    date: Optional[dt.date] = None
    name: Optional[str] = None
    type: Optional[HolidayType] = None
    description: Optional[str] = None
    source: Optional[HolidaySource] = None
    force: Optional[bool] = None


class HolidayResponse(HolidayBase):
    id: int
    company_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    class Config:
        from_attributes = True

# ----------------- Overrides Schemas -----------------

class OverrideBase(BaseModel):
    date: date
    override_type: OverrideType
    reason: Optional[str] = None

class OverrideCreate(OverrideBase):
    force: bool = False

class OverrideUpdate(BaseModel):
    date: Optional[dt.date] = None
    override_type: Optional[OverrideType] = None
    reason: Optional[str] = None
    force: Optional[bool] = None

class OverrideResponse(OverrideBase):
    id: int
    company_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

# ----------------- Day Status Schema -----------------

class DayStatusResponse(BaseModel):
    date: date
    status: str  # working, holiday, half_day
    source: str  # rule, holiday, override
    name: Optional[str] = None

    class Config:
        from_attributes = True
