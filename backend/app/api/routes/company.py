from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.base_response import ResponseSchema
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse, UserAssignment, CompanyUserResponse
from app.services.company_service import CompanyService
from app.api.dependencies.roles import role_required
from app.api.dependencies.auth import get_current_user
from app.models import User

router = APIRouter(prefix="/companies", tags=["Companies"])

@router.post("/", response_model=ResponseSchema[CompanyResponse], status_code=status.HTTP_201_CREATED)
def create_company(
    company: CompanyCreate, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = CompanyService.create_company(db, company)
    return ResponseSchema(status="success", message="Company created successfully", data=result)

@router.get("/", response_model=ResponseSchema[List[CompanyResponse]])
def get_companies(
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["ADMIN", "HR", "MANAGER"]))
):
    companies = CompanyService.get_companies(db)
    return ResponseSchema(status="success", data=companies)

@router.get("/my", response_model=ResponseSchema[List[CompanyResponse]])
def get_my_companies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    companies = CompanyService.get_my_companies(db, current_user.id)
    return ResponseSchema(status="success", data=companies)

@router.get("/{company_id}", response_model=ResponseSchema[CompanyResponse])
def get_company(
    company_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    company = CompanyService.get_company(db, company_id)
    return ResponseSchema(status="success", data=company)

@router.put("/{company_id}", response_model=ResponseSchema[CompanyResponse])
def update_company(
    company_id: int, 
    company: CompanyUpdate, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = CompanyService.update_company(db, company_id, company)
    return ResponseSchema(status="success", message="Company updated successfully", data=result)

@router.delete("/{company_id}", response_model=ResponseSchema[dict])
def delete_company(
    company_id: int, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = CompanyService.delete_company(db, company_id)
    return ResponseSchema(status="success", message="Company deleted successfully", data=result)

# Assignment Endpoints

@router.post("/{company_id}/assign", response_model=ResponseSchema[dict])
def assign_users(
    company_id: int, 
    assignment: UserAssignment, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = CompanyService.assign_users(db, company_id, assignment.user_ids)
    return ResponseSchema(status="success", message="Users assigned successfully", data=result)

@router.post("/{company_id}/unassign", response_model=ResponseSchema[dict])
def unassign_users(
    company_id: int, 
    assignment: UserAssignment, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = CompanyService.unassign_users(db, company_id, assignment.user_ids)
    return ResponseSchema(status="success", message="Users unassigned successfully", data=result)

@router.get("/{company_id}/users", response_model=ResponseSchema[List[CompanyUserResponse]])
def get_assigned_users(
    company_id: int, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR", "MANAGER"]))
):
    users = CompanyService.get_assigned_users(db, company_id)
    return ResponseSchema(status="success", data=users)

@router.get("/{company_id}/available", response_model=ResponseSchema[List[CompanyUserResponse]])
def get_available_users(
    company_id: int, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR", "MANAGER"]))
):
    users = CompanyService.get_available_users(db, company_id)
    return ResponseSchema(status="success", data=users)
