from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
import app.models as models # Register models with Base

# Import Routers
from app.auth.routes import router as auth_router
from app.questions.routes import router as questions_router
from app.candidates.routes import router as candidates_router
from app.ingestion.routes import router as ingestion_router
from app.results.routes import router as results_router
from app.exams.lifecycle import router as lifecycle_router
from app.packages.center_package import router as package_router
from app.verification.routes import router as verification_router
from app.incidents.routes import router as incidents_router
from app.ops.routes import router as ops_router
from app.audit.timeline import router as timeline_router

# Initialize SQLite tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ExamForge API",
    description="Zero-Trust Examination Security Infrastructure API",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router, prefix="/api")
app.include_router(questions_router)
app.include_router(candidates_router)
app.include_router(ingestion_router)
app.include_router(results_router)
app.include_router(lifecycle_router)
app.include_router(package_router)
app.include_router(verification_router)
app.include_router(incidents_router)
app.include_router(ops_router)
app.include_router(timeline_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "ExamForge API Core",
        "database_connected": True
    }

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the ExamForge Zero-Trust Examination Infrastructure API",
        "docs_url": "/docs"
    }
