from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.user import UserCreate, UserUpdate, UserResponse, AdminPasswordReset, UserStatusUpdate
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_data: UserCreate, db: Session = Depends(get_db)):
    return UserService.create_user(db, user_data)

@router.get("/", response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    return UserService.get_all_users(db)

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

@router.patch("/{user_id}/toggle-status")
def toggle_user_status(user_id: int, data: UserStatusUpdate, db: Session = Depends(get_db)):
    return UserService.toggle_user_status(db, user_id, data.is_active)
