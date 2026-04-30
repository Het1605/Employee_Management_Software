from sqlalchemy import Column, Integer, String, DateTime, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

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
    header_image = Column(String, nullable=True)
    footer_image = Column(String, nullable=True)
    company_stamp = Column(String, nullable=True)
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
