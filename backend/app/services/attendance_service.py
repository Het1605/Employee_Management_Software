from sqlalchemy.orm import Session
from app.db.models import Attendance, User, UserCompanyMapping
from app.models.calendar import WorkingDaysConfig, Holidays, CalendarOverrides, OverrideType
from datetime import date, datetime, timedelta
import calendar
from fastapi import HTTPException, status

def get_day_status(db: Session, company_id: int, target_date: date):
    # Step 1: check override
    override = db.query(CalendarOverrides).filter(
        CalendarOverrides.company_id == company_id,
        CalendarOverrides.date == target_date
    ).first()

    if override:
        if override.override_type == OverrideType.WORKING:
            return "working"
        if override.override_type == OverrideType.HOLIDAY:
            return "off"
        if override.override_type == OverrideType.HALF_DAY:
            return "half"

    # Step 2: check holiday
    holiday = db.query(Holidays).filter(
        Holidays.company_id == company_id,
        Holidays.date == target_date
    ).first()

    if holiday:
        return "off"

    # Step 3: weekly config
    # Convert Python weekday (0=Monday...6=Sunday) to Standard (0=Sunday...6=Saturday)
    day_of_week = (target_date.weekday() + 1) % 7

    config = db.query(WorkingDaysConfig).filter(
        WorkingDaysConfig.company_id == company_id,
        WorkingDaysConfig.day_of_week == day_of_week
    ).first()

    if not config or not config.is_working:
        return "off"

    if config.is_half_day:
        return "half"

    return "working"

def mark_attendance(db: Session, actor: User, company_id: int, status_str: str, target_user_id: int = None, target_date: date = None):
    # If no actor (lockless swagger), handle as requested or identifying by target_user_id
    if not actor:
         actor = db.query(User).filter(User.id == target_user_id).first()
         if not actor:
             raise HTTPException(status_code=404, detail="User not found")
             
    role = actor.role.upper()
    today = date.today()

    # Determine user and date based on role
    if role in ['ADMIN', 'HR']:
        user_id = target_user_id or actor.id
        final_date = target_date or today
    else:
        user_id = actor.id
        final_date = today
        if target_date and target_date != today:
             raise HTTPException(status_code=400, detail="Employee can only mark attendance for today")

    # Resolve company_id if not provided
    if not company_id:
        mapping = db.query(UserCompanyMapping).filter(UserCompanyMapping.user_id == user_id).first()
        if not mapping:
             raise HTTPException(status_code=400, detail="User is not assigned to any company")
        company_id = mapping.company_id
    else:
        # Check if user belongs to company
        mapping = db.query(UserCompanyMapping).filter(
            UserCompanyMapping.user_id == user_id,
            UserCompanyMapping.company_id == company_id
        ).first()
        if not mapping:
            raise HTTPException(status_code=403, detail="User does not belong to this company")

    # Validation from get_day_status
    day_status = get_day_status(db, company_id, final_date)
    
    if day_status == "off":
        raise HTTPException(status_code=400, detail="Attendance not allowed on off day or holiday")
    
    if day_status == "half":
        if status_str not in ["present", "half_day", "absent"]: # Validation includes absent now
             raise HTTPException(status_code=400, detail="Invalid status for half working day")

    if status_str not in ['present', 'half_day', 'absent']:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'present', 'half_day' or 'absent'")

    # UPSERT: Always store records, including 'absent'
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
    return {"message": f"Attendance recorded as {status_str}"}

def get_my_attendance(db: Session, user_id: int, month: int, year: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Get associated company
    mapping = db.query(UserCompanyMapping).filter(UserCompanyMapping.user_id == user_id).first()
    if not mapping:
        raise HTTPException(status_code=404, detail="User not assigned to any company")
    
    company_id = mapping.company_id
    
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
        db_status = record_map.get(curr_date)
        
        day_type = get_day_status(db, company_id, curr_date)
        
        # Priority: DB record first, fallback to 'absent' (implied or explicit)
        final_status = db_status if db_status else "absent"
        attendance_list.append({"date": curr_date, "status": final_status, "day_type": day_type})
        
        if final_status == "present":
            present_days += 1
        elif final_status == "half_day":
            half_days += 1
        elif final_status == "absent":
             # Every working day must have a record, but if it doesn't, we still count as absent for stats
             if day_type in ["working", "half"]:
                  absent_days += 1

    return {
        "total_days": total_days,
        "present_days": present_days,
        "half_days": half_days,
        "absent_days": absent_days,
        "attendance": attendance_list
    }

def get_company_attendance(db: Session, company_id: int, month: int, year: int):
    users = db.query(User).join(UserCompanyMapping).filter(UserCompanyMapping.company_id == company_id).all()
    
    start_date = date(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    end_date = date(year, month, last_day)

    all_records = db.query(Attendance).filter(
        Attendance.company_id == company_id,
        Attendance.date >= start_date,
        Attendance.date <= end_date
    ).all()

    company_record_map = {}
    for r in all_records:
        if r.user_id not in company_record_map:
            company_record_map[r.user_id] = {}
        company_record_map[r.user_id][r.date] = r.status

    # Get working day map for the month to avoid repetitive DB hits
    day_types = {}
    for day in range(1, last_day + 1):
        curr_date = date(year, month, day)
        day_types[curr_date] = get_day_status(db, company_id, curr_date)

    response = []
    for u in users:
        user_records = company_record_map.get(u.id, {})
        present_count = 0
        half_count = 0
        absent_count = 0

        for curr_date, day_type in day_types.items():
            db_status = user_records.get(curr_date)
            final_status = db_status if db_status else "absent"
            
            if final_status == "present":
                present_count += 1
            elif final_status == "half_day":
                half_count += 1
            elif final_status == "absent":
                if day_type in ["working", "half"]:
                    absent_count += 1

        response.append({
            "user_id": u.id,
            "name": f"{u.first_name} {u.last_name}",
            "present_days": present_count,
            "half_days": half_count,
            "absent_days": absent_count
        })

    return response

def get_today_status(db: Session, user_id: int):
    today = date.today()
    mapping = db.query(UserCompanyMapping).filter(UserCompanyMapping.user_id == user_id).first()
    company_id = mapping.company_id if mapping else None
    day_type = get_day_status(db, company_id, today) if company_id else "working"
    
    record = db.query(Attendance).filter(
        Attendance.user_id == user_id,
        Attendance.date == today
    ).first()
    
    status = record.status if record else "absent"
    return {"status": status, "day_type": day_type}
