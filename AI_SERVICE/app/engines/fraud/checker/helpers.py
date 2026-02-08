import logging
from datetime import datetime, timedelta
from typing import Tuple, Optional
from bson import ObjectId

logger = logging.getLogger(__name__)

def parse_date(date_str: str) -> Optional[datetime]:
    if not date_str:
        return None
    date_str = str(date_str).strip()
    try:
        return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except:
        pass
    
    formats = [
        '%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%Y/%m/%d',
        '%m-%d-%Y', '%d-%m-%Y', '%B %d, %Y', '%b %d, %Y',
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt)
        except:
            continue
    return None

async def check_billing_period(
    db,
    organization_id: str,
    vendor: str,
    invoice_date: datetime
) -> Tuple[float, Optional[str]]:
    try:
        month_start = invoice_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if invoice_date.month == 12:
            month_end = invoice_date.replace(year=invoice_date.year + 1, month=1, day=1)
        else:
            month_end = invoice_date.replace(month=invoice_date.month + 1, day=1)
        
        same_period = db.invoices.count_documents({
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

def check_submission_time(created_at) -> Tuple[float, Optional[str]]:
    try:
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        
        hour = created_at.hour
        weekday = created_at.weekday()
        
        if weekday >= 5:
            return 0.8, "TEMPORAL_WEEKEND: Submitted on weekend"
        if hour >= 23 or hour < 5:
            return 0.7, "TEMPORAL_LATE_NIGHT: Submitted late at night"
        return 1.0, None
    except:
        return 1.0, None
