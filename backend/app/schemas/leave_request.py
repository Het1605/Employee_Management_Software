from pydantic import BaseModel, root_validator, validator
from typing import Optional
from datetime import date, datetime
from decimal import Decimal
import enum

class LeaveCategory(str, enum.Enum):
    PL = "PL"
    CL = "CL"
    SL = "SL"

class LeaveDurationType(str, enum.Enum):
    FULL_DAY = "FULL_DAY"
    HALF_DAY = "HALF_DAY"

class LeaveRequestBase(BaseModel):
    start_date: date
    end_date: date
    reason: Optional[str] = None
    leave_category: LeaveCategory
    leave_duration_type: LeaveDurationType

class LeaveRequestCreate(LeaveRequestBase):
    @validator('start_date')
    def check_future_date(cls, v):
        if v < date.today():
            raise ValueError('Leave cannot be applied for past dates')
        return v

    @root_validator(pre=True)
    def check_dates(cls, values):
        start_date = values.get('start_date')
        end_date = values.get('end_date')

        if start_date and end_date:
            if start_date > end_date:
                raise ValueError('start_date must be less than or equal to end_date')
        
        return values

class LeaveRequestUpdate(BaseModel):
    status: str

    @validator('status')
    def check_status(cls, v):
        if v not in ['approved', 'rejected']:
            raise ValueError('status must be approved or rejected')
        return v

class LeaveRequestEdit(BaseModel):
    """Schema for employee editing their own leave request."""
    start_date: date
    end_date: date
    reason: Optional[str] = None
    leave_category: LeaveCategory
    leave_duration_type: LeaveDurationType

    @validator('start_date')
    def check_future_date(cls, v):
        if v < date.today():
            raise ValueError('Leave cannot be applied for past dates')
        return v

    @root_validator(pre=True)
    def validate_edit(cls, values):
        start_date = values.get('start_date')
        end_date = values.get('end_date')

        if start_date and end_date:
            if start_date > end_date:
                raise ValueError('start_date must be less than or equal to end_date')

        return values

class LeaveRequestOutUser(BaseModel):
    id: int
    first_name: str
    last_name: str
    
    class Config:
        from_attributes = True

class LeaveRequestOut(LeaveRequestBase):
    id: int
    user_id: int
    company_id: int
    total_days: Decimal
    status: str
    applied_at: datetime
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None
    
    # We optionally include the user for HR view
    user: Optional[LeaveRequestOutUser] = None

    class Config:
        from_attributes = True

class LeaveCalendarSummary(BaseModel):
    date: date
    leave_count: int

    class Config:
        from_attributes = True

class LeaveActivityLogOut(BaseModel):
    id: int
    user_id: int
    leave_type: str
    old_balance: Optional[Decimal] = None
    new_balance: Decimal
    action: str
    action_by: int
    impact_month: Optional[str] = None
    details: Optional[dict] = None
    timestamp: datetime
    
    # Optional fields for UI convenience
    user: Optional[LeaveRequestOutUser] = None
    admin: Optional[LeaveRequestOutUser] = None

    class Config:
        from_attributes = True

