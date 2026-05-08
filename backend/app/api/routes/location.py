from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.api.dependencies.auth import get_current_user
from app.schemas.base_response import ResponseSchema
from app.schemas.location import (
    JourneyStart, JourneyTrack, JourneyEnd,
    JourneyResponse, JourneyDetailResponse, PaginatedJourneys
)
from app.services.location_service import LocationService
from uuid import UUID
from typing import Optional, Any, Union, Dict
from datetime import date

router = APIRouter(prefix="/location", tags=["Location Tracking"])

@router.get("/active-journey", response_model=ResponseSchema[Optional[JourneyResponse]])
async def get_active_journey(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = await LocationService.get_active_journey(db, current_user.id)
    return ResponseSchema(status=result["status"], message=result.get("message"), data=result.get("data"))

@router.post("/start", response_model=ResponseSchema[Union[JourneyResponse, Dict[str, Any]]], status_code=status.HTTP_201_CREATED)
async def start_journey(
    data: JourneyStart,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = await LocationService.start_journey(db, current_user.id, data)
    return ResponseSchema(status=result["status"], message=result.get("message"), data=result.get("data"))

@router.post("/track", response_model=ResponseSchema[Dict[str, Any]], status_code=status.HTTP_200_OK)
async def track_location(
    data: JourneyTrack,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = await LocationService.track_location(db, current_user.id, data)
    return ResponseSchema(status=result["status"], message=result.get("message"), data=result.get("data"))

@router.post("/end", response_model=ResponseSchema[JourneyResponse])
async def end_journey(
    data: JourneyEnd,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = await LocationService.end_journey(db, current_user.id, data)
    return ResponseSchema(status=result["status"], message=result.get("message"), data=result.get("data"))

@router.get("/journeys", response_model=ResponseSchema[PaginatedJourneys])
async def get_journeys(
    company_id: int = Query(...),
    user_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Strict validation
    LocationService._validate_user_membership(db, current_user.id, company_id)
    
    result = await LocationService.get_journeys(db, company_id, user_id, status, start_date, end_date, page, size)
    return ResponseSchema(status=result["status"], message=result.get("message"), data=result.get("data"))

@router.get("/journey/{id}", response_model=ResponseSchema[JourneyDetailResponse])
async def get_journey_detail(
    id: UUID,
    company_id: int = Query(...),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Strict validation
    LocationService._validate_user_membership(db, current_user.id, company_id)
    
    result = await LocationService.get_journey_detail(db, id, company_id)
    return ResponseSchema(status=result["status"], message=result.get("message"), data=result.get("data"))

@router.delete("/journey/{id}", response_model=ResponseSchema[Dict[str, Any]])
async def delete_journey(
    id: UUID,
    company_id: int = Query(...),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Strict validation
    LocationService._validate_user_membership(db, current_user.id, company_id)
    
    result = await LocationService.delete_journey(db, id, company_id)
    return ResponseSchema(status=result["status"], message=result.get("message"), data=result.get("data"))
@router.post("/force-stop/{id}", response_model=ResponseSchema[JourneyResponse])
async def force_stop_journey(
    id: UUID,
    company_id: int = Query(...),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Role Check: Only Admin or HR can force stop
    if current_user.role not in ["ADMIN", "HR"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized: Only administrators or HR can force-stop a journey"
        )

    # 2. Strict company membership validation
    LocationService._validate_user_membership(db, current_user.id, company_id)
    
    result = await LocationService.force_stop_session(db, id, company_id)
    return ResponseSchema(status=result["status"], message=result.get("message"), data=result.get("data"))
