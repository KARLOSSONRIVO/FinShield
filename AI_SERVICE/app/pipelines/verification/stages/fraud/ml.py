"""
ML prediction logic for Fraud Detection Layer.
"""
import logging
from typing import List

logger = logging.getLogger(__name__)

# Feature order mirrors FRAUD_FEATURE_NAMES in app/core/constants.py
_F = {
    'total': 0, 'subtotal': 1, 'tax': 2, 'tax_ratio': 3, 'amount_log': 4,
    'is_round_100': 5, 'is_round_1000': 6, 'is_round_500': 7,
    'has_cents': 8, 'cents_value': 9,
    'inv_num_length': 10, 'inv_num_has_prefix': 11, 'inv_num_is_numeric': 12, 'inv_num_missing': 13,
    'issued_to_length': 14, 'issued_to_missing': 15, 'issued_to_is_generic': 16,
    'date_missing': 17, 'days_old': 18, 'is_future': 19, 'is_weekend': 20,
    'month': 21, 'day_of_week': 22, 'is_month_end': 23,
    'line_item_count': 24, 'has_line_items': 25, 'avg_line_item_value': 26,
    'max_quantity': 27, 'avg_quantity': 28, 'max_unit_price': 29, 'avg_unit_price': 30,
    'calculation_mismatches': 31, 'single_item_dominance': 32, 'has_high_quantity': 33,
    'missing_fields_count': 34, 'completeness_score': 35,
}


def _f(features: List[float], name: str) -> float:
    idx = _F.get(name)
    if idx is None or idx >= len(features):
        return 0.0
    return features[idx]


def explain_fraud_ml(features: List[float], fraud_proba: float) -> str:
    """
    Produce a human-readable explanation of what drove the Random Forest
    fraud probability score, based on the 36 FRAUD_FEATURE_NAMES features.
    """
    if len(features) < 36:
        return f"high fraud probability ({fraud_proba * 100:.1f}%) based on invoice characteristics"

    explanations = []
    total = _f(features, 'total')

    # --- Amount signals ---
    if _f(features, 'is_round_1000') == 1.0:
        explanations.append(f"round total amount (${total:,.0f} — exact $1,000 multiple)")
    elif _f(features, 'is_round_500') == 1.0:
        explanations.append(f"round total amount (${total:,.0f} — exact $500 multiple)")
    elif _f(features, 'is_round_100') == 1.0:
        explanations.append(f"round total amount (${total:,.0f} — exact $100 multiple)")

    tax_ratio = _f(features, 'tax_ratio')
    if tax_ratio > 0.35:
        explanations.append(f"very high tax rate ({tax_ratio * 100:.1f}%)")
    elif tax_ratio > 0.20:
        explanations.append(f"above-average tax rate ({tax_ratio * 100:.1f}%)")

    # --- Invoice number signals ---
    if _f(features, 'inv_num_missing') == 1.0:
        explanations.append("missing invoice number")
    elif _f(features, 'inv_num_length') <= 2 and _f(features, 'inv_num_missing') == 0.0:
        explanations.append("very short invoice number")

    # --- Customer / issued-to signals ---
    if _f(features, 'issued_to_missing') == 1.0:
        explanations.append("missing recipient (issued-to field blank)")
    elif _f(features, 'issued_to_is_generic') == 1.0:
        explanations.append("generic or placeholder recipient (e.g. 'Cash', 'N/A')")

    # --- Date signals ---
    if _f(features, 'date_missing') == 1.0:
        explanations.append("missing invoice date")
    elif _f(features, 'is_future') == 1.0:
        explanations.append("invoice date is in the future")
    else:
        days_old = _f(features, 'days_old')
        if days_old > 730:
            explanations.append(f"invoice is over 2 years old ({int(days_old)} days)")
        elif days_old > 365:
            explanations.append(f"invoice is over a year old ({int(days_old)} days)")

    if _f(features, 'is_weekend') == 1.0:
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        day_idx = int(_f(features, 'day_of_week'))
        day_name = day_names[day_idx] if 0 <= day_idx < 7 else "weekend"
        explanations.append(f"submitted on a {day_name}")

    if _f(features, 'is_month_end') == 1.0:
        explanations.append("submitted on the last day of the month")

    # --- Line item signals ---
    calc_mismatches = int(_f(features, 'calculation_mismatches'))
    if calc_mismatches > 0:
        explanations.append(
            f"{calc_mismatches} line item calculation error{'s' if calc_mismatches > 1 else ''} "
            f"(quantity × unit price ≠ line total)"
        )

    if _f(features, 'has_high_quantity') == 1.0:
        explanations.append(f"unusually high quantity on a line item ({int(_f(features, 'max_quantity'))})")

    line_count = int(_f(features, 'line_item_count'))
    dominance = _f(features, 'single_item_dominance')
    if line_count == 1 and dominance >= 0.99:
        explanations.append("single line item covers entire invoice amount")
    elif dominance >= 0.95 and line_count > 1:
        explanations.append(f"one line item accounts for ≥95% of the total across {line_count} items")

    # --- Completeness ---
    missing = int(_f(features, 'missing_fields_count'))
    if missing >= 3:
        explanations.append(f"{missing} required fields missing")
    elif missing == 2:
        explanations.append("2 required fields missing")

    pct = fraud_proba * 100
    if explanations:
        return f"{', '.join(explanations)} — ML fraud probability: {pct:.1f}%"

    return (
        f"multiple subtle indicators collectively raise fraud risk "
        f"(no single dominant signal) — ML fraud probability: {pct:.1f}%"
    )


def predict_fraud_score(model, features: list) -> float:
    """
    Get fraud score from Random Forest model.
    
    Args:
        model: Trained Random Forest model
        features: Feature vector
    
    Returns:
        Normalized score (0.0 = fraud, 1.0 = safe)
    """
    try:
        # Get fraud probability (class 1 = fraud)
        fraud_proba = model.predict_proba([features])[0][1]
        
        # ML score = 1 - fraud_probability (higher = safer)
        ml_score = 1.0 - fraud_proba
        
        logger.info(f"ML fraud probability: {fraud_proba:.3f}, ML score: {ml_score:.3f}")
        return ml_score, fraud_proba
        
    except Exception as e:
        logger.error(f"ML prediction failed: {e}")
        return 0.5, 0.5  # Neutral score on error
