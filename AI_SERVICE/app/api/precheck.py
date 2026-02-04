"""
Precheck Router - Endpoint for pre-validation of invoice files.
"""
from fastapi import APIRouter, UploadFile, File
from app.services.precheck_service import run_precheck
from app.schemas.precheck import PreCheckResponse

router = APIRouter(prefix="/precheck", tags=["Precheck"])


@router.post("/", response_model=PreCheckResponse)
async def precheck(file: UploadFile = File(...)):
    """Pre-validate an uploaded invoice file before processing."""
    return await run_precheck(file)
