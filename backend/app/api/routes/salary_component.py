from fastapi import APIRouter, Depends, status, HTTPException
from app.schemas.base_response import ResponseSchema
from sqlalchemy.orm import Session
from typing import List
from fastapi import Query


from app.db.database import get_db
from app.api.dependencies.auth import get_current_user
from app.api.dependencies.roles import role_required
from app.models import User
from app.schemas.salary_structure import (
    SalaryComponentCreate, SalaryComponentUpdate, SalaryComponentResponse
)
from app.services.salary_structure_service import SalaryStructureService

router = APIRouter(prefix="/salary-components", tags=["Salary Components"])

@router.post("/", response_model=ResponseSchema[SalaryComponentResponse], status_code=status.HTTP_201_CREATED)
def create_component(
    component: SalaryComponentCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = SalaryStructureService.create_salary_component(db, component)
    return ResponseSchema(status="success", message="Salary component created", data=result)

@router.get("/", response_model=ResponseSchema[List[SalaryComponentResponse]])
def get_components(
    company_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = SalaryStructureService.get_salary_components(db, company_id)
    return ResponseSchema(status="success", data=result)

@router.get("/{component_id}", response_model=ResponseSchema[SalaryComponentResponse])
def get_component(
    component_id: int,
    company_id: int = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = SalaryStructureService.get_salary_component_by_id(db, component_id, company_id)
    return ResponseSchema(status="success", data=result)

@router.put("/{component_id}", response_model=ResponseSchema[SalaryComponentResponse])
def update_component(
    component_id: int,
    data: SalaryComponentUpdate,
    company_id: int = Query(...),
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = SalaryStructureService.update_salary_component(db, component_id, company_id, data)
    return ResponseSchema(status="success", message="Salary component updated", data=result)

@router.delete("/{component_id}", response_model=ResponseSchema[dict])
def delete_component(
    component_id: int,
    company_id: int = Query(...),
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = SalaryStructureService.delete_salary_component(db, component_id, company_id)
    return ResponseSchema(status="success", message="Salary component deleted", data=result)
