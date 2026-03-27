from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from app.db.models import User
from app.schemas.user import UserCreate, UserUpdate, ChangePasswordRequest
from app.core.security import hash_password, verify_password

class UserService:
    @staticmethod
    def get_user_by_id(db: Session, user_id: int):
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user

    @staticmethod
    def get_user_by_email(db: Session, email: str):
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def create_user(db: Session, user_data: UserCreate):
        if UserService.get_user_by_email(db, user_data.email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
        
        hashed_pwd = hash_password(user_data.password)
        db_user = User(
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            email=user_data.email,
            phone=user_data.phone,
            password=hashed_pwd,
            role=user_data.role.value
        )
        db.add(db_user)
        try:
            db.commit()
            db.refresh(db_user)
            return db_user
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered"
            )
        except Exception:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error. Please try again later."
            )

    @staticmethod
    def update_user(db: Session, user_id: int, user_data: UserUpdate):
        db_user = UserService.get_user_by_id(db, user_id)
        
        update_data = user_data.dict(exclude_unset=True)
        
        if "email" in update_data and update_data["email"] != db_user.email:
            if UserService.get_user_by_email(db, update_data["email"]):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already registered"
                )
        
        # Password update removed from this API as per requirement
        # (It's also removed from UserUpdate schema)
        
        for key, value in update_data.items():
            setattr(db_user, key, value)
        
        try:
            db.commit()
            db.refresh(db_user)
            return db_user
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered"
            )
        except Exception:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error. Please try again later."
            )

    @staticmethod
    def delete_user(db: Session, user_id: int):
        db_user = UserService.get_user_by_id(db, user_id)
        db.delete(db_user)
        try:
            db.commit()
            return {"message": "User deleted successfully"}
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete user because they have active company associations"
            )
        except Exception:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error. Please try again later."
            )

    @staticmethod
    def get_all_users(db: Session):
        return db.query(User).all()

    @staticmethod
    def change_password(db: Session, user_id: int, password_data: ChangePasswordRequest):
        db_user = UserService.get_user_by_id(db, user_id)
        
        if not verify_password(password_data.old_password, db_user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid old password"
            )
        
        db_user.password = hash_password(password_data.new_password)
        try:
            db.commit()
            return {"message": "Password updated successfully"}
        except Exception:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error. Please try again later."
            )

    @staticmethod
    def admin_reset_password(db: Session, user_id: int, new_password: str):
        user = UserService.get_user_by_id(db, user_id)
        user.password = hash_password(new_password)
        db.commit()
        return {"message": "Password updated successfully"}
