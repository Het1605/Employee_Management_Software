from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.auth_service import AuthService
from app.schemas.user import LoginRequest
from app.schemas.base_response import ResponseSchema

router = APIRouter()

@router.post("/login", response_model=ResponseSchema)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = AuthService.authenticate_user(db, data)
    
    return ResponseSchema(
        message="Login successful",
        data={
            "role": user.role,
            "username": user.username
        }
    )