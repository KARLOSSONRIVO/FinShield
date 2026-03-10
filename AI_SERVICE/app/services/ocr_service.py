"""
OCR Service - Unified invoice processing with MCP Pipeline.

This service handles:
1. OCR text extraction from invoices
2. Layout extraction for comparison
3. Run MCP Pipeline (all 3 layers: Layout, Anomaly, Fraud)
4. Field parsing and database updates

The combined result from all 3 layers is stored in:
- aiRiskScore: Combined risk score (0-100, higher = riskier)
- aiVerdict: "clean" or "flagged"
- aiSummary: Human-readable summary of all layer results
"""
import os
import tempfile
import requests
from datetime import datetime
from bson import ObjectId
from typing import Dict, Any, Optional

from app.core.config import IPFS_GATEWAY_BASE, CHAIN_RPC_URL
from app.core.redis_client import cache_get, cache_set, is_redis_available, publish_event
from app.db.mongo import invoices, organizations
from app.engines.tesseract.extractor import extract_text_simple, extract_text_with_layout
from app.utils.parser import parse_invoice_fields
from app.agent import AgentOrchestrator



def _fetch_cid_from_tx(tx_hash: str) -> Optional[str]:
    """
    Fetches the raw IPFS CID string from an Ethereum transaction log
    by calling the Alchemy RPC via HTTP.
    The CID is stored as a non-indexed `string` in the InvoiceAnchored event Data field.
    ABI encoding: [0-64] = offset pointer, [64-128] = string length, [128+] = UTF-8 bytes
    """
    payload = {
        "jsonrpc": "2.0",
        "method": "eth_getTransactionReceipt",
        "params": [tx_hash],
        "id": 1
    }
    resp = requests.post(CHAIN_RPC_URL, json=payload, timeout=30)
    resp.raise_for_status()
    result = resp.json().get("result")
    if not result or not result.get("logs"):
        return None

    log_data = result["logs"][0].get("data", "")
    raw = log_data[2:] if log_data.startswith("0x") else log_data

    # ABI-decode: InvoiceAnchored non-indexed params are (string cid, address uploader, uint256 timestamp)
    # The first 32-byte word is a pointer (offset in bytes) to where the `string` data begins.
    # We must follow the pointer rather than hardcode positions.
    try:
        # Read the offset (in bytes) to the string data from the first word
        ptr_bytes = int(raw[0:64], 16)          # pointer value (e.g. 96 = 0x60)
        ptr_hex   = ptr_bytes * 2               # convert byte offset to hex-string index

        # At the pointer location: first word = string byte length, followed by the UTF-8 bytes
        str_len = int(raw[ptr_hex: ptr_hex + 64], 16)
        str_hex = raw[ptr_hex + 64: ptr_hex + 64 + str_len * 2]
        return bytes.fromhex(str_hex).decode("utf-8")
    except Exception:
        return None


def _pick_filename(inv: dict) -> str:
    """Get filename from invoice record."""
    return inv.get("originalFileName") or "invoice.pdf"


