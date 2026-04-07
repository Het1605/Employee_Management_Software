import datetime
from pydantic import BaseModel
from typing import List, Optional

class AttendanceMark(BaseModel):
    company_id: int
    user_id: Optional[int] = None
    date: Optional[datetime.date] = None
    status: str # 'present', 'half_day', 'absent'

class AttendanceResponse(BaseModel):
    date: datetime.date
    status: str

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
