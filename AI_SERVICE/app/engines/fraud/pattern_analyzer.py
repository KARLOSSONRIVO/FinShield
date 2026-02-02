"""
Pattern Analysis for Fraud Detection (20% weight)

Checks for suspicious invoice patterns:
- Round numbers
- Sequential invoice numbers
- Unusual formatting
- Benford's Law violations
"""

import re
import logging
from typing import Tuple, Optional, List

logger = logging.getLogger(__name__)


class PatternAnalyzer:
    """Analyze invoice for suspicious patterns"""
    
    def check(self, invoice_data: dict) -> Tuple[float, Optional[str]]:
        """
        Check for suspicious patterns
        
        Args:
            invoice_data: Parsed invoice data
        
        Returns:
            (score, issue_message)
            score: 1.0 = no suspicious patterns, 0.0 = highly suspicious
        """
        try:
            issues: List[str] = []
            deductions = 0.0
            
            total = float(
                invoice_data.get('total', 0) or 
                invoice_data.get('totalAmount', 0) or 0
            )
            invoice_number = str(
                invoice_data.get('invoiceNumber', '') or 
                invoice_data.get('invoice_number', '') or ''
            )
            
            # Check 1: Suspiciously round amount (40% of pattern weight)
            round_score = self._check_round_amount(total)
            if round_score < 1.0:
                deductions += (1.0 - round_score) * 0.4
                if total > 0 and total % 1000 == 0:
                    issues.append(f"PATTERN_ROUND: Very round amount ${total:,.0f}")
                elif total > 0 and total % 100 == 0:
                    issues.append(f"PATTERN_ROUND: Round amount ${total:,.0f}")
            
            # Check 2: Invoice number patterns (30% of pattern weight)
            number_score = self._check_invoice_number(invoice_number)
            if number_score < 1.0:
                deductions += (1.0 - number_score) * 0.3
                issues.append(f"PATTERN_INVOICE_NUMBER: Suspicious invoice number format '{invoice_number}'")
            
            # Check 3: Benford's Law approximation (20% of pattern weight)
            benford_score = self._check_benford_law(total)
            if benford_score < 1.0:
                deductions += (1.0 - benford_score) * 0.2
                # Don't add flag for Benford - it's subtle
            
            # Check 4: Missing or suspicious fields (10% of pattern weight)
            field_score = self._check_required_fields(invoice_data)
            if field_score < 1.0:
                deductions += (1.0 - field_score) * 0.1
                issues.append("PATTERN_MISSING_FIELDS: Missing or incomplete invoice fields")
            
            final_score = max(0.0, 1.0 - deductions)
            
            if issues:
                return final_score, "; ".join(issues)
            
            return 1.0, None
            
        except Exception as e:
            logger.error(f"Error in pattern analysis: {e}")
            return 0.8, None
    
    def _check_round_amount(self, amount: float) -> float:
        """Check if amount is suspiciously round"""
        if amount <= 0:
            return 1.0
        
        # Very round (multiples of 1000)
        if amount >= 1000 and amount % 1000 == 0:
            return 0.4
        
        # Moderately round (multiples of 100)
        if amount >= 100 and amount % 100 == 0:
            return 0.7
        
        # Slightly round (multiples of 10, no cents)
        if amount % 10 == 0:
            return 0.9
        
        return 1.0
    
    def _check_invoice_number(self, invoice_number: str) -> float:
        """Check invoice number for suspicious patterns"""
        if not invoice_number:
            return 0.5  # Missing invoice number is suspicious
        
        invoice_number = invoice_number.strip()
        
        # Check for all-numeric sequential (like 001, 002, 003)
        if invoice_number.isdigit() and len(invoice_number) <= 3:
            return 0.6  # Very simple numbering
        
        # Check for suspicious patterns
        suspicious_patterns = [
            r'^0+$',          # All zeros
            r'^1+$',          # All ones
            r'^test',         # Test invoice
            r'^sample',       # Sample invoice
            r'^xxx',          # Placeholder
            r'^fake',         # Fake
            r'^demo',         # Demo
            r'^temp',         # Temporary
        ]
        
        for pattern in suspicious_patterns:
            if re.match(pattern, invoice_number.lower()):
                return 0.2
        
        # Check for repeating patterns (111, aaa, etc.)
        if len(set(invoice_number.lower())) == 1 and len(invoice_number) >= 3:
            return 0.3
        
        return 1.0
    
    def _check_benford_law(self, amount: float) -> float:
        """
        Simple Benford's Law check
        First digit should follow Benford distribution
        Higher digits (7,8,9) are less common
        """
        if amount <= 0:
            return 1.0
        
        try:
            # Get first significant digit
            amount_str = str(amount).replace('.', '').replace(',', '').lstrip('0')
            if not amount_str:
                return 1.0
            
            first_digit = int(amount_str[0])
            
            if first_digit == 0:
                return 1.0
            
            # Higher digits (7,8,9) are less common in natural data
            # If first digit is 7-9, slightly flag it
            if first_digit >= 7:
                return 0.8  # Slightly unusual but not definitive
            
            return 1.0
            
        except:
            return 1.0
    
    def _check_required_fields(self, invoice_data: dict) -> float:
        """Check for missing required fields"""
        required_fields = ['invoiceNumber', 'vendor', 'total', 'invoiceDate']
        alt_fields = {
            'vendor': ['issuedTo', 'vendorName'],
            'total': ['totalAmount'],
            'invoiceDate': ['date'],
            'invoiceNumber': ['invoice_number']
        }
        
        missing = 0
        
        for field in required_fields:
            value = invoice_data.get(field)
            
            # Check alternatives
            if not value and field in alt_fields:
                for alt in alt_fields[field]:
                    if invoice_data.get(alt):
                        value = invoice_data.get(alt)
                        break
            
            if not value:
                missing += 1
        
        if missing >= 3:
            return 0.3
        elif missing >= 2:
            return 0.6
        elif missing >= 1:
            return 0.8
        
        return 1.0
