"""
Template Router - Endpoint for invoice template processing.
"""
import traceback
from fastapi import APIRouter, UploadFile, File, HTTPException

from app.core.redis_client import cache_invalidate_pattern
from app.services.template_service import process_template

router = APIRouter(prefix="/template", tags=["Template"])


@router.post("/process")
async def process_template_endpoint(file: UploadFile = File(...)):
    """
    Process an invoice template file and extract text using Tesseract OCR.
    
    Accepts PDF or DOCX files.
    Returns extracted text and layout signature for template comparison.
    
    The BACKEND handles template storage and organization association.
    """
    try:
        result = await process_template(file)
        
        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Template processing failed")
            )
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Template processing error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@router.post("/invalidate/{org_id}")
async def invalidate_template_cache(org_id: str):
    """
    Invalidate the cached template layout for an organization.

    Call this endpoint from BACKEND whenever an organization updates
    their invoice template so the next OCR run fetches the fresh version.
    """
    deleted = cache_invalidate_pattern(f"org:template:{org_id}")
    return {
        "success": True,
        "deleted": deleted,
        "message": f"Cache invalidated for org: {org_id}",
    }
