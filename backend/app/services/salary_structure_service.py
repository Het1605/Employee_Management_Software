from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from typing import Optional

from app.models import (
    SalaryComponent,
    Company,
    SalaryStructureDefinition,
    SalaryStructureDetail,
    UserSalaryStructure,
    User,
)


class SalaryStructureService:
    """
    Handles salary components plus new salary structure definitions, details, and user assignments.
    """

    # ---------- Salary Components ----------
    @staticmethod
    def create_salary_component(db: Session, data):
        company = db.query(Company).filter(Company.id == data.company_id).first()
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")

        component = SalaryComponent(**data.model_dump())
        db.add(component)
        try:
            db.commit()
            db.refresh(component)
            return component
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Component with name '{data.name}' already exists for this company."
            )

    @staticmethod
    def get_salary_components(db: Session, company_id: int):
        query = db.query(SalaryComponent).filter(SalaryComponent.company_id == company_id)
        return query.all()

    @staticmethod
    def get_salary_component_by_id(db: Session, component_id: int, company_id: int):
        component = db.query(SalaryComponent).filter(
            SalaryComponent.id == component_id,
            SalaryComponent.company_id == company_id
        ).first()
        if not component:
            raise HTTPException(status_code=404, detail="Salary Component not found")
        return component

    @staticmethod
    def update_salary_component(db: Session, component_id: int, company_id: int, data):
        component = SalaryStructureService.get_salary_component_by_id(db, component_id, company_id)
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(component, field, value)
        try:
            db.commit()
            db.refresh(component)
            return component
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Component with the provided name already exists for this company."
            )

    @staticmethod
    def delete_salary_component(db: Session, component_id: int, company_id: int):
        component = SalaryStructureService.get_salary_component_by_id(db, component_id, company_id)
        db.delete(component)
        db.commit()
        return {"detail": "Component deleted successfully"}


    # ---------- Salary Structure Definitions ----------
    @staticmethod
    def create_definition(db: Session, data):
        company = db.query(Company).filter(Company.id == data.company_id).first()
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        definition = SalaryStructureDefinition(**data.model_dump())
        db.add(definition)
        try:
            db.commit()
            db.refresh(definition)
            return definition
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=400, detail="Structure name already exists for this company")

    @staticmethod
    def list_definitions(db: Session, company_id: Optional[int] = None):
        query = db.query(SalaryStructureDefinition)
        if company_id is not None:
            query = query.filter(SalaryStructureDefinition.company_id == company_id)
        return query.all()

    @staticmethod
    def get_definition(db: Session, structure_id: int):
        definition = db.query(SalaryStructureDefinition).filter(SalaryStructureDefinition.id == structure_id).first()
        if not definition:
            raise HTTPException(status_code=404, detail="Salary structure not found")
        return definition

    @staticmethod
    def update_definition(db: Session, structure_id: int, data):
        definition = SalaryStructureService.get_definition(db, structure_id)
        definition.structure_name = data.structure_name
        try:
            db.commit()
            db.refresh(definition)
            return definition
        except IntegrityError as exc:
            db.rollback()
            # uniqueness should ignore self; if still triggered, return meaningful message
            raise HTTPException(status_code=400, detail="Structure name already exists for this company") from exc

    @staticmethod
    def delete_definition(db: Session, structure_id: int):
        definition = SalaryStructureService.get_definition(db, structure_id)
        db.delete(definition)
        db.commit()
        return {"detail": "Deleted"}

    # ---------- Salary Structure Details ----------
    @staticmethod
    def add_details(db: Session, structure_id: int, items):
        structure = SalaryStructureService.get_definition(db, structure_id)
        detail_objs = []
        for item in items:
            component = db.query(SalaryComponent).filter(SalaryComponent.id == item.component_id).first()
            if not component:
                raise HTTPException(status_code=404, detail=f"Component {item.component_id} not found")
            if component.company_id != structure.company_id:
                raise HTTPException(status_code=400, detail="Component company mismatch")
            detail_objs.append(
                SalaryStructureDetail(
                    structure_id=structure_id,
                    component_id=item.component_id,
                    percentage=item.percentage,
                )
            )
        db.add_all(detail_objs)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=400, detail="Duplicate component for this structure")
        return SalaryStructureService.list_details(db, structure_id)

    @staticmethod
    def list_details(db: Session, structure_id: int):
        SalaryStructureService.get_definition(db, structure_id)
        rows = (
            db.query(SalaryStructureDetail, SalaryComponent.name.label("component_name"))
            .join(SalaryComponent, SalaryComponent.id == SalaryStructureDetail.component_id)
            .filter(SalaryStructureDetail.structure_id == structure_id)
            .all()
        )
        return [
            {
                "id": d.id,
                "structure_id": d.structure_id,
                "component_id": d.component_id,
                "percentage": d.percentage,
                "component_name": comp_name,
            }
            for d, comp_name in rows
        ]

    @staticmethod
    def update_detail(db: Session, structure_id: int, component_id: int, data):
        detail = db.query(SalaryStructureDetail).filter(
            SalaryStructureDetail.structure_id == structure_id,
            SalaryStructureDetail.component_id == component_id,
        ).first()
        if not detail:
            raise HTTPException(status_code=404, detail="Component mapping not found")
        detail.percentage = data.percentage
        db.commit()
        db.refresh(detail)
        comp_name = db.query(SalaryComponent.name).filter(SalaryComponent.id == detail.component_id).scalar()
        return {
            "id": detail.id,
            "structure_id": detail.structure_id,
            "component_id": detail.component_id,
            "percentage": detail.percentage,
            "component_name": comp_name,
        }

    @staticmethod
    def delete_detail(db: Session, structure_id: int, component_id: int):
        detail = db.query(SalaryStructureDetail).filter(
            SalaryStructureDetail.structure_id == structure_id,
            SalaryStructureDetail.component_id == component_id,
        ).first()
        if not detail:
            raise HTTPException(status_code=404, detail="Component mapping not found")
        db.delete(detail)
        db.commit()
        return {"detail": "Deleted"}

    # ---------- User Salary Structures ----------
    @staticmethod
    def create_assignment(db: Session, data):
        structure = SalaryStructureService.get_definition(db, data.structure_id)
        if structure.company_id != data.company_id:
            raise HTTPException(status_code=400, detail="Structure company mismatch")

        user = db.query(User).filter(User.id == data.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        assignment = UserSalaryStructure(**data.model_dump())
        db.add(assignment)
        try:
            db.commit()
            db.refresh(assignment)
            return assignment
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=400, detail="Assignment already exists for this company or invalid data")

    @staticmethod
    def list_assignments(db: Session, company_id: Optional[int] = None):
        query = db.query(UserSalaryStructure)
        if company_id is not None:
            query = query.filter(UserSalaryStructure.company_id == company_id)
        return query.all()

    @staticmethod
    def get_assignment(db: Session, assignment_id: int, company_id: Optional[int] = None):
        query = db.query(UserSalaryStructure).filter(UserSalaryStructure.id == assignment_id)
        if company_id is not None:
            query = query.filter(UserSalaryStructure.company_id == company_id)
        assignment = query.first()
        if not assignment:
            raise HTTPException(status_code=404, detail="Assignment not found")
        return assignment

    @staticmethod
    def update_assignment(db: Session, assignment_id: int, company_id: int, data):
        assignment = SalaryStructureService.get_assignment(db, assignment_id, company_id)
        structure = SalaryStructureService.get_definition(db, data.structure_id)
        if structure.company_id != company_id:
            raise HTTPException(status_code=400, detail="Structure company mismatch")
        
        assignment.structure_id = data.structure_id
        assignment.ctc = data.ctc
        db.commit()
        db.refresh(assignment)
        return assignment

    @staticmethod
    def delete_assignment(db: Session, assignment_id: int, company_id: int):
        assignment = SalaryStructureService.get_assignment(db, assignment_id, company_id)
        db.delete(assignment)
        db.commit()
        return {"detail": "Deleted"}
