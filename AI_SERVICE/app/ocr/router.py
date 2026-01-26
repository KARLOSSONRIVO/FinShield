from fastapi import APIRouter, HTTPException
from app.ocr.service import run_ocr_for_invoice

router = APIRouter(prefix="/ocr", tags=["OCR"])

@router.post("/{invoice_id}")
async def ocr_invoice(invoice_id: str):
    try:
        data = await run_ocr_for_invoice(invoice_id)
        return {"ok": True, "data": data}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
