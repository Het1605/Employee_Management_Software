from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import Base, engine
import app.models  # Register all models for SQLAlchemy
from app.api.routes.auth import router as auth_router
from app.api.routes.users import router as users_router
from app.api.routes.company import router as company_router
from app.api.routes.calendar import router as calendar_router
from app.api.routes.salary_component import router as salary_component_router
from app.api.routes.salary_structure import router as salary_structure_router, assign_router as salary_assign_router
from app.api.routes.document import router as document_router
from app.api.routes.attendance import router as attendance_router
from app.api.routes.leave_request import router as leave_request_router
from app.api.routes.leave_structure import router as leave_structure_router
from app.api.routes.location import router as location_router

from app.core.config import settings
from app.db.database import SessionLocal
from app.services.document_service import DocumentService
from app.services.dispatch_service import start_dispatch_scheduler
from app.services.seed_service import seed_admin_user
from fastapi.staticfiles import StaticFiles
import os
import time
from sqlalchemy.exc import OperationalError

app = FastAPI(
    title=settings.PROJECT_NAME,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

def wait_for_db():
    retries = 60 # Wait up to 120 seconds
    while retries > 0:
        try:
            # Attempt to connect to the engine
            with engine.connect() as conn:
                return
        except (OperationalError, Exception) as e:
            retries -= 1
            time.sleep(2)
    print("FATAL: Could not connect to database. Exiting.")
    exit(1)


@app.on_event("startup")
def startup_event():
    # Ensure database is ready
    wait_for_db()

    # Create tables in DB
    Base.metadata.create_all(bind=engine)
    

    with SessionLocal() as db:
        seed_admin_user(db)
        DocumentService.seed_document_types(db)
        # Start the automated salary slip dispatch scheduler
        start_dispatch_scheduler()

UPLOADS_DIR = "/app/uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Centralized API Router with /api prefix
api_router = APIRouter(prefix="/api")

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(company_router)
api_router.include_router(calendar_router)
api_router.include_router(salary_component_router)
api_router.include_router(salary_structure_router)
api_router.include_router(salary_assign_router)
api_router.include_router(document_router)
api_router.include_router(attendance_router, prefix="/attendance", tags=["Attendance"])
api_router.include_router(leave_request_router)
api_router.include_router(leave_structure_router)
api_router.include_router(location_router)

# Include the centralized API router into the main app
app.include_router(api_router)

@app.get("/api")
def home():
    return {"message": "API running"}
