from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.db.database import get_db
from app.db.models import LeaveRequest, User, UserCompanyMapping
from app.api.dependencies.auth import get_current_user
from app.schemas.leave_request import LeaveRequestCreate, LeaveRequestUpdate, LeaveRequestOut

router = APIRouter(prefix="/leave-requests", tags=["Leave Management"])

@router.post("", response_model=LeaveRequestOut)
def apply_for_leave(request: LeaveRequestCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.id != request.user_id and current_user.role not in ["ADMIN", "HR", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Cannot apply leave for another user")
    
    mapping = db.query(UserCompanyMapping).filter_by(user_id=request.user_id, company_id=request.company_id).first()
    if not mapping:
        raise HTTPException(status_code=400, detail="User does not belong to the selected company")

    total_days = (request.end_date - request.start_date).days + 1

    db_request = LeaveRequest(
        user_id=request.user_id,
        company_id=request.company_id,
        start_date=request.start_date,
        end_date=request.end_date,
        total_days=total_days,
        reason=request.reason,
        status="pending"
    )
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

@router.get("/my", response_model=List[LeaveRequestOut])
def get_my_leaves(company_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(LeaveRequest).filter(LeaveRequest.user_id == current_user.id)
    if company_id:
        query = query.filter(LeaveRequest.company_id == company_id)
    return query.order_by(LeaveRequest.applied_at.desc()).all()

@router.get("", response_model=List[LeaveRequestOut])
def get_all_leaves(company_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["ADMIN", "HR", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Not authorized to view all leaves")
        
    leaves = db.query(LeaveRequest).filter(LeaveRequest.company_id == company_id).order_by(LeaveRequest.applied_at.desc()).all()
    return leaves

@router.put("/{leave_id}", response_model=LeaveRequestOut)
def approve_reject_leave(leave_id: int, request: LeaveRequestUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["ADMIN", "HR", "MANAGER"]:
        raise HTTPException(status_code=403, detail="Not authorized to approve or reject leaves")
        
    db_request = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not db_request:
        raise HTTPException(status_code=404, detail="Leave request not found")
        
    db_request.status = request.status
    db_request.reviewed_by = current_user.id
    db_request.reviewed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_request)
    return db_request
