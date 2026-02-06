"""
Smart sampling strategies for training data.

Provides intelligent sampling to balance dataset size while maintaining representativeness.
"""
import random
import logging
from datetime import datetime, timedelta
from typing import List, Dict

logger = logging.getLogger(__name__)


def smart_sample(
    invoices: List[Dict],
    max_samples: int,
    recent_weight: float = 0.8,
    recent_days: int = 90
) -> List[Dict]:
    """
    Smart sampling: Weighted toward recent invoices.
    
    Args:
        invoices: List of all invoices
        max_samples: Maximum samples to use
        recent_days: Days to consider as "recent"
        recent_weight: Proportion of recent samples (0.0 to 1.0)
    
    Returns:
        Sampled invoice list
    
    Example:
        With 10000 invoices, max_samples=5000, recent_weight=0.8:
        - Takes 4000 from last 90 days
        - Takes 1000 from older history
    """
    if len(invoices) <= max_samples:
        return invoices
    
    # Calculate cutoff date
    cutoff_date = datetime.now() - timedelta(days=recent_days)
    
    # Split into recent and historical
    recent = [
        inv for inv in invoices
        if inv.get('createdAt') and inv['createdAt'] >= cutoff_date
    ]
    historical = [inv for inv in invoices if inv not in recent]
    
    # Calculate sample sizes
    recent_count = int(max_samples * recent_weight)
    historical_count = max_samples - recent_count
    
    # Sample from each group
    sampled_recent = random.sample(recent, min(len(recent), recent_count))
    sampled_historical = (
        random.sample(historical, min(len(historical), historical_count))
        if historical else []
    )
    
    total_sampled = len(sampled_recent) + len(sampled_historical)
    
    logger.info(
        f"Smart sampling: {len(sampled_recent)} recent + "
        f"{len(sampled_historical)} historical = {total_sampled} total"
    )
    
    return sampled_recent + sampled_historical


def stratified_sample_by_amount(
    invoices: List[Dict],
    max_samples: int,
    bins: int = 5
) -> List[Dict]:
    """
    Stratified sampling by invoice amount to ensure diverse representation.
    
    Args:
        invoices: List of invoices
        max_samples: Maximum samples to use
        bins: Number of amount bins to create
    
    Returns:
        Stratified sampled invoice list
    """
    if len(invoices) <= max_samples:
        return invoices
    
    # Sort by amount
    sorted_invoices = sorted(invoices, key=lambda x: float(x.get('total', 0)))
    
    # Divide into bins
    bin_size = len(sorted_invoices) // bins
    samples_per_bin = max_samples // bins
    
    sampled = []
    for i in range(bins):
        start_idx = i * bin_size
        end_idx = start_idx + bin_size if i < bins - 1 else len(sorted_invoices)
        bin_invoices = sorted_invoices[start_idx:end_idx]
        
        # Sample from this bin
        sample_count = min(len(bin_invoices), samples_per_bin)
        sampled.extend(random.sample(bin_invoices, sample_count))
    
    # Fill remaining slots if needed
    remaining = max_samples - len(sampled)
    if remaining > 0:
        unsampled = [inv for inv in sorted_invoices if inv not in sampled]
        if unsampled:
            sampled.extend(random.sample(unsampled, min(len(unsampled), remaining)))
    
    logger.info(f"Stratified sampling: {len(sampled)} samples from {bins} amount bins")
    
    return sampled
