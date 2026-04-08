from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.db.models import ComponentType

class SalaryComponentResponse(BaseModel):
    id: int
    company_id: int
    name: str
    type: ComponentType
    is_taxable: bool
    is_active: bool

    class Config:
        from_attributes = True

class SalaryComponentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: ComponentType
    is_taxable: bool = True
    company_id: int

class SalaryComponentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[ComponentType] = None
    is_taxable: Optional[bool] = None
    is_active: Optional[bool] = None

class SalaryStatusUpdate(BaseModel):
    is_active: bool

# ---------------- New Salary Structure Schema ----------------

class SalaryStructureDefinitionCreate(BaseModel):
    structure_name: str = Field(..., min_length=1, max_length=150)
    company_id: int


class SalaryStructureDefinitionUpdate(BaseModel):
    structure_name: str = Field(..., min_length=1, max_length=150)


class SalaryStructureDefinitionResponse(BaseModel):
    id: int
    company_id: int
    structure_name: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SalaryStructureDetailItem(BaseModel):
    component_id: int
    percentage: Decimal = Field(..., ge=0)


class SalaryStructureDetailCreate(BaseModel):
    items: List[SalaryStructureDetailItem]


class SalaryStructureDetailUpdate(BaseModel):
    percentage: Decimal = Field(..., ge=0)


class SalaryStructureDetailResponse(BaseModel):
    id: int
    structure_id: int
    component_id: int
    percentage: Decimal
    component_name: str

    class Config:
        from_attributes = True


class UserSalaryStructureCreate(BaseModel):
    user_id: int
    structure_id: int
    ctc: Decimal = Field(..., gt=0)


class UserSalaryStructureUpdate(BaseModel):
    structure_id: int
    ctc: Decimal = Field(..., gt=0)


class UserSalaryStructureResponse(BaseModel):
    id: int
    user_id: int
    structure_id: int
    ctc: Decimal
    assigned_at: datetime

    class Config:
        from_attributes = True
