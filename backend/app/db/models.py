from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table, CheckConstraint, Boolean, Enum, Numeric, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # ADMIN, HR, MANAGER, EMPLOYEE
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    companies = relationship("Company", secondary="user_company_mapping", back_populates="users")

class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    address_line_1 = Column(String, nullable=True)
    address_line_2 = Column(String, nullable=True)
    address_line_3 = Column(String, nullable=True)
    gst_number = Column(String, unique=True, nullable=True)
    pan_number = Column(String, unique=True, nullable=True)
    logo_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        CheckConstraint('gst_number IS NULL OR length(gst_number) = 15', name='chk_gst_len'),
        CheckConstraint('pan_number IS NULL OR length(pan_number) = 10', name='chk_pan_len'),
    )

    # Relationships
    users = relationship("User", secondary="user_company_mapping", back_populates="companies")
    salary_structures = relationship("SalaryStructure", back_populates="company", cascade="all, delete-orphan")

class UserCompanyMapping(Base):
    __tablename__ = "user_company_mapping"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), primary_key=True)

# ----------------- SALARY STRUCTURE MODELS -----------------

import enum

class ComponentType(enum.Enum):
    EARNING = "EARNING"
    DEDUCTION = "DEDUCTION"
    EMPLOYER_CONTRIBUTION = "EMPLOYER_CONTRIBUTION"

class CalculationType(enum.Enum):
    FIXED = "FIXED"
    PERCENTAGE = "PERCENTAGE"

class BasedOnType(enum.Enum):
    CTC = "CTC"
    COMPONENT = "COMPONENT"

class SalaryStructure(Base):
    __tablename__ = "salary_structures"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    company = relationship("Company", back_populates="salary_structures")
    components = relationship("StructureComponent", back_populates="structure", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint('company_id', 'name', name='uq_structure_name_per_company'),
    )

class SalaryComponent(Base):
    __tablename__ = "salary_components"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    type = Column(Enum(ComponentType), nullable=False)
    is_taxable = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    structure_mappings = relationship("StructureComponent", foreign_keys="[StructureComponent.component_id]", back_populates="component")

class StructureComponent(Base):
    __tablename__ = "structure_components"

    id = Column(Integer, primary_key=True, index=True)
    structure_id = Column(Integer, ForeignKey("salary_structures.id"), nullable=False)
    component_id = Column(Integer, ForeignKey("salary_components.id"), nullable=False)
    
    calculation_type = Column(Enum(CalculationType), nullable=False)
    value = Column(Numeric(precision=12, scale=2), nullable=False)  # Supports large amounts with 2 decimal places
    
    based_on = Column(Enum(BasedOnType), nullable=False)
    based_on_component_id = Column(Integer, ForeignKey("salary_components.id"), nullable=True)
    
    sequence = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)

    # Relationships
    structure = relationship("SalaryStructure", back_populates="components")
    component = relationship("SalaryComponent", foreign_keys=[component_id], back_populates="structure_mappings")
    based_on_component = relationship("SalaryComponent", foreign_keys=[based_on_component_id])

    __table_args__ = (
        UniqueConstraint('structure_id', 'sequence', name='uq_sequence_per_structure'),
        CheckConstraint('value >= 0', name='chk_positive_value'),
    )