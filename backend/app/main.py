from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.db.database import Base, engine
from app.db import models
from app.models import calendar  # Register Calendar models to Base
from app.api.routes import auth, users, company, calendar, salary_component, salary_structure, document, attendance, leave_request
from app.core.config import settings
from app.db.database import SessionLocal
from app.services.document_service import DocumentService
from app.services.dispatch_service import start_dispatch_scheduler
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title=settings.PROJECT_NAME)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Drop legacy salary structure tables if they still exist
with engine.begin() as conn:
    conn.execute(text("DROP TABLE IF EXISTS structure_components CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS salary_structures CASCADE"))
    conn.execute(text("DROP TABLE IF EXISTS document_templates CASCADE"))

# 🔥 Create tables in DB
Base.metadata.create_all(bind=engine)

with SessionLocal() as db:
    DocumentService.seed_document_types(db)
    # Start the automated salary slip dispatch scheduler
    start_dispatch_scheduler()

uploads_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'uploads'))
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(company.router)
app.include_router(calendar.router)
app.include_router(salary_component.router)
app.include_router(salary_structure.router)
app.include_router(salary_structure.assign_router)
app.include_router(document.router)
app.include_router(attendance.router, prefix="/attendance", tags=["Attendance"])
app.include_router(leave_request.router)

@app.get("/")
def home():
    return {"message": "API running"}
