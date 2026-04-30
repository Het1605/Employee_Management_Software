from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func, and_
from fastapi import HTTPException, status
from app.models import JourneySession, LocationLog, JourneyStatus
from app.models import UserCompanyMapping
from app.schemas.location import JourneyStart, JourneyTrack, JourneyEnd
from datetime import datetime
from uuid import UUID
from typing import List

class LocationService:
    @staticmethod
    def _validate_user_membership(db: Session, user_id: int, company_id: int):
        """Strictly validates if the user belongs to the provided company."""
        mapping = db.query(UserCompanyMapping).filter(
            UserCompanyMapping.user_id == user_id,
            UserCompanyMapping.company_id == company_id
        ).first()
        
        if not mapping:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: User does not belong to company {company_id}"
            )

    @staticmethod
    async def start_journey(db: Session, user_id: int, data: JourneyStart):
        # 1. Multi-company safety check
        LocationService._validate_user_membership(db, user_id, data.company_id)

        # 2. Prevent multiple active journeys for this user in THIS company
        active_journey = db.query(JourneySession).filter(
            JourneySession.user_id == user_id,
            JourneySession.company_id == data.company_id,
            JourneySession.status == JourneyStatus.ACTIVE
        ).first()
        
        if active_journey:
            return {
                "status": "error",
                "message": "Active journey already exists",
                "data": {"journey_id": str(active_journey.id)}
            }
        
        # 3. Create journey
        new_journey = JourneySession(
            user_id=user_id,
            company_id=data.company_id,
            start_lat=data.start_lat,
            start_lng=data.start_lng,
            status=JourneyStatus.ACTIVE
        )
        
        db.add(new_journey)
        db.commit()
        db.refresh(new_journey)
        
        return {
            "status": "success",
            "message": "Journey started successfully",
            "data": new_journey
        }

    @staticmethod
    async def track_location(db: Session, user_id: int, data: JourneyTrack):
        # 1. Multi-company safety check
        LocationService._validate_user_membership(db, user_id, data.company_id)

        # 2. Find and Validate Journey (Ownership + Status + Company)
        journey = db.query(JourneySession).filter(
            JourneySession.id == data.journey_id
        ).first()
        
        if not journey:
            raise HTTPException(status_code=404, detail="Journey not found")
        
        if journey.user_id != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized: This journey does not belong to you")
            
        if journey.company_id != data.company_id:
            raise HTTPException(status_code=403, detail="Unauthorized: Journey company mismatch")

        if journey.status != JourneyStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="Cannot track location: Journey is not ACTIVE")

        # 3. Duplicate Protection (Lightweight)
        # We'll filter out points that might be duplicates in this batch or already exist
        # To avoid heavy DB checks, we'll at least deduplicate the incoming batch
        seen_points = set()
        unique_logs = []
        
        for loc in data.locations:
            point_key = (loc.recorded_at, loc.latitude, loc.longitude)
            if point_key not in seen_points:
                seen_points.add(point_key)
                unique_logs.append(
                    LocationLog(
                        journey_id=journey.id,
                        user_id=user_id,
                        company_id=journey.company_id,
                        latitude=loc.latitude,
                        longitude=loc.longitude,
                        recorded_at=loc.recorded_at
                    )
                )

        if unique_logs:
            db.bulk_save_objects(unique_logs)
            journey.total_points += len(unique_logs)
            db.commit()
        
        return {
            "status": "success", 
            "message": f"Successfully tracked {len(unique_logs)} points",
            "data": {"points_added": len(unique_logs), "total_points": journey.total_points}
        }

    @staticmethod
    async def end_journey(db: Session, user_id: int, data: JourneyEnd):
        # 1. Multi-company safety check
        LocationService._validate_user_membership(db, user_id, data.company_id)

        # 2. Find and Validate Journey
        journey = db.query(JourneySession).filter(
            JourneySession.id == data.journey_id
        ).first()
        
        if not journey:
            raise HTTPException(status_code=404, detail="Journey not found")
            
        if journey.user_id != user_id:
            raise HTTPException(status_code=403, detail="Unauthorized: Ownership check failed")

        if journey.company_id != data.company_id:
            raise HTTPException(status_code=403, detail="Unauthorized: Company mismatch")

        if journey.status != JourneyStatus.ACTIVE:
            raise HTTPException(status_code=400, detail="Journey is already COMPLETED or invalid")
        
        # 3. Mark COMPLETED
        journey.status = JourneyStatus.COMPLETED
        journey.end_time = datetime.utcnow()
        journey.end_lat = data.end_lat
        journey.end_lng = data.end_lng
        
        db.commit()
        db.refresh(journey)
        
        return {
            "status": "success",
            "message": "Journey completed successfully",
            "data": journey
        }

    @staticmethod
    async def get_journeys(db: Session, company_id: int, user_id: int = None, status: str = None, start_date=None, end_date=None, page: int = 1, size: int = 20):
        query = db.query(JourneySession).filter(JourneySession.company_id == company_id)
        
        if user_id:
            query = query.filter(JourneySession.user_id == user_id)
        
        if status:
            query = query.filter(JourneySession.status == status)
            
        if start_date:
            # Filter where start_time (as date) is >= start_date
            query = query.filter(func.date(JourneySession.start_time) >= start_date)
            
        if end_date:
            # Filter where start_time (as date) is <= end_date
            query = query.filter(func.date(JourneySession.start_time) <= end_date)
            
        total = query.count()
        items = query.options(joinedload(JourneySession.user)).order_by(JourneySession.start_time.desc()).offset((page - 1) * size).limit(size).all()
        
        return {
            "status": "success",
            "message": "Journeys retrieved successfully",
            "data": {
                "items": items,
                "total": total,
                "page": page,
                "size": size
            }
        }

    @staticmethod
    async def get_journey_detail(db: Session, journey_id: UUID, company_id: int):
        journey = db.query(JourneySession).options(joinedload(JourneySession.user)).filter(
            JourneySession.id == journey_id,
            JourneySession.company_id == company_id
        ).first()
        
        if not journey:
            raise HTTPException(status_code=404, detail="Journey not found")
            
        return {
            "status": "success",
            "message": "Journey details retrieved",
            "data": journey
        }
    @staticmethod
    async def get_active_journey(db: Session, user_id: int):
        """Finds any currently ACTIVE journey for the user across any company."""
        
        journey = db.query(JourneySession).filter(
            JourneySession.user_id == user_id,
            JourneySession.status == "ACTIVE" # Use string directly for safety
        ).order_by(JourneySession.start_time.desc()).first()
        
        if not journey:
            return {
                "status": "success",
                "message": "No active journey found",
                "data": None
            }
            
        return {
            "status": "success",
            "message": "Active journey found",
            "data": journey
        }
