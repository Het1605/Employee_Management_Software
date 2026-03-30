from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.db.models import ComponentType, CalculationType, BasedOnType

class SalaryComponentResponse(BaseModel):
    id: int
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

class SalaryComponentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    is_taxable: Optional[bool] = None
    is_active: Optional[bool] = None

class StructureComponentBase(BaseModel):
    component_id: int
    calculation_type: CalculationType
    value: Decimal = Field(..., ge=0)
    based_on: BasedOnType
    based_on_component_id: Optional[int] = None
    sequence: int = Field(..., gt=0)
    is_active: bool = True

class StructureComponentCreate(StructureComponentBase):
    pass

class StructureComponentUpdate(BaseModel):
    calculation_type: Optional[CalculationType] = None
    value: Optional[Decimal] = Field(None, ge=0)
    sequence: Optional[int] = Field(None, gt=0)
    is_active: Optional[bool] = None

class StructureComponentResponse(StructureComponentBase):
    id: int
    component_name: str
    type: ComponentType
    based_on_component_name: Optional[str] = None

    class Config:
        from_attributes = True

class SalaryStructureBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    is_active: bool = True

class SalaryStructureCreate(SalaryStructureBase):
    company_id: int

class SalaryStructureResponse(SalaryStructureBase):
    id: int
    company_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class SalaryStructureDetailResponse(SalaryStructureResponse):
    components: List[StructureComponentResponse] = []

    class Config:
        from_attributes = True
