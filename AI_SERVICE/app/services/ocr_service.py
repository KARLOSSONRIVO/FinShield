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

from app.core.config import IPFS_GATEWAY_BASE
from app.db.mongo import invoices, organizations
from app.engines.tesseract.extractor import extract_text_simple, extract_text_with_layout
from app.utils.parser import parse_invoice_fields
from app.pipelines.verification.runner import VerificationPipeline



def _pick_filename(inv: dict) -> str:
    """Get filename from invoice record."""
    return inv.get("originalFileName") or "invoice.pdf"


def _get_org_template_layout(org_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch the organization's template layout signature from database.
    
    Returns:
        Layout signature dict or None if not found
    """
    try:
        org = organizations.find_one({"_id": ObjectId(org_id)})
        if not org:
            return None
        
        template = org.get("invoiceTemplate", {})
        layout_sig = template.get("layoutSignature", {})
        
        # Convert MongoDB Map types to regular dicts if needed
        if layout_sig:
            return {
                "fields": list(layout_sig.get("fields", [])),
                "positions": dict(layout_sig.get("positions", {})),
                "detected_fields": dict(layout_sig.get("detectedFields", {})),
                "element_count": layout_sig.get("elementCount", 0),
                "structural_features": dict(layout_sig.get("structural_features", {})),
            }
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

    cid = inv.get("ipfsCid")
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
        
        pipeline = VerificationPipeline()
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


async def extract_invoice_layout(invoice_id: str) -> Dict[str, Any]:
    """
    Extract layout from an invoice without running comparison.
    Useful for debugging or manual analysis.
    
    Args:
        invoice_id: MongoDB invoice ID
        
    Returns:
        Dict with extracted layout signature
    """
    inv = invoices.find_one({"_id": ObjectId(invoice_id)})
    if not inv:
        raise ValueError("INVOICE_NOT_FOUND")

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
        extracted = extract_text_with_layout(tmp_path, filename)
        
        return {
            "invoiceId": invoice_id,
            "layoutSignature": extracted.get("layout_signature", {}),
            "fullText": extracted.get("full_text", ""),
            "totalElements": extracted.get("total_elements", 0),
            "source": extracted.get("source", "unknown"),
        }
    finally:
        try:
            os.remove(tmp_path)
        except:
            pass
