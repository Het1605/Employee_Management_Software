from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User
from app.schemas.attendance import AttendanceMark, MyAttendanceStats, UserAttendanceRecord, AttendanceToday, AttendanceResponse
from app.services import attendance_service
from typing import List, Optional

router = APIRouter()

# In this project, authentication is not globally enforced.
# We identify the user performing the action from the request parameters (user_id/actor_id).
def get_user_by_id(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/mark")
def mark_attendance(
    attendance: AttendanceMark,
    db: Session = Depends(get_db)
):
    # If user_id is in body, use it to identify the user for logic
    actor = get_user_by_id(db, attendance.user_id) if attendance.user_id else None
    
    return attendance_service.mark_attendance(
        db, 
        actor, # Passed as actor to determine role
        attendance.company_id, 
        attendance.status, 
        attendance.user_id, 
        attendance.date
    )

@router.get("/my", response_model=MyAttendanceStats)
def get_my_attendance(
    user_id: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000),
    db: Session = Depends(get_db)
):
    return attendance_service.get_my_attendance(db, user_id, month, year)

@router.get("/company", response_model=List[UserAttendanceRecord])
def get_company_attendance(
    company_id: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2000),
    db: Session = Depends(get_db)
):
    # Role check is bypassed here to allow Swagger testing directly,
    # as other management APIs in this project are open.
    return attendance_service.get_company_attendance(db, company_id, month, year)

@router.get("/today", response_model=AttendanceToday)
def get_today_status(
    user_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return attendance_service.get_today_status(db, user_id)
