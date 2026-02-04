"""
Anomaly Router - Anomaly detection endpoints (placeholder for MCP).
"""
from fastapi import APIRouter

router = APIRouter(prefix="/anomaly", tags=["Anomaly Detection"])


@router.post("/detect")
async def detect_anomalies(invoice_id: str = ""):
    """
    Detect anomalies in an invoice.
    TODO: Implement anomaly detection model.
    """
    return {
        "ok": True,
        "message": "Anomaly detection endpoint - not yet implemented",
        "invoice_id": invoice_id,
    }


@router.post("/batch")
async def batch_detect_anomalies(org_id: str = ""):
    """
    Batch anomaly detection for all invoices in an organization.
    TODO: Implement batch processing.
    """
    return {
        "ok": True,
        "message": "Batch anomaly detection - not yet implemented",
        "org_id": org_id,
    }
