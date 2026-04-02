from fastapi import APIRouter, Depends, status
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

@router.post("/documents/generate", response_model=GeneratedDocumentResponse, status_code=status.HTTP_201_CREATED)
def generate_document(data: GeneratedDocumentCreate, db: Session = Depends(get_db)):
    return DocumentService.generate_document_pdf(db, data)

@router.post("/documents/send")
def send_document(data: SendDocumentRequest, db: Session = Depends(get_db)):
    return DocumentService.send_document_email(db, data)


@router.get("/documents", response_model=list[GeneratedDocumentResponse])
def list_documents(db: Session = Depends(get_db)):
    return DocumentService.list_documents(db)


@router.get("/documents/{document_id}", response_model=GeneratedDocumentResponse)
def get_document(document_id: int, db: Session = Depends(get_db)):
    return DocumentService.get_document(db, document_id)


@router.put("/documents/{document_id}", response_model=GeneratedDocumentResponse)
def update_document(document_id: int, data: GeneratedDocumentUpdate, db: Session = Depends(get_db)):
    return DocumentService.update_document(db, document_id, data)


@router.delete("/documents/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    return DocumentService.delete_document(db, document_id)

