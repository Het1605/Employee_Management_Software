from pydantic import BaseModel, HttpUrl, Field, field_validator, model_validator, computed_field
from typing import Optional, List
import re
from datetime import datetime

class TaxIdMixin(BaseModel):
    gst_number: Optional[str] = Field(None)
    pan_number: Optional[str] = Field(None)

    @field_validator('gst_number', 'pan_number', mode='before')
    @classmethod
    def empty_to_none(cls, v):
        if v == "":
            return None
        return v

    @field_validator('gst_number')
    @classmethod
    def validate_gst(cls, v):
        if v is None:
            return v
        if len(v) != 15:
            raise ValueError("GST Number must be exactly 15 characters")
        pattern = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[0-9A-Z]{1}[0-9A-Z]{1}$'
        if not re.match(pattern, v):
            raise ValueError("Invalid GST Format")
        return v
        
    @field_validator('pan_number')
    @classmethod
    def validate_pan(cls, v):
        if v is None:
            return v
        if len(v) != 10:
            raise ValueError("PAN Number must be exactly 10 characters")
        pattern = r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$'
        if not re.match(pattern, v):
            raise ValueError("Invalid PAN Format")
        return v
        
    @model_validator(mode='after')
    def validate_pan_matches_gst(self):
        if hasattr(self, 'gst_number') and hasattr(self, 'pan_number'):
            if self.gst_number and self.pan_number:
                extracted_pan = self.gst_number[2:12]
                if extracted_pan != self.pan_number:
                    raise ValueError(f"PAN number {self.pan_number} must match the center 10 characters of GST number {self.gst_number}")
        return self

class CompanyBase(TaxIdMixin):
    name: str = Field(..., min_length=2, max_length=100)
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    address_line_3: Optional[str] = None
    postal_code: Optional[str] = None
    logo_url: Optional[str] = None
    header_image: Optional[str] = None
    footer_image: Optional[str] = None
    signature_image: Optional[str] = None
    company_stamp: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(TaxIdMixin):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    address_line_3: Optional[str] = None
    postal_code: Optional[str] = None
    logo_url: Optional[str] = None
    header_image: Optional[str] = None
    footer_image: Optional[str] = None
    signature_image: Optional[str] = None
    company_stamp: Optional[str] = None

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
    first_name: str
    last_name: str
    email: str
    role: str

    @computed_field
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    class Config:
        from_attributes = True
