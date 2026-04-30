from sqlalchemy.orm import Session
from app.models import User
from app.core.config import settings
from app.core.security import hash_password

def seed_admin_user(db: Session):
    admin_email = settings.DEFAULT_ADMIN_EMAIL
    
    # Check if admin already exists
    existing_admin = db.query(User).filter(User.email == admin_email).first()
    if existing_admin:
        print(f"Startup Seed: Admin user '{admin_email}' already exists. Skipping creation.")
        return
        
    print(f"Startup Seed: Creating default admin user '{admin_email}'...")
    
    # Create the user
    new_admin = User(
        first_name="System",
        last_name="Admin",
        email=admin_email,
        password=hash_password(settings.DEFAULT_ADMIN_PASSWORD),
        role="ADMIN",
        is_active=True
    )
    
    db.add(new_admin)
    db.commit()
    print("Startup Seed: Default admin user created successfully.")
