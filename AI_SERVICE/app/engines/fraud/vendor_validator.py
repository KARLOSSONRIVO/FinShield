"""
Vendor Validation (30% weight)

Checks if vendor is in organization's approved vendor list
or has established invoice history.
"""

import logging
from typing import Tuple, Optional
from bson import ObjectId

logger = logging.getLogger(__name__)


class VendorValidator:
    """Validate vendor against approved list"""
    
    def __init__(self, db):
        self.db = db
        self.organizations = db.organizations
        self.invoices = db.invoices
    
    async def check(
        self,
        invoice_data: dict,
        organization_id: str
    ) -> Tuple[float, Optional[str]]:
        """
        Check if vendor is approved
        
        Args:
            invoice_data: Parsed invoice data
            organization_id: Organization ID
        
        Returns:
            (score, issue_message)
            score: 1.0 = approved vendor, 0.0 = unknown vendor
        """
        try:
            vendor_name = (
                invoice_data.get('vendor', '') or 
                invoice_data.get('issuedTo', '') or
                invoice_data.get('vendorName', '')
            )
            
            if not vendor_name:
                return 0.5, "VENDOR_MISSING: No vendor name found on invoice"
            
            vendor_name_lower = vendor_name.lower().strip()
            
            # Check 1: Look up organization's approved vendors
            org = self.organizations.find_one({
                '_id': ObjectId(organization_id)
            })
            
            if org:
                approved_vendors = org.get('approvedVendors', [])
                
                # Check if vendor is in approved list (case-insensitive partial match)
                for approved in approved_vendors:
                    # Handle both string and dict formats
                    if isinstance(approved, str):
                        approved_name = approved
                    else:
                        approved_name = approved.get('name', '')
                    
                    approved_lower = approved_name.lower().strip()
                    
                    if approved_lower and (
                        approved_lower in vendor_name_lower or 
                        vendor_name_lower in approved_lower
                    ):
                        logger.info(f"Vendor '{vendor_name}' is approved")
                        return 1.0, None
                
                # Vendor not in approved list
                if approved_vendors:
                    logger.warning(f"Vendor '{vendor_name}' not in approved list")
                    return 0.2, f"VENDOR_NOT_APPROVED: Vendor '{vendor_name}' is not in approved vendor list"
            
            # Check 2: Fallback - check if vendor has previous approved invoices
            previous_approved = self.invoices.count_documents({
                'orgId': ObjectId(organization_id),
                'issuedTo': {'$regex': vendor_name, '$options': 'i'},
                'reviewDecision': 'APPROVED'
            })
            
            if previous_approved >= 5:
                logger.info(f"Vendor '{vendor_name}' has {previous_approved} approved invoices")
                return 0.9, None  # Established vendor
            
            if previous_approved >= 1:
                return 0.7, f"VENDOR_LIMITED_HISTORY: Vendor '{vendor_name}' has limited history ({previous_approved} approved invoices)"
            
            # Check 3: Check total invoice count (even if not reviewed)
            total_invoices = self.invoices.count_documents({
                'orgId': ObjectId(organization_id),
                'issuedTo': {'$regex': vendor_name, '$options': 'i'}
            })
            
            if total_invoices >= 3:
                return 0.6, f"VENDOR_UNVERIFIED: Vendor '{vendor_name}' has {total_invoices} invoices but not reviewed"
            
            # New vendor - flag for review
            logger.warning(f"New/unknown vendor: '{vendor_name}'")
            return 0.3, f"VENDOR_UNKNOWN: Unknown vendor '{vendor_name}' - no history found"
            
        except Exception as e:
            logger.error(f"Error in vendor validation: {e}")
            return 0.5, f"Unable to validate vendor: {str(e)}"
