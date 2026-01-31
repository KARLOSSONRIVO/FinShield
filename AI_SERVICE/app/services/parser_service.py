"""
Parser Service - Invoice field parsing from extracted text.
"""
import re
from datetime import datetime
from decimal import Decimal, InvalidOperation


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


def parse_money(raw: str) -> Decimal | None:
    """Parse monetary value from string."""
    if not raw:
        return None

    s = raw.strip()
    s = re.sub(r"[^\d,.\-]", "", s)

    # EU format: 1.234,56
    if re.match(r"^\d{1,3}(\.\d{3})+,\d{2}$", s):
        s = s.replace(".", "").replace(",", ".")

    # US format: 1,234.56 or 2,044
    if re.match(r"^\d{1,3}(,\d{3})+(\.\d{2})?$", s):
        s = s.replace(",", "")

    try:
        return Decimal(s)
    except InvalidOperation:
        return None


def parse_numeric_date(raw: str) -> datetime | None:
    """Parse date from numeric format."""
    raw = raw.replace("-", "/")
    for fmt in ("%m/%d/%Y", "%d/%m/%Y", "%m/%d/%y", "%d/%m/%y"):
        try:
            return datetime.strptime(raw, fmt)
        except ValueError:
            continue
    return None


def parse_text_date(day: str, month: str, year: str) -> datetime | None:
    """Parse date from text format (e.g., 'Jan 15, 2025')."""
    try:
        m = MONTH_MAP[month.lower()[:3]]
        y = int(year)
        if y < 100:
            y += 2000
        return datetime(y, m, int(day))
    except Exception:
        return None


def parse_invoice_fields(text: str) -> dict:
    """
    Extract structured fields from invoice text.
    
    Returns:
        dict with invoiceNumber, invoiceDate, totalAmount, confidence, meta
    """
    if isinstance(text, tuple):
        text = text[0] if text and isinstance(text[0], str) else ""

    result = {
        "invoiceNumber": None,
        "invoiceDate": None,
        "totalAmount": None,
        "confidence": {},
        "meta": {}
    }

    # Invoice Number (digits only)
    invoice_patterns = [
        r"\binvoice\s*(?:number|no\.?|#)\s*[:\-]?\s*(\d{3,})",
        r"\bno\.?\s*[:\-]?\s*(\d{3,})",
    ]

    for pat in invoice_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            result["invoiceNumber"] = m.group(1)
            result["confidence"]["invoiceNumber"] = 0.90
            result["meta"]["invoiceNumberSource"] = "labeled_numeric"
            break

    # Invoice Date
    date_patterns = [
        r"(?:invoice\s*date|issue\s*date|date)\s*[:\-]?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})",
        r"(?:invoice\s*date|issue\s*date|date)\s*[:\-]?\s*([0-9]{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+([0-9]{4})",
        r"(?:invoice\s*date|issue\s*date|date)\s*[:\-]?\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+([0-9]{1,2}),?\s+([0-9]{4})",
    ]

    for pat in date_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if not m:
            continue

        if len(m.groups()) == 3 and m.group(2).isalpha():
            parsed = parse_text_date(m.group(1), m.group(2), m.group(3))
        elif len(m.groups()) == 3 and m.group(1).isalpha():
            parsed = parse_text_date(m.group(2), m.group(1), m.group(3))
        else:
            parsed = parse_numeric_date(m.group(1))

        if parsed:
            result["invoiceDate"] = parsed.strftime("%Y-%m-%d")
            result["confidence"]["invoiceDate"] = 0.85
            result["meta"]["invoiceDateSource"] = "pattern"
            break

    # Total Amount (strict priority)
    TOTAL_PATTERNS = [
        ("grand_total", r"\bgrand\s*total\b[^\d]{0,40}([$€£₱]?\s*\d[\d,]*(?:\.\d{2})?)"),
        ("balance_due", r"\bbalance\s*due\b[^\d]{0,40}([$€£₱]?\s*\d[\d,]*(?:\.\d{2})?)"),
        ("amount_due",  r"\bamount\s*due\b[^\d]{0,40}([$€£₱]?\s*\d[\d,]*(?:\.\d{2})?)"),
        ("total",       r"\btotal\b(?!\s*%)\b[^\d]{0,40}([$€£₱]?\s*\d[\d,]*(?:\.\d{2})?)"),
    ]

    for label, pat in TOTAL_PATTERNS:
        m = re.search(pat, text, re.IGNORECASE)
        if not m:
            continue

        amt = parse_money(m.group(1))
        if amt is not None:
            result["totalAmount"] = float(amt)
            result["confidence"]["totalAmount"] = 0.92
            result["meta"]["totalAmountSource"] = label
            break

    return result
