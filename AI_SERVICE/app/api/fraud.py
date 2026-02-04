"""
Fraud Router - Fraud detection endpoints (placeholder for MCP).
"""
from fastapi import APIRouter

router = APIRouter(prefix="/fraud", tags=["Fraud Detection"])


@router.post("/analyze")
async def analyze_fraud_risk(invoice_id: str = ""):
    """
    Analyze fraud risk for an invoice.
    TODO: Implement fraud classification model.
    """
    return {
        "ok": True,
        "message": "Fraud analysis endpoint - not yet implemented",
        "invoice_id": invoice_id,
        "risk_score": None,
    }


@router.post("/compare")
async def compare_template(invoice_id: str = "", org_id: str = ""):
    """
    Compare invoice against organization template.
    TODO: Implement layout comparison logic.
    """
    return {
        "ok": True,
        "message": "Template comparison - not yet implemented",
        "invoice_id": invoice_id,
        "org_id": org_id,
    }
