from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import List
from app.db.models import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse, AdminPasswordReset, UserStatusUpdate, ResignationRequest
from app.services.user_service import UserService
from app.api.dependencies.auth import get_current_user
from app.db.database import get_db


router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    return UserService.create_user(db, user_data)

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/", response_model=List[UserResponse])
def get_all_users(
    active_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return UserService.get_all_users(db, active_only=active_only)

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    return UserService.get_user_by_id(db, user_id)

@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_data: UserUpdate, db: Session = Depends(get_db)):
    return UserService.update_user(db, user_id, user_data)

@router.delete("/{user_id}", status_code=status.HTTP_200_OK)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    return UserService.delete_user(db, user_id)
@router.put("/{user_id}/reset-password")
def admin_reset_password(user_id: int, data: AdminPasswordReset, db: Session = Depends(get_db)):
    return UserService.admin_reset_password(db, user_id, data.password)

@router.post("/resign")
def submit_resignation(
    data: ResignationRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    return UserService.submit_resignation(db, current_user, data)

@router.patch("/{user_id}/toggle-status")
def toggle_user_status(user_id: int, data: UserStatusUpdate, db: Session = Depends(get_db)):
    return UserService.toggle_user_status(db, user_id, data.is_active)


