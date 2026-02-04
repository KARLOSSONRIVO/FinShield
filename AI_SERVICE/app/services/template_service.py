"""
Template Service - Organization invoice template processing.

This service handles:
1. Template file processing (PDF/DOCX)
2. Layout extraction for template storage
3. Layout signature generation for comparison

The extracted template layout is stored in the organization record
and used by Layer 1 (Layout Detection) during invoice OCR processing.
"""
import os
import tempfile
from fastapi import UploadFile
from typing import Dict, Any, Optional
from bson import ObjectId

from app.db.mongo import organizations
from app.engines.tesseract.extractor import extract_text_with_layout

SUPPORTED_EXTENSIONS = (".pdf", ".docx")


async def process_template(file: UploadFile) -> dict:
    """
    Process an uploaded template file and extract text + layout.
    
    This extracts the layout signature that will be used for
    comparing invoices against this template.
    
    Returns:
        dict with:
        - success: bool
        - full_text: concatenated text
        - pages: list of page data with elements and bounding boxes
        - layout_signature: detected fields and their positions
        - source: extraction engine used
    """
    filename = file.filename.lower()
    
    # Validate file type
    if not filename.endswith(SUPPORTED_EXTENSIONS):
        raise ValueError(
            f"Unsupported file type. Only PDF and DOCX are allowed. Got: {file.filename}"
        )
    
    # Save to temp file for processing
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(filename)[1]) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        # Extract text and layout using Tesseract OCR
        result = extract_text_with_layout(tmp_path, file.filename)
        
        return {
            "success": True,
            "fileName": file.filename,
            "fileSize": len(content),
            "source": result.get("source", "tesseract"),
            # Text data
            "full_text": result.get("full_text", ""),
            "total_elements": result.get("total_elements", 0),
            # Layout data for template comparison
            "pages": result.get("pages", []),
            "layout_signature": result.get("layout_signature", {}),
            # DOCX-specific
            "elements": result.get("elements"),
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "fileName": file.filename,
        }
    finally:
        # Clean up temp file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


async def store_template_for_org(
    org_id: str,
    template_data: Dict[str, Any],
    s3_key: Optional[str] = None,
    file_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Store processed template data in the organization record.
    
    Args:
        org_id: Organization MongoDB ID
        template_data: Result from process_template()
        s3_key: Optional S3 key where template file is stored
        file_name: Original file name
        
    Returns:
        Updated organization template data
    """
    if not template_data.get("success"):
        raise ValueError(template_data.get("error", "Template processing failed"))
    
    layout_sig = template_data.get("layout_signature", {})
    
    update = {
        "invoiceTemplate": {
            "s3Key": s3_key,
            "fileName": file_name or template_data.get("fileName"),
            "uploadedAt": __import__("datetime").datetime.utcnow(),
            "extractedText": template_data.get("full_text", ""),
            "layoutSignature": {
                "fields": layout_sig.get("fields", []),
                "positions": layout_sig.get("positions", {}),
                "detectedFields": layout_sig.get("detected_fields", {}),
                "elementCount": layout_sig.get("element_count", 0),
            },
            "totalElements": template_data.get("total_elements", 0),
            "source": template_data.get("source"),
        },
        "updatedAt": __import__("datetime").datetime.utcnow(),
    }
    
    result = organizations.update_one(
        {"_id": ObjectId(org_id)},
        {"$set": update}
    )
    
    if result.modified_count == 0:
        raise ValueError("Failed to update organization template")
    
    return {
        "orgId": org_id,
        "templateStored": True,
        "layoutSignature": layout_sig,
        "totalElements": template_data.get("total_elements", 0),
    }


async def get_org_template_layout(org_id: str) -> Optional[Dict[str, Any]]:
    """
    Retrieve the organization's stored template layout.
    
    Args:
        org_id: Organization MongoDB ID
        
    Returns:
        Layout signature dict or None if not found
    """
    try:
        org = organizations.find_one({"_id": ObjectId(org_id)})
        if not org:
            return None
        
        template = org.get("invoiceTemplate", {})
        layout_sig = template.get("layoutSignature", {})
        
        if layout_sig:
            return {
                "fields": list(layout_sig.get("fields", [])),
                "positions": dict(layout_sig.get("positions", {})),
                "detected_fields": dict(layout_sig.get("detectedFields", {})),
                "element_count": layout_sig.get("elementCount", 0),
                "source": template.get("source"),
                "fileName": template.get("fileName"),
                "uploadedAt": template.get("uploadedAt"),
            }
        return None
    except Exception as e:
        print(f"[Template] Error fetching org template: {e}")
        return None


async def compare_invoice_to_template(
    invoice_layout: Dict[str, Any],
    org_id: str
) -> Dict[str, Any]:
    """
    Compare an invoice's layout against the organization's template.
    
    This is a convenience function that fetches the template and
    runs the comparison.
    
    Args:
        invoice_layout: Layout signature from extracted invoice
        org_id: Organization MongoDB ID
        
    Returns:
        Comparison result from Layout Detection Layer
    """
    from app.pipelines.verification.stages.layout import LayoutDetectionLayer
    
    template_layout = await get_org_template_layout(org_id)
    
    layer = LayoutDetectionLayer()
    context = {
        "extracted_layout": invoice_layout,
        "template_layout": template_layout or {},
        "org_id": org_id,
    }
    
    result = await layer.analyze(context)
    return result.to_dict()
