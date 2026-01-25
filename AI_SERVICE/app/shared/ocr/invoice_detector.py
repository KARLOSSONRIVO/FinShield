import re

INVOICE_KEYWORDS = [
    "invoice",
    "billing",
    "bill to",
    "invoice no",
    "invoice #",
    "invoice number",
    "date",
    "total",
    "subtotal",
    "amount due",
    "vat",
    "tax",
    "balance",
]

NON_INVOICE_KEYWORDS = [
    "resume",
    "curriculum vitae",
    "report",
    "minutes of meeting",
    "contract",
    "agreement",
    "proposal",
    "certificate",
    "letter",
]

MONEY_REGEX = re.compile(r"\b(\$|₱|€|£)\s?\d+|\d+\.\d{2}")
DATE_REGEX = re.compile(r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b")


def invoice_likeness_score(text: str) -> int:
    score = 0
    lower = text.lower()

    # 1️⃣ Keyword presence
    for kw in INVOICE_KEYWORDS:
        if kw in lower:
            score += 2

    # 2️⃣ Penalize known non-invoice docs
    for kw in NON_INVOICE_KEYWORDS:
        if kw in lower:
            score -= 3

    # 3️⃣ Monetary patterns
    score += len(MONEY_REGEX.findall(text))

    # 4️⃣ Date presence
    if DATE_REGEX.search(text):
        score += 2

    # 5️⃣ Line-item density (tables)
    lines = [l for l in text.splitlines() if l.strip()]
    numeric_lines = sum(1 for l in lines if any(c.isdigit() for c in l))
    if numeric_lines >= 5:
        score += 2

    return score


def is_likely_invoice(text: str, threshold: int = 6) -> bool:
    return invoice_likeness_score(text) >= threshold
