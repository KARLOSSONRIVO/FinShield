import logging
from datetime import datetime
from typing import List
from app.utils.extractors import extract_base_amounts, extract_base_date_features, extract_line_item_count

logger = logging.getLogger(__name__)


class FeatureExtractor:
    """Extract numerical features from invoice data for anomaly detection"""
    
    def extract_features(
        self,
        invoice_data: dict,
        organization_id: str,
        db
    ) -> List[float]:
        """
        Extract feature vector for anomaly detection
        
        Features (9 total):
            1. total_amount - Invoice total
            2. subtotal - Pre-tax amount
            3. tax_amount - Tax amount
            4. tax_rate - tax / subtotal ratio
            5. line_item_count - Number of line items
            6. invoice_day_of_week - 0=Monday, 6=Sunday
            7. amount_rounded - Binary (is it exactly $100 or $1000 multiple?)
            8. subtotal_tax_ratio - subtotal / total
            9. days_since_last_invoice - Historical context
        """
        try:
            # 1. Amounts and Ratios
            amounts = extract_base_amounts(invoice_data)
            total = amounts['total']
            subtotal = amounts['subtotal']
            tax = amounts['tax']
            tax_rate = amounts['tax_rate']
            subtotal_tax_ratio = amounts['subtotal_ratio']
            
            # 2. Line items
            line_item_count = extract_line_item_count(invoice_data)
            
            # 3. Date features
            invoice_date_str = invoice_data.get('invoiceDate') or invoice_data.get('date')
            date_features = extract_base_date_features(invoice_date_str)
            day_of_week = date_features['day_of_week']
            
            # 4. Round number detection
            amount_rounded = 1.0 if (total > 0 and (total % 100 == 0 or total % 1000 == 0)) else 0.0
            
            # 5. Historical context: days since last invoice
            days_since_last = self._get_days_since_last_invoice(
                organization_id,
                invoice_date_str,
                db
            )
            
            features = [
                total,
                subtotal,
                tax,
                tax_rate,
                float(line_item_count),
                day_of_week,
                amount_rounded,
                subtotal_tax_ratio,
                days_since_last
            ]
            
            logger.debug(f"Extracted features for org {organization_id}: {features}")
            return features
            
        except Exception as e:
            logger.error(f"Error extracting features: {e}")
            return [0.0] * 9
    
    def _get_days_since_last_invoice(
        self,
        organization_id: str,
        current_date_str: str,
        db
    ) -> float:
        """Calculate days since last invoice for this organization"""
        try:
            if not current_date_str:
                return 0.0
            
            # Simple conversion to ISO for comparison
            current_date = datetime.fromisoformat(current_date_str.replace('Z', '+00:00'))
            
            last_invoice = db.invoices.find_one(
                {
                    '$or': [{'organizationId': organization_id}, {'orgId': organization_id}],
                    '$or': [
                        {'invoiceDate': {'$lt': current_date.isoformat()}},
                        {'date': {'$lt': current_date.isoformat()}}
                    ],
                    'aiVerdict': 'clean'
                },
                sort=[('invoiceDate', -1), ('date', -1)]
            )
            
            if last_invoice:
                last_date_str = last_invoice.get('invoiceDate') or last_invoice.get('date')
                last_date = datetime.fromisoformat(last_date_str.replace('Z', '+00:00'))
                delta = (current_date - last_date).days
                return float(max(0, delta))
            
            return 0.0
        except Exception as e:
            logger.warning(f"Error calculating days since last invoice: {e}")
            return 0.0
