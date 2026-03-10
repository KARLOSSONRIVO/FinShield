"""
Data loading utilities for model training.

Provides functions to fetch invoice data from MongoDB for training purposes.
"""
import logging
from typing import List, Dict, Tuple, Optional
from bson import ObjectId

logger = logging.getLogger(__name__)


def fetch_invoices_for_training(
    db,
    org_id: str,
    verdict_filter: str = 'clean',
    min_count: int = 100,
    max_count: int = 50000
) -> List[Dict]:
    """
    Fetch invoices for training from MongoDB.

    Args:
        db: MongoDB database connection
        org_id: Organization ID (string or ObjectId)
        verdict_filter: AI verdict to filter by (default: 'clean')
        min_count: Minimum invoices required
        max_count: Maximum invoices to fetch

    Returns:
        List of invoice documents
    """
    # Accept both string and ObjectId — DB stores orgId as ObjectId
    try:
        oid = ObjectId(org_id) if not isinstance(org_id, ObjectId) else org_id
    except Exception:
        oid = org_id

    query = {
        'orgId': oid,
        'aiVerdict': verdict_filter,
    }

    cursor = db.invoices.find(query).limit(max_count)
    invoices = list(cursor)

    logger.info(f"Fetched {len(invoices)} invoices for org {org_id}")
    return invoices


async def fetch_labeled_fraud_data(
    db,
    min_samples: int,
    max_samples: int
) -> Tuple[List[Dict], int, int]:
    """
    Fetch labeled invoices for fraud detection training.
    
    Args:
        db: MongoDB database connection
        min_samples: Minimum total samples required
        max_samples: Maximum samples to fetch
    
    Returns:
        Tuple of (invoices, total_count, fraud_count)
    """
    logger.info(f"Fetching labeled training data from MongoDB...")
    
    pipeline = [
        {
            '$match': {
                'reviewDecision': {'$in': ['approved', 'rejected']},
                'parsedData': {'$exists': True}
            }
        },
        {
            '$project': {
                '_id': 1,
                'parsedData': 1,
                'reviewDecision': 1,
                'organizationId': 1
            }
        },
        {
            '$sort': {'updatedAt': -1}
        },
        {
            '$limit': max_samples
        }
    ]
    
    cursor = db.invoices.aggregate(pipeline)
    invoices = await cursor.to_list(length=max_samples)
    
    # Count fraud vs legitimate
    fraud_count = sum(1 for inv in invoices if inv.get('reviewDecision') == 'rejected')
    total_count = len(invoices)
    
    logger.info(f"Fetched {total_count} labeled invoices ({fraud_count} fraud, {total_count - fraud_count} legitimate)")
    
    return invoices, total_count, fraud_count


def count_organization_invoices(
    db,
    org_id: str,
    verdict_filter: str = 'clean'
) -> int:
    """
    Count invoices for an organization.

    Args:
        db: MongoDB database connection
        org_id: Organization ID (string or ObjectId)
        verdict_filter: AI verdict to filter by

    Returns:
        Count of matching invoices
    """
    try:
        oid = ObjectId(org_id) if not isinstance(org_id, ObjectId) else org_id
    except Exception:
        oid = org_id

    count = db.invoices.count_documents({
        'orgId': oid,
        'aiVerdict': verdict_filter,
    })

    return count


def get_eligible_organizations(
    db,
    min_invoices: int
) -> List[Dict]:
    """
    Find organizations eligible for training.
    
    Args:
        db: MongoDB database connection
        min_invoices: Minimum invoice count required
    
    Returns:
        List of dicts with 'org_id' and 'count' keys
    """
    pipeline = [
        {
            '$match': {
                'aiVerdict': 'clean',
            }
        },
        {
            '$group': {
                '_id': '$orgId',
                'count': {'$sum': 1}
            }
        },
        {
            '$match': {
                'count': {'$gte': min_invoices}
            }
        },
        {
            '$sort': {'count': -1}
        }
    ]

    orgs = list(db.invoices.aggregate(pipeline))
    # Convert ObjectId to string for compatibility with train script
    eligible = [{'org_id': str(org['_id']), 'count': org['count']} for org in orgs]

    logger.info(f"Found {len(eligible)} eligible organizations (>= {min_invoices} invoices)")

    return eligible
