"""
ML prediction logic for Anomaly Detection Layer.
"""
import logging

logger = logging.getLogger(__name__)

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
