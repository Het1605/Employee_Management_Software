from sqlalchemy import Column, Integer, ForeignKey, Date, Enum, DateTime, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    status = Column(Enum("present", "half_day", "absent", name="attendance_status"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
    company = relationship("Company")

    __table_args__ = (
        UniqueConstraint('user_id', 'company_id', 'date', name='uq_user_attendance_per_day_per_company'),
        Index('idx_company_attendance_date', 'company_id', 'date'),
        Index('idx_user_attendance_date', 'user_id', 'date')
    )
