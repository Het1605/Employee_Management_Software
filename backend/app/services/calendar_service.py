import logging

from sqlalchemy.orm import Session
from datetime import date
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from typing import List

logger = logging.getLogger(__name__)

from app.models.calendar import (
    WorkingDaysConfig, Holidays, CalendarOverrides, 
    HolidayType, OverrideType, HolidaySource
)
from app.schemas.calendar import (
    WorkingDayUpdate, WorkingDayResponse, WorkingDaysUpdateBulk,
    HolidayCreate, HolidayUpdate, HolidayResponse,
    OverrideCreate, OverrideUpdate, OverrideResponse,
    DayStatusResponse
)
from app.db.models import Company

class CalendarService:
    # -----------------------------------------------------
    # Company Validation Helper
    # -----------------------------------------------------
    @staticmethod
    def _ensure_company_exists(db: Session, company_id: int):
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found")
        return company

    # -----------------------------------------------------
    # Working Days Configuration
    # -----------------------------------------------------
    @staticmethod
    def get_working_days(db: Session, company_id: int) -> List[WorkingDaysConfig]:
        CalendarService._ensure_company_exists(db, company_id)
        days = db.query(WorkingDaysConfig).filter(WorkingDaysConfig.company_id == company_id).all()
        
        # Initialize if not exists
        if len(days) == 0:
            default_days = []
            for i in range(7):
                is_working = i < 5  # Mon-Fri working, Sat-Sun off
                default_days.append(WorkingDaysConfig(
                    company_id=company_id,
                    day_of_week=i,
                    is_working=is_working,
                    is_half_day=False
                ))
            db.add_all(default_days)
            db.commit()
            days = db.query(WorkingDaysConfig).filter(WorkingDaysConfig.company_id == company_id).all()
            
        return days

    @staticmethod
    def update_working_days(db: Session, company_id: int, payload: WorkingDaysUpdateBulk) -> List[WorkingDaysConfig]:
        CalendarService._ensure_company_exists(db, company_id)
        # Ensure days exist first
        CalendarService.get_working_days(db, company_id)
        
        from sqlalchemy import extract
        
        for day_data in payload.days:
            config = db.query(WorkingDaysConfig).filter(
                WorkingDaysConfig.company_id == company_id,
                WorkingDaysConfig.day_of_week == day_data.day_of_week
            ).first()
            if config:
                # Priority Logic: If a day is changed from OFF -> WORKING, delete holidays for that day.
                # old_config is accessed before update
                was_off = not config.is_working
                now_working = day_data.is_working

                config.is_working = day_data.is_working
                config.is_half_day = day_data.is_half_day
        db.commit()
        return CalendarService.get_working_days(db, company_id)

    # -----------------------------------------------------
    # Holidays
    # -----------------------------------------------------
    @staticmethod
    def get_holidays(db: Session, company_id: int) -> List[Holidays]:
        holidays = db.query(Holidays).filter(Holidays.company_id == company_id).all()
        logger.info("Fetched holidays for company %s: %s entries", company_id, len(holidays))
        return holidays

    @staticmethod
    def create_holiday(db: Session, company_id: int, holiday_data: HolidayCreate) -> Holidays:
        CalendarService._ensure_company_exists(db, company_id)
        
        # Check for duplicate holiday
        existing = db.query(Holidays).filter(
            Holidays.company_id == company_id, 
            Holidays.date == holiday_data.date
        ).first()
        
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Holiday already exists for this date")

        # Conflict Management: Check for existing override (Day Adjustment)
        existing_override = db.query(CalendarOverrides).filter(
            CalendarOverrides.company_id == company_id,
            CalendarOverrides.date == holiday_data.date
        ).first()

        if existing_override:
            if not holiday_data.force:
                status_label = "Working Day" if existing_override.override_type == OverrideType.WORKING else "Half Working Day"
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "conflict": True,
                        "existing_type": "custom_day",
                        "message": f"A Custom Day ({status_label}) already exists for this date. Do you want to replace it?"
                    }
                )
            # Delete if force is true
            db.delete(existing_override)

        # Remove force from dict before creating model
        create_dict = holiday_data.dict()
        create_dict.pop('force', None)
        
        db_holiday = Holidays(company_id=company_id, **create_dict)
        db.add(db_holiday)
        db.commit()
        db.refresh(db_holiday)
        return db_holiday

    @staticmethod
    def update_holiday(db: Session, holiday_id: int, update_data: HolidayUpdate) -> Holidays:
        holiday = db.query(Holidays).filter(Holidays.id == holiday_id).first()
        if not holiday:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Holiday not found")

        # Conflict Management if date is being updated
        update_dict = update_data.dict(exclude_unset=True)
        new_date = update_dict.get('date')
        force = update_dict.get('force', False)
        
        if new_date and new_date != holiday.date:
            # Check for existing override on new date
            existing_override = db.query(CalendarOverrides).filter(
                CalendarOverrides.company_id == holiday.company_id,
                CalendarOverrides.date == new_date
            ).first()

            if existing_override:
                if not force:
                    status_label = "Working Day" if existing_override.override_type == OverrideType.WORKING else "Half Working Day"
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail={
                            "conflict": True,
                            "existing_type": "custom_day",
                            "message": f"A Custom Day ({status_label}) already exists for this date. Do you want to replace it?"
                        }
                    )
                db.delete(existing_override)

        # Apply updates
        update_dict.pop('force', None)
        for key, value in update_dict.items():
            setattr(holiday, key, value)
            
        db.commit()
        db.refresh(holiday)
        return holiday

    @staticmethod
    def delete_holiday(db: Session, holiday_id: int):
        holiday = db.query(Holidays).filter(Holidays.id == holiday_id).first()
        if not holiday:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Holiday not found")
        
        db.delete(holiday)
        db.commit()
        return {"detail": "Holiday successfully deleted (hard delete)"}

    # -----------------------------------------------------
    # Calendar Overrides
    # -----------------------------------------------------
    @staticmethod
    def get_overrides(db: Session, company_id: int) -> List[CalendarOverrides]:
        return db.query(CalendarOverrides).filter(CalendarOverrides.company_id == company_id).all()

    @staticmethod
    def _ensure_day_adjustment_type(override_type):
        if override_type == OverrideType.HOLIDAY:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Holiday cannot be set from Day Adjustments. Please use Holiday Rules."
            )

    @staticmethod
    def create_override(db: Session, company_id: int, override_data: OverrideCreate) -> CalendarOverrides:
        CalendarService._ensure_company_exists(db, company_id)
        CalendarService._ensure_day_adjustment_type(override_data.override_type)
        
        # Check for duplicate override
        existing = db.query(CalendarOverrides).filter(
            CalendarOverrides.company_id == company_id, 
            CalendarOverrides.date == override_data.date
        ).first()
        
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Override already exists for this date")

        # Conflict Management: Check for existing holiday
        existing_holiday = db.query(Holidays).filter(
            Holidays.company_id == company_id,
            Holidays.date == override_data.date
        ).first()

        if existing_holiday:
            if not override_data.force:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail={
                        "conflict": True,
                        "existing_type": "holiday",
                        "message": "A Holiday already exists for this date. Do you want to replace it?"
                    }
                )
            # Delete if force is true
            db.delete(existing_holiday)
            
        # Remove force from dict before creating model
        create_dict = override_data.dict()
        create_dict.pop('force', None)

        db_override = CalendarOverrides(company_id=company_id, **create_dict)
        db.add(db_override)
        db.commit()
        db.refresh(db_override)
        return db_override

    @staticmethod
    def update_override(db: Session, override_id: int, update_data: OverrideUpdate) -> CalendarOverrides:
        override = db.query(CalendarOverrides).filter(CalendarOverrides.id == override_id).first()
        if not override:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Override not found")

        if update_data.override_type:
            CalendarService._ensure_day_adjustment_type(update_data.override_type)

        update_dict = update_data.dict(exclude_unset=True)
        new_date = update_dict.get('date')
        force = update_dict.get('force', False)

        if new_date and new_date != override.date:
            # Check for existing holiday on new date
            existing_holiday = db.query(Holidays).filter(
                Holidays.company_id == override.company_id,
                Holidays.date == new_date
            ).first()

            if existing_holiday:
                if not force:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail={
                            "conflict": True,
                            "existing_type": "holiday",
                            "message": "A Holiday already exists for this date. Do you want to replace it?"
                        }
                    )
                db.delete(existing_holiday)

        # Apply updates
        update_dict.pop('force', None)
        for key, value in update_dict.items():
            setattr(override, key, value)
            
        db.commit()
        db.refresh(override)
        return override

    @staticmethod
    def delete_override(db: Session, override_id: int):
        override = db.query(CalendarOverrides).filter(CalendarOverrides.id == override_id).first()
        if not override:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Override not found")
        
        db.delete(override)
        db.commit()
        return {"detail": "Override successfully deleted"}

    # -----------------------------------------------------
    # Core Business Logic
    # -----------------------------------------------------
    @staticmethod
    def get_day_status(db: Session, company_id: int, target_date: date) -> DayStatusResponse:
        CalendarService._ensure_company_exists(db, company_id)
        
        # 1. Check override
        override = db.query(CalendarOverrides).filter(
            CalendarOverrides.company_id == company_id,
            CalendarOverrides.date == target_date
        ).first()
        
        if override:
            return DayStatusResponse(
                date=target_date,
                status=override.override_type.value,
                source="override",
                name=override.reason
            )

        # 2. Check holiday
        holiday = db.query(Holidays).filter(
            Holidays.company_id == company_id,
            Holidays.date == target_date
        ).first()
        
        if holiday:
            return DayStatusResponse(
                date=target_date,
                status="holiday",
                source="holiday",
                name=holiday.name
            )

        # 3. Check working_days_config
        day_of_week = target_date.weekday() # 0 = Monday, 6 = Sunday
        
        # Fetch configs, init if necessary
        days = CalendarService.get_working_days(db, company_id)
        config = next((d for d in days if d.day_of_week == day_of_week), None)
        
        if not config:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Invalid working day configuration")

        if config.is_half_day:
            return DayStatusResponse(
                date=target_date,
                status="half_day",
                source="rule"
            )
        elif config.is_working:
            return DayStatusResponse(
                date=target_date,
                status="working",
                source="rule"
            )
        else:
            return DayStatusResponse(
                date=target_date,
                status="holiday",  # Off-day treated as holiday equivalent
                source="rule"
            )
