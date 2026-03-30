from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from app.db.models import SalaryStructure, SalaryComponent, StructureComponent, BasedOnType
from app.schemas.salary_structure import (
    SalaryStructureCreate, StructureComponentCreate, StructureComponentUpdate,
    SalaryComponentCreate, SalaryComponentUpdate
)

class SalaryStructureService:
    @staticmethod
    def create_salary_structure(db: Session, structure_data: SalaryStructureCreate):
        db_structure = SalaryStructure(**structure_data.model_dump())
        db.add(db_structure)
        try:
            db.commit()
            db.refresh(db_structure)
            return db_structure
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Structure with name '{structure_data.name}' already exists for this company."
            )

    @staticmethod
    def get_salary_structures(db: Session, company_id: int):
        return db.query(SalaryStructure).filter(SalaryStructure.company_id == company_id).all()

    @staticmethod
    def get_salary_structure_details(db: Session, structure_id: int):
        structure = db.query(SalaryStructure).options(
            joinedload(SalaryStructure.components).joinedload(StructureComponent.component),
            joinedload(SalaryStructure.components).joinedload(StructureComponent.based_on_component)
        ).filter(SalaryStructure.id == structure_id).first()
        
        if not structure:
            raise HTTPException(status_code=404, detail="Salary Structure not found")
        
        # Format the response manually if needed, but the response_model will handle much of it
        # We need to ensure StructureComponentResponse fields are populated
        results = []
        for mapping in structure.components:
            results.append({
                "id": mapping.id,
                "component_id": mapping.component_id,
                "component_name": mapping.component.name,
                "type": mapping.component.type,
                "calculation_type": mapping.calculation_type,
                "value": mapping.value,
                "based_on": mapping.based_on,
                "based_on_component_id": mapping.based_on_component_id,
                "based_on_component_name": mapping.based_on_component.name if mapping.based_on_component else None,
                "sequence": mapping.sequence,
                "is_active": mapping.is_active
            })
        
        return {
            "id": structure.id,
            "company_id": structure.company_id,
            "name": structure.name,
            "description": structure.description,
            "is_active": structure.is_active,
            "created_at": structure.created_at,
            "updated_at": structure.updated_at,
            "components": results
        }

    @staticmethod
    def add_component_to_structure(db: Session, structure_id: int, data: StructureComponentCreate):
        # 1. Verify structure exists
        structure = db.query(SalaryStructure).filter(SalaryStructure.id == structure_id).first()
        if not structure:
            raise HTTPException(status_code=404, detail="Structure not found")

        # 2. Verify component exists
        component = db.query(SalaryComponent).filter(SalaryComponent.id == data.component_id).first()
        if not component:
            raise HTTPException(status_code=404, detail="Salary Component not found")

        # 3. Check if component already in structure
        existing_mapping = db.query(StructureComponent).filter(
            StructureComponent.structure_id == structure_id,
            StructureComponent.component_id == data.component_id
        ).first()
        if existing_mapping:
            raise HTTPException(status_code=400, detail="This component is already part of this structure")

        # 4. Dependency Validation
        if data.based_on == BasedOnType.COMPONENT:
            if not data.based_on_component_id:
                raise HTTPException(status_code=400, detail="based_on_component_id is required when based_on is COMPONENT")
            
            if data.based_on_component_id == data.component_id:
                raise HTTPException(status_code=400, detail="Component cannot depend on itself")
            
            # Verify dependency exists in the same structure
            dep_exists = db.query(StructureComponent).filter(
                StructureComponent.structure_id == structure_id,
                StructureComponent.component_id == data.based_on_component_id
            ).first()
            if not dep_exists:
                raise HTTPException(status_code=400, detail="Dependent component must be added to the structure first")

        # 5. Create mapping
        db_mapping = StructureComponent(
            structure_id=structure_id,
            **data.model_dump()
        )
        db.add(db_mapping)
        try:
            db.commit()
            db.refresh(db_mapping)
            return {"message": "Component added successfully"}
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=400, detail="Sequence number must be unique within a structure")

    @staticmethod
    def update_structure_component(db: Session, mapping_id: int, data: StructureComponentUpdate):
        mapping = db.query(StructureComponent).filter(StructureComponent.id == mapping_id).first()
        if not mapping:
            raise HTTPException(status_code=404, detail="Component mapping not found")

        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(mapping, key, value)
        
        try:
            db.commit()
            db.refresh(mapping)
            return mapping
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=400, detail="Database constraint violated (likely duplicate sequence)")

    @staticmethod
    def delete_structure_component(db: Session, mapping_id: int):
        mapping = db.query(StructureComponent).filter(StructureComponent.id == mapping_id).first()
        if not mapping:
            raise HTTPException(status_code=404, detail="Component mapping not found")
        
        # Check if any other component depends on this one in the same structure
        dependency = db.query(StructureComponent).filter(
            StructureComponent.structure_id == mapping.structure_id,
            StructureComponent.based_on_component_id == mapping.component_id
        ).first()
        if dependency:
            raise HTTPException(status_code=400, detail="Cannot delete this component because other components depend on it")

        db.delete(mapping)
        db.commit()
        return {"message": "Component removed successfully"}

    @staticmethod
    def get_salary_components(db: Session):
        return db.query(SalaryComponent).all()

    @staticmethod
    def create_salary_component(db: Session, data: SalaryComponentCreate):
        # Name Normalization
        name_normalized = data.name.strip()
        
        # Unique Check (case-insensitive)
        existing = db.query(SalaryComponent).filter(
            SalaryComponent.name.ilike(name_normalized)
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Salary component '{name_normalized}' already exists."
            )
        
        db_component = SalaryComponent(
            name=name_normalized,
            type=data.type,
            is_taxable=data.is_taxable
        )
        db.add(db_component)
        db.commit()
        db.refresh(db_component)
        return db_component

    @staticmethod
    def get_salary_component_by_id(db: Session, component_id: int):
        component = db.query(SalaryComponent).filter(SalaryComponent.id == component_id).first()
        if not component:
            raise HTTPException(status_code=404, detail="Salary Component not found")
        return component

    @staticmethod
    def update_salary_component(db: Session, component_id: int, data: SalaryComponentUpdate):
        db_component = SalaryStructureService.get_salary_component_by_id(db, component_id)
        
        update_data = data.model_dump(exclude_unset=True)
        if "name" in update_data:
            name_normalized = update_data["name"].strip()
            # Unique Check excluding self
            existing = db.query(SalaryComponent).filter(
                SalaryComponent.name.ilike(name_normalized),
                SalaryComponent.id != component_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Salary component '{name_normalized}' already exists."
                )
            update_data["name"] = name_normalized

        for key, value in update_data.items():
            setattr(db_component, key, value)
        
        db.commit()
        db.refresh(db_component)
        return db_component

    @staticmethod
    def delete_salary_component(db: Session, component_id: int):
        db_component = SalaryStructureService.get_salary_component_by_id(db, component_id)
        
        # Check if used in any structure
        is_used = db.query(StructureComponent).filter(
            StructureComponent.component_id == component_id
        ).first()
        
        if is_used:
            # Mark as inactive instead of deleting
            db_component.is_active = False
            db.commit()
            return {"message": "Component is in use and has been marked as inactive"}
        
        db.delete(db_component)
        db.commit()
        return {"message": "Component deleted successfully"}
