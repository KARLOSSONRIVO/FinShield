"""
ML prediction logic for Fraud Detection Layer.
"""
import logging

logger = logging.getLogger(__name__)

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
