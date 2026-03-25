from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, List
from datetime import datetime

class CompanyBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    address: str = Field(..., min_length=5)
    gst_number: str = Field(..., min_length=15, max_length=15, description="15-digit GSTIN")
    pan_number: str = Field(..., min_length=10, max_length=10, description="10-digit PAN")
    logo_url: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    address: Optional[str] = Field(None, min_length=5)
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    logo_url: Optional[str] = None

class CompanyResponse(CompanyBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserAssignment(BaseModel):
    user_ids: List[int]

class CompanyUserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True
