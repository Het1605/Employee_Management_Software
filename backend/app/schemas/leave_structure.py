"""
Pydantic Schemas — Leave Structure & Assignment
"""

from __future__ import annotations
import enum
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
# Leave Day Type
# ─────────────────────────────────────────────────────────────

class LeaveDayType(str, enum.Enum):
    """Granularity of a single leave request."""
    FULL_DAY = "FULL_DAY"
    HALF_DAY = "HALF_DAY"


# ─────────────────────────────────────────────────────────────
# Leave Deduction (used by leave management / approval flow)
# ─────────────────────────────────────────────────────────────

class LeaveDeductRequest(BaseModel):
    """
    Called by the leave approval flow to deduct days from the active balance.

    Fields:
      - user_id        : Target user
      - leave_category : PL / CL / SL — which bucket to deduct from
      - leave_day_type : FULL_DAY (default) or HALF_DAY
      - days           : Total days to deduct.
                         Must be exactly 0.5 for HALF_DAY;
                         a whole positive integer (≥ 1) for FULL_DAY.

    Examples:
      Half day    → { "leave_day_type": "HALF_DAY", "days": 0.5 }
      2 full days → { "leave_day_type": "FULL_DAY",  "days": 2   }
    """
    user_id:        int
    leave_category: LeaveType
    leave_day_type: LeaveDayType = LeaveDayType.FULL_DAY
    days:           Decimal = Field(
        ...,
        ge=Decimal("0.5"),
        description=(
            "Total days to deduct. "
            "Use 0.5 for HALF_DAY; a whole number ≥ 1 for FULL_DAY."
        ),
    )

    @model_validator(mode="after")
    def validate_days_for_leave_day_type(self) -> "LeaveDeductRequest":
        """Ensure `days` is consistent with `leave_day_type`."""
        if self.leave_day_type == LeaveDayType.HALF_DAY:
            if self.days != Decimal("0.5"):
                raise ValueError(
                    "For HALF_DAY leave, days must be exactly 0.5"
                )
        else:  # FULL_DAY
            # days must be a whole number (1, 2, 3 …)
            if self.days % Decimal("1") != Decimal("0") or self.days < Decimal("1"):
                raise ValueError(
                    "For FULL_DAY leave, days must be a whole number ≥ 1 (e.g. 1, 2, 3)"
                )
        return self
