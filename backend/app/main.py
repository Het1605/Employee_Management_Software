from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.db.database import Base, engine
from app.db import models
from app.models.calendar import WorkingDaysConfig, Holidays, CalendarOverrides # Register Calendar models
from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.company import router as company_router
from app.api.routes.calendar import router as calendar_router
from app.api.routes.salary_component import router as salary_component_router
from app.api.routes.salary_structure import router as salary_structure_router, assign_router as salary_assign_router
from app.api.routes.document import router as document_router
from app.api.routes.attendance import router as attendance_router
from app.api.routes.leave_request import router as leave_request_router

from app.core.config import settings
from app.db.database import SessionLocal
from app.services.document_service import DocumentService
from app.services.dispatch_service import start_dispatch_scheduler
from fastapi.staticfiles import StaticFiles
import os
import time
from sqlalchemy.exc import OperationalError

app = FastAPI(title=settings.PROJECT_NAME)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

def wait_for_db():
    print("Waiting for database connection...")
    retries = 60 # Wait up to 120 seconds
    while retries > 0:
        try:
            # Attempt to connect to the engine
            with engine.connect() as conn:
                print("✅ Database connection successful!")
                return
        except (OperationalError, Exception) as e:
            retries -= 1
            print(f"❌ Database not ready. Retrying in 2 seconds... ({retries} retries left) Error: {str(e)[:100]}...")
            time.sleep(2)
    print("FATAL: Could not connect to database. Exiting.")
    exit(1)

@app.on_event("startup")
def startup_event():
    # Ensure database is ready
    wait_for_db()

    # Drop legacy salary structure tables if they still exist
    with engine.begin() as conn:
        conn.execute(text("DROP TABLE IF EXISTS structure_components CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS salary_structures CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS document_templates CASCADE"))

        # Add soft-delete columns to leave_requests (safe idempotent migration)
        conn.execute(text("ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE"))
        conn.execute(text("ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS deleted_by VARCHAR NULL"))
        conn.execute(text("ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL"))

    #  Create tables in DB
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        DocumentService.seed_document_types(db)
        # Start the automated salary slip dispatch scheduler
        start_dispatch_scheduler()

UPLOADS_DIR = "/app/uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(company_router)
app.include_router(calendar_router)
app.include_router(salary_component_router)
app.include_router(salary_structure_router)
app.include_router(salary_assign_router)
app.include_router(document_router)
app.include_router(attendance_router, prefix="/attendance", tags=["Attendance"])
app.include_router(leave_request_router)

@app.get("/")
def home():
    return {"message": "API running"}
