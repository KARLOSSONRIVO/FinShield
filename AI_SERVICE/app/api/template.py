"""
Template Router - Endpoint for processing organization invoice templates.
"""
import traceback
from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.template_service import process_template

router = APIRouter(prefix="/template", tags=["Template"])


@router.post("/process")
async def process_template_endpoint(file: UploadFile = File(...)):
    """
    Process an invoice template file and extract text using Tesseract OCR.
    
    Accepts PDF or DOCX files.
    Returns extracted text and layout signature for template comparison.
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
