from sqlalchemy import Column, String, DateTime, Float, ForeignKey, Integer, BigInteger, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base
import uuid
import enum

class JourneyStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"

class JourneySession(Base):
    __tablename__ = "journey_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)
    
    start_lat = Column(Float, nullable=False)
    start_lng = Column(Float, nullable=False)
    end_lat = Column(Float, nullable=True)
    end_lng = Column(Float, nullable=True)
    
    status = Column(SQLEnum(JourneyStatus), default=JourneyStatus.ACTIVE, nullable=False, index=True)
    total_points = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    logs = relationship("LocationLog", back_populates="journey", cascade="all, delete-orphan")
    user = relationship("User")

    @property
    def user_name(self):
        if self.user:
            return f"{self.user.first_name}"
        return None

class LocationLog(Base):
    __tablename__ = "location_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    journey_id = Column(UUID(as_uuid=True), ForeignKey("journey_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False, index=True)
    
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    recorded_at = Column(DateTime(timezone=True), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    journey = relationship("JourneySession", back_populates="logs")
