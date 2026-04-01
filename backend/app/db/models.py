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
    role = Column(String, nullable=False)  # ADMIN, HR, MANAGER, EMPLOYEE, INTERN
    is_active = Column(Boolean, default=True)
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
    postal_code = Column(String, nullable=True)
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
    salary_components = relationship("SalaryComponent", back_populates="company", cascade="all, delete-orphan")
    salary_structure_definitions = relationship("SalaryStructureDefinition", back_populates="company", cascade="all, delete-orphan")

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

class SalaryComponent(Base):
    __tablename__ = "salary_components"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String, index=True, nullable=False)
    type = Column(Enum(ComponentType), nullable=False)
    is_taxable = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    company = relationship("Company", back_populates="salary_components")

    __table_args__ = (
        UniqueConstraint('company_id', 'name', name='uq_salary_component_name_per_company'),
    )


# ----------------- NEW SALARY STRUCTURE SCHEMA -----------------

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
    structure_id = Column(Integer, ForeignKey("salary_structure_definitions.id"), nullable=False)
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())

    structure = relationship("SalaryStructureDefinition", back_populates="user_assignments")
    user = relationship("User")
