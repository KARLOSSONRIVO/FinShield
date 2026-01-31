"""
OCR Service - Business logic for invoice OCR processing.
"""
import os
import tempfile
import requests
from bson import ObjectId

from app.core.config import IPFS_GATEWAY_BASE
from app.db.mongo import invoices
from app.engines.tesseract.extractor import extract_text_simple
from app.utils.parser import parse_invoice_fields


def _pick_filename(inv: dict) -> str:
    return inv.get("originalFileName") or "invoice.pdf"


async def run_ocr_for_invoice(invoice_id: str):
    """
    Run OCR on an anchored invoice and extract structured fields.
    
    1. Fetch invoice from database
    2. Download from IPFS
    3. Extract text using Tesseract
    4. Parse invoice fields (number, date, total)
    5. Update invoice record (without overwriting manual fields)
    """
    inv = invoices.find_one({"_id": ObjectId(invoice_id)})
    if not inv:
        raise ValueError("INVOICE_NOT_FOUND")

    if inv.get("anchorStatus") != "anchored":
        raise ValueError("INVOICE_NOT_ANCHORED")

    cid = inv.get("ipfsCid")
    if not cid:
        raise ValueError("MISSING_IPFS_CID")

    filename = _pick_filename(inv)

    # Download from IPFS
    url = f"{IPFS_GATEWAY_BASE}/{cid}"
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()

    fd, tmp_path = tempfile.mkstemp()
    os.close(fd)
    with open(tmp_path, "wb") as f:
        f.write(resp.content)

    try:
        extracted = extract_text_simple(tmp_path, filename)
        text = extracted["text"]

        parsed = parse_invoice_fields(text)

        update = {}

        # Never overwrite manual fields
        if parsed.get("invoiceNumber") and not inv.get("invoiceNumber"):
            update["invoiceNumber"] = parsed["invoiceNumber"]

        if parsed.get("invoiceDate") and not inv.get("invoiceDate"):
            update["invoiceDate"] = parsed["invoiceDate"]

        if parsed.get("totalAmount") and not inv.get("totalAmount"):
            update["totalAmount"] = parsed["totalAmount"]

        if parsed.get("issuedTo") and not inv.get("issuedTo"):
            update["issuedTo"] = parsed["issuedTo"]

        if update:
            invoices.update_one(
                {"_id": ObjectId(invoice_id)},
                {"$set": update}
            )

        return {
            "invoiceId": invoice_id,
            "invoiceNumber": update.get("invoiceNumber"),
            "invoiceDate": update.get("invoiceDate"),
            "totalAmount": update.get("totalAmount"),
            "issuedTo": update.get("issuedTo"),
        }

    finally:
        try:
            os.remove(tmp_path)
        except:
            pass
