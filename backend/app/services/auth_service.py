from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from jose import jwt, JWTError
from datetime import datetime, timedelta
from app.db.models import User
from app.core.security import verify_password, hash_password
from app.core.config import settings
from app.schemas.user import LoginRequest, ResetPasswordConfirm

class AuthService:
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str):
        user = db.query(User).filter(User.email == email).first()

        if not user or not verify_password(password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is inactive. Please contact admin."
            )

        # Generate Access Token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token_data = {
            "sub": user.email,
            "role": user.role.upper(),
            "exp": datetime.utcnow() + access_token_expires
        }
        access_token = jwt.encode(access_token_data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "message": "Login successful",
            "role": user.role.upper(),
            "user": {
                "id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email
            }
        }

    @staticmethod
    def change_password(db: Session, email: str, old_password: str, new_password: str):
        user = db.query(User).filter(User.email == email).first()
        if not user or not verify_password(old_password, user.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid current password"
            )
        
        user.password = hash_password(new_password)
        db.commit()
        return {"message": "Password changed successfully"}

    @staticmethod
    def reset_password_request(db: Session, email: str):
        user = db.query(User).filter(User.email == email).first()
        
        # Generic message to not expose email existence
        success_msg = {"message": "If this email exists in our system, a reset link has been sent."}
        
        if not user:
            return success_msg
        
        # Generate JWT Token (15 min expiry)
        token_data = {
            "sub": user.email,
            "exp": datetime.utcnow() + timedelta(minutes=15),
            "type": "reset_password"
        }
        token = jwt.encode(token_data, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        
        # Send email
        reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
        AuthService._send_reset_email(user.email, reset_link)
        
        return success_msg

    @staticmethod
    def reset_password_confirm(db: Session, confirm_data: ResetPasswordConfirm):
        # Clean token (safeguard against hidden characters)
        token = confirm_data.token.replace("\\r", "").replace("\\n", "").replace("\r", "").replace("\n", "").strip()
        
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
            email = payload.get("sub")
            if not email or payload.get("type") != "reset_password":
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid token")
        except JWTError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token")
        
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
        user.password = hash_password(confirm_data.new_password)
        db.commit()
        
        return {"message": "Password reset successfully"}

    @staticmethod
    def _send_reset_email(email: str, link: str):
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            print("EMAIL ERROR: SMTP credentials not configured")
            return

        # Create message
        message = MIMEMultipart()
        message["From"] = settings.SMTP_USER
        message["To"] = email
        message["Subject"] = "Password Reset Request"

        body = f"""
        Hello,

        You requested a password reset for your Employee Management System account.
        Please click the link below to reset your password:

        {link}

        This link will expire in 15 minutes.
        If you did not request this, please ignore this email.
        """
        message.attach(MIMEText(body, "plain"))

        try:
            # Connect to SMTP server
            print(f"DEBUG: Connecting to {settings.SMTP_SERVER}:{settings.SMTP_PORT}...")
            server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
            server.set_debuglevel(1) # Enable debug output in console
            server.starttls() # Secure the connection
            
            print(f"DEBUG: Logging in as {settings.SMTP_USER}...")
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            
            print(f"DEBUG: Sending email to {email}...")
            server.send_message(message)
            server.quit()
            print("DEBUG: Email sent successfully!")
            
        except Exception as e:
            print(f"EMAIL ERROR: {str(e)}")
            # Optional: re-raise or handle silently as per requirements
