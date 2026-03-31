from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.db.database import Base, engine
from app.db import models
from app.models import calendar  # Register Calendar models to Base
from app.api.routes import auth, users, company, calendar, salary_component, salary_structure
from app.core.config import settings

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

# 🔥 Create tables in DB
Base.metadata.create_all(bind=engine)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(company.router)
app.include_router(calendar.router)
app.include_router(salary_component.router)
app.include_router(salary_structure.router)
app.include_router(salary_structure.assign_router)

@app.get("/")
def home():
    return {"message": "API running"}
