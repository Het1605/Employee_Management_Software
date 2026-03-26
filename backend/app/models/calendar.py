from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from app.db.database import Base

class HolidayType(enum.Enum):
    PUBLIC = "public"
    COMPANY = "company"
    OPTIONAL = "optional"

class HolidaySource(enum.Enum):
    MANUAL = "manual"
    IMPORTED = "imported"

class OverrideType(enum.Enum):
    WORKING = "working"
    HOLIDAY = "holiday"
    HALF_DAY = "half_day"

class WorkingDaysConfig(Base):
    __tablename__ = "working_days_configs"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    day_of_week = Column(Integer, nullable=False)  # 0-6 (0=Monday, 6=Sunday)
    is_working = Column(Boolean, default=True, nullable=False)
    is_half_day = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('company_id', 'day_of_week', name='uq_company_day_of_week'),
    )

class Holidays(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    date = Column(Date, nullable=False)
    name = Column(String, nullable=False)
    type = Column(SQLEnum(HolidayType), nullable=False)
    description = Column(String, nullable=True)
    source = Column(SQLEnum(HolidaySource), default=HolidaySource.MANUAL, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('company_id', 'date', name='uq_company_holiday_date'),
    )

class CalendarOverrides(Base):
    __tablename__ = "calendar_overrides"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    date = Column(Date, nullable=False)
    override_type = Column(SQLEnum(OverrideType), nullable=False)
    reason = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('company_id', 'date', name='uq_company_override_date'),
    )
