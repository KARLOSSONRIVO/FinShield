"""
OCR Router - Endpoints for invoice OCR and layout comparison.
"""
from fastapi import APIRouter, HTTPException
from app.services.ocr_service import run_ocr_for_invoice, extract_invoice_layout

router = APIRouter(prefix="/ocr", tags=["OCR"])


@router.post("/{invoice_id}")
async def ocr_invoice(invoice_id: str):
    """
    Run OCR on an anchored invoice with layout comparison.
    
    This endpoint:
    1. Downloads the invoice from IPFS
    2. Extracts text and layout using Tesseract
    3. Parses invoice fields (number, date, total)
    4. Compares layout against org template (Layer 1)
    5. Updates invoice record with results
    
    Returns extracted fields and layout comparison verdict.
    """
    try:
        data = await run_ocr_for_invoice(invoice_id)
        return {"ok": True, "data": data}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{invoice_id}/layout")
async def get_invoice_layout(invoice_id: str):
    """
    Extract layout from an invoice without running comparison.
    
    Useful for debugging or manual analysis.
    """
    try:
        data = await extract_invoice_layout(invoice_id)
        return {"ok": True, "data": data}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
