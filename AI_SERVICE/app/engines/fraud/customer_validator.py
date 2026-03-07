"""
Customer Validation (30% weight)

Checks if customer (who the invoice is issued to) is in organization's 
approved customer list or has established invoice history.
"""

import logging
from typing import Tuple, Optional
from bson import ObjectId

logger = logging.getLogger(__name__)


class CustomerValidator:
    """Validate customer against approved list"""
    
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
        Check if customer is approved
        
        Args:
            invoice_data: Parsed invoice data
            organization_id: Organization ID
        
        Returns:
            (score, issue_message)
            score: 1.0 = approved customer, 0.0 = unknown customer
        """
        try:
            customer_name = (
                invoice_data.get('issuedTo', '') 
            )
            
            if not customer_name:
                return 0.5, "CUSTOMER_MISSING: No customer name found on invoice"
            
            customer_name_lower = customer_name.lower().strip()
            
            # Check 1: Look up organization's approved customers
            org = self.organizations.find_one({
                '_id': ObjectId(organization_id)
            })
            
            if org:
                approved_customers = org.get('approvedCustomers', [])
                
                # Check if customer is in approved list (case-insensitive partial match)
                for approved in approved_customers:
                    # Handle both string and dict formats
                    if isinstance(approved, str):
                        approved_name = approved
                    else:
                        approved_name = approved.get('name', '')
                    
                    approved_lower = approved_name.lower().strip()
                    
                    if approved_lower and (
                        approved_lower in customer_name_lower or 
                        customer_name_lower in approved_lower
                    ):
                        logger.info(f"Customer '{customer_name}' is approved")
                        return 1.0, None
                
                # Customer not in approved list
                if approved_customers:
                    logger.warning(f"Customer '{customer_name}' not in approved list")
                    return 0.2, f"CUSTOMER_NOT_APPROVED: Customer '{customer_name}' is not in approved customer list"
            
            # Check 2: Fallback - check if customer has previous approved invoices
            previous_approved = self.invoices.count_documents({
                'orgId': ObjectId(organization_id),
                'issuedTo': {'$regex': customer_name, '$options': 'i'},
                'reviewDecision': 'approved'
            })
            
            if previous_approved >= 5:
                logger.info(f"Customer '{customer_name}' has {previous_approved} approved invoices")
                return 0.9, None  # Established customer
            
            if previous_approved >= 1:
                return 0.7, f"CUSTOMER_LIMITED_HISTORY: Customer '{customer_name}' has limited history ({previous_approved} approved invoices)"
            
            # Check 3: Check total invoice count (even if not reviewed)
            total_invoices = self.invoices.count_documents({
                'orgId': ObjectId(organization_id),
                'issuedTo': {'$regex': customer_name, '$options': 'i'}
            })
            
            if total_invoices >= 3:
                return 0.6, f"CUSTOMER_UNVERIFIED: Customer '{customer_name}' has {total_invoices} invoices but not reviewed"
            
            # New customer - soft flag only; new customers are routine
            logger.info(f"New customer (no history): '{customer_name}'")
            return 0.65, f"CUSTOMER_UNKNOWN: New customer '{customer_name}' - no prior invoice history"
            
        except Exception as e:
            logger.error(f"Error in customer validation: {e}")
            return 0.5, f"Unable to validate customer: {str(e)}"
