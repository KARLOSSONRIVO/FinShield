"""
Verification Stages Package.

This package contains the individual layers of the verification pipeline.
"""
from .layout import LayoutDetectionLayer
from .anomaly import AnomalyDetectionLayer
from .fraud import FraudDetectionLayer
from .base import LayerResult, LayerVerdict
