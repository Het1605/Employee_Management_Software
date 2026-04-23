from sqlalchemy.orm import Session
from app.db.models import Attendance, User, UserCompanyMapping
from app.models.calendar import WorkingDaysConfig, Holidays, CalendarOverrides, OverrideType
from datetime import date, datetime, timedelta
import calendar
from fastapi import HTTPException, status
from app.services.calendar_service import CalendarService

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

    # 1. LOCK CHECK: Check if an approved leave exists for this date
    # (Avoid circular import by importing here)
    from app.db.models import LeaveRequest
    approved_leave = db.query(LeaveRequest).filter(
        LeaveRequest.user_id == user_id,
        LeaveRequest.company_id == company_id,
        LeaveRequest.status == "approved",
        LeaveRequest.start_date <= final_date,
        LeaveRequest.end_date >= final_date
    ).first()

    if approved_leave:
        # Strict enforcement: Even Admins cannot override attendance if a leave is approved.
        # Use simple error message as requested.
        raise HTTPException(
            status_code=400, 
            detail="Leave approved for this day. Attendance is locked."
        )

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

    # Validation from CalendarService (Standardized 0=Sunday logic)
    day_status_info = CalendarService.get_day_status(db, company_id, final_date)
    day_status = day_status_info.status
    
    if day_status == "holiday" or day_status == "off":
        raise HTTPException(status_code=400, detail="Attendance not allowed on off day or holiday")
    
    if day_status == "half_day":
        if status_str not in ["present", "half_day", "absent"]: # Validation includes absent now
             raise HTTPException(status_code=400, detail="Invalid status for half working day")

    if status_str not in ['present', 'half_day', 'absent']:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'present', 'half_day' or 'absent'")

    # UPSERT: Always store records, including 'absent'
    existing = db.query(Attendance).filter(
        Attendance.user_id == user_id,
        Attendance.company_id == company_id,
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

def get_my_attendance(db: Session, user_id: int, company_id: int, month: int, year: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    start_date = date(year, month, 1)
    last_day = calendar.monthrange(year, month)[1]
    end_date = date(year, month, last_day)

    records = db.query(Attendance).filter(
        Attendance.user_id == user_id,
        Attendance.company_id == company_id,
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
        
        day_status_info = CalendarService.get_day_status(db, company_id, curr_date)
        day_type = day_status_info.status
        
        final_status = db_status if db_status else "absent"
            
        attendance_list.append({"date": curr_date, "status": final_status, "day_type": day_type})
        
        if final_status == "present":
            present_days += 1
        elif final_status == "half_day":
            half_days += 1
        elif final_status == "absent":
             # Every working day must have a record, but if it doesn't, we still count as absent for stats
             if day_type in ["working", "half_day"]:
                  absent_days += 1

    return {
        "total_days": total_days,
        "present_days": present_days,
        "half_days": half_days,
        "absent_days": absent_days,
        "attendance": attendance_list
    }

def get_company_attendance(db: Session, company_id: int, month: int, year: int):
    # Fetch all users assigned to this company who are currently active
    users = db.query(User).join(
        UserCompanyMapping, User.id == UserCompanyMapping.user_id
    ).filter(
        UserCompanyMapping.company_id == company_id,
        User.is_active == True
    ).all()
    
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
    for d in range(1, last_day + 1):
        curr_date = date(year, month, d)
        day_info = CalendarService.get_day_status(db, company_id, curr_date)
        day_types[curr_date] = day_info.status

    # Get approved leaves for the company in this month range for locking
    from app.db.models import LeaveRequest
    leaves = db.query(LeaveRequest).filter(
        LeaveRequest.company_id == company_id,
        LeaveRequest.status == "approved",
        LeaveRequest.start_date <= end_date,
        LeaveRequest.end_date >= start_date
    ).all()

    # user_id -> set of dates with approved leave
    leave_map = {}
    for l in leaves:
        if l.user_id not in leave_map:
            leave_map[l.user_id] = set()
        
        # Add all dates in range
        d = max(l.start_date, start_date)
        while d <= min(l.end_date, end_date):
            leave_map[l.user_id].add(d)
            d += timedelta(days=1)

    response = []
    for u in users:
        user_records = company_record_map.get(u.id, {})
        user_leaves = leave_map.get(u.id, set())
        
        attendance_list = []
        present_count = 0
        half_count = 0
        absent_count = 0

        for curr_date, day_type in day_types.items():
            db_status = user_records.get(curr_date)
            final_status = db_status if db_status else "absent"
            
            is_locked = curr_date in user_leaves
            
            attendance_list.append({
                "date": curr_date,
                "status": final_status,
                "day_type": day_type,
                "is_locked": is_locked
            })

            if final_status == "present":
                present_count += 1
            elif final_status == "half_day":
                half_count += 1
            elif final_status == "absent":
                # Fix: Check for 'half_day' instead of 'half'
                if day_type in ["working", "half_day"]:
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

def get_today_status(db: Session, user_id: int, company_id: int):
    today = date.today()
    from app.db.models import LeaveRequest, LeaveDurationType
    
    record = db.query(Attendance).filter(
        Attendance.user_id == user_id,
        Attendance.company_id == company_id,
        Attendance.date == today
    ).first()
    
    day_status_info = CalendarService.get_day_status(db, company_id, today) if company_id else None
    day_type = day_status_info.status if day_status_info else "working"
    
    # Check for approved leave lock
    approved_leave = db.query(LeaveRequest).filter(
        LeaveRequest.user_id == user_id,
        LeaveRequest.company_id == company_id,
        LeaveRequest.status == "approved",
        LeaveRequest.start_date <= today,
        LeaveRequest.end_date >= today
    ).first()
    
    is_locked = False
    lock_message = ""
    
    if approved_leave:
        is_locked = True
        if approved_leave.leave_duration_type == LeaveDurationType.HALF_DAY:
            lock_message = "Half-day leave approved. Attendance is already recorded."
        else:
            lock_message = "Leave approved for this day. Attendance is locked."
            
    status = record.status if record else "absent"
    return {
        "status": status, 
        "day_type": day_type,
        "is_locked": is_locked,
        "lock_message": lock_message
    }

def sync_leave_to_attendance(
    db: Session, 
    user_id: int, 
    company_id: int, 
    start_date: date, 
    end_date: date, 
    duration_type: str, # "FULL_DAY" or "HALF_DAY"
    is_approved: bool
):
    """
    Synchronizes an approved leave request to the attendance table.
    - If is_approved=True: Inserts 'absent' or 'half_day' for all working days.
    - If is_approved=False: Deletes attendance for those days if it matches the leave status.
    """
    curr = start_date
    while curr <= end_date:
        # Only affect working days
        day_info = CalendarService.get_day_status(db, company_id, curr)
        if day_info.status in ["working", "half_day"]:
            if is_approved:
                # Determine status
                target_status = "absent" if duration_type == "FULL_DAY" else "half_day"
                
                # UPSERT
                existing = db.query(Attendance).filter_by(user_id=user_id, company_id=company_id, date=curr).first()
                if existing:
                    existing.status = target_status
                else:
                    db.add(Attendance(
                        user_id=user_id,
                        company_id=company_id,
                        date=curr,
                        status=target_status
                    ))
            else:
                # CLEANUP: Remove attendance for those days only if they was created by leave (absent/half_day)
                # If the employee had a manual "Present" record before approval, we should keep it?
                # The design says "Attendance must always reflect final state".
                # To be safe, we remove any attendance for those dates so the user can re-mark.
                db.query(Attendance).filter_by(user_id=user_id, company_id=company_id, date=curr).delete()
        
        curr += timedelta(days=1)
    
    db.flush() # Ensure changes are staged for the calling session
