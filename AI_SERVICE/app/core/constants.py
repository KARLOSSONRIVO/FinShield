import os

# =================================================================
# OCR & PARSING CONSTANTS
# =================================================================

# Used in app/utils/parser.py for month name resolution
MONTH_MAP = {
    "jan": 1, "january": 1,
    "feb": 2, "february": 2,
    "mar": 3, "march": 3,
    "apr": 4, "april": 4,
    "may": 5,
    "jun": 6, "june": 6,
    "jul": 7, "july": 7,
    "aug": 8, "august": 8,
    "sep": 9, "september": 9,
    "oct": 10, "october": 10,
    "nov": 11, "november": 11,
    "dec": 12, "december": 12,
}

# Used in app/engines/anomaly/line_parser/ to identify non-item lines
TOTAL_KEYWORDS = [
    'subtotal',
    'sub total',
    'sub-total',
    'total:',
    'total amount',
    'grand total',
    'amount due',
    'balance due',
    'balance',
    'sum',
    'payment',
    'discount:',
    'shipping:',
    'handling:',
    'tax:',
    'tax(',
    'gst:',
    'vat:',   
]

# Regex patterns for field extraction in app/utils/parser.py
INVOICE_PATTERNS = [
    r"\binvoice\s*(?:number|no\.?|#)\s*[:\-]?\s*(\d{3,})",
    r"\bno\.?\s*[:\-]?\s*(\d{3,})",
]

DATE_PATTERNS = [
    r"(?:invoice\s*date|issue\s*date|date)\s*[:\-]?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})",
    r"(?:invoice\s*date|issue\s*date|date)\s*[:\-]?\s*([0-9]{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+([0-9]{4})",
    r"(?:invoice\s*date|issue\s*date|date)\s*[:\-]?\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+([0-9]{1,2}),?\s+([0-9]{4})",
]

TOTAL_PATTERNS = [
    ("grand_total", r"\bgrand\s*total\b[^\d]{0,40}([$€£₱]?\s*\d[\d,]*(?:\.\d{2})?)"),
    ("balance_due", r"\bbalance\s*due\b[^\d]{0,40}([$€£₱]?\s*\d[\d,]*(?:\.\d{2})?)"),
    ("amount_due",  r"\bamount\s*due\b[^\d]{0,40}([$€£₱]?\s*\d[\d,]*(?:\.\d{2})?)"),
    ("total",       r"\btotal\b(?!\s*%)\b[^\d]{0,40}([$€£₱]?\s*\d[\d,]*(?:\.\d{2})?)"),
]

ISSUED_TO_PATTERNS = [
    r"(?:issued|bill(?:ed)?)\s*to\s*[:\-]?\s*([^\n]+)",
]

# =================================================================
# FRAUD DETECTION CONSTANTS
# =================================================================

# Used in app/engines/fraud/feature_extractor.py to maintain feature order
FRAUD_FEATURE_NAMES = [
    'total', 'subtotal', 'tax', 'tax_ratio', 'amount_log',
    'is_round_100', 'is_round_1000', 'is_round_500',
    'has_cents', 'cents_value',
    'inv_num_length', 'inv_num_has_prefix', 'inv_num_is_numeric', 'inv_num_missing',
    'issued_to_length', 'issued_to_missing', 'issued_to_is_generic',
    'date_missing', 'days_old', 'is_future', 'is_weekend', 'month', 'day_of_week', 'is_month_end',
    'line_item_count', 'has_line_items', 'avg_line_item_value',
    'max_quantity', 'avg_quantity', 'max_unit_price', 'avg_unit_price',
    'calculation_mismatches', 'single_item_dominance', 'has_high_quantity',
    'missing_fields_count', 'completeness_score'
]

# Model storage paths used in app/engines/fraud/model_loader.py
FRAUD_S3_MODEL_KEY = 'models/fraud_model_rf.pkl.gz'
FRAUD_S3_METADATA_KEY = 'models/fraud_model_metadata.json'

# Absolute paths for local fallback
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FRAUD_LOCAL_MODEL_PATH = os.path.join(_BASE_DIR, 'models', 'fraud_model_rf.pkl')
FRAUD_LOCAL_METADATA_PATH = os.path.join(_BASE_DIR, 'models', 'fraud_model_metadata.json')
