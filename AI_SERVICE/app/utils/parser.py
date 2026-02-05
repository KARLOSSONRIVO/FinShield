"""
Invoice field parsing utility from extracted text.
"""
import re
from datetime import datetime
from decimal import Decimal, InvalidOperation
from app.engines.anomaly.line_item_parser import LineItemParser


from app.core.constants import MONTH_MAP, DATE_PATTERNS, TOTAL_PATTERNS, INVOICE_PATTERNS, ISSUED_TO_PATTERNS


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
        dict with invoiceNumber, invoiceDate, totalAmount, subtotalAmount, taxAmount, 
        lineItems, issuedTo, confidence, meta
    """
    if isinstance(text, tuple):
        text = text[0] if text and isinstance(text[0], str) else ""

    result = {
        "invoiceNumber": None,
        "invoiceDate": None,
        "totalAmount": None,
        "subtotalAmount": None,
        "taxAmount": None,
        "lineItems": [],
        "issuedTo": None,
        "confidence": {},
        "meta": {}
    }

    for pat in INVOICE_PATTERNS:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            result["invoiceNumber"] = m.group(1)
            result["confidence"]["invoiceNumber"] = 0.90
            result["meta"]["invoiceNumberSource"] = "labeled_numeric"
            break

    for pat in DATE_PATTERNS:
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

    # Subtotal and Tax Amount - Use LineItemParser for accurate extraction
    parser = LineItemParser()
    totals = parser.extract_totals(text)
    
    if totals.get('subtotal'):
        result["subtotalAmount"] = float(totals['subtotal'])
        result["confidence"]["subtotalAmount"] = 0.95
        result["meta"]["subtotalAmountSource"] = "line_item_parser"
    
    if totals.get('tax'):
        result["taxAmount"] = float(totals['tax'])
        result["confidence"]["taxAmount"] = 0.95
        result["meta"]["taxAmountSource"] = "line_item_parser"
    
    # Line Items - Use LineItemParser for accurate extraction
    line_items = parser.parse_line_items(text)
    
    # DEBUG: Print line item parsing results
    print("\n" + "="*60)
    print("🔍 LINE ITEM PARSER DEBUG")
    print("="*60)
    print(f"Extracted {len(line_items)} line items:")
    for idx, item in enumerate(line_items, 1):
        print(f"  {idx}. {item.get('description')}: ${item.get('amount')}")
    print("="*60 + "\n")
    
    if line_items:
        result["lineItems"] = line_items
        result["confidence"]["lineItems"] = 0.95
        result["meta"]["lineItemsSource"] = "line_item_parser"

    for pat in ISSUED_TO_PATTERNS:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            content = m.group(1).strip()
            # If the same line is empty or just special chars, look at the next line
            # (This is a simplified approach; robust multiline extraction might need more context)
            if not content or len(content) < 3:
                # Try to find the match again but capture the next line
                # We need to find the position and look ahead
                pass  
            else:
                # Check if the extracted content contains secondary labels (multi-column)
                # e.g. "Values Invoice Number 123" -> "Values"
                # Look for common column headers
                split_pat = r"\s{2,}(?:invoice|date|no\.|number|total|amount|balance|due)\b"
                split_match = re.search(split_pat, content, re.IGNORECASE)
                if split_match:
                     content = content[:split_match.start()].strip()
                
                # Also checks for "Invoice Number" specifically even with single space
                rigid_pat = r"\s+(?:invoice\s+(?:number|no|#)|date\s*:)\b"
                split_match_rigid = re.search(rigid_pat, content, re.IGNORECASE)
                if split_match_rigid:
                     content = content[:split_match_rigid.start()].strip()

                result["issuedTo"] = content
                result["confidence"]["issuedTo"] = 0.85
                result["meta"]["issuedToSource"] = "label_text"
                break
    
    # Fallback: if 'Issued to' is found but text is on next line
    if not result.get("issuedTo"):
        # Look for the label, then capture the next non-empty line
        multiline_pat = r"(?:issued|bill(?:ed)?)\s*to\s*[:\-]?\s*\n+\s*([^\n]+)"
        m = re.search(multiline_pat, text, re.IGNORECASE | re.MULTILINE)
        if m:
            result["issuedTo"] = m.group(1).strip()
            result["confidence"]["issuedTo"] = 0.80
            result["meta"]["issuedToSource"] = "label_multiline"

    return result
