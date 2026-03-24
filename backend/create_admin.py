from app.db.database import SessionLocal
from app.db.models import User
from app.core.security import hash_password

db = SessionLocal()

# Check if admin already exists
existing = db.query(User).filter(User.username == "admin").first()

if not existing:
    admin = User(
        username="Het",
        password=hash_password("Het123"),
        role="employee"
    )
    db.add(admin)
    db.commit()
    print("✅ Admin created")
else:
    employee = User(
        username="Het",
        password=hash_password("Het123"),
        role="employee"
    )
    db.add(employee)
    db.commit()
    print("✅ employee created")
   

db.close()