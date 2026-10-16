import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base, check_db_connection, close_db_connection, ensure_schema_migrations
import app.models  # Ensures all models are registered with Base

logger = logging.getLogger("roadguard.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist & verify connection
    Base.metadata.create_all(bind=engine)
    ensure_schema_migrations()
    db_connected, db_msg = check_db_connection()
    if db_connected:
        logger.info(f"Connected to database ({engine.dialect.name}): {db_msg}")
    else:
        logger.warning(f"Database connection issue on startup: {db_msg}")
    yield
    # Shutdown: Cleanly dispose connection pool
    close_db_connection()

# Initialize FastAPI App
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Based Road Damage Detection and Road Authority Management System",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files for Uploads (Photos, Annotations, Repair Proofs)
uploads_dir = Path(settings.UPLOAD_DIR_PATH)
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Include API Routers
from app.api.auth_router import router as auth_router
from app.api.users_router import router as users_router
from app.api.complaints_router import router as complaints_router
from app.api.ai_router import router as ai_router
from app.api.authorities_router import router as authorities_router
from app.api.engineers_router import router as engineers_router
from app.api.repairs_router import router as repairs_router
from app.api.notifications_router import router as notifications_router
from app.api.maps_router import router as maps_router
from app.api.admin_router import router as admin_router

app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(users_router, prefix=settings.API_V1_STR)
app.include_router(complaints_router, prefix=settings.API_V1_STR)
app.include_router(ai_router, prefix=settings.API_V1_STR)
app.include_router(authorities_router, prefix=settings.API_V1_STR)
app.include_router(engineers_router, prefix=settings.API_V1_STR)
app.include_router(repairs_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)
app.include_router(maps_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs_url": "/docs",
        "api_prefix": settings.API_V1_STR
    }

@app.get("/api/health")
def health_check():
    db_ok, db_msg = check_db_connection()
    return {
        "status": "healthy" if db_ok else "degraded",
        "service": "RoadGuard AI Backend",
        "database": {
            "status": "connected" if db_ok else "disconnected",
            "dialect": engine.dialect.name,
            "message": db_msg
        }
    }

@app.get("/api/health/db")
def db_health():
    db_ok, db_msg = check_db_connection()
    return {
        "connected": db_ok,
        "dialect": engine.dialect.name,
        "detail": db_msg
    }
