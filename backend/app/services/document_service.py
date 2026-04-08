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
    def calculate_salary_metrics(db: Session, user_id: int, ctc: float, month: int, year: int, company_id: int):
        user = DocumentService._get_user(db, user_id)
        company = DocumentService._get_company(db, company_id)
        
        # 1. Monthly Base
        monthly_base = Decimal(str(ctc)) / Decimal('12')
        
        # 2. Structure
        assignment = db.query(UserSalaryStructure).filter(UserSalaryStructure.user_id == user.id).first()
        if not assignment:
            raise HTTPException(status_code=400, detail="User has no salary structure assigned")
        structure = assignment.structure

        # 3. Attendance
        att_summary = get_my_attendance(db, user.id, int(month), int(year))
        total_working_days = sum(1 for d in att_summary['attendance'] if d['day_type'] in ['working', 'half'])
        if total_working_days == 0:
            import calendar as pycal
            total_working_days = pycal.monthrange(int(year), int(month))[1]
        
        effective_days = Decimal(str(att_summary['present_days'])) + (Decimal(str(att_summary['half_days'])) * Decimal('0.5'))
        
        # 4. Calculation
        per_day_salary = monthly_base / Decimal(str(total_working_days))
        earned_gross = per_day_salary * effective_days
        leave_deduction = monthly_base - earned_gross

        # 5. Breakdown
        earnings_list = []
        deductions_list = []
        for detail in structure.details:
            amount = (detail.percentage / Decimal('100')) * earned_gross
            comp = {"name": detail.component.name, "amount": round(float(amount), 2)}
            if detail.component.type == ComponentType.EARNING:
                earnings_list.append(comp)
            else:
                deductions_list.append(comp)

        deductions_list.append({"name": "Leave Deduction", "amount": round(float(leave_deduction), 2)})
        
        total_earnings = sum(e['amount'] for e in earnings_list)
        total_deductions = sum(d['amount'] for d in deductions_list)
        net_salary = total_earnings - total_deductions
        total_leaves = total_working_days - float(effective_days)

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
            "total_leaves": total_leaves,
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
    def generate_document_pdf(db: Session, data: GeneratedDocumentCreate):
        doc_type = DocumentService._get_document_type(db, data.document_type_id)
        company = DocumentService._get_company(db, data.company_id)

        # SALARY SLIP AUTOMATION LOGIC
        if doc_type.code == "salary_slip":
            form = data.form_data or {}
            payload_data = form.get("data", {})
            user_id = payload_data.get("user_id")
            ctc = payload_data.get("ctc")
            month = payload_data.get("month")
            year = payload_data.get("year")

            if not all([user_id, ctc, month, year]):
                 raise HTTPException(status_code=400, detail="Missing salary slip basic data (user, ctc, month, year)")

            metrics = DocumentService.calculate_salary_metrics(db, user_id, ctc, month, year, data.company_id)
            form.update(metrics)
            data.form_data = form

            # Extract variables for HTML template
            display_month = metrics['display_month']
            earnings_list = metrics['earnings']
            deductions_list = metrics['deductions']
            total_earnings = metrics['total_earnings']
            total_deductions = metrics['total_deductions']
            total_working_days = metrics['total_working_days']
            effective_days = metrics['effective_days']
            total_leaves = metrics['total_leaves']
            user_name = metrics['employee_name']
            designation = metrics['designation']
            net_salary = metrics['net_salary']
            year = metrics['year']

            # Helper for formatting currency to avoid -0.00
            def f_amt(val):
                if -0.005 < val < 0.005: return "0.00"
                return f"{val:,.2f}"

            # Helper for days formatting
            def f_days(val):
                return int(val) if val == int(val) else val

            # Generate internal HTML for Salary Slip using calculated data
            earnings_rows = "".join([f"<tr><td style='padding: 10px; border: 1px solid #ddd;'>{e['name']}</td><td style='padding: 10px; text-align: right; border: 1px solid #ddd;'>{f_amt(e['amount'])}</td><td style='padding: 10px; border: 1px solid #ddd;'></td></tr>" for e in earnings_list])
            deductions_rows = "".join([f"<tr><td style='padding: 10px; border: 1px solid #ddd;'>{d['name']}</td><td style='padding: 10px; border: 1px solid #ddd;'></td><td style='padding: 10px; text-align: right; border: 1px solid #ddd;'>{f_amt(d['amount'])}</td></tr>" for d in deductions_list])

            salary_slip_html = f"""
            <div class="page">
              <img src="{company.header_image or ''}" class="header-img" style="width: 100%;" />
              <div class="content-area" style="padding: 40px;">
                  <center><h2>SALARY SLIP</h2></center>
                  <div style="margin: 20px 0; border-bottom: 2px solid #333; padding-bottom: 10px;">
                      <table style="width: 100%; font-size: 14px;">
                          <tr>
                              <td><strong>Employee Name:</strong> {user_name}</td>
                              <td><strong>Pay Period:</strong> {display_month} {year}</td>
                          </tr>
                          <tr>
                              <td><strong>Designation:</strong> {designation}</td>
                              <td><strong>Total Working Days:</strong> {total_working_days}</td>
                          </tr>
                          <tr>
                              <td><strong>Effective Days:</strong> {f_days(effective_days)}</td>
                              <td><strong>Total Leaves:</strong> {f_days(total_leaves)}</td>
                          </tr>
                      </table>
                  </div>
                  <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
                      <thead>
                          <tr style="background-color: #f2f2f2; border: 1px solid #ddd;">
                              <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Description</th>
                              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Earnings (₹)</th>
                              <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Deductions (₹)</th>
                          </tr>
                      </thead>
                      <tbody>
                          {earnings_rows}
                          {deductions_rows}
                          <tr style="background-color: #f9f9f9; font-weight: bold;">
                              <td style="padding: 10px; border: 1px solid #ddd;">TOTAL</td>
                              <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">{f_amt(total_earnings)}</td>
                              <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">{f_amt(total_deductions)}</td>
                          </tr>
                      </tbody>
                  </table>
                  <div style="margin-top: 30px; padding: 15px; background-color: #eeefff; border: 1px solid #ccc; text-align: right;">
                      <h3 style="margin: 0;">Net Pay: ₹{f_amt(net_salary)}</h3>
                  </div>
                  <div style="margin-top: 60px;">
                      <p>For</p>
                      <p><strong>{metrics['company_name']}</strong></p>
                      <img src="{metrics['company_stamp'] or ''}" style="max-height: 80px; margin: 10px 0;" />
                      <p>Authorized Signatory</p>
                  </div>
              </div>
              {f'<img src="{company.footer_image}" class="footer-img" style="width: 100%; position: absolute; bottom: 0; left: 0;" />' if form.get("include_footer") and company.footer_image else ''}
            </div>
            """
            data.content = salary_slip_html

        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        upload_dir = os.path.join(base_dir, 'uploads', 'documents')
        os.makedirs(upload_dir, exist_ok=True)

        filename = f"{DocumentService._slugify(data.title)}_{int(time.time())}.pdf"
        file_path = os.path.join(upload_dir, filename)

        pdf_html = f"""
        <html>
        <head>
          <style>
            @page {{
              size: A4;
              margin: 0;
            }}
            * {{
              box-sizing: border-box;
            }}
            body {{
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              color: #111;
            }}
            .page {{
              width: 794px;
              min-height: 1123px;
              margin: 0 auto;
              position: relative;
              box-sizing: border-box;
            }}
            .content-area {{
              padding: 40px;
            }}
            .content {{
              word-wrap: break-word;
              overflow-wrap: break-word;
              white-space: normal;
            }}
            .content p {{
              margin: 8px 0;
              line-height: 1.5;
            }}
            .top-row {{
              display: flex;
              justify-content: space-between;
              flex-wrap: wrap;
              gap: 8px;
            }}
            .date {{
              text-align: right;
              max-width: 40%;
            }}
            .header-img {{
              width: 100%;
              display: block;
              margin: 0;
              padding: 0;
            }}
            .footer-img {{
              width: 100%;
              position: absolute;
              bottom: 0;
              left: 0;
            }}
            img {{
              max-width: 100%;
              height: auto;
              display: block;
              page-break-inside: avoid;
            }}
          </style>
        </head>
        <body>
          {data.content}
        </body>
        </html>
        """

        HTML(string=pdf_html, base_url=os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))).write_pdf(file_path)

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
