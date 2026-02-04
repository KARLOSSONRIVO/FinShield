"""
Feature extraction for Isolation Forest anomaly detection

Extracts numerical features from invoice data for ML model input.
"""

import logging
from datetime import datetime
from typing import List

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
        
        Features (10 total):
            1. total_amount - Invoice total
            2. subtotal - Pre-tax amount
            3. tax_amount - Tax amount
            4. tax_rate - tax / subtotal ratio
            5. line_item_count - Number of line items
            6. has_discount - Binary (0/1)
            7. invoice_day_of_week - 0=Monday, 6=Sunday
            8. amount_rounded - Binary (is it exactly $100 or $1000 multiple?)
            9. subtotal_tax_ratio - subtotal / total
            10. days_since_last_invoice - Historical context
        
        Args:
            invoice_data: Parsed invoice data from OCR
            organization_id: Organization ID
            db: Database connection
        
        Returns:
            Feature vector [f1, f2, ..., f10]
        
        Example:
            >>> extractor = FeatureExtractor()
            >>> features = extractor.extract_features(invoice, 'org_123', db)
            >>> print(features)
            [5000.0, 4500.0, 500.0, 0.111, 5, 0, 2, 0, 0.9, 7]
        """
        try:
            # 1. Basic amounts (handle both field name formats)
            total = float(invoice_data.get('totalAmount') or invoice_data.get('total', 0))
            subtotal = float(invoice_data.get('subtotalAmount') or invoice_data.get('subtotal', total))
            tax = float(invoice_data.get('taxAmount') or invoice_data.get('tax', 0))
            
            # 2. Calculate tax rate
            tax_rate = (tax / subtotal) if subtotal > 0 else 0.0
            
            # 3. Line items
            line_items = invoice_data.get('lineItems') or invoice_data.get('line_items', [])
            line_item_count = len(line_items) if line_items else 0
            
            # 4. Discount detection
            discount = float(invoice_data.get('discountAmount') or invoice_data.get('discount', 0))
            has_discount = 1.0 if discount > 0 else 0.0
            
            # 5. Date features
            invoice_date_str = invoice_data.get('invoiceDate') or invoice_data.get('date')
            if invoice_date_str:
                try:
                    invoice_date = datetime.fromisoformat(invoice_date_str.replace('Z', '+00:00'))
                    day_of_week = float(invoice_date.weekday())  # 0=Monday, 6=Sunday
                except Exception as e:
                    logger.warning(f"Error parsing date '{invoice_date_str}': {e}")
                    day_of_week = 0.0
            else:
                day_of_week = 0.0
            
            # 6. Round number detection
            amount_rounded = 1.0 if (total > 0 and (total % 100 == 0 or total % 1000 == 0)) else 0.0
            
            # 7. Subtotal to total ratio
            subtotal_tax_ratio = (subtotal / total) if total > 0 else 0.0
            
            # 8. Historical context: days since last invoice
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
                has_discount,
                day_of_week,
                amount_rounded,
                subtotal_tax_ratio,
                days_since_last
            ]
            
            logger.debug(f"Extracted features for org {organization_id}: {features}")
            return features
            
        except Exception as e:
            logger.error(f"Error extracting features: {e}")
            # Return default features on error (neutral values)
            return [0.0] * 10
    
    def _get_days_since_last_invoice(
        self,
        organization_id: str,
        current_date_str: str,
        db
    ) -> float:
        """
        Calculate days since last invoice for this organization
        
        Args:
            organization_id: Organization ID
            current_date_str: Current invoice date (ISO format)
            db: Database connection
        
        Returns:
            Days since last invoice (0.0 if no previous invoice or error)
        """
        try:
            if not current_date_str:
                return 0.0
            
            current_date = datetime.fromisoformat(current_date_str.replace('Z', '+00:00'))
            
            # Find most recent invoice before this one (try both field names)
            last_invoice = db.invoices.find_one(
                {
                    '$or': [
                        {'organizationId': organization_id},
                        {'orgId': organization_id}
                    ],
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
                return float(max(0, delta))  # Ensure non-negative
            
            # No previous invoice found
            return 0.0
            
        except Exception as e:
            logger.warning(f"Error calculating days since last invoice: {e}")
            return 0.0
