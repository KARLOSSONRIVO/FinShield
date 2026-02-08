from typing import Dict, Any, List
from app.core.constants import FRAUD_FEATURE_NAMES as FEATURE_NAMES
from .extractor.helpers import (
    extract_amount_features,
    extract_invoice_num_features,
    extract_issued_to_features,
    extract_date_features,
    extract_line_item_features,
    extract_completeness_features
)

class FraudFeatureExtractor:
    def extract_features(self, invoice_data: Dict[str, Any]) -> Dict[str, float]:
        features = {}
        extract_amount_features(invoice_data, features)
        extract_invoice_num_features(invoice_data, features)
        extract_issued_to_features(invoice_data, features)
        extract_date_features(invoice_data, features)
        extract_line_item_features(invoice_data, features)
        extract_completeness_features(invoice_data, features)
        return features
    
    def extract_feature_vector(self, invoice_data: Dict[str, Any]) -> List[float]:
        features = self.extract_features(invoice_data)
        return [features.get(name, 0.0) for name in FEATURE_NAMES]
    
    def get_feature_names(self) -> List[str]:
        return FEATURE_NAMES.copy()
