"""
ML prediction logic for Anomaly Detection Layer.
"""
import logging
from typing import List

logger = logging.getLogger(__name__)


DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def explain_ml_anomaly(features: List[float], ml_score: float) -> str:
    """
    Produce a human-readable explanation of what drove the ML anomaly score.

    Feature order (matches FeatureExtractor.extract_features):
        0  total               1  subtotal          2  tax
        3  tax_rate            4  line_item_count   5  day_of_week (0=Mon)
        6  amount_rounded      7  subtotal_tax_ratio  8  days_since_last
    """
    if len(features) < 9:
        return f"statistical outlier for this organisation (anomaly score: {ml_score:.2f})"

    total          = features[0]
    tax_rate       = features[3]
    line_items     = int(features[4])
    day_of_week    = int(features[5])
    amount_rounded = features[6]
    days_since     = features[8]

    explanations = []

    if total >= 1_000_000:
        explanations.append(f"extremely large total amount (${total:,.2f})")
    elif total >= 100_000:
        explanations.append(f"unusually large total amount (${total:,.2f})")

    if tax_rate > 0.35:
        explanations.append(f"very high tax rate ({tax_rate * 100:.1f}%)")
    elif tax_rate > 0.20:
        explanations.append(f"above-average tax rate ({tax_rate * 100:.1f}%)")
    elif tax_rate < 0.01 and features[2] > 0:
        explanations.append("near-zero tax rate despite non-zero tax amount")

    if amount_rounded == 1.0:
        explanations.append(f"suspiciously round total amount (${total:,.0f})")

    if line_items == 1:
        explanations.append("single line item invoice")
    elif line_items == 0:
        explanations.append("no line items detected")
    elif line_items > 20:
        explanations.append(f"unusually high number of line items ({line_items})")

    if day_of_week == 5:
        explanations.append("submitted on a Saturday")
    elif day_of_week == 6:
        explanations.append("submitted on a Sunday")

    if 0 < days_since < 2:
        explanations.append(f"submitted only {int(days_since)} day(s) after the previous invoice")
    elif days_since > 365:
        years = days_since / 365
        explanations.append(f"unusually long gap since last invoice ({years:.1f} years)")
    elif days_since > 90:
        explanations.append(f"unusually long gap since last invoice ({int(days_since)} days)")

    if explanations:
        return ", ".join(explanations) + f" (anomaly score: {ml_score:.2f})"

    # No single threshold breached — keep it simple: just call out the amount
    # as the clearest signal a non-technical user can understand.
    subtotal       = features[1]
    tax            = features[2]
    days_since_val = features[8]
    day_name       = DAY_NAMES[day_of_week] if 0 <= day_of_week < 7 else "unknown day"

    return (
        f"invoice amount (${total:,.2f}) differs from this organisation's usual invoice amounts"
    )


def predict_anomaly_score(model, features: list) -> float:
    """
    Get anomaly score from Isolation Forest.
    
    Args:
        model: Trained Isolation Forest
        features: Feature vector
    
    Returns:
        Normalized score (0.0 = anomaly, 1.0 = normal)
    """
    try:
        # Predict anomaly score
        # Returns negative for anomalies, positive for normal
        raw_score = model.decision_function([features])[0]
        
        # Normalize to 0-1 range
        # Typical range: -1.5 to 1.5
        normalized = (raw_score + 1.5) / 3.0
        
        # Clamp to [0, 1]
        normalized = max(0.0, min(1.0, normalized))
        
        logger.debug(f"ML prediction - raw: {raw_score:.3f}, normalized: {normalized:.3f}")
        return normalized
        
    except Exception as e:
        logger.error(f"Error in model prediction: {e}")
        return 0.5  # Neutral score on error
