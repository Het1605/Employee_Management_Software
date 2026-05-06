from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models import User
from app.api.dependencies.auth import get_current_user
from app.api.dependencies.roles import role_required
from app.schemas.base_response import ResponseSchema
from app.schemas.attendance import AttendanceMark, MyAttendanceStats, UserAttendanceRecord, AttendanceToday, AttendanceResponse
from app.services import attendance_service
from typing import List, Optional

router = APIRouter()

def get_user_by_id(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/mark", response_model=ResponseSchema[AttendanceResponse])
def mark_attendance(
    attendance: AttendanceMark,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Security check: Only Admin/HR can mark attendance for others
    if attendance.user_id != current_user.id and current_user.role not in ["ADMIN", "HR"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not authorized to mark attendance for other users"
        )
    
    initiator_id = attendance.actor_id or attendance.user_id
    actor = get_user_by_id(db, initiator_id) if initiator_id else None
    
    result = attendance_service.mark_attendance(
        db, 
        actor, 
        attendance.company_id, 
        attendance.status, 
        attendance.user_id, 
        attendance.date
    )
    return ResponseSchema(status="success", message="Attendance marked successfully", data=result)

@router.get("/my", response_model=ResponseSchema[MyAttendanceStats])
def get_my_attendance(
    user_id: int = Query(...),
    company_id: int = Query(..., description="ID of the company to filter by"),
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if user_id != current_user.id and current_user.role not in ["ADMIN", "HR", "MANAGER"]:
         raise HTTPException(status_code=403, detail="Not authorized to view other's attendance")
    result = attendance_service.get_my_attendance(db, user_id, company_id, month, year)
    return ResponseSchema(status="success", data=result)

@router.get("/company", response_model=ResponseSchema[List[UserAttendanceRecord]])
def get_company_attendance(
    company_id: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000),
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    attendance = attendance_service.get_company_attendance(db, company_id, month, year)
    return ResponseSchema(status="success", data=attendance)

@router.get("/today", response_model=ResponseSchema[AttendanceToday])
def get_today_status(
    user_id: int = Query(...),
    company_id: int = Query(..., description="ID of the company to filter by"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if user_id != current_user.id and current_user.role not in ["ADMIN", "HR", "MANAGER"]:
         raise HTTPException(status_code=403, detail="Not authorized")
    result = attendance_service.get_today_status(db, user_id, company_id)
    return ResponseSchema(status="success", data=result)
