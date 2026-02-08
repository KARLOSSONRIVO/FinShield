"""
Fraud Detection Engine

Rule-based and ML-based fraud detection for invoices.
"""

from .duplicate_detector import DuplicateDetector
from .customer_validator import CustomerValidator
from .pattern_analyzer import PatternAnalyzer
from .temporal_checker import TemporalChecker
from .feature_extractor import FraudFeatureExtractor, FEATURE_NAMES
from .model_loader import (
    get_fraud_model,
    save_fraud_model_to_s3_explicit,
    clear_fraud_model_cache,
    is_model_available
)

__all__ = [
    # Rule checkers
    'DuplicateDetector',
    'CustomerValidator',
    'PatternAnalyzer',
    'TemporalChecker',
    # ML components
    'FraudFeatureExtractor',
    'FEATURE_NAMES',
    'get_fraud_model',
    'save_fraud_model_to_s3_explicit',
    'clear_fraud_model_cache',
    'is_model_available',
]
