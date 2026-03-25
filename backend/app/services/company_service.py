from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.db.models import Company, User, UserCompanyMapping
from app.schemas.company import CompanyCreate, CompanyUpdate
from sqlalchemy import and_

class CompanyService:
    @staticmethod
    def create_company(db: Session, company_data: CompanyCreate):
        db_company = Company(**company_data.model_dump())
        db.add(db_company)
        try:
            db.commit()
            db.refresh(db_company)
            return db_company
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Company creation failed: {str(e)}"
            )

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
        db.commit()
        db.refresh(db_company)
        return db_company

    @staticmethod
    def delete_company(db: Session, company_id: int):
        db_company = CompanyService.get_company(db, company_id)
        db.delete(db_company)
        db.commit()
        return {"message": "Company deleted successfully"}

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
        db.commit()
        return {"message": "Users unassigned successfully"}

    @staticmethod
    def get_assigned_users(db: Session, company_id: int):
        company = CompanyService.get_company(db, company_id)
        return company.users

    @staticmethod
    def get_available_users(db: Session, company_id: int):
        # Users NOT in this company
        assigned_user_ids = db.query(UserCompanyMapping.user_id).filter(
            UserCompanyMapping.company_id == company_id
        ).all()
        assigned_ids = [uid[0] for uid in assigned_user_ids]
        return db.query(User).filter(~User.id.in_(assigned_ids)).all()
