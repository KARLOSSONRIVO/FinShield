import os
import tempfile
import requests
from bson import ObjectId

from app.core.config import IPFS_GATEWAY_BASE
from app.db.mongo import invoices
from app.shared.ocr.extractor import extract_text
from app.ocr.parser import parse_invoice_fields

def _pick_filename(inv: dict) -> str:
    return inv.get("originalFileName") or "invoice.pdf"

async def run_ocr_for_invoice(invoice_id: str):
    inv = invoices.find_one({"_id": ObjectId(invoice_id)})
    if not inv:
        raise ValueError("INVOICE_NOT_FOUND")

    if inv.get("anchorStatus") != "anchored":
        raise ValueError("INVOICE_NOT_ANCHORED")

    cid = inv.get("ipfsCid")
    if not cid:
        raise ValueError("MISSING_IPFS_CID")

    filename = _pick_filename(inv)

    # Download file bytes from gateway
    url = f"{IPFS_GATEWAY_BASE}/{cid}"
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()

    # Temp file
    fd, tmp_path = tempfile.mkstemp()
    os.close(fd)
    with open(tmp_path, "wb") as f:
        f.write(resp.content)

    try:
        text = extract_text(tmp_path, filename)
        
        # DEBUG: Print extracted text to console
        print("=" * 50)
        print("EXTRACTED TEXT:")
        print(text[:1000] if text else "NO TEXT")
        print("=" * 50)
        
        parsed = parse_invoice_fields(text)
        
        # DEBUG: Print parsed results
        print("PARSED:", parsed)

        update = {
            "invoiceNumber": parsed.get("invoiceNumber"),
            "totalAmount": parsed.get("totalAmount"),
        }
        if parsed.get("invoiceDate"):
            update["invoiceDate"] = parsed["invoiceDate"]

        invoices.update_one({"_id": ObjectId(invoice_id)}, {"$set": update})
        return {
            "invoiceId": invoice_id,
            "invoiceNumber": update.get("invoiceNumber"),
            "invoiceDate": update.get("invoiceDate"),
            "totalAmount": update.get("totalAmount"),
        }
    finally:
        try:
            os.remove(tmp_path)
        except:
            pass
