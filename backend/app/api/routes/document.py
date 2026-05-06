from fastapi import APIRouter, Depends, status, Query
from app.schemas.base_response import ResponseSchema
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies.auth import get_current_user
from app.api.dependencies.roles import role_required
from app.models import User
from app.schemas.document import (
    DocumentTypeResponse,
    GeneratedDocumentCreate,
    GeneratedDocumentResponse,
    GeneratedDocumentUpdate,
    SendDocumentRequest,
)
from app.services.document_service import DocumentService


router = APIRouter(tags=["Documents"])


@router.get("/document-types", response_model=ResponseSchema[list[DocumentTypeResponse]])
def list_document_types(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = DocumentService.list_document_types(db)
    return ResponseSchema(status="success", data=result)


@router.post("/documents", response_model=ResponseSchema[GeneratedDocumentResponse], status_code=status.HTTP_201_CREATED)
def create_document(
    data: GeneratedDocumentCreate, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = DocumentService.create_document(db, data)
    return ResponseSchema(status="success", message="Document generated", data=result)

@router.post("/documents/salary/calculate", response_model=ResponseSchema[dict])
def calculate_salary_preview(
    user_id: int,
    month: int,
    year: int,
    company_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = DocumentService.calculate_salary_metrics(db, user_id, month, year, company_id)
    return ResponseSchema(status="success", data=result)

@router.post("/documents/salary/yearly-calculate", response_model=ResponseSchema[dict])
def calculate_yearly_salary_preview(
    user_id: int,
    year: int,
    company_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = DocumentService.calculate_yearly_salary_metrics(db, user_id, year, company_id)
    return ResponseSchema(status="success", data=result)

@router.post("/documents/send", response_model=ResponseSchema[dict])
def send_document(
    data: SendDocumentRequest, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = DocumentService.send_document_email(db, data)
    return ResponseSchema(status="success", message="Document sent via email", data=result)


@router.get("/documents", response_model=ResponseSchema[list[GeneratedDocumentResponse]])
def list_documents(
    company_id: int | None = Query(default=None), 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = DocumentService.list_documents(db, company_id=company_id)
    return ResponseSchema(status="success", data=result)


@router.get("/documents/{document_id}", response_model=ResponseSchema[GeneratedDocumentResponse])
def get_document(
    document_id: int, 
    company_id: int | None = Query(default=None), 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = DocumentService.get_document(db, document_id, company_id=company_id)
    return ResponseSchema(status="success", data=result)


@router.put("/documents/{document_id}", response_model=ResponseSchema[GeneratedDocumentResponse])
def update_document(
    document_id: int, 
    data: GeneratedDocumentUpdate, 
    company_id: int | None = Query(default=None), 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = DocumentService.update_document(db, document_id, data, company_id=company_id)
    return ResponseSchema(status="success", message="Document updated", data=result)


@router.delete("/documents/{document_id}", response_model=ResponseSchema[dict])
def delete_document(
    document_id: int, 
    company_id: int | None = Query(default=None), 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = DocumentService.delete_document(db, document_id, company_id=company_id)
    return ResponseSchema(status="success", message="Document deleted", data=result)
