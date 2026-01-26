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


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------

def normalize_invoice_number(raw: str) -> str | None:
    """
    Accepts:
      INV-000001, INV000001, INV-CO0001 -> INV-0001 (digits only tail)
      US-001, PO-12345, SI2023-001
    """
    if not raw:
        return None

    s = raw.upper().strip()
    s = s.replace(" ", "")

    # Common OCR fixes
    s = s.replace("—", "-").replace("_", "-")

    # Find PREFIX and TAIL
    m = re.match(r"^([A-Z]{2,10})-?([A-Z0-9]+)$", s)
    if not m:
        return None

    prefix, tail = m.groups()

    # Extract digits only from tail
    digits = re.sub(r"\D", "", tail)
    if not digits:
        return None

    return f"{prefix}-{digits}"


def parse_money(raw: str) -> Decimal | None:
    """
    Supports:
      $2,338.35
      €1.234,56
      £55.00
      154.06
    """
    if not raw:
        return None

    s = raw.strip()
    # drop currency symbols and other text
    s = re.sub(r"[^\d,.\-]", "", s)

    # EU format: 1.234,56
    if re.match(r"^\d{1,3}(\.\d{3})+,\d{2}$", s):
        s = s.replace(".", "").replace(",", ".")

    # US format: 2,338.35
    elif re.match(r"^\d{1,3}(,\d{3})+(\.\d{2})$", s):
        s = s.replace(",", "")

    # plain decimal: 154.06
    try:
        return Decimal(s)
    except InvalidOperation:
        return None


def parse_text_date(day: str, month: str, year: str) -> datetime | None:
    try:
        month_num = MONTH_MAP[month.lower()[:3]]
        y = int(year)
        if y < 100:
            y += 2000
        return datetime(y, month_num, int(day))
    except Exception:
        return None


def _parse_numeric_date(raw: str) -> datetime | None:
    """
    Try both MM/DD/YYYY and DD/MM/YYYY safely.
    Prefer the one where month<=12 and day<=31 (both may pass).
    If ambiguous (e.g., 11/02/2019), we choose MM/DD/YYYY first.
    """
    if not raw:
        return None

    raw = raw.strip()

    # normalize separators
    raw = raw.replace("-", "/")

    for fmt in ("%m/%d/%Y", "%d/%m/%Y", "%m/%d/%y", "%d/%m/%y"):
        try:
            return datetime.strptime(raw, fmt)
        except ValueError:
            continue

    return None


def _nearly_equal(a: Decimal, b: Decimal, tol: Decimal = Decimal("1.00")) -> bool:
    return abs(a - b) <= tol


# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------

