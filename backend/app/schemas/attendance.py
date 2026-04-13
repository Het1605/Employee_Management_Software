import datetime
from pydantic import BaseModel, validator
from typing import List, Optional

class AttendanceMark(BaseModel):
    company_id: Optional[int] = None
    user_id: Optional[int] = None
    actor_id: Optional[int] = None
    date: Optional[datetime.date] = None
    status: str # 'present', 'half_day', 'absent'

    @validator("date", pre=True)
    def handle_empty_date(cls, v):
        if v == "":
            return None
        return v

class AttendanceResponse(BaseModel):
    date: datetime.date
    status: str
    day_type: str

class MyAttendanceStats(BaseModel):
    total_days: int
    present_days: int
    half_days: int
    absent_days: int
    attendance: List[AttendanceResponse]

class UserAttendanceRecord(BaseModel):
    user_id: int
    name: str
    present_days: int
    half_days: int
    absent_days: int
    attendance: List[AttendanceResponse]

class AttendanceToday(BaseModel):
    status: str # 'present', 'half_day', 'absent'
    day_type: str # 'working', 'half', 'off'
