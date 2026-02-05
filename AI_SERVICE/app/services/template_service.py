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
