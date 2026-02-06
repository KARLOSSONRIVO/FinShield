"""
Rule-based validation logic for Anomaly Detection Layer.
"""
import logging
from datetime import datetime
from typing import Dict, Any, Tuple, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

def check_line_item_totals(
    invoice_data: dict,
    raw_text: str,
    line_item_parser: Any
) -> Tuple[float, Optional[str]]:
    """
    Verify line items add up to total.
    """
    try:
        total = float(invoice_data.get('total') or 0)
        subtotal = float(invoice_data.get('subtotal') or 0)
        tax = float(invoice_data.get('tax') or 0)
        
        if total == 0:
            return 0.5, "Total amount is zero"
        
        # If subtotal/tax not provided, try to parse from text
        if (subtotal == 0 or tax == 0) and raw_text:
            parsed_totals = line_item_parser.extract_totals(raw_text)
            if subtotal == 0 and parsed_totals.get('subtotal'):
                subtotal = parsed_totals['subtotal']
            if tax == 0 and parsed_totals.get('tax'):
                tax = parsed_totals['tax']
        
        expected_total = subtotal + tax
        
        if expected_total == 0:
            return 0.7, "Unable to verify line item totals (missing subtotal/tax)"
        
        discrepancy = abs(expected_total - total)
        discrepancy_pct = (discrepancy / total) * 100 if total > 0 else 0
        tolerance_pct = settings.ANOMALY_MATH_TOLERANCE * 100
        
        if discrepancy_pct <= tolerance_pct:
            return 1.0, None
        elif discrepancy_pct <= 5.0:
            return 0.6, f"Math discrepancy: {discrepancy_pct:.1f}% (medium severity)"
        elif discrepancy_pct <= 10.0:
            return 0.3, f"Math discrepancy: {discrepancy_pct:.1f}% (high severity)"
        else:
            return 0.0, f"Math discrepancy: {discrepancy_pct:.1f}% (critical severity)"
            
    except Exception as e:
        logger.error(f"Error checking line items: {e}")
        return 0.5, f"Error verifying line item totals: {str(e)}"

def check_date_validity(invoice_data: dict) -> Tuple[float, Optional[str]]:
    """Check if invoice date is logical."""
    try:
        date_str = invoice_data.get('date')
        if not date_str:
            return 0.7, "No date provided"
        
        invoice_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        today = datetime.now()
        
        days_future = (invoice_date - today).days
        if days_future > 30:
            return 0.0, f"Invoice dated {days_future} days in future"
        
        days_past = (today - invoice_date).days
        if days_past > 365:
            return 0.5, f"Invoice dated {days_past} days ago (over 1 year)"
        
        return 1.0, None
    except Exception as e:
        logger.error(f"Error checking date: {e}")
        return 0.7, f"Invalid date format: {str(e)}"

def check_amount_sanity(invoice_data: dict) -> Tuple[float, Optional[str]]:
    """Check if amounts are reasonable."""
    try:
        total = float(invoice_data.get('total', 0))
        if total <= 0:
            return 0.0, f"Invalid total amount: ${total}"
        if total > 1000000:
            return 0.3, f"Unusually high amount: ${total:,.2f}"
        return 1.0, None
    except Exception as e:
        logger.error(f"Error checking amounts: {e}")
        return 0.5, f"Unable to verify amounts: {str(e)}"

def check_round_numbers(invoice_data: dict) -> Tuple[float, Optional[str]]:
    """Detect suspiciously round amounts."""
    try:
        total = float(invoice_data.get('total', 0))
        if total <= 0:
            return 1.0, None
        if total % 1000 == 0:
            return 0.5, f"Suspiciously round amount: ${total:,.2f}"
        if total % 100 == 0:
            return 0.7, f"Round amount detected: ${total:,.2f}"
        return 1.0, None
    except Exception as e:
        logger.error(f"Error checking round numbers: {e}")
        return 1.0, None
