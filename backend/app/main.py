from fastapi import FastAPI, APIRouter, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import logging
import os
import time
from sqlalchemy.exc import OperationalError

from app.schemas.base_response import ResponseSchema
from app.db.database import Base, engine, SessionLocal
import app.models  # Register all models for SQLAlchemy
from app.core.config import settings

# Router Imports
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

# Service Imports
from app.services.document_service import DocumentService
from app.services.dispatch_service import start_dispatch_scheduler
from app.services.seed_service import seed_admin_user

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

# --- GLOBAL EXCEPTION HANDLERS ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"CRITICAL: Unhandled Exception at {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "An unexpected internal error occurred. Our team has been notified.",
            "data": None
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "status": "error",
            "message": "Validation failed for the provided data.",
            "data": exc.errors()
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "message": exc.detail,
            "data": None
        }
    )

# --- MIDDLEWARE ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

def wait_for_db():
    retries = 60
    while retries > 0:
        try:
            with engine.connect() as conn:
                return
        except (OperationalError, Exception):
            retries -= 1
            time.sleep(2)
    print("FATAL: Could not connect to database. Exiting.")
    exit(1)

@app.on_event("startup")
def startup_event():
    wait_for_db()
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed_admin_user(db)
        DocumentService.seed_document_types(db)
        start_dispatch_scheduler()

UPLOADS_DIR = "/app/uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# --- ROUTING ---
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

app.include_router(api_router)

@app.get("/api", response_model=ResponseSchema[dict])
def home():
    return ResponseSchema(status="success", message="API running")
