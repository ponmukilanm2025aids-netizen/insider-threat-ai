from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime

from backend.app.core.config import settings
from backend.app.core.database import Base, engine
from backend.app.scripts.seed_data import seed_database

# Routers
from backend.app.api.auth import router as auth_router
from backend.app.api.patients import router as patients_router
from backend.app.api.doctors_therapists import router as doc_therapist_router
from backend.app.api.therapies_rooms import router as therapy_room_router
from backend.app.api.appointments import router as appointments_router
from backend.app.api.scheduling_ai import router as scheduling_ai_router
from backend.app.api.clinical import router as clinical_router
from backend.app.api.billing import router as billing_router
from backend.app.api.inventory import router as inventory_router
from backend.app.api.reports import router as reports_router
from backend.app.api.notifications import router as notifications_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables and demonstration seed data exist
    Base.metadata.create_all(bind=engine)
    try:
        seed_database()
    except Exception as e:
        print(f"Seed note: {e}")
    yield
    # Shutdown

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Integrated Digital Platform for Ayurvedic Hospitals & Panchakarma Treatment Centers (Ministry of AYUSH SIH25023)",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow development frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Endpoints under /api/v1
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(patients_router, prefix=settings.API_V1_STR)
app.include_router(doc_therapist_router, prefix=settings.API_V1_STR)
app.include_router(therapy_room_router, prefix=settings.API_V1_STR)
app.include_router(appointments_router, prefix=settings.API_V1_STR)
app.include_router(scheduling_ai_router, prefix=settings.API_V1_STR)
app.include_router(clinical_router, prefix=settings.API_V1_STR)
app.include_router(billing_router, prefix=settings.API_V1_STR)
app.include_router(inventory_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(notifications_router, prefix=settings.API_V1_STR)

@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "system": "AyurSutra Clinical & Scheduling Platform",
        "timestamp": datetime.utcnow().isoformat(),
        "database": settings.DATABASE_URL.split("://")[0]
    }

@app.get("/", tags=["System"])
def root():
    return {
        "name": "AyurSutra API",
        "version": "1.0.0",
        "docs": "/docs",
        "ayush_problem_code": "SIH25023"
    }
