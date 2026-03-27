from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table, CheckConstraint
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
        CheckConstraint('gst_number IS NULL OR char_length(gst_number) = 15', name='chk_gst_len'),
        CheckConstraint('pan_number IS NULL OR char_length(pan_number) = 10', name='chk_pan_len'),
    )

    # Relationships
    users = relationship("User", secondary="user_company_mapping", back_populates="companies")

class UserCompanyMapping(Base):
    __tablename__ = "user_company_mapping"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    company_id = Column(Integer, ForeignKey("companies.id"), primary_key=True)