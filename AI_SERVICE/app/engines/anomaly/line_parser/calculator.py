import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)

def calculate_expected_total(
    line_items: List[Dict],
    tax: Optional[float] = None,
    discount: Optional[float] = None
) -> float:
    try:
        subtotal = sum(item['amount'] for item in line_items)
        
        if tax:
            subtotal += tax
        
        if discount:
            subtotal -= discount
        
        return max(0.0, subtotal)
        
    except Exception as e:
        logger.error(f"Error calculating expected total: {e}")
        return 0.0
