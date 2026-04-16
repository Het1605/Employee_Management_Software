"""
Pydantic Schemas — Leave Structure & Assignment
"""

from __future__ import annotations
from pydantic import BaseModel, Field, model_validator
from typing import List, Optional
from datetime import datetime
from decimal import Decimal

from app.models.leave_structure import LeaveType, AllocationType, ResetPolicy


# ─────────────────────────────────────────────────────────────
# Leave Structure
# ─────────────────────────────────────────────────────────────

class LeaveStructureDetailIn(BaseModel):
    """One detail row supplied when creating a structure."""
    leave_type:      LeaveType
    total_days:      int = Field(..., gt=0, description="Must be > 0")
    allocation_type: AllocationType
    reset_policy:    ResetPolicy


class LeaveStructureCreate(BaseModel):
    name:    str = Field(..., min_length=1, max_length=150)
    details: List[LeaveStructureDetailIn]

    @model_validator(mode="after")
    def validate_all_three_types(self) -> "LeaveStructureCreate":
        provided = {d.leave_type for d in self.details}
        required = {LeaveType.PL, LeaveType.CL, LeaveType.SL}
        if provided != required:
            raise ValueError(
                "details must contain exactly one entry for each of PL, CL, and SL"
            )
        return self


class LeaveStructureDetailOut(BaseModel):
    id:              int
    structure_id:    int
    leave_type:      LeaveType
    total_days:      int
    allocation_type: AllocationType
    reset_policy:    ResetPolicy

    class Config:
        from_attributes = True


class LeaveStructureOut(BaseModel):
    id:         int
    name:       str
    created_at: datetime
    details:    List[LeaveStructureDetailOut]

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────
# Leave Assignment
# ─────────────────────────────────────────────────────────────

class LeaveAssignmentCreate(BaseModel):
    user_id:      int
    structure_id: int


class LeaveAssignmentOut(BaseModel):
    id:           int
    user_id:      int
    structure_id: int
    assigned_at:  datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────
# Leave Balance
# ─────────────────────────────────────────────────────────────

class LeaveBalanceOut(BaseModel):
    id:              int
    user_id:         int
    leave_type:      LeaveType
    year:            int
    month:           Optional[int] = None
    total_allocated: Decimal
    used:            Decimal
    remaining:       Decimal
    updated_at:      Optional[datetime] = None

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────
# Leave Deduction (used by leave management / approval flow)
# ─────────────────────────────────────────────────────────────

class LeaveDeductRequest(BaseModel):
    """
    Called by the leave approval flow to deduct days from the active balance.
    leave_category is PL / CL / SL identifying which bucket to deduct from.
    """
    user_id:        int
    leave_category: LeaveType
    days:           Decimal = Field(..., gt=0)
