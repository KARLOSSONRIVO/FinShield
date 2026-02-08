"""
OCR Router - Endpoints for invoice OCR processing.
"""
from fastapi import APIRouter, HTTPException
from app.services.ocr_service import run_ocr_for_invoice

router = APIRouter(prefix="/ocr", tags=["OCR"])


@router.post("/{invoice_id}")
async def ocr_invoice(invoice_id: str):
    """
    Run OCR on an anchored invoice with MCP verification pipeline.
    
    This endpoint:
    1. Downloads the invoice from IPFS
    2. Extracts text and layout using Tesseract
    3. Parses invoice fields (number, date, total)
    4. Runs MCP verification pipeline (Layout, Anomaly, Fraud detection)
    5. Updates invoice record with results
    
    Returns extracted fields and verification results.
    """
    try:
        data = await run_ocr_for_invoice(invoice_id)
        return {"ok": True, "data": data}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
