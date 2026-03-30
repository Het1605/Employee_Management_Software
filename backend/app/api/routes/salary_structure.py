from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.db.models import SalaryStructure, StructureComponent
from app.schemas.salary_structure import (
    SalaryStructureCreate, SalaryStructureResponse, SalaryStructureDetailResponse,
    StructureComponentCreate, StructureComponentUpdate, SalaryComponentResponse
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
    db: Session = Depends(get_db)
):
    structure = db.query(SalaryStructure).filter(SalaryStructure.id == structure_id).first()
    if not structure:
        raise HTTPException(status_code=404, detail="Salary Structure not found")
    
    return SalaryStructureService.get_salary_structure_details(db, structure_id)

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
    db: Session = Depends(get_db)
):
    # Available to all authenticated users
    return SalaryStructureService.get_salary_components(db)

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

@router.delete("/components/{mapping_id}")
def delete_component_mapping(
    mapping_id: int,
    db: Session = Depends(get_db)
):
    return SalaryStructureService.delete_structure_component(db, mapping_id)
