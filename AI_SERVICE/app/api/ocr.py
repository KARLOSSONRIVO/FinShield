"""
OCR Router - Endpoint for running OCR on invoices.
"""
from fastapi import APIRouter, HTTPException
from app.services.ocr_service import run_ocr_for_invoice

router = APIRouter(prefix="/ocr", tags=["OCR"])


@router.post("/{invoice_id}")
async def ocr_invoice(invoice_id: str):
    """Run OCR on an anchored invoice and extract fields."""
    try:
        data = await run_ocr_for_invoice(invoice_id)
        return {"ok": True, "data": data}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
