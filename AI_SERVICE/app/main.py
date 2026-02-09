"""
FinShield AI Service - FastAPI Application

Main entry point for the AI/ML microservice.
Provides:
- OCR processing (/ocr)
- Template processing (/template)
- Pre-validation (/precheck)
"""
from fastapi import FastAPI
from contextlib import asynccontextmanager

# Import routers from api package
from app.api.precheck import router as precheck_router
from app.api.ocr import router as ocr_router
from app.api.template import router as template_router
from app.core.redis_client import get_redis_client, close_redis, is_redis_available

# Import scheduler
from scripts.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # Startup
    start_scheduler()

    # Initialize Redis (non-blocking — service works without it)
    try:
        get_redis_client()
    except Exception as e:
        print(f"⚠️  Redis initialization skipped: {e}")

    yield

    # Shutdown
    stop_scheduler()
    close_redis()


app = FastAPI(
    title="FinShield AI Service",
    description="AI/ML microservice for invoice processing and fraud detection",
    version="2.0.0",
    lifespan=lifespan,
)

# Register all routers
app.include_router(precheck_router)
app.include_router(ocr_router)
app.include_router(template_router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "FinShield AI Service",
        "status": "running",
        "version": "2.0.0",
        "redis": "connected" if is_redis_available() else "unavailable",
    }
