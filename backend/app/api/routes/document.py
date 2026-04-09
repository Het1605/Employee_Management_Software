from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.document import (
    DocumentTypeResponse,
    GeneratedDocumentCreate,
    GeneratedDocumentResponse,
    GeneratedDocumentUpdate,
    SendDocumentRequest,
)
from app.services.document_service import DocumentService


router = APIRouter(tags=["Documents"])


@router.get("/document-types", response_model=list[DocumentTypeResponse])
def list_document_types(db: Session = Depends(get_db)):
    return DocumentService.list_document_types(db)


@router.post("/documents", response_model=GeneratedDocumentResponse, status_code=status.HTTP_201_CREATED)
def create_document(data: GeneratedDocumentCreate, db: Session = Depends(get_db)):
    return DocumentService.create_document(db, data)

@router.post("/documents/salary/calculate")
def calculate_salary_preview(
    user_id: int,
    month: int,
    year: int,
    company_id: int,
    db: Session = Depends(get_db)
):
    return DocumentService.calculate_salary_metrics(db, user_id, month, year, company_id)

@router.post("/documents/salary/yearly-calculate")
def calculate_yearly_salary_preview(
    user_id: int,
    year: int,
    company_id: int,
    db: Session = Depends(get_db)
):
    return DocumentService.calculate_yearly_salary_metrics(db, user_id, year, company_id)

@router.post("/documents/send")
def send_document(data: SendDocumentRequest, db: Session = Depends(get_db)):
    return DocumentService.send_document_email(db, data)


@router.get("/documents", response_model=list[GeneratedDocumentResponse])
def list_documents(company_id: int | None = Query(default=None), db: Session = Depends(get_db)):
    return DocumentService.list_documents(db, company_id=company_id)


@router.get("/documents/{document_id}", response_model=GeneratedDocumentResponse)
def get_document(document_id: int, company_id: int | None = Query(default=None), db: Session = Depends(get_db)):
    return DocumentService.get_document(db, document_id, company_id=company_id)


@router.put("/documents/{document_id}", response_model=GeneratedDocumentResponse)
def update_document(document_id: int, data: GeneratedDocumentUpdate, company_id: int | None = Query(default=None), db: Session = Depends(get_db)):
    return DocumentService.update_document(db, document_id, data, company_id=company_id)


@router.delete("/documents/{document_id}")
def delete_document(document_id: int, company_id: int | None = Query(default=None), db: Session = Depends(get_db)):
    return DocumentService.delete_document(db, document_id, company_id=company_id)
