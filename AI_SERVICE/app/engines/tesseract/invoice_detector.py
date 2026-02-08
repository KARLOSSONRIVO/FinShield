import re
from app.core.constants import INVOICE_LIKENESS_KEYWORDS, NON_INVOICE_KEYWORDS, MONEY_REGEX_PATTERN, DATE_REGEX_PATTERN

MONEY_REGEX = re.compile(MONEY_REGEX_PATTERN)
DATE_REGEX = re.compile(DATE_REGEX_PATTERN)


def invoice_likeness_score(text: str) -> int:
    """Calculate invoice likeness score for a document."""
    score = 0
    lower = text.lower()

    # Keyword presence
    for kw in INVOICE_LIKENESS_KEYWORDS:
        if kw in lower:
            score += 2

    # Penalize known non-invoice docs
    for kw in NON_INVOICE_KEYWORDS:
        if kw in lower:
            score -= 3

    # Monetary patterns
    score += len(MONEY_REGEX.findall(text))

    # Date presence
    if DATE_REGEX.search(text):
        score += 2

    # Line-item density (tables)
    lines = [l for l in text.splitlines() if l.strip()]
    numeric_lines = sum(1 for l in lines if any(c.isdigit() for c in l))
    if numeric_lines >= 5:
        score += 2

    return score


def is_likely_invoice(text: str, threshold: int = 6) -> bool:
    """Check if document is likely an invoice."""
    return invoice_likeness_score(text) >= threshold
