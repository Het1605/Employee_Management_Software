from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.salary_structure import (
    SalaryStructureDefinitionCreate,
    SalaryStructureDefinitionUpdate,
    SalaryStructureDefinitionResponse,
    SalaryStructureDetailCreate,
    SalaryStructureDetailUpdate,
    SalaryStructureDetailResponse,
    UserSalaryStructureCreate,
    UserSalaryStructureUpdate,
    UserSalaryStructureResponse,
)
from app.services.salary_structure_service import SalaryStructureService

router = APIRouter(prefix="/salary-structures", tags=["Salary Structures"])


# -------- Definitions --------
@router.post("/", response_model=SalaryStructureDefinitionResponse)
def create_structure(data: SalaryStructureDefinitionCreate, db: Session = Depends(get_db)):
    return SalaryStructureService.create_definition(db, data)


@router.get("/", response_model=list[SalaryStructureDefinitionResponse])
def list_structures(company_id: int | None = None, db: Session = Depends(get_db)):
    return SalaryStructureService.list_definitions(db, company_id)


@router.get("/{structure_id}", response_model=SalaryStructureDefinitionResponse)
def get_structure(structure_id: int, db: Session = Depends(get_db)):
    return SalaryStructureService.get_definition(db, structure_id)


@router.put("/{structure_id}", response_model=SalaryStructureDefinitionResponse)
def update_structure(structure_id: int, data: SalaryStructureDefinitionUpdate, db: Session = Depends(get_db)):
    return SalaryStructureService.update_definition(db, structure_id, data)


@router.delete("/{structure_id}")
def delete_structure(structure_id: int, db: Session = Depends(get_db)):
    return SalaryStructureService.delete_definition(db, structure_id)


# -------- Details --------
@router.post("/{structure_id}/components", response_model=list[SalaryStructureDetailResponse])
def add_components(structure_id: int, payload: SalaryStructureDetailCreate, db: Session = Depends(get_db)):
    if not payload.items:
        raise HTTPException(status_code=400, detail="No components provided")
    return SalaryStructureService.add_details(db, structure_id, payload.items)


@router.get("/{structure_id}/components", response_model=list[SalaryStructureDetailResponse])
def list_components(structure_id: int, db: Session = Depends(get_db)):
    return SalaryStructureService.list_details(db, structure_id)


@router.put("/{structure_id}/components/{component_id}", response_model=SalaryStructureDetailResponse)
def update_component(structure_id: int, component_id: int, data: SalaryStructureDetailUpdate, db: Session = Depends(get_db)):
    return SalaryStructureService.update_detail(db, structure_id, component_id, data)


@router.delete("/{structure_id}/components/{component_id}")
def delete_component(structure_id: int, component_id: int, db: Session = Depends(get_db)):
    return SalaryStructureService.delete_detail(db, structure_id, component_id)


# -------- User Assignments --------
assign_router = APIRouter(prefix="/user-salary-structures", tags=["User Salary Structures"])


@assign_router.post("/", response_model=UserSalaryStructureResponse)
def assign_structure(data: UserSalaryStructureCreate, db: Session = Depends(get_db)):
    return SalaryStructureService.create_assignment(db, data)


@assign_router.get("/", response_model=list[UserSalaryStructureResponse])
def list_assignments(company_id: int | None = None, db: Session = Depends(get_db)):
    return SalaryStructureService.list_assignments(db, company_id)


@assign_router.get("/{assignment_id}", response_model=UserSalaryStructureResponse)
def get_assignment(assignment_id: int, db: Session = Depends(get_db)):
    return SalaryStructureService.get_assignment(db, assignment_id)


@assign_router.put("/{assignment_id}", response_model=UserSalaryStructureResponse)
def update_assignment(assignment_id: int, data: UserSalaryStructureUpdate, db: Session = Depends(get_db)):
    return SalaryStructureService.update_assignment(db, assignment_id, data)


@assign_router.delete("/{assignment_id}")
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    return SalaryStructureService.delete_assignment(db, assignment_id)
