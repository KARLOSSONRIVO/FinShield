def confidence_for_match(value: str, text: str) -> float:
    if not value:
        return 0.0

    occurrences = text.lower().count(value.lower())
    if occurrences >= 2:
        return 0.95
    if occurrences == 1:
        return 0.85
    return 0.70
