from fastapi import APIRouter, UploadFile, File
from .service import run_precheck
from .schemas import PreCheckResponse

router = APIRouter(prefix="/precheck", tags=["Precheck"])

@router.post("/", response_model=PreCheckResponse)
async def precheck(file: UploadFile = File(...)):
    return await run_precheck(file)
