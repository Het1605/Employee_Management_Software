from app.db.database import SessionLocal, Base, engine
from app.db.models import User
from app.core.security import hash_password

# Ensure tables are created
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Check if admin already exists
existing_admin = db.query(User).filter(User.email == "admin@example.com").first()

if not existing_admin:
    admin = User(
        name="Admin User",
        email="admin@example.com",
        password=hash_password("admin123"),
        role="ADMIN"
    )
    db.add(admin)
    db.commit()
    print("✅ Admin created: admin@example.com / admin123")
else:
    print("ℹ️ Admin already exists")

# Create a test employee
existing_employee = db.query(User).filter(User.email == "employee@example.com").first()
if not existing_employee:
    employee = User(
        name="Test Employee",
        email="employee@example.com",
        password=hash_password("employee123"),
        role="EMPLOYEE"
    )
    db.add(employee)
    db.commit()
    print("✅ Employee created: employee@example.com / employee123")
else:
    print("ℹ️ Employee already exists")

db.close()