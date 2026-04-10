import datetime
from pydantic import BaseModel
from typing import List, Optional

class EmployeeCalendarDay(BaseModel):
    date: datetime.date
    day_type: str # 'working', 'off', 'holiday'
    attendance: Optional[str] = None # 'present', 'half_day', 'absent', null
    leave: Optional[str] = None # 'full', 'half', null
    display_status: str # The unified priority status (e.g. "✔ Present", "🔵 On Leave", etc.)

class EmployeeCalendarSummary(BaseModel):
    days: List[EmployeeCalendarDay]
