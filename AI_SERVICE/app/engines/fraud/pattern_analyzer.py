import logging
from typing import Tuple, Optional, List
from .analyzer.validators import (
    check_round_amount,
    check_invoice_number,
    check_benford_law,
    check_required_fields
)

logger = logging.getLogger(__name__)

class PatternAnalyzer:
    def check(self, invoice_data: dict) -> Tuple[float, Optional[str]]:
        try:
            issues: List[str] = []
            deductions = 0.0
            
            total = float(invoice_data.get('total', 0) or invoice_data.get('totalAmount', 0) or 0)
            raw_invoice_number = invoice_data.get('invoiceNumber') or invoice_data.get('invoice_number')
            invoice_number = str(raw_invoice_number) if raw_invoice_number else ''
            
            round_score = check_round_amount(total)
            if round_score < 1.0:
                deductions += (1.0 - round_score) * 0.7   # raised from 0.6
                if total > 0 and total % 10 == 0:
                    if total % 1_000_000 == 0 or total % 10_000 == 0:
                        label = 'Critically round'
                    elif total % 1_000 == 0:
                        label = 'Very round'
                    elif total % 100 == 0:
                        label = 'Round'
                    else:
                        label = 'Slightly round'
                    issues.append(f"PATTERN_ROUND: {label} amount ${total:,.2f}")
            
            number_score = check_invoice_number(invoice_number)
            if number_score < 1.0:
                deductions += (1.0 - number_score) * 0.3
                issues.append(f"PATTERN_INVOICE_NUMBER: Suspicious invoice number format '{invoice_number}'")
            
            benford_score = check_benford_law(total)
            if benford_score < 1.0:
                deductions += (1.0 - benford_score) * 0.2
            
            field_score = check_required_fields(invoice_data)
            if field_score < 1.0:
                deductions += (1.0 - field_score) * 0.1
                issues.append("PATTERN_MISSING_FIELDS: Missing or incomplete invoice fields")
            
            final_score = max(0.0, 1.0 - deductions)
            return (final_score, "; ".join(issues)) if issues else (1.0, None)
            
        except Exception as e:
            logger.error(f"Error in pattern analysis: {e}")
            return 0.8, None
