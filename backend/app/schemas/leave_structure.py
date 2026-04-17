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
    total_days:      Decimal = Field(..., ge=0, description="Must be >= 0")
    allocation_type: AllocationType
    reset_policy:    ResetPolicy


class LeaveStructureCreate(BaseModel):
    company_id: int
    name:       str = Field(..., min_length=1, max_length=150)
    details:    List[LeaveStructureDetailIn]

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
    total_days:      Decimal
    allocation_type: AllocationType
    reset_policy:    ResetPolicy

    class Config:
        from_attributes = True


class LeaveStructureOut(BaseModel):
    id:         int
    company_id: int
    name:       str
    created_at: datetime
    details:    List[LeaveStructureDetailOut]

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────
# Leave Structure — Update
# ─────────────────────────────────────────────────────────────

class LeaveStructureDetailUpdate(BaseModel):
    """One detail row for an update request. leave_type acts as the key."""
    leave_type:      LeaveType
    total_days:      Decimal = Field(..., ge=0, description="Must be >= 0")
    allocation_type: AllocationType
    reset_policy:    ResetPolicy


class LeaveStructureUpdate(BaseModel):
    """
    Partial update for a leave structure.
    - name        : optional rename (must still be unique)
    - details     : if provided, must include exactly PL, CL, and SL entries
    """
    name:    Optional[str] = Field(None, min_length=1, max_length=150)
    details: Optional[List[LeaveStructureDetailUpdate]] = None

    @model_validator(mode="after")
    def validate_details_if_provided(self) -> "LeaveStructureUpdate":
        if self.details is not None:
            provided = {d.leave_type for d in self.details}
            required = {LeaveType.PL, LeaveType.CL, LeaveType.SL}
            if provided != required:
                raise ValueError(
                    "details must contain exactly one entry for each of PL, CL, and SL"
                )
        return self


# ─────────────────────────────────────────────────────────────
# Leave Assignment
# ─────────────────────────────────────────────────────────────

class LeaveAssignmentCreate(BaseModel):
    company_id:   int
    user_id:      int
    structure_id: int


class LeaveAssignmentUpdate(BaseModel):
    """Change the structure assigned to a user."""
    structure_id: int


class LeaveAssignmentOut(BaseModel):
    id:           int
    company_id:   int
    user_id:      int
    structure_id: int
    assigned_at:  datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────────────────────
# Leave Balance (Runtime Summary)
# ─────────────────────────────────────────────────────────────

class LeaveBalanceSummaryOut(BaseModel):
    allocated: float
    used:      float
    remaining: float
    excess:    float

class LeaveBalanceResponse(BaseModel):
    PL: LeaveBalanceSummaryOut
    CL: LeaveBalanceSummaryOut
    SL: LeaveBalanceSummaryOut