def parse_invoice_fields(text: str) -> dict:
    result = {
        "invoiceNumber": None,
        "invoiceDate": None,
        "totalAmount": None,
        "confidence": {},
        "meta": {}  # optional: where values came from
    }

    # -------------------------------------------------------------------------
    # Invoice Number (support INV-..., US-001, etc.)
    # -------------------------------------------------------------------------

    inv_patterns = [
        # INVOICE # US-001   /   Invoice No: INV-000001
        r"\binvoice\s*(?:number|no\.?|#)\s*[:\-]?\s*([A-Z]{2,10}\s*[-]?\s*[A-Z0-9]{2,})",
        # Standalone code-like tokens (conservative)
        r"\b([A-Z]{2,10}-\d{1,10})\b",
    ]

    for pat in inv_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            normalized = normalize_invoice_number(m.group(1))
            if normalized:
                result["invoiceNumber"] = normalized
                result["confidence"]["invoiceNumber"] = 0.85
                result["meta"]["invoiceNumberSource"] = "pattern"
                break

    # -------------------------------------------------------------------------
    # Invoice Date
    # -------------------------------------------------------------------------

    date_patterns = [
        # Invoice Date 05 Aug 2024
        r"(?:invoice\s*date|date)\s*[:\-]?\s*([0-9]{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+([0-9]{2,4})",
        # Invoice Date Aug 05, 2024
        r"(?:invoice\s*date|date)\s*[:\-]?\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+([0-9]{1,2}),?\s+([0-9]{2,4})",
        # Labeled numeric: Invoice Date 11/02/2019
        r"(?:invoice\s*date|date)\s*[:\-]?\s*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})",
        # Numeric anywhere (OCR often splits label/value)
        r"\b([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})\b",
    ]

    parsed_date = None

    for pat in date_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if not m:
            continue

        # text month formats
        if len(m.groups()) == 3 and m.group(2).isalpha():
            # pattern could be (day, month, year) or (month, day, year)
            g1, g2, g3 = m.group(1), m.group(2), m.group(3)
            # Detect which is day/month by alpha position:
            # If group2 is alpha, group1 is day for DATE_TEXT_SHORT pattern
            # For ALT pattern group1 is month alpha; group2 is day
            if g1.isdigit() and g2.isalpha():
                parsed_date = parse_text_date(g1, g2, g3)
            else:
                # month alpha first
                parsed_date = parse_text_date(m.group(2), m.group(1), m.group(3))  # fallback
        else:
            raw = m.group(1)
            parsed_date = _parse_numeric_date(raw)

        if parsed_date:
            result["invoiceDate"] = parsed_date.strftime("%Y-%m-%d")
            result["confidence"]["invoiceDate"] = 0.80
            result["meta"]["invoiceDateSource"] = "pattern"
            break

    # -------------------------------------------------------------------------
    # Total Amount (STRICT) + Consistency fallback using Subtotal + Tax
    # -------------------------------------------------------------------------

    # Strict TOTAL (avoids percent by requiring currency/decimal amount)
    TOTAL_STRICT = re.compile(
        r"\b(total|grand\s*total|amount\s*due|balance\s*due)\b[^\d%]{0,30}"
        r"([$€£₱]?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2}))",
        re.IGNORECASE
    )

    # Subtotal and tax patterns for fallback
    SUBTOTAL_PAT = re.compile(
        r"\bsub\s*total\b[^\d%]{0,30}([$€£₱]?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2}))",
        re.IGNORECASE
    )
    TAX_AMT_PAT = re.compile(
        r"\b(?:sales\s*tax|tax)\b(?!\s*rate|\s*%)[^\d%]{0,30}([$€£₱]?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2}))",
        re.IGNORECASE
    )

    total_candidates = TOTAL_STRICT.findall(text)
    picked_total = None

    if total_candidates:
        raw_total = total_candidates[-1][1]  # last TOTAL
        amt = parse_money(raw_total)
        if amt:
            picked_total = amt
            result["meta"]["totalAmountSource"] = "total_label"
            result["confidence"]["totalAmount"] = 0.85

    # Fallback: if we have subtotal + tax, compute total and prefer it if plausible.
    sub_m = SUBTOTAL_PAT.search(text)
    tax_m = TAX_AMT_PAT.search(text)

    subtotal = parse_money(sub_m.group(1)) if sub_m else None
    tax_amt = parse_money(tax_m.group(1)) if tax_m else None

    if subtotal is not None and tax_amt is not None:
        computed = subtotal + tax_amt  # e.g., 145.00 + 9.06 = 154.06

        # If OCR total exists but looks inconsistent, prefer computed.
        if picked_total is None:
            picked_total = computed
            result["meta"]["totalAmountSource"] = "subtotal_plus_tax"
            result["confidence"]["totalAmount"] = 0.90
        else:
            # If OCR misread 154.06 as 184.06, computed will differ by ~30.
            # Prefer computed when far from OCR total.
            if not _nearly_equal(picked_total, computed, tol=Decimal("2.00")):
                picked_total = computed
                result["meta"]["totalAmountSource"] = "subtotal_plus_tax_override"
                result["confidence"]["totalAmount"] = 0.90

    if picked_total is not None:
        result["totalAmount"] = float(picked_total)

    return result
