from sqlalchemy.orm import Session
from app.db.models import Attendance, User, UserCompanyMapping
from datetime import date, datetime, timedelta
import calendar
from fastapi import HTTPException, status

def mark_attendance(db: Session, current_user: User, company_id: int, status_str: str, target_user_id: int = None, target_date: date = None):
    role = current_user.role.upper()
    today = date.today()

    # Determine user and date based on role
    if role in ['ADMIN', 'HR']:
        user_id = target_user_id or current_user.id
        final_date = target_date or today
    else:
        user_id = current_user.id
        final_date = today
        if status_str == 'absent':
             raise HTTPException(status_code=400, detail="Employee cannot set attendance to 'absent'")
        if target_date and target_date != today:
             raise HTTPException(status_code=400, detail="Employee can only mark attendance for today")

    # Check if user belongs to company
    mapping = db.query(UserCompanyMapping).filter(
        UserCompanyMapping.user_id == user_id,
        UserCompanyMapping.company_id == company_id
    ).first()
    if not mapping:
        raise HTTPException(status_code=403, detail="User does not belong to this company")

    # Handle status = 'absent' (DELETE if exists)
    if status_str == 'absent':
        db.query(Attendance).filter(
            Attendance.user_id == user_id,
            Attendance.date == final_date
        ).delete()
        db.commit()
        return {"message": "Attendance marked as absent (record removed)"}

    if status_str not in ['present', 'half_day']:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'present', 'half_day' or 'absent'")

    # UPSERT: Check if record exists
    existing = db.query(Attendance).filter(
        Attendance.user_id == user_id,
        Attendance.date == final_date
    ).first()
    
    if existing:
        existing.status = status_str
        existing.company_id = company_id
    else:
        new_attendance = Attendance(
            user_id=user_id,
            company_id=company_id,
            date=final_date,
            status=status_str
        )
        db.add(new_attendance)
        
    db.commit()
    return {"message": f"Attendance marked as {status_str} successfully"}

def get_my_attendance(db: Session, user_id: int, month: int, year: int):
    # Get all records for user in this month/year
    start_date = date(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    end_date = date(year, month, last_day)

    records = db.query(Attendance).filter(
        Attendance.user_id == user_id,
        Attendance.date >= start_date,
        Attendance.date <= end_date
    ).all()

    record_map = {r.date: r.status for r in records}
    
    attendance_list = []
    present_days = 0
    half_days = 0
    absent_days = 0
    total_days = last_day

    for day in range(1, last_day + 1):
        curr_date = date(year, month, day)
        status = record_map.get(curr_date, "absent")
        attendance_list.append({"date": curr_date, "status": status})
        
        if status == "present":
            present_days += 1
        elif status == "half_day":
            half_days += 1
        else:
            absent_days += 1

    return {
        "total_days": total_days,
        "present_days": present_days,
        "half_days": half_days,
        "absent_days": absent_days,
        "attendance": attendance_list
    }

def get_company_attendance(db: Session, company_id: int, month: int, year: int):
    # Get all users in company
    users = db.query(User).join(UserCompanyMapping).filter(UserCompanyMapping.company_id == company_id).all()
    
    start_date = date(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    end_date = date(year, month, last_day)

    # Get all attendance records for this company in this period
    all_records = db.query(Attendance).filter(
        Attendance.company_id == company_id,
        Attendance.date >= start_date,
        Attendance.date <= end_date
    ).all()

    # UserID -> Date -> Status
    company_record_map = {}
    for r in all_records:
        if r.user_id not in company_record_map:
            company_record_map[r.user_id] = {}
        company_record_map[r.user_id][r.date] = r.status

    response = []
    for u in users:
        user_records = company_record_map.get(u.id, {})
        attendance_list = []
        present_count = 0
        half_count = 0
        absent_count = 0

        for day in range(1, last_day + 1):
            curr_date = date(year, month, day)
            day_status = user_records.get(curr_date, "absent")
            attendance_list.append({"date": curr_date, "status": day_status})
            
            if day_status == "present":
                present_count += 1
            elif day_status == "half_day":
                half_count += 1
            else:
                absent_count += 1

        response.append({
            "user_id": u.id,
            "name": f"{u.first_name} {u.last_name}",
            "present_days": present_count,
            "half_days": half_count,
            "absent_days": absent_count,
            "attendance": attendance_list
        })

    return response

def get_today_status(db: Session, user_id: int):
    today = date.today()
    record = db.query(Attendance).filter(
        Attendance.user_id == user_id,
        Attendance.date == today
    ).first()
    return {"status": record.status if record else "absent"}
