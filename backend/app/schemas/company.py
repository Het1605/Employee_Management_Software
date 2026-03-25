from pydantic import BaseModel, HttpUrl, Field, field_validator, model_validator
from typing import Optional, List
import re
from datetime import datetime

class CompanyBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    address: str = Field(..., min_length=5)
    gst_number: str = Field(..., min_length=15, max_length=15, description="15-digit GSTIN")
    pan_number: str = Field(..., min_length=10, max_length=10, description="10-digit PAN")
    logo_url: Optional[str] = None

    @field_validator('gst_number')
    @classmethod
    def validate_gst(cls, v):
        pattern = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[0-9A-Z]{1}[0-9A-Z]{1}$'
        if not re.match(pattern, v):
            raise ValueError("Invalid GST Format")
        return v
        
    @field_validator('pan_number')
    @classmethod
    def validate_pan(cls, v):
        pattern = r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$'
        if not re.match(pattern, v):
            raise ValueError("Invalid PAN Format")
        return v
        
    @model_validator(mode='after')
    def validate_pan_matches_gst(self):
        if self.gst_number and self.pan_number:
            extracted_pan = self.gst_number[2:12]
            if extracted_pan != self.pan_number:
                raise ValueError(f"PAN number {self.pan_number} must match the center 10 characters of GST number {self.gst_number}")
        return self

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    address: Optional[str] = Field(None, min_length=5)
    gst_number: Optional[str] = Field(None, min_length=15, max_length=15)
    pan_number: Optional[str] = Field(None, min_length=10, max_length=10)
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
