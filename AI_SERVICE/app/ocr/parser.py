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

def normalize_invoice_number(raw: str) -> str | None:
    if not raw:
        return None

    s = raw.upper().strip().replace(" ", "")
    s = s.replace("—", "-").replace("_", "-")

    m = re.match(r"^([A-Z]{2,10})-?([A-Z0-9]+)$", s)
    if not m:
        return None

    prefix, tail = m.groups()
    digits = re.sub(r"\D", "", tail)

    if not digits:
        return None

    return f"{prefix}-{digits}"


def parse_money(raw: str) -> Decimal | None:
    if not raw:
        return None

    s = re.sub(r"[^\d,.\-]", "", raw.strip())

    if re.match(r"^\d{1,3}(\.\d{3})+,\d{2}$", s):
        s = s.replace(".", "").replace(",", ".")
    elif re.match(r"^\d{1,3}(,\d{3})+(\.\d{2})$", s):
        s = s.replace(",", "")

    try:
        return Decimal(s)
    except InvalidOperation:
        return None


def parse_invoice_fields(text: str) -> dict:
    result = {
        "invoiceNumber": None,
        "invoiceDate": None,
        "totalAmount": None,
    }

    # ---------------- INVOICE NUMBER ----------------
    inv_patterns = [
        r"\binvoice\s*(?:number|no\.?|#)\s*[:\-]?\s*([A-Z]{2,10}[-]?[A-Z0-9]{2,})",
        r"\b([A-Z]{2,10}-\d{1,10})\b",
    ]

    for pat in inv_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            norm = normalize_invoice_number(m.group(1))
            if norm:
                result["invoiceNumber"] = norm
                break

    # ---------------- INVOICE DATE ----------------
    date_patterns = [
        r"(?:invoice\s*date|date)\s*[:\-]?\s*([0-9]{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+([0-9]{4})",
        r"(?:invoice\s*date|date)\s*[:\-]?\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+([0-9]{1,2}),?\s+([0-9]{4})",
        r"\b([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})\b",
    ]

    for pat in date_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if not m:
            continue
        try:
            if m.group(2).isalpha():
                day, month, year = m.group(1), m.group(2), m.group(3)
                result["invoiceDate"] = datetime(
                    int(year), MONTH_MAP[month.lower()[:3]], int(day)
                ).strftime("%Y-%m-%d")
            else:
                dt = datetime.strptime(m.group(1), "%m/%d/%Y")
                result["invoiceDate"] = dt.strftime("%Y-%m-%d")
            break
        except:
            continue

    # ---------------- TOTAL AMOUNT ----------------
    TOTAL = re.compile(
        r"\b(total|grand\s*total|amount\s*due|balance\s*due)\b[^\d]{0,20}"
        r"([$€£₱]?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2}))",
        re.IGNORECASE
    )

    SUBTOTAL = re.compile(
        r"\bsub\s*total\b[^\d]{0,20}([$€£₱]?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2}))",
        re.IGNORECASE
    )

    TAX = re.compile(
        r"\btax\b(?!\s*rate|\s*%)\s*[^\d]{0,20}([$€£₱]?\s*\d{1,3}(?:,\d{3})*(?:\.\d{2}))",
        re.IGNORECASE
    )

    totals = TOTAL.findall(text)
    picked = None

    if totals:
        picked = parse_money(totals[-1][1])

    sub = parse_money(SUBTOTAL.search(text).group(1)) if SUBTOTAL.search(text) else None
    tax = parse_money(TAX.search(text).group(1)) if TAX.search(text) else None

    if sub and tax:
        computed = sub + tax
        if not picked or abs(picked - computed) > Decimal("2.00"):
            picked = computed

    if picked:
        result["totalAmount"] = float(picked)

    return result
