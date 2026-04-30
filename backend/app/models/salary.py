import enum
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Enum, Numeric, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class ComponentType(enum.Enum):
    EARNING = "EARNING"
    DEDUCTION = "DEDUCTION"
    EMPLOYER_CONTRIBUTION = "EMPLOYER_CONTRIBUTION"

class SalaryComponent(Base):
    __tablename__ = "salary_components"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, index=True, nullable=False)
    type = Column(Enum(ComponentType), nullable=False)
    is_taxable = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    company = relationship("Company", back_populates="salary_components")

    __table_args__ = (
        UniqueConstraint('company_id', 'name', name='uq_salary_component_name_per_company'),
    )

class SalaryStructureDefinition(Base):
    __tablename__ = "salary_structure_definitions"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    structure_name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    company = relationship("Company", back_populates="salary_structure_definitions")
    details = relationship("SalaryStructureDetail", back_populates="structure", cascade="all, delete-orphan")
    user_assignments = relationship("UserSalaryStructure", back_populates="structure", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('company_id', 'structure_name', name='uq_structure_name_per_company'),
    )

class SalaryStructureDetail(Base):
    __tablename__ = "salary_structure_details"

    id = Column(Integer, primary_key=True, index=True)
    structure_id = Column(Integer, ForeignKey("salary_structure_definitions.id"), nullable=False)
    component_id = Column(Integer, ForeignKey("salary_components.id"), nullable=False)
    percentage = Column(Numeric(precision=7, scale=4), nullable=False)

    structure = relationship("SalaryStructureDefinition", back_populates="details")
    component = relationship("SalaryComponent")

    __table_args__ = (
        UniqueConstraint('structure_id', 'component_id', name='uq_component_per_structure'),
    )

class UserSalaryStructure(Base):
    __tablename__ = "user_salary_structures"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    structure_id = Column(Integer, ForeignKey("salary_structure_definitions.id"), nullable=False)
    ctc = Column(Numeric(precision=15, scale=2), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())

    structure = relationship("SalaryStructureDefinition", back_populates="user_assignments")
    user = relationship("User")
    company = relationship("Company")

    __table_args__ = (
        UniqueConstraint('user_id', 'company_id', name='uq_user_salary_per_company'),
    )
