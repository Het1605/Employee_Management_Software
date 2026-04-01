from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib

from app.core.config import settings
from app.db.models import DocumentType, GeneratedDocument, User
from app.schemas.document import (
    GeneratedDocumentCreate,
    GeneratedDocumentUpdate,
    SendDocumentRequest,
)


DOCUMENT_TYPE_SEEDS = [
    {"name": "Offer Letter", "code": "offer_letter"},
    {"name": "Internship Certificate", "code": "internship_certificate"},
    {"name": "Experience Letter", "code": "experience_letter"},
    {"name": "Salary Slip", "code": "salary_slip"},
]


class DocumentService:
    @staticmethod
    def seed_document_types(db: Session):
        existing_codes = {
            code for (code,) in db.query(DocumentType.code).all()
        }

        missing_types = [
            DocumentType(**item)
            for item in DOCUMENT_TYPE_SEEDS
            if item["code"] not in existing_codes
        ]

        if not missing_types:
            return

        db.add_all(missing_types)
        db.commit()

    @staticmethod
    def list_document_types(db: Session):
        return db.query(DocumentType).order_by(DocumentType.name.asc()).all()

    @staticmethod
    def _get_user(db: Session, user_id: int):
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    @staticmethod
    def _get_document_type(db: Session, document_type_id: int):
        document_type = db.query(DocumentType).filter(DocumentType.id == document_type_id).first()
        if not document_type:
            raise HTTPException(status_code=404, detail="Document type not found")
        return document_type

    @staticmethod
    def _get_generated_document(db: Session, document_id: int):
        document = db.query(GeneratedDocument).filter(GeneratedDocument.id == document_id).first()
        if not document:
            raise HTTPException(status_code=404, detail="Generated document not found")
        return document

    @staticmethod
    def create_document(db: Session, data: GeneratedDocumentCreate):
        DocumentService._get_document_type(db, data.document_type_id)
        document = GeneratedDocument(**data.model_dump())
        db.add(document)
        db.commit()
        db.refresh(document)
        return document

    @staticmethod
    def update_document(db: Session, document_id: int, data: GeneratedDocumentUpdate):
        document = DocumentService._get_generated_document(db, document_id)

        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(document, key, value)

        db.commit()
        db.refresh(document)
        return document

    @staticmethod
    def list_documents(db: Session):
        return db.query(GeneratedDocument).order_by(GeneratedDocument.created_at.desc()).all()

    @staticmethod
    def get_document(db: Session, document_id: int):
        return DocumentService._get_generated_document(db, document_id)

    @staticmethod
    def delete_document(db: Session, document_id: int):
        document = DocumentService._get_generated_document(db, document_id)
        db.delete(document)
        db.commit()
        return {"message": "Document deleted successfully"}

    @staticmethod
    def send_document(db: Session, document_id: int, payload: SendDocumentRequest):
        document = DocumentService._get_generated_document(db, document_id)
        user = DocumentService._get_user(db, payload.user_id)

        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="SMTP credentials are not configured",
            )

        message = MIMEMultipart()
        message["From"] = settings.SMTP_USER
        message["To"] = user.email
        message["Subject"] = document.title
        message.attach(MIMEText(document.content, "html"))

        try:
            server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
            server.quit()
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send email: {exc}",
            ) from exc

        document.status = "sent"
        db.commit()
        db.refresh(document)
        return {"message": "Document sent successfully", "document_id": document.id, "status": document.status}
