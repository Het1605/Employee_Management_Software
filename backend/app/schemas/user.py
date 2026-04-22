from pydantic import BaseModel, EmailStr, Field, validator, computed_field
from typing import Optional, Any
from datetime import datetime, date
from enum import Enum
import re


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    HR = "HR"
    MANAGER = "MANAGER"
    EMPLOYEE = "EMPLOYEE"
    INTERN = "INTERN"

class UserBase(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    phone: Optional[str] = None
    position: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    role: UserRole = UserRole.EMPLOYEE
    is_active: bool = True

    @validator("start_date", "end_date", pre=True)
    def handle_empty_date(cls, v):
        if v == "":
            return None
        return v

    @validator("phone", pre=True)
    def validate_phone(cls, v):
        if v in (None, ""):
            return None
        phone = str(v).strip()
        if not re.fullmatch(r"\d{10}", phone):
            raise ValueError("Phone number must be exactly 10 digits")
        return phone

class UserCreate(UserBase):
    password: str = Field(...)
    confirm_password: str = Field(...)

    @validator("password", "confirm_password")
    def validate_password_length(cls, v):
        if len(v) < 8:
            raise ValueError("password should have at least 8 characters")
        return v

    @validator("confirm_password")
    def passwords_match(cls, v, values, **kwargs):
        if "password" in values and v != values["password"]:
            raise ValueError("passwords do not match")
        return v

class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=2, max_length=50)
    last_name: Optional[str] = Field(None, min_length=2, max_length=50)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    role: Optional[UserRole] = None

    @validator("start_date", "end_date", pre=True)
    def handle_empty_date(cls, v):
        if v == "":
            return None
        return v

    @validator("phone", pre=True)
    def validate_phone(cls, v):
        if v in (None, ""):
            return None
        phone = str(v).strip()
        if not re.fullmatch(r"\d{10}", phone):
            raise ValueError("Phone number must be exactly 10 digits")
        return phone

class UserResponse(UserBase):
    id: int
    created_at: datetime

    @computed_field
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(...)

    @validator("new_password")
    def validate_password_length(cls, v):
        if len(v) < 8:
            raise ValueError("password should have at least 8 characters")
        return v

class AdminPasswordReset(BaseModel):
    password: str = Field(...)

    @validator("password")
    def validate_password_length(cls, v):
        if len(v) < 8:
            raise ValueError("password should have at least 8 characters")
        return v
class ResetPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordConfirm(BaseModel):
    token: str
    new_password: str = Field(...)

    @validator("new_password")
    def validate_password_length(cls, v):
        if len(v) < 8:
            raise ValueError("password should have at least 8 characters")
        return v

class ResignationRequest(BaseModel):
    end_date: date

class UserStatusUpdate(BaseModel):
    is_active: bool

