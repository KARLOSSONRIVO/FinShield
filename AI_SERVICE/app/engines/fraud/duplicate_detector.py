"""
Duplicate Invoice Detection (40% weight)

Checks for:
1. Same invoice number from same vendor
2. Same file hash (exact duplicate)
3. Similar amount + date + vendor combination
"""

import logging
from typing import Tuple, Optional
from bson import ObjectId
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class DuplicateDetector:
    """Detect duplicate invoice submissions"""
    
    def __init__(self, db):
        self.db = db
        self.invoices = db.invoices
    
    async def check(
        self,
        invoice_data: dict,
        organization_id: str,
        current_invoice_id: str = None
    ) -> Tuple[float, Optional[str]]:
        """
        Check if invoice is a duplicate
        
        Args:
            invoice_data: Parsed invoice data
            organization_id: Organization ID
            current_invoice_id: Current invoice ID (exclude from search)
        
        Returns:
            (score, issue_message)
            score: 1.0 = no duplicate, 0.0 = exact duplicate found
        """
        try:
            invoice_number = invoice_data.get('invoiceNumber', '') or invoice_data.get('invoice_number', '')
            vendor = invoice_data.get('vendor', '') or invoice_data.get('issuedTo', '')
            file_hash = invoice_data.get('fileHashSha256', '')
            total = float(invoice_data.get('total', 0) or invoice_data.get('totalAmount', 0) or 0)
            invoice_date = invoice_data.get('invoiceDate', '') or invoice_data.get('date', '')
            
            # Build exclusion filter
            exclude_filter = {}
            if current_invoice_id:
                try:
                    exclude_filter['_id'] = {'$ne': ObjectId(current_invoice_id)}
                except:
                    pass
            
            # Check 1: Exact file hash match (exact duplicate)
            if file_hash:
                hash_match = self.invoices.find_one({
                    'orgId': ObjectId(organization_id),
                    'fileHashSha256': file_hash,
                    **exclude_filter
                })
                
                if hash_match:
                    logger.warning(f"Exact duplicate found: {hash_match['_id']}")
                    return 0.0, "DUPLICATE_EXACT: Exact duplicate detected (same file hash)"
            
            # Check 2: Same invoice number + vendor
            if invoice_number and vendor:
                number_match = self.invoices.find_one({
                    'orgId': ObjectId(organization_id),
                    'invoiceNumber': invoice_number,
                    'issuedTo': {'$regex': vendor, '$options': 'i'},
                    **exclude_filter
                })
                
                if number_match:
                    logger.warning(f"Duplicate invoice number: {invoice_number}")
                    return 0.1, f"DUPLICATE_NUMBER: Duplicate invoice number '{invoice_number}' from vendor '{vendor}'"
            
            # Check 3: Same vendor + amount + date (likely duplicate)
            if vendor and total > 0 and invoice_date:
                similar_match = self.invoices.find_one({
                    'orgId': ObjectId(organization_id),
                    'issuedTo': {'$regex': vendor, '$options': 'i'},
                    'totalAmount': total,
                    'invoiceDate': invoice_date,
                    **exclude_filter
                })
                
                if similar_match:
                    logger.warning(f"Possible duplicate: same vendor/amount/date")
                    return 0.3, f"DUPLICATE_SIMILAR: Possible duplicate - same vendor, amount (${total:,.2f}), and date"
            
            # Check 4: Same vendor + very close amount (within 1%) in last 7 days
            if vendor and total > 0:
                week_ago = datetime.now() - timedelta(days=7)
                
                close_match = self.invoices.find_one({
                    'orgId': ObjectId(organization_id),
                    'issuedTo': {'$regex': vendor, '$options': 'i'},
                    'totalAmount': {'$gte': total * 0.99, '$lte': total * 1.01},
                    'createdAt': {'$gte': week_ago},
                    **exclude_filter
                })
                
                if close_match:
                    return 0.6, f"DUPLICATE_RECENT: Similar invoice from '{vendor}' submitted recently"
            
            # No duplicates found
            return 1.0, None
            
        except Exception as e:
            logger.error(f"Error in duplicate detection: {e}")
            return 0.8, f"Unable to verify duplicates: {str(e)}"
