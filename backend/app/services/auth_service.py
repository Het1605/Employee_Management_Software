from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import secrets
from app.db.models import User
from app.core.security import verify_password, hash_password
from app.schemas.user import LoginRequest, ResetPasswordConfirm

# In-memory store for reset tokens (for logic demonstration as per requirements)
# In production, this should be in DB with expiry or Redis
reset_tokens = {}

class AuthService:
    @staticmethod
    def authenticate_user(db: Session, login_data: LoginRequest):
        user = db.query(User).filter(User.email == login_data.email).first()

        if not user or not verify_password(login_data.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        return {
            "message": "Login successful",
            "role": user.role,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email
            }
        }

    @staticmethod
    def reset_password_request(db: Session, email: str):
        user = db.query(User).filter(User.email == email).first()
        
        # Improvement: Do not reveal whether email exists if desired, 
        # but here we return token as requested for implementation logic.
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email not found"
            )
        
        token = secrets.token_urlsafe(32)
        reset_tokens[token] = user.email
        
        return {
            "message": "Reset token generated",
            "token": token
        }

    @staticmethod
    def reset_password_confirm(db: Session, confirm_data: ResetPasswordConfirm):
        email = reset_tokens.get(confirm_data.token)
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired token"
            )
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user.password = hash_password(confirm_data.new_password)
        db.commit()
        
        # Remove token after use
        del reset_tokens[confirm_data.token]
        
        return {"message": "Password reset successfully"}
