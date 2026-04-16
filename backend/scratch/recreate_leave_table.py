
from app.db.database import engine, Base
from app.db.models import LeaveRequest
import sqlalchemy as sa

def recreate_leave_requests():
    print("Dropping leave_requests table...")
    try:
        # Drop table if exists
        Base.metadata.tables['leave_requests'].drop(engine, checkfirst=True)
        print("Table dropped successfully.")
    except Exception as e:
        print(f"Error dropping table: {e}")

    print("Creating tables...")
    try:
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully.")
    except Exception as e:
        print(f"Error creating tables: {e}")

if __name__ == "__main__":
    recreate_leave_requests()
