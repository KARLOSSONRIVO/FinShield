"""
Temporal Validation for Fraud Detection (10% weight)

Checks date-related fraud patterns:
- Future-dated invoices
- Very old invoices
- Duplicate billing periods
- Weekend/holiday submissions
"""

import logging
from typing import Tuple, Optional
from bson import ObjectId
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class TemporalChecker:
    """Check temporal patterns for fraud"""
    
    def __init__(self, db):
        self.db = db
        self.invoices = db.invoices
    
    async def check(
        self,
        invoice_data: dict,
        organization_id: str
    ) -> Tuple[float, Optional[str]]:
        """
        Check temporal validity
        
        Args:
            invoice_data: Parsed invoice data
            organization_id: Organization ID
        
        Returns:
            (score, issue_message)
        """
        try:
            issues = []
            deductions = 0.0
            
            invoice_date_str = (
                invoice_data.get('invoiceDate', '') or 
                invoice_data.get('date', '')
            )
            
            if not invoice_date_str:
                return 0.7, "TEMPORAL_NO_DATE: No invoice date found"
            
            # Parse date
            try:
                if isinstance(invoice_date_str, datetime):
                    invoice_date = invoice_date_str
                else:
                    # Try multiple formats
                    invoice_date = self._parse_date(invoice_date_str)
                    
                if not invoice_date:
                    return 0.6, f"TEMPORAL_INVALID_DATE: Invalid date format: {invoice_date_str}"
                    
            except Exception as e:
                return 0.6, f"TEMPORAL_INVALID_DATE: Cannot parse date: {invoice_date_str}"
            
            today = datetime.now()
            
            # Check 1: Future-dated invoice (40% of temporal weight)
            days_future = (invoice_date - today).days
            if days_future > 30:
                deductions += 0.5
                issues.append(f"TEMPORAL_FUTURE: Invoice dated {days_future} days in future")
            elif days_future > 7:
                deductions += 0.2
                issues.append(f"TEMPORAL_FUTURE: Invoice dated {days_future} days in future")
            
            # Check 2: Very old invoice (30% of temporal weight)
            days_old = (today - invoice_date).days
            if days_old > 365:
                deductions += 0.3
                issues.append(f"TEMPORAL_OLD: Invoice is {days_old} days old (over 1 year)")
            elif days_old > 180:
                deductions += 0.1
                issues.append(f"TEMPORAL_OLD: Invoice is {days_old} days old (over 6 months)")
            
            # Check 3: Duplicate billing period (20% of temporal weight)
            vendor = invoice_data.get('vendor', '') or invoice_data.get('issuedTo', '')
            if vendor:
                period_score, period_issue = await self._check_billing_period(
                    organization_id, vendor, invoice_date
                )
                if period_score < 1.0:
                    deductions += (1.0 - period_score) * 0.2
                    if period_issue:
                        issues.append(period_issue)
            
            # Check 4: Suspicious submission time (10% of temporal weight)
            created_at = invoice_data.get('createdAt')
            if created_at:
                time_score, time_issue = self._check_submission_time(created_at)
                if time_score < 1.0:
                    deductions += (1.0 - time_score) * 0.1
                    # Don't add issue for submission time - too minor
            
            final_score = max(0.0, 1.0 - deductions)
            
            if issues:
                return final_score, "; ".join(issues)
            
            return 1.0, None
            
        except Exception as e:
            logger.error(f"Error in temporal check: {e}")
            return 0.8, None
    
    def _parse_date(self, date_str: str) -> Optional[datetime]:
        """Try to parse date from various formats"""
        if not date_str:
            return None
        
        # Clean the string
        date_str = str(date_str).strip()
        
        # Try ISO format first
        try:
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except:
            pass
        
        # Try common formats
        formats = [
            '%Y-%m-%d',
            '%m/%d/%Y',
            '%d/%m/%Y',
            '%Y/%m/%d',
            '%m-%d-%Y',
            '%d-%m-%Y',
            '%B %d, %Y',
            '%b %d, %Y',
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except:
                continue
        
        return None
    
    async def _check_billing_period(
        self,
        organization_id: str,
        vendor: str,
        invoice_date: datetime
    ) -> Tuple[float, Optional[str]]:
        """Check for duplicate billing periods"""
        try:
            # Get start and end of the invoice's month
            month_start = invoice_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if invoice_date.month == 12:
                month_end = invoice_date.replace(year=invoice_date.year + 1, month=1, day=1)
            else:
                month_end = invoice_date.replace(month=invoice_date.month + 1, day=1)
            
            # Check for other invoices from same vendor in same month
            same_period = self.invoices.count_documents({
                'orgId': ObjectId(organization_id),
                'issuedTo': {'$regex': vendor, '$options': 'i'},
                'invoiceDate': {
                    '$gte': month_start.strftime('%Y-%m-%d'),
                    '$lt': month_end.strftime('%Y-%m-%d')
                }
            })
            
            if same_period > 2:
                return 0.5, f"TEMPORAL_MULTI_INVOICE: Multiple invoices ({same_period}) from '{vendor}' in same month"
            elif same_period > 1:
                return 0.8, f"TEMPORAL_DUPLICATE_PERIOD: Another invoice from '{vendor}' in same billing period"
            
            return 1.0, None
            
        except Exception as e:
            logger.error(f"Error checking billing period: {e}")
            return 1.0, None
    
    def _check_submission_time(self, created_at) -> Tuple[float, Optional[str]]:
        """Check if submission time is suspicious (late night, weekend)"""
        try:
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
            
            hour = created_at.hour
            weekday = created_at.weekday()
            
            # Weekend submission
            if weekday >= 5:  # Saturday=5, Sunday=6
                return 0.8, "TEMPORAL_WEEKEND: Submitted on weekend"
            
            # Late night (11 PM - 5 AM)
            if hour >= 23 or hour < 5:
                return 0.7, "TEMPORAL_LATE_NIGHT: Submitted late at night"
            
            return 1.0, None
            
        except:
            return 1.0, None
