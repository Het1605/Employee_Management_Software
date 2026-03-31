from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.db.models import SalaryStructure, StructureComponent
from app.schemas.salary_structure import (
    SalaryStructureCreate, SalaryStructureResponse, SalaryStructureDetailResponse,
    StructureComponentCreate, StructureComponentUpdate, SalaryComponentResponse,
    SalaryStatusUpdate, SalaryStructureUpdate
)
from app.services.salary_structure_service import SalaryStructureService

router = APIRouter(prefix="/salary-structures", tags=["Salary Structures"])

@router.post("/", response_model=SalaryStructureResponse, status_code=status.HTTP_201_CREATED)
def create_structure(
    structure: SalaryStructureCreate,
    db: Session = Depends(get_db)
):
    return SalaryStructureService.create_salary_structure(db, structure)

@router.get("/", response_model=List[SalaryStructureResponse])
def get_structures(
    company_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return SalaryStructureService.get_salary_structures(db, company_id)

@router.get("/{structure_id}", response_model=SalaryStructureDetailResponse)
def get_structure_details(
    structure_id: int,
    company_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return SalaryStructureService.get_salary_structure_details(db, structure_id, company_id)

@router.put("/{structure_id}", response_model=SalaryStructureResponse)
def update_structure(
    structure_id: int,
    data: SalaryStructureUpdate,
    company_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return SalaryStructureService.update_salary_structure(db, structure_id, company_id, data)

@router.patch("/{structure_id}/status", response_model=SalaryStructureResponse)
def patch_structure_status(
    structure_id: int,
    data: SalaryStatusUpdate,
    company_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return SalaryStructureService.toggle_salary_structure_status(db, structure_id, company_id, data)

@router.delete("/{structure_id}")
def delete_structure(
    structure_id: int,
    company_id: int = Query(...),
    db: Session = Depends(get_db)
):
    return SalaryStructureService.delete_salary_structure(db, structure_id, company_id)

@router.post("/{structure_id}/components")
def add_component(
    structure_id: int,
    data: StructureComponentCreate,
    db: Session = Depends(get_db)
):
    structure = db.query(SalaryStructure).filter(SalaryStructure.id == structure_id).first()
    if not structure:
        raise HTTPException(status_code=404, detail="Structure not found")
    
    return SalaryStructureService.add_component_to_structure(db, structure_id, data)

@router.get("/master-components/all", response_model=List[SalaryComponentResponse])
def get_master_components(
    company_id: int = Query(...),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    # Available to all authenticated users, scoped to the selected company
    return SalaryStructureService.get_salary_components(db, company_id, is_active)

# Structure Components Management

@router.put("/components/{mapping_id}")
def update_component_mapping(
    mapping_id: int,
    data: StructureComponentUpdate,
    db: Session = Depends(get_db)
):
    mapping = db.query(StructureComponent).join(SalaryStructure).filter(StructureComponent.id == mapping_id).first()
    if not mapping:
        raise HTTPException(status_code=404, detail="Component mapping not found")
    
    return SalaryStructureService.update_structure_component(db, mapping_id, data)

@router.patch("/components/{mapping_id}/status")
def patch_component_mapping_status(
    mapping_id: int,
    data: SalaryStatusUpdate,
    db: Session = Depends(get_db)
):
    return SalaryStructureService.toggle_structure_component_status(db, mapping_id, data)

@router.delete("/components/{mapping_id}")
def delete_component_mapping(
    mapping_id: int,
    db: Session = Depends(get_db)
):
    return SalaryStructureService.delete_structure_component(db, mapping_id)
