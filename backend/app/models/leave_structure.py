"""
Leave Structure & Assignment Models
====================================
Tables:
  - leave_structures          : Named leave policy templates
  - leave_structure_details   : Per-leave-type rules (PL / CL / SL)
  - leave_assignments         : User ↔ structure mapping (one active per user)
  - leave_balances            : Running balance per user / leave-type / period
"""

import enum
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey,
    Enum as SAEnum, UniqueConstraint, Numeric, CheckConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


# ─────────────────────────────────────────
# ENUMs
# ─────────────────────────────────────────

class LeaveType(enum.Enum):
    PL = "PL"   # Privilege Leave
    CL = "CL"   # Casual Leave
    SL = "SL"   # Sick Leave


class AllocationType(enum.Enum):
    MONTHLY = "MONTHLY"   # (total_days / 12) credited each month
    YEARLY  = "YEARLY"    # full total_days credited at once


class ResetPolicy(enum.Enum):
    ENCASH = "ENCASH"   # remaining balance paid out; reset to 0
    EXTEND = "EXTEND"   # carry forward remaining balance
    VOID   = "VOID"     # remaining balance forfeited; reset to 0


# ─────────────────────────────────────────
# leave_structures
# ─────────────────────────────────────────

class LeaveStructure(Base):
    __tablename__ = "leave_structures"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(150), unique=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    details     = relationship(
        "LeaveStructureDetail",
        back_populates="structure",
        cascade="all, delete-orphan",
    )
    assignments = relationship(
        "LeaveAssignment",
        back_populates="structure",
        cascade="all, delete-orphan",
    )


# ─────────────────────────────────────────
# leave_structure_details
# ─────────────────────────────────────────

class LeaveStructureDetail(Base):
    __tablename__ = "leave_structure_details"

    id              = Column(Integer, primary_key=True, index=True)
    structure_id    = Column(Integer, ForeignKey("leave_structures.id", ondelete="CASCADE"), nullable=False)
    leave_type      = Column(SAEnum(LeaveType,    name="leave_type_enum"),    nullable=False)
    total_days      = Column(Integer, nullable=False)
    allocation_type = Column(SAEnum(AllocationType, name="allocation_type_enum"), nullable=False)
    reset_policy    = Column(SAEnum(ResetPolicy,  name="reset_policy_enum"),  nullable=False)

    # Relationships
    structure = relationship("LeaveStructure", back_populates="details")

    __table_args__ = (
        # Exactly one row per (structure, leave_type)
        UniqueConstraint("structure_id", "leave_type", name="uq_structure_leave_type"),
        CheckConstraint("total_days > 0", name="chk_total_days_positive"),
    )


# ─────────────────────────────────────────
# leave_assignments
# ─────────────────────────────────────────

class LeaveAssignment(Base):
    """One active structure per user (enforced by unique constraint on user_id)."""
    __tablename__ = "leave_assignments"

    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    structure_id = Column(Integer, ForeignKey("leave_structures.id", ondelete="CASCADE"), nullable=False)
    assigned_at  = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user      = relationship("User")
    structure = relationship("LeaveStructure", back_populates="assignments")


# ─────────────────────────────────────────
# leave_balances
# ─────────────────────────────────────────

class LeaveBalance(Base):
    """
    Tracks per-user leave balance.
    - YEARLY  allocation: month = NULL  (one row per year)
    - MONTHLY allocation: month = 1-12  (one row per month)
    """
    __tablename__ = "leave_balances"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    leave_type      = Column(SAEnum(LeaveType, name="leave_type_enum", create_type=False), nullable=False)
    year            = Column(Integer, nullable=False)
    month           = Column(Integer, nullable=True)   # NULL for YEARLY allocation
    total_allocated = Column(Numeric(precision=8, scale=2), nullable=False, default=0)
    used            = Column(Numeric(precision=8, scale=2), nullable=False, default=0)
    remaining       = Column(Numeric(precision=8, scale=2), nullable=False, default=0)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User")

    __table_args__ = (
        # Prevent duplicate period rows
        UniqueConstraint("user_id", "leave_type", "year", "month", name="uq_user_leave_balance_period"),
        CheckConstraint("used >= 0",      name="chk_used_non_negative"),
        CheckConstraint("remaining >= 0", name="chk_remaining_non_negative"),
    )