def _get_org_template_layout(org_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch the organization's template layout signature from cache or database.
    
    Cache strategy:
        - First checks Redis for cached template (key: org:template:<org_id>)
        - On miss, fetches from MongoDB and caches for 1 hour
        - Falls back to MongoDB-only if Redis is unavailable

    Returns:
        Layout signature dict or None if not found
    """
    cache_key = f"org:template:{org_id}"

    # Try cache first
    if is_redis_available():
        cached = cache_get(cache_key)
        if cached is not None:
            print(f"[OCR] ✅ Template cache HIT for org: {org_id}")
            return cached
        print(f"[OCR] ⚠️  Template cache MISS for org: {org_id}")

    # Cache miss or Redis unavailable — fetch from MongoDB
    try:
        org = organizations.find_one({"_id": ObjectId(org_id)})
        if not org:
            return None
        
        template = org.get("invoiceTemplate", {})
        layout_sig = template.get("layoutSignature", {})
        
        # Convert MongoDB Map types to regular dicts if needed
        if layout_sig:
            result = {
                "fields": list(layout_sig.get("fields", [])),
                "positions": dict(layout_sig.get("positions", {})),
                "detected_fields": dict(layout_sig.get("detectedFields", {})),
                "element_count": layout_sig.get("elementCount", 0),
                "structural_features": dict(layout_sig.get("structural_features", {})),
            }

            # Cache for 1 hour
            if is_redis_available():
                cache_set(cache_key, result, ttl=3600)
                print(f"[OCR] 📦 Cached template for org: {org_id}")

            return result
        return None
    except Exception as e:
        print(f"[OCR] Error fetching org template: {e}")
        return None


async def run_ocr_for_invoice(invoice_id: str) -> Dict[str, Any]:
    """
    Run OCR on an anchored invoice with MCP Pipeline verification.
    
    Process:
    1. Fetch invoice from database
    2. Download from IPFS
    3. Extract text AND layout using Tesseract
    4. Parse invoice fields (number, date, total)
    5. Run MCP Pipeline (Layer 1: Layout, Layer 2: Anomaly, Layer 3: Fraud)
    6. Combine all layer results into aiRiskScore, aiVerdict, aiSummary
    7. Update invoice record
    
    Returns:
        Dict with extracted fields and MCP verification results
    """
    # Step 1: Fetch invoice
    inv = invoices.find_one({"_id": ObjectId(invoice_id)})
    if not inv:
        raise ValueError("INVOICE_NOT_FOUND")

    if inv.get("anchorStatus") != "anchored":
        raise ValueError("INVOICE_NOT_ANCHORED")

    tx_hash = inv.get("anchorTxHash")
    if not tx_hash:
        raise ValueError("MISSING_ANCHOR_TX_HASH")

    cid = _fetch_cid_from_tx(tx_hash)
    if not cid:
        raise ValueError("MISSING_IPFS_CID")

    org_id = str(inv.get("orgId"))
    filename = _pick_filename(inv)

    # Step 2: Download from IPFS
    url = f"{IPFS_GATEWAY_BASE}/{cid}"
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()

    fd, tmp_path = tempfile.mkstemp()
    os.close(fd)
    with open(tmp_path, "wb") as f:
        f.write(resp.content)

    try:
        # Step 3: Extract text (Simple - for parsing) AND Layout (for AI)
        # Use simple extraction (pdfplumber) for parsing as it preserves layout/newlines better for native PDFs
        simple_extracted = extract_text_simple(tmp_path, filename)
        text = simple_extracted.get("text", "")
        
        # Use layout extraction (Tesseract) for the AI Layout Detection Layer
        # This gives us the bounding boxes and visual structure
        layout_extracted = extract_text_with_layout(tmp_path, filename)
        invoice_layout = layout_extracted.get("layout_signature", {})
        
        # Step 4: Parse invoice fields
        parsed = parse_invoice_fields(text)

        # Step 5: Get org template and run MCP Pipeline
        template_layout = _get_org_template_layout(org_id)
        
        # Build invoice_data in the format expected by anomaly layer
        invoice_data = {
            'invoiceNumber': parsed.get('invoiceNumber'),  # Added for fraud detection
            'issuedTo': parsed.get('issuedTo'),            # Added for customer validation
            'total': parsed.get('totalAmount', 0),
            'totalAmount': parsed.get('totalAmount', 0),   # Both formats for compatibility
            'subtotal': parsed.get('subtotalAmount', 0),
            'tax': parsed.get('taxAmount', 0),
            'date': parsed.get('invoiceDate', ''),
            'invoiceDate': parsed.get('invoiceDate', ''),  # Both formats for compatibility
            'lineItems': parsed.get('lineItems', [])
        }
        
        pipeline = AgentOrchestrator()
        pipeline_result = await pipeline.run({
            "invoice_id": invoice_id,
            "org_id": org_id,
            "organization_id": org_id,  # Anomaly layer expects this
            "extracted_layout": invoice_layout,
            "template_layout": template_layout or {},
            "extracted_text": text,
            "raw_text": text,           # For Anomaly Layer line item parser
            "parsed_fields": parsed,
            "invoice_data": invoice_data,  # Mapped format for Anomaly Layer
        })

        # Step 6: Build update payload
        update = {}

        # Never overwrite manual fields
        if parsed.get("invoiceNumber") and not inv.get("invoiceNumber"):
            update["invoiceNumber"] = parsed["invoiceNumber"]

        if parsed.get("invoiceDate") and not inv.get("invoiceDate"):
            update["invoiceDate"] = parsed["invoiceDate"]

        if parsed.get("totalAmount") and not inv.get("totalAmount"):
            update["totalAmount"] = float(parsed["totalAmount"])
        
        if parsed.get("subtotalAmount") and not inv.get("subtotalAmount"):
            update["subtotalAmount"] = float(parsed["subtotalAmount"])
        
        if parsed.get("taxAmount") and not inv.get("taxAmount"):
            update["taxAmount"] = float(parsed["taxAmount"])
        
        if parsed.get("lineItems") and not inv.get("lineItems"):
            update["lineItems"] = parsed["lineItems"]

        if parsed.get("issuedTo") and not inv.get("issuedTo"):
            update["issuedTo"] = parsed["issuedTo"]

        # Store extracted OCR text for anomaly detection line item parser
        if text:
            update["ocrText"] = text

        # Combined AI results from all 3 layers
        # aiRiskScore: 0-100 (higher = riskier), derived from overall_score (0-1, higher = better)
        update["aiRiskScore"] = round((1 - pipeline_result.overall_score) * 100, 2)
        
        # aiVerdict: "clean" or "flagged" based on combined verdict
        if pipeline_result.overall_verdict == "clean":
            update["aiVerdict"] = "clean"
        else:
            update["aiVerdict"] = "flagged"
        
        # aiSummary: Human-readable summary of all layer results
        update["aiSummary"] = pipeline_result.summary
        
        # riskLevel: "low", "medium", or "high" based on pipeline result
        update["riskLevel"] = pipeline_result.risk_level

        if update:
            invoices.update_one(
                {"_id": ObjectId(invoice_id)},
                {"$set": update}
            )

        # ── Publish AI completion event to Node backend via Redis Pub/Sub ──
        publish_event("channel:invoice", {
            "event": "ai_complete",
            "invoiceId": invoice_id,
            "orgId": org_id,
            "uploadedByUserId": str(inv.get("uploadedByUserId", "")),
            "aiVerdict": update.get("aiVerdict"),
            "aiRiskScore": update.get("aiRiskScore"),
            "riskLevel": update.get("riskLevel"),
        })

        return {
            "invoiceId": invoice_id,
            "orgId": org_id,
            # Extracted fields
            "invoiceNumber": update.get("invoiceNumber"),
            "invoiceDate": str(update.get("invoiceDate")) if update.get("invoiceDate") else None,
            "totalAmount": update.get("totalAmount"),
            "issuedTo": update.get("issuedTo"),
            # Combined AI results
            "aiRiskScore": update.get("aiRiskScore"),
            "aiVerdict": update.get("aiVerdict"),
            "aiSummary": update.get("aiSummary"),
            "riskLevel": update.get("riskLevel"),
            # Detailed layer results (for API response, not stored)
            "layerResults": pipeline_result.layer_results,
            "allFlags": pipeline_result.all_flags,
        }

    finally:
        try:
            os.remove(tmp_path)
        except:
            pass
