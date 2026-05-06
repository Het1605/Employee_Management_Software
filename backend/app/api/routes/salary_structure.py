from fastapi import APIRouter, Depends, HTTPException
from app.schemas.base_response import ResponseSchema
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies.auth import get_current_user
from app.api.dependencies.roles import role_required
from app.models import User
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
@router.post("/", response_model=ResponseSchema[SalaryStructureDefinitionResponse])
def create_structure(
    data: SalaryStructureDefinitionCreate, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = SalaryStructureService.create_definition(db, data)
    return ResponseSchema(status="success", message="Salary structure created", data=result)


@router.get("/", response_model=ResponseSchema[list[SalaryStructureDefinitionResponse]])
def list_structures(
    company_id: int | None = None, 
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["ADMIN", "HR", "MANAGER"]))
):
    result = SalaryStructureService.list_definitions(db, company_id)
    return ResponseSchema(status="success", data=result)


@router.get("/{structure_id}", response_model=ResponseSchema[SalaryStructureDefinitionResponse])
def get_structure(
    structure_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["ADMIN", "HR", "MANAGER"]))
):
    result = SalaryStructureService.get_definition(db, structure_id)
    return ResponseSchema(status="success", data=result)


@router.put("/{structure_id}", response_model=ResponseSchema[SalaryStructureDefinitionResponse])
def update_structure(
    structure_id: int, 
    data: SalaryStructureDefinitionUpdate, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = SalaryStructureService.update_definition(db, structure_id, data)
    return ResponseSchema(status="success", message="Salary structure updated", data=result)


@router.delete("/{structure_id}", response_model=ResponseSchema[dict])
def delete_structure(
    structure_id: int, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = SalaryStructureService.delete_definition(db, structure_id)
    return ResponseSchema(status="success", message="Salary structure deleted", data=result)


# -------- Details --------
@router.post("/{structure_id}/components", response_model=ResponseSchema[list[SalaryStructureDetailResponse]])
def add_components(
    structure_id: int, 
    payload: SalaryStructureDetailCreate, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    if not payload.items:
        raise HTTPException(status_code=400, detail="No components provided")
    result = SalaryStructureService.add_details(db, structure_id, payload.items)
    return ResponseSchema(status="success", message="Components added successfully", data=result)


@router.get("/{structure_id}/components", response_model=ResponseSchema[list[SalaryStructureDetailResponse]])
def list_components(
    structure_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["ADMIN", "HR", "MANAGER"]))
):
    result = SalaryStructureService.list_details(db, structure_id)
    return ResponseSchema(status="success", data=result)


@router.put("/{structure_id}/components/{component_id}", response_model=ResponseSchema[SalaryStructureDetailResponse])
def update_component(
    structure_id: int, 
    component_id: int, 
    data: SalaryStructureDetailUpdate, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = SalaryStructureService.update_detail(db, structure_id, component_id, data)
    return ResponseSchema(status="success", message="Component updated", data=result)


@router.delete("/{structure_id}/components/{component_id}", response_model=ResponseSchema[dict])
def delete_component(
    structure_id: int, 
    component_id: int, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = SalaryStructureService.delete_detail(db, structure_id, component_id)
    return ResponseSchema(status="success", message="Component deleted", data=result)


# -------- User Assignments --------
assign_router = APIRouter(prefix="/user-salary-structures", tags=["User Salary Structures"])


@assign_router.post("/", response_model=ResponseSchema[UserSalaryStructureResponse])
def assign_structure(
    data: UserSalaryStructureCreate, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = SalaryStructureService.create_assignment(db, data)
    return ResponseSchema(status="success", message="Structure assigned successfully", data=result)


@assign_router.get("/", response_model=ResponseSchema[list[UserSalaryStructureResponse]])
def list_assignments(
    company_id: int | None = None, 
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["ADMIN", "HR", "MANAGER"]))
):
    result = SalaryStructureService.list_assignments(db, company_id)
    return ResponseSchema(status="success", data=result)


@assign_router.get("/{assignment_id}", response_model=ResponseSchema[UserSalaryStructureResponse])
def get_assignment(
    assignment_id: int, 
    company_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["ADMIN", "HR", "MANAGER"]))
):
    result = SalaryStructureService.get_assignment(db, assignment_id, company_id)
    return ResponseSchema(status="success", data=result)


@assign_router.put("/{assignment_id}", response_model=ResponseSchema[UserSalaryStructureResponse])
def update_assignment(
    assignment_id: int, 
    data: UserSalaryStructureUpdate, 
    company_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = SalaryStructureService.update_assignment(db, assignment_id, company_id, data)
    return ResponseSchema(status="success", message="Assignment updated", data=result)


@assign_router.delete("/{assignment_id}", response_model=ResponseSchema[dict])
def delete_assignment(
    assignment_id: int, 
    company_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = SalaryStructureService.delete_assignment(db, assignment_id, company_id)
    return ResponseSchema(status="success", message="Assignment deleted", data=result)
