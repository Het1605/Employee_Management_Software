from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List,Optional
from fastapi import Query


from app.db.database import get_db
from app.schemas.salary_structure import (
    SalaryComponentCreate, SalaryComponentUpdate, SalaryComponentResponse, SalaryStatusUpdate
)
from app.services.salary_structure_service import SalaryStructureService

router = APIRouter(prefix="/salary-components", tags=["Salary Components"])

@router.post("/", response_model=SalaryComponentResponse, status_code=status.HTTP_201_CREATED)
def create_component(
    component: SalaryComponentCreate,
    db: Session = Depends(get_db)
):
    return SalaryStructureService.create_salary_component(db, component)

@router.get("/", response_model=List[SalaryComponentResponse])
def get_components(
    company_id: int = Query(...),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    return SalaryStructureService.get_salary_components(db,company_id, is_active)

@router.get("/{component_id}", response_model=SalaryComponentResponse)
def get_component(
    component_id: int,
    company_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return SalaryStructureService.get_salary_component_by_id(db, component_id, company_id)

@router.put("/{component_id}", response_model=SalaryComponentResponse)
def update_component(
    component_id: int,
    data: SalaryComponentUpdate,
    company_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return SalaryStructureService.update_salary_component(db, component_id,company_id, data)

@router.patch("/{component_id}/status", response_model=SalaryComponentResponse)
def patch_component_status(
    component_id: int,
    data: SalaryStatusUpdate,
    company_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return SalaryStructureService.update_salary_component_status(db, component_id, company_id, data)

@router.delete("/{component_id}")
def delete_component(
    component_id: int,
    company_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return SalaryStructureService.delete_salary_component(db, component_id, company_id)
