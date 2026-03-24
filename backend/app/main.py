from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import Base, engine
from app.db import models
from app.api.routes import auth
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

# 🔥 This line creates tables in DB
Base.metadata.create_all(bind=engine)

app.include_router(auth.router, prefix="/auth")

@app.get("/")
def home():
    return {"message": "API running"}