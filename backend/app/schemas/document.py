from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class DocumentTypeResponse(BaseModel):
    id: int
    name: str
    code: str
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentStatus(str, Enum):
    DRAFT = "draft"
    GENERATED = "generated"
    SENT = "sent"


class GeneratedDocumentCreate(BaseModel):
    company_id: int
    document_type_id: int
    title: str = Field(..., min_length=2, max_length=200)
    content: str = Field(..., min_length=1)
    form_data: dict = Field(default_factory=dict)
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    status: DocumentStatus = DocumentStatus.DRAFT


class GeneratedDocumentUpdate(BaseModel):
    document_type_id: Optional[int] = None
    title: Optional[str] = Field(None, min_length=2, max_length=200)
    content: Optional[str] = Field(None, min_length=1)
    form_data: Optional[dict] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    status: Optional[DocumentStatus] = None


class SendDocumentRequest(BaseModel):
    user_id: int
    document_id: int


class GeneratedDocumentResponse(BaseModel):
    id: int
    company_id: Optional[int] = None
    document_type_id: int
    title: str
    content: str
    form_data: dict = Field(default_factory=dict)
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    status: DocumentStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
