"""
FinShield AI Service - FastAPI Application

Main entry point for the AI/ML microservice.
Provides:
- OCR processing (/ocr)
- Template processing (/template)
- Pre-validation (/precheck)
- Semantic search (/search) [placeholder]
- Anomaly detection (/anomaly) [placeholder]
- Fraud detection (/fraud) [placeholder]
"""
from fastapi import FastAPI

# Import routers from api package
from app.api.precheck import router as precheck_router
from app.api.ocr import router as ocr_router
from app.api.template import router as template_router
from app.api.search import router as search_router
from app.api.anomaly import router as anomaly_router
from app.api.fraud import router as fraud_router

app = FastAPI(
    title="FinShield AI Service",
    description="AI/ML microservice for invoice processing, fraud detection, and semantic search",
    version="2.0.0",
)

# Register all routers
app.include_router(precheck_router)
app.include_router(ocr_router)
app.include_router(template_router)
app.include_router(search_router)
app.include_router(anomaly_router)
app.include_router(fraud_router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "FinShield AI Service",
        "status": "running",
        "version": "2.0.0",
    }
