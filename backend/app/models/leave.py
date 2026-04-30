import enum
from sqlalchemy import Column, Integer, ForeignKey, Date, Enum, DateTime, Numeric, Text, String, Boolean, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class LeaveCategory(enum.Enum):
    PL = "PL"
    CL = "CL"
    SL = "SL"

class LeaveDurationType(enum.Enum):
    FULL_DAY = "FULL_DAY"
    HALF_DAY = "HALF_DAY"

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    total_days = Column(Numeric(precision=5, scale=2), nullable=False)
    reason = Column(Text, nullable=True)
    status = Column(String, default="pending", nullable=False)  # pending / approved / rejected
    
    leave_category = Column(Enum(LeaveCategory), nullable=False)
    leave_duration_type = Column(Enum(LeaveDurationType), nullable=False)
    
    applied_at = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    hidden_for_admin = Column(Boolean, default=False)
    hidden_for_employee = Column(Boolean, default=False)

    user = relationship("User", foreign_keys=[user_id])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    company = relationship("Company")

    __table_args__ = (
        Index('idx_leave_company_dates', 'company_id', 'start_date', 'end_date'),
        Index('idx_leave_user_dates', 'user_id', 'start_date', 'end_date'),
        Index('idx_leave_balance_aggregation', 'user_id', 'leave_category', 'status')
    )

class LeaveBalance(Base):
    __tablename__ = "leave_balances"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    leave_type = Column(String, nullable=False) # PL, CL, SL
    balance = Column(Numeric(precision=5, scale=2), default=0)
    set_month = Column(Integer, nullable=False)
    set_year = Column(Integer, nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    user = relationship("User")
    company = relationship("Company")

    __table_args__ = (
        UniqueConstraint('user_id', 'company_id', 'leave_type', name='uq_user_company_leave_type_balance'),
    )

class LeaveActivityLog(Base):
    __tablename__ = "leave_activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    leave_type = Column(String, nullable=False)
    action = Column(String, default="BALANCE_SET")
    action_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    action_by_role = Column(String, nullable=True) # ADMIN, HR, MANAGER
    balance_changes = Column(JSONB, nullable=False) # List of {month, before, after}
    details = Column(JSONB, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", foreign_keys=[user_id])
    admin = relationship("User", foreign_keys=[action_by])
    company = relationship("Company")
