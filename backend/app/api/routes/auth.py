from fastapi import APIRouter, Depends, status, HTTPException, Header
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.auth_service import AuthService
from app.services.user_service import UserService
from app.schemas.user import LoginRequest, ChangePasswordRequest, ResetPasswordRequest, ResetPasswordConfirm
from app.api.dependencies.auth import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    return AuthService.authenticate_user(db, data)

@router.post("/change-password")
def change_password(data: ChangePasswordRequest, current_user = Depends(get_current_user), db: Session = Depends(get_db)):
    return AuthService.change_password(db, current_user.email, data.old_password, data.new_password)

@router.post("/reset-password")
def reset_password_request(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    return AuthService.reset_password_request(db, data.email)

@router.post("/reset-password-confirm")
def reset_password_confirm(data: ResetPasswordConfirm, db: Session = Depends(get_db)):
    return AuthService.reset_password_confirm(db, data)