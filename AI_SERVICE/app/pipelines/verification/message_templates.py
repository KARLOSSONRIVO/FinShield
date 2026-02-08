"""
Verification Message Templates

Contains human-readable message templates for converting technical flags
into user-friendly descriptions in verification summaries.
"""

# Flag message templates
FLAG_TEMPLATES = {
    # Layout flags
    "MISSING_FIELD": lambda flag: f"Missing expected field: {flag.replace('MISSING_FIELD:', '').strip()}",
    "FIELD_MISMATCH": "Field positions do not match template",
    "NO_TEMPLATE": "No template registered for this organization",
    
    # Anomaly flags
    "Math discrepancy": lambda flag: f"Calculation error: {flag}",
    "future": "Invoice date is in the future",
    "ago": "Invoice is unusually old (over 1 year)",
    "Unusually high amount": lambda flag: flag,
    "round amount": "Suspiciously round amount detected",
    "ML model flagged": "ML model detected unusual patterns",
    
    # Fraud flags - Customer validation
    "CUSTOMER_UNKNOWN": lambda flag: f"New/unknown customer detected: {flag.split(':')[1].strip() if ':' in flag else 'no history found'}",
    "CUSTOMER_NOT_APPROVED": lambda flag: f"Customer not in approved list: {flag.split(':')[1].strip() if ':' in flag else ''}",
    "CUSTOMER_LIMITED_HISTORY": lambda flag: f"Customer has limited history: {flag.split(':')[1].strip() if ':' in flag else ''}",
    "CUSTOMER_UNVERIFIED": lambda flag: f"Unverified customer: {flag.split(':')[1].strip() if ':' in flag else ''}",
    "CUSTOMER_MISSING": "No customer name found on invoice",
    "UNKNOWN_CUSTOMER": "Customer/vendor not recognized in system",
    "customer": "Customer/vendor not recognized in system",
    "NEW_CUSTOMER": "New customer detected, no historical data available",
    
    # Fraud flags - Other
    "DUPLICATE": "Potential duplicate invoice detected",
    "duplicate": "Potential duplicate invoice detected",
    "PATTERN": "Unusual invoice patterns detected",
    "FREQUENCY": "Unusual invoice submission frequency",
    "frequency": "Unusual invoice submission frequency",
    "ML_HIGH_FRAUD_RISK": lambda flag: f"ML model detected high fraud risk ({flag.split(':')[-1].strip()})",
}

# Layer verdict templates
LAYER_MESSAGES = {
    "layout_detection": {
        "warn": "Invoice layout does not match the organization's template",
        "fail": "Invoice layout significantly differs from expected template"
    },
    "anomaly_detection": {
        "warn": None,  # Use flags only
        "fail": None
    },
    "fraud_detection": {
        "warn": None,  # Use flags only
        "fail": None
    }
}
