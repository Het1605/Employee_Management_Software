from typing import Optional
import re
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from app.db.models import SalaryStructure, SalaryComponent, StructureComponent, BasedOnType, Company, CalculationType
from app.schemas.salary_structure import (
    SalaryStructureCreate, SalaryStructureUpdate, StructureComponentCreate, StructureComponentUpdate,
    SalaryComponentCreate, SalaryComponentUpdate, SalaryStatusUpdate
)

class SalaryStructureService:
    @staticmethod
    def _ensure_formula_token_boundary(formula: str, end_pos: int) -> bool:
        if end_pos >= len(formula):
            return True
        return formula[end_pos].isspace() or formula[end_pos] in "+-*/()"

    @staticmethod
    def _extract_formula_dependencies(formula: str, available_names: list[str], self_name: str):
        token_candidates = sorted(
            {name for name in [self_name, *available_names] if name},
            key=len,
            reverse=True
        )
        referenced_names = []
        pos = 0
        number_pattern = re.compile(r"\d+(\.\d+)?")

        while pos < len(formula):
            if formula[pos].isspace():
                pos += 1
                continue

            if formula[pos] in "+-*/()":
                pos += 1
                continue

            number_match = number_pattern.match(formula, pos)
            if number_match:
                pos = number_match.end()
                continue

            matched_name = None
            for candidate in token_candidates:
                if formula.startswith(candidate, pos) and SalaryStructureService._ensure_formula_token_boundary(formula, pos + len(candidate)):
                    matched_name = candidate
                    referenced_names.append(candidate)
                    pos += len(candidate)
                    break

            if matched_name:
                continue

            unknown_end = pos
            while unknown_end < len(formula) and not formula[unknown_end].isspace() and formula[unknown_end] not in "+-*/()":
                unknown_end += 1
            unknown_token = formula[pos:unknown_end]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown token '{unknown_token}' in formula."
            )

        if self_name in referenced_names:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Component cannot reference itself in formula.")

        return [name for name in referenced_names if name != self_name]

    @staticmethod
    def _validate_structure_component_config(db: Session, structure: SalaryStructure, component: SalaryComponent, data):
        value = data.value
        based_on = data.based_on
        based_on_component_id = data.based_on_component_id
        formula = data.formula.strip() if isinstance(data.formula, str) else None
        if data.calculation_type == CalculationType.FIXED:
            if value is None:
                raise HTTPException(status_code=400, detail="value is required when calculation_type is FIXED")
            if based_on is not None or based_on_component_id is not None:
                raise HTTPException(status_code=400, detail="based_on and based_on_component_id must be null when calculation_type is FIXED")
            if formula:
                raise HTTPException(status_code=400, detail="formula must be null when calculation_type is FIXED")
            return {
                "value": value,
                "based_on": None,
                "based_on_component_id": None,
                "formula": None
            }

        if data.calculation_type == CalculationType.PERCENTAGE:
            if value is None:
                raise HTTPException(status_code=400, detail="value is required when calculation_type is PERCENTAGE")
            if based_on is None:
                raise HTTPException(status_code=400, detail="based_on is required when calculation_type is PERCENTAGE")
            if formula:
                raise HTTPException(status_code=400, detail="formula must be null when calculation_type is PERCENTAGE")

            if based_on == BasedOnType.CTC:
                if based_on_component_id is not None:
                    raise HTTPException(status_code=400, detail="based_on_component_id must be null when based_on is CTC")
                return {
                    "value": value,
                    "based_on": based_on,
                    "based_on_component_id": None,
                    "formula": None
                }

            if based_on != BasedOnType.COMPONENT:
                raise HTTPException(status_code=400, detail="Invalid based_on value for calculation_type PERCENTAGE")
            if based_on_component_id is None:
                raise HTTPException(status_code=400, detail="based_on_component_id is required when based_on is COMPONENT")
            if based_on_component_id == component.id:
                raise HTTPException(status_code=400, detail="Component cannot depend on itself")

            dep_mapping = db.query(StructureComponent).options(
                joinedload(StructureComponent.component)
            ).filter(
                StructureComponent.structure_id == structure.id,
                StructureComponent.component_id == based_on_component_id
            ).first()
            if not dep_mapping:
                raise HTTPException(status_code=400, detail="Dependent component must be part of the same structure")
            if dep_mapping.component.company_id != structure.company_id:
                raise HTTPException(status_code=400, detail="Dependent Salary Component does not belong to this company")
            if dep_mapping.sequence >= data.sequence:
                raise HTTPException(status_code=400, detail="Dependent component must come before this component in sequence")

            return {
                "value": value,
                "based_on": based_on,
                "based_on_component_id": based_on_component_id,
                "formula": None
            }

        if data.calculation_type == CalculationType.FORMULA:
            if not formula:
                raise HTTPException(status_code=400, detail="formula is required when calculation_type is FORMULA")
            if value is not None:
                raise HTTPException(status_code=400, detail="value must be null when calculation_type is FORMULA")
            if based_on is not None or based_on_component_id is not None:
                raise HTTPException(status_code=400, detail="based_on and based_on_component_id must be null when calculation_type is FORMULA")

            structure_components = db.query(StructureComponent).options(
                joinedload(StructureComponent.component)
            ).filter(StructureComponent.structure_id == structure.id).all()
            company_components = db.query(SalaryComponent).filter(
                SalaryComponent.company_id == structure.company_id
            ).all()
            available_names = [comp.name for comp in company_components if comp.id != component.id]
            referenced_names = SalaryStructureService._extract_formula_dependencies(
                formula,
                available_names,
                component.name
            )

            if referenced_names:
                name_to_mapping = {
                    mapping.component.name: mapping
                    for mapping in structure_components
                    if mapping.component_id != component.id
                }
                for referenced_name in referenced_names:
                    dep_mapping = name_to_mapping.get(referenced_name)
                    if not dep_mapping:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Component '{referenced_name}' must be part of the same structure before it can be used in a formula."
                        )
                    if dep_mapping.sequence >= data.sequence:
                        raise HTTPException(status_code=400, detail="Formula dependencies must come before this component in sequence")

            return {
                "value": None,
                "based_on": None,
                "based_on_component_id": None,
                "formula": formula
            }

        raise HTTPException(status_code=400, detail="Unsupported calculation_type")

    @staticmethod
    def get_structure_component_by_id(db: Session, mapping_id: int):
        mapping = db.query(StructureComponent).options(
            joinedload(StructureComponent.structure),
            joinedload(StructureComponent.component)
        ).filter(StructureComponent.id == mapping_id).first()
        if not mapping:
            raise HTTPException(status_code=404, detail="Component mapping not found")
        return mapping

    @staticmethod
    def get_salary_structure_by_id(db: Session, structure_id: int, company_id: int):
        structure = db.query(SalaryStructure).filter(
            SalaryStructure.id == structure_id,
            SalaryStructure.company_id == company_id
        ).first()
        if not structure:
            raise HTTPException(status_code=404, detail="Salary Structure not found")
        return structure

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
    def get_salary_structure_details(db: Session, structure_id: int, company_id: int):
        structure = db.query(SalaryStructure).options(
            joinedload(SalaryStructure.components).joinedload(StructureComponent.component),
            joinedload(SalaryStructure.components).joinedload(StructureComponent.based_on_component)
        ).filter(
            SalaryStructure.id == structure_id,
            SalaryStructure.company_id == company_id
        ).first()
        
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
                "formula": mapping.formula,
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
    def update_salary_structure(db: Session, structure_id: int, company_id: int, data: SalaryStructureUpdate):
        structure = SalaryStructureService.get_salary_structure_by_id(db, structure_id, company_id)

        name_normalized = data.name.strip()
        if not name_normalized:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Structure name is required.")

        existing = db.query(SalaryStructure).filter(
            SalaryStructure.company_id == company_id,
            func.lower(SalaryStructure.name) == name_normalized.lower(),
            SalaryStructure.id != structure_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Structure with name '{name_normalized}' already exists for this company."
            )

        structure.name = name_normalized
        structure.description = data.description

        db.commit()
        db.refresh(structure)
        return structure

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
        if component.company_id != structure.company_id:
            raise HTTPException(status_code=400, detail="Salary Component does not belong to this company")

        # 3. Check if component already in structure
        existing_mapping = db.query(StructureComponent).filter(
            StructureComponent.structure_id == structure_id,
            StructureComponent.component_id == data.component_id
        ).first()
        if existing_mapping:
            raise HTTPException(status_code=400, detail="This component is already part of this structure")

        # 4. Dependency Validation
        validated_config = SalaryStructureService._validate_structure_component_config(db, structure, component, data)

        # 5. Create mapping
        db_mapping = StructureComponent(
            structure_id=structure_id,
            component_id=data.component_id,
            calculation_type=data.calculation_type,
            value=validated_config["value"],
            based_on=validated_config["based_on"],
            based_on_component_id=validated_config["based_on_component_id"],
            formula=validated_config["formula"],
            sequence=data.sequence,
            is_active=data.is_active
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
        mapping = SalaryStructureService.get_structure_component_by_id(db, mapping_id)
        structure = mapping.structure
        validated_config = SalaryStructureService._validate_structure_component_config(db, structure, mapping.component, data)

        mapping.calculation_type = data.calculation_type
        mapping.value = validated_config["value"]
        mapping.based_on = validated_config["based_on"]
        mapping.based_on_component_id = validated_config["based_on_component_id"]
        mapping.formula = validated_config["formula"]
        mapping.sequence = data.sequence
        
        try:
            db.commit()
            db.refresh(mapping)
            return mapping
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=400, detail="Database constraint violated (likely duplicate sequence)")

    @staticmethod
    def toggle_structure_component_status(db: Session, mapping_id: int, status_data: SalaryStatusUpdate):
        mapping = SalaryStructureService.get_structure_component_by_id(db, mapping_id)
        mapping.is_active = status_data.is_active
        db.commit()
        db.refresh(mapping)
        return mapping

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
    def get_salary_components(db: Session, company_id: int, is_active: Optional[bool] = None):
        query = db.query(SalaryComponent).filter(SalaryComponent.company_id == company_id)
        if is_active is not None:
            query = query.filter(SalaryComponent.is_active == is_active)
        return query.order_by(SalaryComponent.name.asc()).all()

    @staticmethod
    def create_salary_component(db: Session, data: SalaryComponentCreate):
        # Name Normalization
        name_normalized = data.name.strip()
        if not name_normalized:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Salary component name is required.")

        company = db.query(Company).filter(Company.id == data.company_id).first()
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Unique Check (case-insensitive)
        existing = db.query(SalaryComponent).filter(
            SalaryComponent.company_id == data.company_id,
            func.lower(SalaryComponent.name) == name_normalized.lower()
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Salary component '{name_normalized}' already exists for this company."
            )
        
        db_component = SalaryComponent(
            company_id=data.company_id,
            name=name_normalized,
            type=data.type,
            is_taxable=data.is_taxable
        )
        db.add(db_component)
        try:
            db.commit()
            db.refresh(db_component)
            return db_component
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to create salary component. Please check company and name uniqueness."
            )

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
    def update_salary_component(db: Session, component_id: int, company_id: int, data: SalaryComponentUpdate):
        db_component = SalaryStructureService.get_salary_component_by_id(db, component_id, company_id)
        
        update_data = data.model_dump(exclude_unset=True)
        if "name" in update_data:
            name_normalized = update_data["name"].strip()
            if not name_normalized:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Salary component name is required.")
            # Unique Check excluding self
            existing = db.query(SalaryComponent).filter(
                SalaryComponent.company_id == company_id,
                func.lower(SalaryComponent.name) == name_normalized.lower(),
                SalaryComponent.id != component_id
            ).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Salary component '{name_normalized}' already exists for this company."
                )
            update_data["name"] = name_normalized

        for key, value in update_data.items():
            setattr(db_component, key, value)
        
        db.commit()
        db.refresh(db_component)
        return db_component

    @staticmethod
    def toggle_salary_component_status(db: Session, component_id: int, company_id: int, status_data: SalaryStatusUpdate):
        db_component = SalaryStructureService.get_salary_component_by_id(db, component_id, company_id)
        db_component.is_active = status_data.is_active
        db.commit()
        db.refresh(db_component)
        return db_component

    @staticmethod
    def delete_salary_component(db: Session, component_id: int, company_id: int):
        db_component = SalaryStructureService.get_salary_component_by_id(db, component_id, company_id)
        
        # Check if used in any structure
        is_used = db.query(StructureComponent).filter(
            StructureComponent.component_id == component_id
        ).first()
        
        if is_used:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete component as it is used in one or more salary structures. Deactivate it instead."
            )
        
        db.delete(db_component)
        db.commit()
        return {"message": "Component deleted successfully"}

    @staticmethod
    def delete_salary_structure(db: Session, structure_id: int, company_id: int):
        structure = SalaryStructureService.get_salary_structure_by_id(db, structure_id, company_id)
        
        # In a real system, you might check for assigned employees here
        
        # First delete all structure-component mappings
        db.query(StructureComponent).filter(StructureComponent.structure_id == structure_id).delete()
        
        db.delete(structure)
        db.commit()
        return {"message": "Salary Structure deleted successfully"}

    @staticmethod
    def toggle_salary_structure_status(db: Session, structure_id: int, company_id: int, status_data: SalaryStatusUpdate):
        structure = SalaryStructureService.get_salary_structure_by_id(db, structure_id, company_id)
        
        structure.is_active = status_data.is_active
        db.commit()
        db.refresh(structure)
        return structure
