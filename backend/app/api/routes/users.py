from fastapi import APIRouter, Depends, status, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.models import User
from app.schemas.base_response import ResponseSchema
from app.schemas.user import UserCreate, UserUpdate, UserResponse, AdminPasswordReset, UserStatusUpdate, ResignationRequest
from app.services.user_service import UserService
from app.api.dependencies.auth import get_current_user
from app.api.dependencies.roles import role_required
from app.db.database import get_db


router = APIRouter(prefix="/users", tags=["users"])

@router.post("/", response_model=ResponseSchema[UserResponse], status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    user = UserService.create_user(db, user_data)
    return ResponseSchema(status="success", message="User created successfully", data=user)

@router.get("/me", response_model=ResponseSchema[UserResponse])
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return ResponseSchema(status="success", data=current_user)

@router.get("/", response_model=ResponseSchema[List[UserResponse]])
def get_all_users(
    active_only: bool = Query(False),
    company_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    users = UserService.get_all_users(db, active_only=active_only, company_id=company_id)
    return ResponseSchema(status="success", data=users)

@router.get("/{user_id}", response_model=ResponseSchema[UserResponse])
def get_user(
    user_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    user = UserService.get_user_by_id(db, user_id)
    return ResponseSchema(status="success", data=user)

@router.put("/{user_id}", response_model=ResponseSchema[UserResponse])
def update_user(
    user_id: int, 
    user_data: UserUpdate, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    user = UserService.update_user(db, user_id, user_data)
    return ResponseSchema(status="success", message="User updated successfully", data=user)

@router.delete("/{user_id}", response_model=ResponseSchema[Dict[str, Any]], status_code=status.HTTP_200_OK)
def delete_user(
    user_id: int, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    if admin_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account."
        )
    result = UserService.delete_user(db, user_id)
    return ResponseSchema(status="success", message="User deleted successfully", data=result)

@router.put("/{user_id}/reset-password", response_model=ResponseSchema[Dict[str, Any]])
def admin_reset_password(
    user_id: int, 
    data: AdminPasswordReset, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    result = UserService.admin_reset_password(db, user_id, data.password)
    return ResponseSchema(status="success", message="Password reset successfully", data=result)

@router.post("/resign", response_model=ResponseSchema[Dict[str, Any]])
def submit_resignation(
    data: ResignationRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    result = UserService.submit_resignation(db, current_user, data)
    return ResponseSchema(status="success", message="Resignation submitted successfully", data=result)

@router.patch("/{user_id}/toggle-status", response_model=ResponseSchema[Dict[str, Any]])
def toggle_user_status(
    user_id: int, 
    data: UserStatusUpdate, 
    db: Session = Depends(get_db),
    admin_user: User = Depends(role_required(["ADMIN", "HR"]))
):
    if admin_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account."
        )
    result = UserService.toggle_user_status(db, user_id, data.is_active)
    status_label = "activated" if data.is_active else "deactivated"
    return ResponseSchema(status="success", message=f"User {status_label} successfully", data=result)


