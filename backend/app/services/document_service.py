from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import os
import time
import re
from weasyprint import HTML
from typing import List, Optional
from app.core.config import settings
from app.db.models import DocumentType, GeneratedDocument, User, SentDocument, Company, UserSalaryStructure, ComponentType, SalarySlipDispatchLog
from app.schemas.document import (
    GeneratedDocumentCreate,
    GeneratedDocumentUpdate,
    SendDocumentRequest,
)
from app.services.attendance_service import get_my_attendance
from decimal import Decimal
from app.core.email_utils import send_email_with_attachment


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
    def _calculate_approved_leaves_for_month(db: Session, user_id: int, company_id: int, year: int, month: int) -> int:
        from app.db.models import LeaveRequest
        from datetime import date
        from calendar import monthrange
        
        _, last_day = monthrange(year, month)
        month_start = date(year, month, 1)
        month_end = date(year, month, last_day)
        
        leaves = db.query(LeaveRequest).filter(
            LeaveRequest.user_id == user_id,
            LeaveRequest.company_id == company_id,
            LeaveRequest.status == "approved",
            LeaveRequest.is_deleted == False,
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
        assignment = db.query(UserSalaryStructure).filter(
            UserSalaryStructure.user_id == user.id,
            UserSalaryStructure.company_id == company.id
        ).first()
        if not assignment or not assignment.ctc:
            raise HTTPException(status_code=400, detail="Salary structure or CTC not assigned to user")
            
        ctc = assignment.ctc
        structure = assignment.structure
        
        # 2. Monthly Base
        monthly_base = Decimal(str(ctc)) / Decimal('12')

        # 3. Attendance
        att_summary = get_my_attendance(db, user.id, company.id, int(month), int(year))
        
        # 4. Payable Days Reconciliation
        from app.db.models import LeaveRequest, LeaveDurationType
        from app.services.leave_structure_service import LeaveStructureService
        from datetime import date, timedelta
        import calendar as pycal
        
        _, last_day = pycal.monthrange(int(year), int(month))
        month_start = date(int(year), int(month), 1)
        month_end = date(int(year), int(month), last_day)

        # A. Get Approved Leaves for this month
        leaves = db.query(LeaveRequest).filter(
            LeaveRequest.user_id == user.id,
            LeaveRequest.company_id == company.id,
            LeaveRequest.status == "approved",
            LeaveRequest.start_date <= month_end,
            LeaveRequest.end_date >= month_start
        ).all()
        
        leave_map = {} # date -> LeaveRequest
        for l in leaves:
            curr = l.start_date
            while curr <= l.end_date:
                if month_start <= curr <= month_end:
                    leave_map[curr] = l
                curr += timedelta(days=1)

        # B. Get Dynamic Runtime Balances
        # Note: get_runtime_leave_balance now returns the cumulative/dynamic state for the year.
        balance_summary = LeaveStructureService.get_runtime_leave_balance(db, user.id, company_id=company.id, month=int(month), year=int(year))
        
        # C. Re-calculate Reconciliation based on Runtime Balance
        # available_balance in the context of this month's salary logic
        raw_absences = Decimal('0')
        total_working_days = 0
        total_leaves_taken = Decimal('0')
        total_paid_leaves = Decimal('0')
        total_unpaid_leaves = Decimal('0')

        # D. Process Attendance Days & Raw Absences
        # Rule: Absence where NO leave was applied is a "raw absence" (Unpaid).
        raw_absences = Decimal('0')
        total_working_days = 0
        
        for day in att_summary['attendance']:
            status = day['status']
            day_type = day['day_type']
            dt = day['date']
            
            if day_type not in ['working', 'half_day']:
                continue
                
            total_working_days += 1
            
            # Check if a leave was applied for this date
            has_leave = dt in leave_map
            
            if status == 'absent':
                if not has_leave:
                    raw_absences += Decimal('1.0')
            elif status == 'half_day':
                # For half days, if no leave was applied for the remaining half, it counts as 0.5 unpaid.
                if not has_leave:
                    raw_absences += Decimal('0.5')

        # E. Finalize Leave Metrics from API Balance (Single Source of Truth)
        # CRITICAL FIX: Calculate per-category to prevent quota-leaking
        total_paid_leaves = Decimal('0')
        total_excess_from_api = Decimal('0')
        
        for cat, vals in balance_summary.items():
            alloc_c = Decimal(str(vals.get('allocated', 0)))
            used_c = Decimal(str(vals.get('used', 0)))
            excess_c = Decimal(str(vals.get('excess', 0)))
            
            # Paid for this category is derived by subtracting any excess from the total used
            paid_c = used_c - excess_c
            total_paid_leaves += paid_c
            total_excess_from_api += excess_c

        # Calculation Logic per User Guidelines:
        total_unpaid_leaves = total_excess_from_api + raw_absences
        total_leaves_taken = total_paid_leaves + total_unpaid_leaves

        # MANDATORY DEBUG LOGS
        print(f"[SALARY DEBUG] User:{user.id} Month:{month} Year:{year}")
        print(f"  API Paid: {total_paid_leaves} | API Excess: {total_excess_from_api}")
        print(f"  Raw Absences (Internal): {raw_absences}")
        print(f"  Final Paid: {total_paid_leaves} | Final Unpaid: {total_unpaid_leaves}")

        if total_working_days == 0:
            total_working_days = last_day

        # 5. Calculation
        # Effective Paid Days = Total Working Days - Unpaid Leaves
        effective_days_val = float(Decimal(str(total_working_days)) - total_unpaid_leaves)
        per_day_salary = monthly_base / Decimal(str(total_working_days))
        leave_deduction = per_day_salary * total_unpaid_leaves

        if leave_deduction < 0:
            leave_deduction = Decimal('0')

        # 6. Breakdown & Basic Salary Search
        earnings_list = []
        deductions_list = []
        basic_monthly_amount = Decimal('0')
        
        for detail in structure.details:
            # Percentage-based component calculation
            amount = (detail.percentage / Decimal('100')) * monthly_base
            comp = {"name": detail.component.name, "amount": round(float(amount), 2)}
            
            # Identify "Basic" component for encashment base
            if "basic" in detail.component.name.lower():
                basic_monthly_amount = amount
                
            if detail.component.type == ComponentType.EARNING:
                earnings_list.append(comp)
            else:
                deductions_list.append(comp)

        # 7. Dynamic Encashment Injection (Runtime-based)
        # Use Basic component for rate calculation if found; fallback to Monthly CTC
        encash_base_monthly = basic_monthly_amount if basic_monthly_amount > 0 else monthly_base
        per_day_encash_rate = encash_base_monthly / Decimal(str(total_working_days))
        
        is_payroll_trigger_month = int(month) == 1 or int(month) == 12 # Common encashment months
        
        if is_payroll_trigger_month:
            for cat, vals in balance_summary.items():
                enc_days = Decimal(str(vals.get("encashable", 0)))
                if enc_days > 0:
                    enc_amount = enc_days * per_day_encash_rate
                    earnings_list.append({
                        "name": f"Leave Encashment ({float(enc_days)} Days)",
                        "label": f"Leave Encashment ({float(enc_days)} Days)", # User requested 'label' key
                        "amount": round(float(enc_amount), 2)
                    })
                    print(f"  [ENCASH DETECTED] Type:{cat} Days:{enc_days} Amount:{enc_amount}")

        if leave_deduction > 0:
            deductions_list.append({
                "name": f"Unpaid Leave Deduction ({float(total_unpaid_leaves)} Days)", 
                "amount": round(float(leave_deduction), 2)
            })
        
        total_earnings = sum(e['amount'] for e in earnings_list)
        total_deductions = sum(d['amount'] for d in deductions_list)
        net_salary = total_earnings - total_deductions
        total_leaves_val = float(total_unpaid_leaves) # Legacy support

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
            "effective_paid_days": effective_days_val,
            "total_leaves": total_leaves_val,
            "leaves_taken": float(total_leaves_taken),
            "paid_leaves": float(total_paid_leaves),
            "unpaid_leaves": float(total_unpaid_leaves),
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
        assignment = db.query(UserSalaryStructure).filter(
            UserSalaryStructure.user_id == user.id,
            UserSalaryStructure.company_id == company.id
        ).first()
        if not assignment or not assignment.ctc:
            raise HTTPException(status_code=400, detail="Salary structure or CTC not assigned to user")
            
        ctc = assignment.ctc
        structure = assignment.structure
        monthly_base = Decimal(str(ctc)) / Decimal('12')

        # Yearly Aggregates
        total_working_days_year = 0
        total_leaves_taken_year = Decimal('0')
        total_paid_leaves_year = Decimal('0')
        total_unpaid_leaves_year = Decimal('0')
        total_effective_days_year = Decimal('0')
        
        total_earnings_year = Decimal('0')
        total_deductions_year = Decimal('0')
        
        monthly_data = []
        month_names = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

        from app.db.models import LeaveRequest, LeaveDurationType
        from app.services.leave_structure_service import LeaveStructureService
        from datetime import date, timedelta
        import calendar as pycal

        for month_idx in range(1, 13):
            month_str = str(month_idx)
            year_str = str(year)
            
            # --- Monthly Metrics Simulation (Same as Monthly Slip Logic) ---
            _, last_day = pycal.monthrange(int(year), month_idx)
            month_start = date(int(year), month_idx, 1)
            month_end = date(int(year), month_idx, last_day)

            # A. Attendance & Approved Leaves
            att_summary = get_my_attendance(db, user.id, company.id, month_idx, int(year))
            leaves = db.query(LeaveRequest).filter(
                LeaveRequest.user_id == user.id,
                LeaveRequest.company_id == company.id,
                LeaveRequest.status == "approved",
                LeaveRequest.start_date <= month_end,
                LeaveRequest.end_date >= month_start
            ).all()
            
            leave_map = {}
            for l in leaves:
                curr = l.start_date
                while curr <= l.end_date:
                    if month_start <= curr <= month_end:
                        leave_map[curr] = l
                    curr += timedelta(days=1)

            # B. Get Dynamic Runtime Balances
            balance_summary = LeaveStructureService.get_runtime_leave_balance(db, user.id, company_id=company.id, month=month_idx, year=int(year))
            
            # C. Process Attendance Days & Raw Absences
            raw_abs_m = Decimal('0')
            work_days_m = 0
            for day in att_summary['attendance']:
                status = day['status']
                day_type = day['day_type']
                dt = day['date']
                if day_type not in ['working', 'half_day']: continue
                work_days_m += 1
                if not (dt in leave_map):
                    if status == 'absent': raw_abs_m += Decimal('1.0')
                    elif status == 'half_day': raw_abs_m += Decimal('0.5')

            if work_days_m == 0: work_days_m = last_day

            # D. Per-Category Leave Aggregation
            paid_m = Decimal('0')
            excess_m = Decimal('0')
            for cat, vals in balance_summary.items():
                a_c = Decimal(str(vals.get('allocated', 0)))
                u_c = Decimal(str(vals.get('used', 0)))
                e_c = Decimal(str(vals.get('excess', 0)))
                paid_m += (u_c - e_c)
                excess_m += e_c
            
            unpaid_m = excess_m + raw_abs_m
            taken_m = paid_m + unpaid_m
            eff_days_m = float(Decimal(str(work_days_m)) - unpaid_m)
            
            # E. Earnings & Deductions for that month
            # (Assuming standard monthly structure components)
            month_earn = Decimal('0')
            month_deduct = Decimal('0')
            comp_snapshot = {}
            
            for detail in structure.details:
                amount = (detail.percentage / Decimal('100')) * monthly_base
                comp_snapshot[detail.component.name] = round(float(amount), 2)
                if detail.component.type == ComponentType.EARNING:
                    month_earn += amount
                else:
                    month_deduct += amount
            
            # Per-day rate for leave deduction
            per_day_sal = monthly_base / Decimal(str(work_days_m))
            leave_deduct_m = per_day_sal * unpaid_m
            month_deduct += leave_deduct_m

            # F. Year Accumulation
            monthly_data.append({
                "month": f"{month_names[month_idx]} {year}",
                "components": comp_snapshot,
                "leave_deduction": round(float(leave_deduct_m), 2),
                "total_working_days": work_days_m,
                "effective_days": eff_days_m,
                "paid_leaves": float(paid_m),
                "unpaid_leaves": float(unpaid_m),
                "leaves_taken": float(taken_m)
            })
            
            total_working_days_year += work_days_m
            total_leaves_taken_year += taken_m
            total_paid_leaves_year += paid_m
            total_unpaid_leaves_year += unpaid_m
            total_effective_days_year += Decimal(str(eff_days_m))
            
            total_earnings_year += month_earn
            total_deductions_year += month_deduct

        # Net Pay
        net_pay = total_earnings_year - total_deductions_year

        return {
            "employee_name": f"{user.first_name} {user.last_name}",
            "designation": user.position or 'Employee',
            "year": year,
            "total_working_days": total_working_days_year,
            "effective_paid_days": float(total_effective_days_year), # Standardized name
            "leaves_taken": float(total_leaves_taken_year),
            "paid_leaves": float(total_paid_leaves_year),
            "unpaid_leaves": float(total_unpaid_leaves_year),
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

        upload_dir = "/app/uploads/documents"
        os.makedirs(upload_dir, exist_ok=True)

        filename = f"{DocumentService._slugify(data.title)}_{int(time.time())}.pdf"
        file_path = os.path.join(upload_dir, filename)

        HTML(string=data.content, base_url="/app").write_pdf(file_path)

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

        # 4. SALARY SLIP DISPATCH LOGGING
        if doc_type.code == "salary_slip":
            form = data.form_data or {}
            payload_data = form.get("data", {})
            u_id = payload_data.get("user_id")
            y_val = payload_data.get("year")
            m_val = payload_data.get("month")
            template_id = payload_data.get("template_id", "salaryTemplate1")

            if u_id and y_val:
                # Determine dispatch type and normalized period
                dispatch_type = "yearly" if template_id == "salaryTemplate2" else "monthly"
                norm_year = int(y_val)
                norm_month = int(m_val) if dispatch_type == "monthly" and m_val else None

                # Get user for email
                user = db.query(User).filter(User.id == u_id).first()
                if user:
                    # Duplicate Check
                    existing_log = db.query(SalarySlipDispatchLog).filter(
                        SalarySlipDispatchLog.user_id == u_id,
                        SalarySlipDispatchLog.document_type == dispatch_type,
                        SalarySlipDispatchLog.month == norm_month,
                        SalarySlipDispatchLog.year == norm_year
                    ).first()

                    if not existing_log:
                        new_dispatch = SalarySlipDispatchLog(
                            user_id=u_id,
                            company_id=data.company_id,
                            document_type=dispatch_type,
                            month=norm_month,
                            year=norm_year,
                            file_path=file_path,
                            email=user.email,
                            status="PENDING",
                            retry_count=0
                        )
                        db.add(new_dispatch)
                        db.commit()

        return DocumentService._ensure_form_data(document)

    @staticmethod
    def update_document(db: Session, document_id: int, data: GeneratedDocumentUpdate, company_id: Optional[int] = None):
        document = DocumentService._get_generated_document(db, document_id, company_id)

        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(document, key, value)

        if data.content:
            if document.file_name:
                file_path = os.path.join("/app/uploads/documents", document.file_name)
                HTML(string=data.content, base_url="/app").write_pdf(file_path)

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
            # Resolve file path from file_url (Docker volume: /app/uploads/...)
            file_path = None
            if document.file_url:
                candidate = os.path.join("/app", document.file_url.lstrip("/"))
                if os.path.isfile(candidate):
                    file_path = candidate

            if not file_path:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Document file not found on server",
                )

            # Use shared utility
            send_email_with_attachment(
                to_email=user.email,
                subject=f"Your Document - {document.title}",
                body="Hello,\n\nPlease find your document attached.\n\nRegards,\nHR Team",
                file_path=file_path,
                file_name=document.file_name or "document.pdf"
            )
            
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
