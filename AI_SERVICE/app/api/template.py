"""
Template Router - Endpoints for organization invoice template management.
"""
import traceback
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Optional
from pydantic import BaseModel

from app.services.template_service import (
    process_template,
    store_template_for_org,
    get_org_template_layout,
    compare_invoice_to_template,
)

router = APIRouter(prefix="/template", tags=["Template"])


class StoreTemplateRequest(BaseModel):
    """Request body for storing a template."""
    org_id: str
    s3_key: Optional[str] = None


@router.post("/process")
async def process_template_endpoint(file: UploadFile = File(...)):
    """
    Process an invoice template file and extract text using Tesseract OCR.
    
    Accepts PDF or DOCX files.
    Returns extracted text and layout signature for template comparison.
    
    Note: This only processes the template, it does NOT store it.
    Use POST /template/store/{org_id} to store the processed template.
    """
    try:
        result = await process_template(file)
        
        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Template processing failed")
            )
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Template processing error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


@router.post("/store/{org_id}")
async def store_template_endpoint(
    org_id: str,
    file: UploadFile = File(...),
    s3_key: Optional[str] = None
):
    """
    Process and store an invoice template for an organization.
    
    This:
    1. Processes the template file to extract layout signature
    2. Stores the layout in the organization's record
    
    The stored layout will be used by Layer 1 (Layout Detection)
    when processing invoices from this organization.
    """
    try:
        # Process the template
        template_data = await process_template(file)
        
        if not template_data.get("success"):
            raise HTTPException(
                status_code=400,
                detail=template_data.get("error", "Template processing failed")
            )
        
        # Store in organization
        result = await store_template_for_org(
            org_id=org_id,
            template_data=template_data,
            s3_key=s3_key,
            file_name=file.filename,
        )
        
        return {"ok": True, "data": result}
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Template storage error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Storage error: {str(e)}")


@router.get("/{org_id}")
async def get_template_layout_endpoint(org_id: str):
    """
    Get the stored template layout for an organization.
    
    Returns the layout signature that will be used for
    invoice comparison (Layer 1).
    """
    try:
        layout = await get_org_template_layout(org_id)
        
        if not layout:
            raise HTTPException(
                status_code=404,
                detail="No template found for this organization"
            )
        
        return {"ok": True, "data": layout}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/compare/{org_id}")
async def compare_layout_endpoint(
    org_id: str,
    file: UploadFile = File(...)
):
    """
    Compare an invoice file's layout against the organization's template.
    
    This is a standalone comparison endpoint that:
    1. Processes the uploaded invoice file
    2. Compares its layout against the stored template
    3. Returns the Layer 1 comparison result
    
    Useful for testing template matching without full OCR flow.
    """
    try:
        # Process the invoice file to get its layout
        invoice_data = await process_template(file)
        
        if not invoice_data.get("success"):
            raise HTTPException(
                status_code=400,
                detail=invoice_data.get("error", "Invoice processing failed")
            )
        
        invoice_layout = invoice_data.get("layout_signature", {})
        
        # Compare against org template
        result = await compare_invoice_to_template(invoice_layout, org_id)
        
        return {
            "ok": True,
            "data": {
                "comparison": result,
                "invoice_fields": invoice_layout.get("fields", []),
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Layout comparison error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Comparison error: {str(e)}")
