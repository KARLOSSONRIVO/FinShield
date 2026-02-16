import re
from typing import Dict

def check_round_amount(amount: float) -> float:
    if amount <= 0:
        return 1.0
    if amount >= 1000 and amount % 1000 == 0:
        return 0.4
    if amount >= 100 and amount % 100 == 0:
        return 0.7
    if amount % 10 == 0:
        return 0.9
    return 1.0

def check_invoice_number(invoice_number: str) -> float:
    """
    Validates invoice number format. Prefers numeric-only invoice numbers.
    Returns a score between 0.0 (highly suspicious) and 1.0 (valid).
    """
    if not invoice_number:
        return 0.5
    invoice_number = invoice_number.strip()
    
    # Short numeric-only invoice numbers are suspicious (e.g., "123")
    if invoice_number.isdigit() and len(invoice_number) <= 3:
        return 0.6
    
    suspicious_patterns = [
        r'^0+$', r'^1+$', r'^test', r'^sample', r'^xxx', r'^fake', r'^demo', r'^temp'
    ]
    for pattern in suspicious_patterns:
        if re.match(pattern, invoice_number.lower()):
            return 0.2
    
    if len(set(invoice_number.lower())) == 1 and len(invoice_number) >= 3:
        return 0.3
    
    return 1.0

def check_benford_law(amount: float) -> float:
    if amount <= 0:
        return 1.0
    try:
        amount_str = str(amount).replace('.', '').replace(',', '').lstrip('0')
        if not amount_str:
            return 1.0
        first_digit = int(amount_str[0])
        if first_digit == 0:
            return 1.0
        if first_digit >= 7:
            return 0.8
        return 1.0
    except:
        return 1.0

def check_required_fields(invoice_data: Dict) -> float:
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
        if not value and field in alt_fields:
            for alt in alt_fields[field]:
                if invoice_data.get(alt):
                    value = invoice_data.get(alt)
                    break
        if not value:
            missing += 1
    
    if missing >= 3: return 0.3
    elif missing >= 2: return 0.6
    elif missing >= 1: return 0.8
    return 1.0
