import logging
from datetime import datetime
from typing import Tuple, Optional
from .checker.helpers import parse_date, check_billing_period, check_submission_time

logger = logging.getLogger(__name__)

class TemporalChecker:
    def __init__(self, db):
        self.db = db
    
    async def check(self, invoice_data: dict, organization_id: str) -> Tuple[float, Optional[str]]:
        try:
            issues = []
            deductions = 0.0
            
            date_str = invoice_data.get('invoiceDate', '') or invoice_data.get('date', '')
            if not date_str:
                return 0.7, "TEMPORAL_NO_DATE: No invoice date found"
            
            invoice_date = date_str if isinstance(date_str, datetime) else parse_date(date_str)
            if not invoice_date:
                return 0.6, f"TEMPORAL_INVALID_DATE: Cannot parse date: {date_str}"
            
            today = datetime.now()
            
            # Future date
            days_future = (invoice_date - today).days
            if days_future > 7:
                deductions += 0.5 if days_future > 30 else 0.2
                issues.append(f"TEMPORAL_FUTURE: Invoice dated {days_future} days in future")
            
            # Old date
            days_old = (today - invoice_date).days
            if days_old > 180:
                deductions += 0.3 if days_old > 365 else 0.1
                issues.append(f"TEMPORAL_OLD: Invoice is {days_old} days old")
            
            # Billing period
            vendor = invoice_data.get('vendor', '') or invoice_data.get('issuedTo', '')
            if vendor:
                p_score, p_issue = await check_billing_period(self.db, organization_id, vendor, invoice_date)
                if p_score < 1.0:
                    deductions += (1.0 - p_score) * 0.2
                    if p_issue: issues.append(p_issue)
            
            # Submission time
            created_at = invoice_data.get('createdAt')
            if created_at:
                t_score, _ = check_submission_time(created_at)
                if t_score < 1.0:
                    deductions += (1.0 - t_score) * 0.1
            
            final_score = max(0.0, 1.0 - deductions)
            return (final_score, "; ".join(issues)) if issues else (1.0, None)
            
        except Exception as e:
            logger.error(f"Error in temporal check: {e}")
            return 0.8, None
