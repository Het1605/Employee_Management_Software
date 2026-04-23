from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from app.db.models import Company, User, UserCompanyMapping
from app.schemas.company import CompanyCreate, CompanyUpdate
from sqlalchemy import and_

class CompanyService:
    @staticmethod
    def create_company(db: Session, company_data: CompanyCreate):
        data = company_data.model_dump()
        
        # PAN Auto-Extraction Logic
        if data.get('gst_number') and len(data['gst_number']) >= 12:
            extracted_pan = data['gst_number'][2:12]
            if not data.get('pan_number'):
                data['pan_number'] = extracted_pan
        
        db_company = Company(**data)
        db.add(db_company)
        try:
            db.commit()
            db.refresh(db_company)
            return db_company
        except IntegrityError as e:
            db.rollback()
            error_msg = str(e.orig).lower() if hasattr(e, 'orig') else str(e)
            if "name" in error_msg:
                detail = "Company already exists with this name"
            elif "gst_number" in error_msg:
                detail = "GST number is already registered to another company"
            elif "pan_number" in error_msg:
                detail = "PAN number is already registered to another company"
            else:
                detail = "Database constraint violated"
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)
        except Exception:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error. Please try again later.")

    @staticmethod
    def get_companies(db: Session):
        return db.query(Company).all()

    @staticmethod
    def get_company(db: Session, company_id: int):
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        return company

    @staticmethod
    def update_company(db: Session, company_id: int, company_data: CompanyUpdate):
        db_company = CompanyService.get_company(db, company_id)
        update_data = company_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_company, key, value)
        try:
            db.commit()
            db.refresh(db_company)
            return db_company
        except IntegrityError as e:
            db.rollback()
            error_msg = str(e.orig).lower() if hasattr(e, 'orig') else str(e)
            if "name" in error_msg:
                detail = "Company already exists with this name"
            elif "gst_number" in error_msg:
                detail = "GST number is already registered to another company"
            elif "pan_number" in error_msg:
                detail = "PAN number is already registered to another company"
            else:
                detail = "Database constraint violated"
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)
        except Exception:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error. Please try again later.")

    @staticmethod
    def delete_company(db: Session, company_id: int):
        db_company = CompanyService.get_company(db, company_id)
        db.delete(db_company)
        try:
            db.commit()
            return {"message": "Company deleted successfully"}
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete company because it has active users")
        except Exception:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error. Please try again later.")

    @staticmethod
    def assign_users(db: Session, company_id: int, user_ids: list[int]):
        CompanyService.get_company(db, company_id)
        for user_id in user_ids:
            # Check if mapping already exists
            existing = db.query(UserCompanyMapping).filter(
                and_(UserCompanyMapping.user_id == user_id, UserCompanyMapping.company_id == company_id)
            ).first()
            if not existing:
                mapping = UserCompanyMapping(user_id=user_id, company_id=company_id)
                db.add(mapping)
        db.commit()
        return {"message": "Users assigned successfully"}

    @staticmethod
    def unassign_users(db: Session, company_id: int, user_ids: list[int]):
        db.query(UserCompanyMapping).filter(
            and_(UserCompanyMapping.company_id == company_id, UserCompanyMapping.user_id.in_(user_ids))
        ).delete(synchronize_session=False)
        try:
            db.commit()
        except Exception:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error. Please try again later.")
        return {"message": "Users unassigned successfully"}

    @staticmethod
    def get_assigned_users(db: Session, company_id: int):
        return db.query(User).join(UserCompanyMapping).filter(
            UserCompanyMapping.company_id == company_id,
            User.is_active == True
        ).all()

    @staticmethod
    def get_available_users(db: Session, company_id: int):
        # Users NOT in this company AND ARE ACTIVE
        assigned_user_ids = db.query(UserCompanyMapping.user_id).filter(
            UserCompanyMapping.company_id == company_id
        ).all()
        assigned_ids = [uid[0] for uid in assigned_user_ids]
        return db.query(User).filter(
            ~User.id.in_(assigned_ids),
            User.is_active == True
        ).all()
    @staticmethod
    def get_my_companies(db: Session, user_id: int):
        return db.query(Company).join(UserCompanyMapping).filter(
            UserCompanyMapping.user_id == user_id
        ).all()
