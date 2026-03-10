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
            return 0.85, None   # Missing subtotal/tax is not suspicious on its own
        
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
        date_str = invoice_data.get('invoiceDate') or invoice_data.get('date')
        if not date_str:
            return 0.8, None   # Missing date is neutral — not inherently suspicious

        invoice_date = datetime.fromisoformat(str(date_str).replace('Z', '+00:00'))
        today = datetime.now()

        # Future date — tiered severity (threshold: >7 days, consistent with fraud layer)
        days_future = (invoice_date - today).days
        if days_future > 90:
            return 0.0, f"Invoice dated {days_future} days in future (critical)"
        elif days_future > 30:
            return 0.2, f"Invoice dated {days_future} days in future (high)"
        elif days_future > 7:
            return 0.5, f"Invoice dated {days_future} days in future (medium)"

        # Old date — only flag beyond 2 years (consistent with fraud layer)
        days_past = (today - invoice_date).days
        if days_past > 730:
            return 0.4, f"Invoice dated {days_past} days ago (over 2 years)"

        return 1.0, None
    except Exception as e:
        logger.error(f"Error checking date: {e}")
        return 0.8, None   # Parse error is not suspicious on its own

def check_amount_sanity(invoice_data: dict) -> Tuple[float, Optional[str]]:
    """Check if amounts are reasonable."""
    try:
        total = float(invoice_data.get('total') or invoice_data.get('totalAmount') or 0)
        if total <= 0:
            return 0.5, None   # Missing total is neutral — may be a parsing issue
        if total >= 1_000_000:
            return 0.0, f"Extremely high amount: ${total:,.2f} (>= $1M)"
        if total >= 500_000:
            return 0.2, f"Unusually high amount: ${total:,.2f} (>= $500k)"
        if total >= 100_000:
            return 0.6, f"High amount: ${total:,.2f} (>= $100k)"
        return 1.0, None
    except Exception as e:
        logger.error(f"Error checking amounts: {e}")
        return 0.5, f"Unable to verify amounts: {str(e)}"

def check_round_numbers(invoice_data: dict) -> Tuple[float, Optional[str]]:
    """Detect suspiciously round amounts."""
    try:
        total = float(invoice_data.get('total') or invoice_data.get('totalAmount') or 0)
        if total <= 0:
            return 1.0, None
        if total % 1_000_000 == 0:
            return 0.0, f"ROUND_NUMBER: Perfectly round ${total:,.2f} (divisible by $1M)"
        if total % 10_000 == 0:
            return 0.0, f"ROUND_NUMBER: Perfectly round ${total:,.2f} (divisible by $10k)"
        if total % 1_000 == 0:
            return 0.05, f"ROUND_NUMBER: Very round ${total:,.2f} (divisible by $1,000)"
        if total % 500 == 0:
            return 0.2, f"ROUND_NUMBER: Round ${total:,.2f} (divisible by $500)"
        if total % 100 == 0:
            return 0.4, f"ROUND_NUMBER: Round ${total:,.2f} (divisible by $100)"
        return 1.0, None
    except Exception as e:
        logger.error(f"Error checking round numbers: {e}")
        return 1.0, None
