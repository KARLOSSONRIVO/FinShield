import numpy as np
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

def extract_base_amounts(invoice_data: Dict[str, Any]) -> Dict[str, float]:
    """Common amount extraction logic"""
    total = float(invoice_data.get('totalAmount') or invoice_data.get('total', 0) or 0)
    subtotal = float(invoice_data.get('subtotalAmount') or invoice_data.get('subtotal', 0) or 0)
    tax = float(invoice_data.get('taxAmount') or invoice_data.get('tax', 0) or 0)
    
    # If subtotal is 0 but total exists, subtotal is total
    if subtotal == 0 and total > 0:
        subtotal = total
        
    return {
        'total': total,
        'subtotal': subtotal,
        'tax': tax,
        'tax_rate': tax / subtotal if subtotal > 0 else 0.0,
        'subtotal_ratio': subtotal / total if total > 0 else 0.0
    }

def extract_base_date_features(date_str: Optional[str]) -> Dict[str, float]:
    """Common date feature extraction"""
    if not date_str:
        return {
            'day_of_week': 0.0,
            'month': 0.0,
            'is_weekend': 0.0,
            'is_month_end': 0.0,
            'date_missing': 1.0
        }
    
    try:
        # Standardize ISO format
        clean_date_str = str(date_str).replace('Z', '+00:00')
        invoice_date = None
        
        # Try ISO first
        try:
            invoice_date = datetime.fromisoformat(clean_date_str)
        except ValueError:
            # Try other formats if needed
            for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%Y/%m/%d']:
                try:
                    invoice_date = datetime.strptime(clean_date_str.split('T')[0], fmt)
                    break
                except ValueError:
                    continue
        
        if invoice_date:
            return {
                'day_of_week': float(invoice_date.weekday()),
                'month': float(invoice_date.month),
                'is_weekend': 1.0 if invoice_date.weekday() >= 5 else 0.0,
                'is_month_end': 1.0 if invoice_date.day >= 28 else 0.0,
                'date_missing': 0.0,
                'days_old': float((datetime.now() - invoice_date).days)
            }
    except Exception as e:
        logger.warning(f"Date parsing failed for {date_str}: {e}")
        
    return {
        'day_of_week': 0.0,
        'month': 0.0,
        'is_weekend': 0.0,
        'is_month_end':0.0,
        'date_missing': 1.0
    }

def extract_line_item_count(invoice_data: Dict[str, Any]) -> int:
    """Standardize line item counting"""
    line_items = invoice_data.get('lineItems') or invoice_data.get('line_items', [])
    return len(line_items) if line_items else 0
