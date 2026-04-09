from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
import os
import time
import re
from weasyprint import HTML
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional
from app.core.config import settings
from app.db.models import DocumentType, GeneratedDocument, User, SentDocument, Company, UserSalaryStructure, ComponentType
from app.schemas.document import (
    GeneratedDocumentCreate,
    GeneratedDocumentUpdate,
    SendDocumentRequest,
)
from app.services.attendance_service import get_my_attendance
from decimal import Decimal


DOCUMENT_TYPE_SEEDS = [
    {"name": "Offer Letter", "code": "offer_letter"},
    {"name": "Internship Certificate", "code": "internship_certificate"},
    {"name": "Experience Letter", "code": "experience_letter"},
    {"name": "Salary Slip", "code": "salary_slip"},
]


class DocumentService:
    @staticmethod
    def _ensure_form_data(document):
        if document.form_data is None:
            document.form_data = {}
        return document
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
    def _get_company(db: Session, company_id: int):
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        return company

    @staticmethod
    def _get_generated_document(db: Session, document_id: int, company_id: Optional[int] = None):
        document = db.query(GeneratedDocument).filter(GeneratedDocument.id == document_id).first()
        if not document:
            raise HTTPException(status_code=404, detail="Generated document not found")
        if company_id is not None and document.company_id is not None and document.company_id != company_id:
            raise HTTPException(status_code=404, detail="Generated document not found")
        return document

    @staticmethod
    def create_document(db: Session, data: GeneratedDocumentCreate):
        DocumentService._get_document_type(db, data.document_type_id)
        DocumentService._get_company(db, data.company_id)
        return DocumentService.generate_document_pdf(db, data)

    @staticmethod
    def _slugify(value: str) -> str:
        value = re.sub(r'[^a-zA-Z0-9\\-\\s]', '', value)
        value = re.sub(r'\\s+', '-', value.strip())
        return value.lower() or 'document'

    @staticmethod
    def _calculate_approved_leaves_for_month(db: Session, user_id: int, year: int, month: int) -> int:
        from app.db.models import LeaveRequest
        from datetime import date
        from calendar import monthrange
        
        _, last_day = monthrange(year, month)
        month_start = date(year, month, 1)
        month_end = date(year, month, last_day)
        
        leaves = db.query(LeaveRequest).filter(
            LeaveRequest.user_id == user_id,
            LeaveRequest.status == "approved",
            LeaveRequest.start_date <= month_end,
            LeaveRequest.end_date >= month_start
        ).all()
        
        total_days = 0
        for leave in leaves:
            overlap_start = max(month_start, leave.start_date)
            overlap_end = min(month_end, leave.end_date)
            total_days += (overlap_end - overlap_start).days + 1
            
        return total_days

    @staticmethod
    def calculate_salary_metrics(db: Session, user_id: int, month: str, year: str, company_id: Optional[int] = None):
        user = DocumentService._get_user(db, user_id)
        company = DocumentService._get_company(db, company_id)
        
        # 1. Structure & CTC
        assignment = db.query(UserSalaryStructure).filter(UserSalaryStructure.user_id == user.id).first()
        if not assignment or not assignment.ctc:
            raise HTTPException(status_code=400, detail="Salary structure or CTC not assigned to user")
            
        ctc = assignment.ctc
        structure = assignment.structure
        
        # 2. Monthly Base
        monthly_base = Decimal(str(ctc)) / Decimal('12')

        # 3. Attendance
        att_summary = get_my_attendance(db, user.id, int(month), int(year))
        total_working_days = sum(1 for d in att_summary['attendance'] if d['day_type'] in ['working', 'half'])
        if total_working_days == 0:
            import calendar as pycal
            total_working_days = pycal.monthrange(int(year), int(month))[1]
        
        effective_days = Decimal(str(att_summary['present_days'])) + (Decimal(str(att_summary['half_days'])) * Decimal('0.5'))
        
        # 4. Calculation
        approved_leaves_count = DocumentService._calculate_approved_leaves_for_month(db, user.id, int(year), int(month))
        total_leaves = Decimal(str(approved_leaves_count))
        per_day_salary = monthly_base / Decimal(str(total_working_days))
        leave_deduction = per_day_salary * total_leaves

        # 5. Breakdown
        earnings_list = []
        deductions_list = []
        for detail in structure.details:
            # Earned amounts are based on FULL monthly base
            amount = (detail.percentage / Decimal('100')) * monthly_base
            comp = {"name": detail.component.name, "amount": round(float(amount), 2)}
            if detail.component.type == ComponentType.EARNING:
                earnings_list.append(comp)
            else:
                deductions_list.append(comp)

        if leave_deduction > 0:
            deductions_list.append({"name": "Leave Deduction", "amount": round(float(leave_deduction), 2)})
        
        total_earnings = sum(e['amount'] for e in earnings_list)
        total_deductions = sum(d['amount'] for d in deductions_list)
        net_salary = total_earnings - total_deductions
        total_leaves_val = float(total_leaves)

        month_names = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
        display_month = month_names[int(month)]

        return {
            "employee_name": f"{user.first_name} {user.last_name}",
            "designation": user.position or 'Employee',
            "month": month,
            "year": year,
            "display_month": display_month,
            "total_working_days": total_working_days,
            "present_days": att_summary['present_days'],
            "half_days": att_summary['half_days'],
            "absent_days": att_summary['absent_days'],
            "effective_days": float(effective_days),
            "total_leaves": total_leaves_val,
            "earnings": earnings_list,
            "deductions": deductions_list,
            "total_earnings": round(float(total_earnings), 2),
            "total_deductions": round(float(total_deductions), 2),
            "net_salary": round(float(net_salary), 2),
            "header_image": company.header_image,
            "footer_image": company.footer_image,
            "company_stamp": company.company_stamp,
            "company_name": company.name
        }

    @staticmethod
    def calculate_yearly_salary_metrics(db: Session, user_id: int, year: int, company_id: int):
        user = DocumentService._get_user(db, user_id)
        company = DocumentService._get_company(db, company_id)
        
        # 1. Structure & CTC
        assignment = db.query(UserSalaryStructure).filter(UserSalaryStructure.user_id == user.id).first()
        if not assignment or not assignment.ctc:
            raise HTTPException(status_code=400, detail="Salary structure or CTC not assigned to user")
            
        ctc = assignment.ctc
        structure = assignment.structure
        
        # 2. Monthly Base
        monthly_base = Decimal(str(ctc)) / Decimal('12')

        total_working_days_year = 0
        effective_days_year = Decimal('0')
        total_leaves_year = Decimal('0')
        total_earnings_year = Decimal('0')
        total_deductions_year = Decimal('0')
        
        monthly_data = []
        month_names = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

        import calendar as pycal

        for month_idx in range(1, 13):
            # 3. Attendance for the month
            att_summary = get_my_attendance(db, user.id, month_idx, int(year))
            total_working_days_month = sum(1 for d in att_summary['attendance'] if d['day_type'] in ['working', 'half'])
            if total_working_days_month == 0:
                total_working_days_month = pycal.monthrange(int(year), month_idx)[1]
            
            total_working_days_month_dec = Decimal(str(total_working_days_month))
            effective_days_month = Decimal(str(att_summary['present_days'])) + (Decimal(str(att_summary['half_days'])) * Decimal('0.5'))
            
            # Get exactly approved leaves for this particular month
            approved_leaves_count = DocumentService._calculate_approved_leaves_for_month(db, user.id, int(year), month_idx)
            total_leaves_month = Decimal(str(approved_leaves_count))
            
            # 4. Calculation
            per_day_salary = monthly_base / total_working_days_month_dec
            leave_deduction_month = per_day_salary * total_leaves_month

            # 5. Earnings & Components based on FULL monthly salary
            components_dict = {}
            for detail in structure.details:
                amount = (detail.percentage / Decimal('100')) * monthly_base
                components_dict[detail.component.name] = round(float(amount), 2)
                if detail.component.type == ComponentType.EARNING:
                    total_earnings_year += amount
                else:
                    total_deductions_year += amount

            # 6. Store month data
            monthly_data.append({
                "month": f"{month_names[month_idx]} {year}",
                "components": components_dict,
                "leave_deduction": round(float(leave_deduction_month), 2),
                "total_working_days": total_working_days_month,
                "effective_days": float(effective_days_month),
                "total_leaves": float(total_leaves_month)
            })

            total_working_days_year += total_working_days_month
            effective_days_year += effective_days_month
            total_leaves_year += total_leaves_month
            total_deductions_year += leave_deduction_month

        # 7. Final Net Pay
        net_pay = total_earnings_year - total_deductions_year

        return {
            "employee_name": f"{user.first_name} {user.last_name}",
            "designation": user.position or 'Employee',
            "year": year,
            "total_working_days": total_working_days_year,
            "effective_days": float(effective_days_year),
            "total_leaves": float(total_leaves_year),
            "monthly_data": monthly_data,
            "total_earnings": round(float(total_earnings_year), 2),
            "total_deductions": round(float(total_deductions_year), 2),
            "net_pay": round(float(net_pay), 2),
            "header_image": company.header_image,
            "footer_image": company.footer_image,
            "company_stamp": company.company_stamp,
            "company_name": company.name
        }

    @staticmethod

    def generate_document_pdf(db: Session, data: GeneratedDocumentCreate):
        doc_type = DocumentService._get_document_type(db, data.document_type_id)
        company = DocumentService._get_company(db, data.company_id)

        # SALARY SLIP AUTOMATION LOGIC
        if doc_type.code == "salary_slip":
            form = data.form_data or {}
            payload_data = form.get("data", {})
            template_id = payload_data.get("template_id", "salaryTemplate1")
            user_id = payload_data.get("user_id")
            year = payload_data.get("year")
            month = payload_data.get("month")

            if not user_id or not year:
                 raise HTTPException(status_code=400, detail="Missing salary slip basic data (user, year)")

            if template_id == "salaryTemplate2":
                 metrics = DocumentService.calculate_yearly_salary_metrics(db, user_id, year, data.company_id)
            else:
                 if not month:
                     raise HTTPException(status_code=400, detail="Missing salary slip basic data (month)")
                 metrics = DocumentService.calculate_salary_metrics(db, user_id, month, year, data.company_id)
                 
            form.update(metrics)
            data.form_data = form

        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        upload_dir = os.path.join(base_dir, 'uploads', 'documents')
        os.makedirs(upload_dir, exist_ok=True)

        filename = f"{DocumentService._slugify(data.title)}_{int(time.time())}.pdf"
        file_path = os.path.join(upload_dir, filename)

        HTML(string=data.content, base_url=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))).write_pdf(file_path)

        file_url = f"/uploads/documents/{filename}"

        payload = data.model_dump()
        payload.update({
            "file_url": file_url,
            "file_name": filename,
            "status": "generated",
        })

        document = GeneratedDocument(**payload)
        db.add(document)
        db.commit()
        db.refresh(document)
        return DocumentService._ensure_form_data(document)

    @staticmethod
    def update_document(db: Session, document_id: int, data: GeneratedDocumentUpdate, company_id: Optional[int] = None):
        document = DocumentService._get_generated_document(db, document_id, company_id)

        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(document, key, value)

        if data.content:
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
            if document.file_name:
                file_path = os.path.join(base_dir, 'uploads', 'documents', document.file_name)
                HTML(string=data.content, base_url=base_dir).write_pdf(file_path)

        db.commit()
        db.refresh(document)
        return DocumentService._ensure_form_data(document)

    @staticmethod
    def list_documents(db: Session, company_id: Optional[int] = None):
        query = db.query(GeneratedDocument)
        if company_id is not None:
            query = query.filter((GeneratedDocument.company_id == company_id) | (GeneratedDocument.company_id.is_(None)))
        documents = query.order_by(GeneratedDocument.created_at.desc()).all()
        for document in documents:
            DocumentService._ensure_form_data(document)
        return documents

    @staticmethod
    def get_document(db: Session, document_id: int, company_id: Optional[int] = None):
        document = DocumentService._get_generated_document(db, document_id, company_id)
        return DocumentService._ensure_form_data(document)

    @staticmethod
    def delete_document(db: Session, document_id: int, company_id: Optional[int] = None):
        document = DocumentService._get_generated_document(db, document_id, company_id)
        db.query(SentDocument).filter(SentDocument.document_id == document.id).delete(synchronize_session=False)
        db.delete(document)
        db.commit()
        return {"message": "Document deleted successfully"}

    @staticmethod
    def send_document_email(db: Session, payload: SendDocumentRequest):
        document = DocumentService._get_generated_document(db, payload.document_id)
        user = DocumentService._get_user(db, payload.user_id)

        sent_status = "failed"
        error_msg = None

        try:
            if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="SMTP credentials are not configured",
                )

            # Resolve file path from file_url
            file_path = None
            if document.file_url:
                relative = document.file_url.lstrip("/")
                base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
                candidate = os.path.join(base_dir, relative)
                if os.path.isfile(candidate):
                    file_path = candidate

            if not file_path:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Document file not found on server",
                )

            message = MIMEMultipart()
            message["From"] = settings.SMTP_USER
            message["To"] = user.email
            message["Subject"] = f"Your Document - {document.title}"
            body = "Hello,\n\nPlease find your document attached.\n\nRegards,\nHR Team"
            message.attach(MIMEText(body, "plain"))

            with open(file_path, "rb") as f:
                mime_part = MIMEBase("application", "pdf")
                mime_part.set_payload(f.read())
                encoders.encode_base64(mime_part)
                mime_part.add_header("Content-Disposition", f'attachment; filename="{document.file_name or "document.pdf"}"')
                message.attach(mime_part)

            server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(message)
            server.quit()
            sent_status = "sent"
        except Exception as exc:
            error_msg = str(exc)
            if isinstance(exc, HTTPException):
                raise
        finally:
            record = SentDocument(
                document_id=document.id,
                user_id=user.id,
                status=sent_status,
                error_message=error_msg,
            )
            db.add(record)
            db.commit()

        if sent_status != "sent":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_msg or "Failed to send email",
            )

        return {"message": "Email sent successfully"}
