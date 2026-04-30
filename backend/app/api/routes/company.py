from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse, UserAssignment, CompanyUserResponse
from app.services.company_service import CompanyService
from app.api.dependencies.roles import role_required
from app.api.dependencies.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/companies", tags=["Companies"])

@router.post("/", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(
    company: CompanyCreate, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    return CompanyService.create_company(db, company)

@router.get("/", response_model=List[CompanyResponse])
def get_companies(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["ADMIN", "HR", "MANAGER"]))
):
    return CompanyService.get_companies(db)

@router.get("/my", response_model=List[CompanyResponse])
def get_my_companies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return CompanyService.get_my_companies(db, current_user.id)

@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(
    company_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return CompanyService.get_company(db, company_id)

@router.put("/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: int, 
    company: CompanyUpdate, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    return CompanyService.update_company(db, company_id, company)

@router.delete("/{company_id}")
def delete_company(
    company_id: int, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    return CompanyService.delete_company(db, company_id)

# Assignment Endpoints

@router.post("/{company_id}/assign")
def assign_users(
    company_id: int, 
    assignment: UserAssignment, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    return CompanyService.assign_users(db, company_id, assignment.user_ids)

@router.post("/{company_id}/unassign")
def unassign_users(
    company_id: int, 
    assignment: UserAssignment, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    return CompanyService.unassign_users(db, company_id, assignment.user_ids)

@router.get("/{company_id}/users", response_model=List[CompanyUserResponse])
def get_assigned_users(
    company_id: int, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR", "MANAGER"]))
):
    return CompanyService.get_assigned_users(db, company_id)

@router.get("/{company_id}/available", response_model=List[CompanyUserResponse])
def get_available_users(
    company_id: int, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR", "MANAGER"]))
):
    return CompanyService.get_available_users(db, company_id)
