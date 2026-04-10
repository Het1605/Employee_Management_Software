from pydantic import BaseModel, root_validator
from typing import Optional
from datetime import date, datetime
from decimal import Decimal

class LeaveRequestBase(BaseModel):
    start_date: date
    end_date: date
    reason: Optional[str] = None

class LeaveRequestCreate(LeaveRequestBase):
    pass

    @root_validator(pre=True)
    def check_dates(cls, values):
        start_date = values.get('start_date')
        end_date = values.get('end_date')
        if start_date and end_date and start_date > end_date:
            raise ValueError('start_date must be less than or equal to end_date')
        return values

class LeaveRequestUpdate(BaseModel):
    status: str

    @root_validator(pre=True)
    def check_status(cls, values):
        status = values.get('status')
        if status not in ['approved', 'rejected']:
            raise ValueError('status must be approved or rejected')
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
