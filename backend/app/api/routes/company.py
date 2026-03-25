from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyResponse, UserAssignment, CompanyUserResponse
from app.services.company_service import CompanyService

router = APIRouter(prefix="/companies", tags=["Companies"])

@router.post("/", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(
    company: CompanyCreate, 
    db: Session = Depends(get_db)
):
    return CompanyService.create_company(db, company)

@router.get("/", response_model=List[CompanyResponse])
def get_companies(
    db: Session = Depends(get_db)
):
    return CompanyService.get_companies(db)

@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(
    company_id: int, 
    db: Session = Depends(get_db)
):
    return CompanyService.get_company(db, company_id)

@router.put("/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: int, 
    company: CompanyUpdate, 
    db: Session = Depends(get_db)
):
    return CompanyService.update_company(db, company_id, company)

@router.delete("/{company_id}")
def delete_company(
    company_id: int, 
    db: Session = Depends(get_db)
):
    return CompanyService.delete_company(db, company_id)

# Assignment Endpoints

@router.post("/{company_id}/assign")
def assign_users(
    company_id: int, 
    assignment: UserAssignment, 
    db: Session = Depends(get_db)
):
    return CompanyService.assign_users(db, company_id, assignment.user_ids)

@router.post("/{company_id}/unassign")
def unassign_users(
    company_id: int, 
    assignment: UserAssignment, 
    db: Session = Depends(get_db)
):
    return CompanyService.unassign_users(db, company_id, assignment.user_ids)

@router.get("/{company_id}/users", response_model=List[CompanyUserResponse])
def get_assigned_users(
    company_id: int, 
    db: Session = Depends(get_db)
):
    return CompanyService.get_assigned_users(db, company_id)

@router.get("/{company_id}/available", response_model=List[CompanyUserResponse])
def get_available_users(
    company_id: int, 
    db: Session = Depends(get_db)
):
    return CompanyService.get_available_users(db, company_id)
