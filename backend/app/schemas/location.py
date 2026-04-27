from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional, Any, Generic, TypeVar
from uuid import UUID
from enum import Enum

T = TypeVar("T")

class JourneyStatus(str, Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"

class ResponseEnvelope(BaseModel, Generic[T]):
    status: str
    message: str
    data: Optional[T] = None

class LocationPoint(BaseModel):
    latitude: float
    longitude: float
    recorded_at: datetime

class JourneyStart(BaseModel):
    company_id: int
    start_lat: float
    start_lng: float

class JourneyTrack(BaseModel):
    journey_id: UUID
    company_id: int
    locations: List[LocationPoint]

class JourneyEnd(BaseModel):
    journey_id: UUID
    company_id: int
    end_lat: float
    end_lng: float

class LocationLogResponse(BaseModel):
    id: int
    latitude: float
    longitude: float
    recorded_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class JourneyResponse(BaseModel):
    id: UUID
    user_id: int
    company_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    start_lat: float
    start_lng: float
    end_lat: Optional[float] = None
    end_lng: Optional[float] = None
    status: str
    total_points: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class JourneyDetailResponse(JourneyResponse):
    logs: List[LocationLogResponse]

class PaginatedJourneys(BaseModel):
    items: List[JourneyResponse]
    total: int
    page: int
    size: int
