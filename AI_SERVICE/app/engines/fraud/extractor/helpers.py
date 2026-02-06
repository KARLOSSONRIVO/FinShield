import numpy as np
import logging
from typing import Dict, Any, List
from app.utils.extractors import extract_base_amounts, extract_base_date_features, extract_line_item_count

logger = logging.getLogger(__name__)

def extract_amount_features(invoice_data: Dict[str, Any], features: Dict[str, float]):
    amounts = extract_base_amounts(invoice_data)
    total = amounts['total']
    
    features['total'] = total
    features['subtotal'] = amounts['subtotal']
    features['tax'] = amounts['tax']
    features['tax_ratio'] = (amounts['tax'] / total) if total > 0 else 0
    features['amount_log'] = float(np.log1p(total))
    
    features['is_round_100'] = 1.0 if total > 0 and total % 100 == 0 else 0.0
    features['is_round_1000'] = 1.0 if total > 0 and total % 1000 == 0 else 0.0
    features['is_round_500'] = 1.0 if total > 0 and total % 500 == 0 else 0.0
    
    decimal_part = total - int(total)
    features['has_cents'] = 1.0 if decimal_part > 0 else 0.0
    features['cents_value'] = decimal_part

def extract_invoice_num_features(invoice_data: Dict[str, Any], features: Dict[str, float]):
    inv_num = str(invoice_data.get('invoiceNumber') or invoice_data.get('invoice_number', '') or '')
    features['inv_num_length'] = float(len(inv_num))
    features['inv_num_has_prefix'] = 1.0 if any(
        inv_num.upper().startswith(p) for p in ['INV', 'INVOICE', 'PO', 'REF']
    ) else 0.0
    features['inv_num_is_numeric'] = 1.0 if inv_num.isdigit() else 0.0
    features['inv_num_missing'] = 1.0 if not inv_num.strip() else 0.0

def extract_issued_to_features(invoice_data: Dict[str, Any], features: Dict[str, float]):
    issued_to = str(invoice_data.get('issuedTo', '') or '')
    features['issued_to_length'] = float(len(issued_to))
    features['issued_to_missing'] = 1.0 if not issued_to.strip() else 0.0
    features['issued_to_is_generic'] = 1.0 if issued_to.lower() in [
        'cash', 'unknown', 'misc', 'various', '', 'n/a', 'na'
    ] else 0.0

def extract_date_features(invoice_data: Dict[str, Any], features: Dict[str, float]):
    date_str = str(invoice_data.get('invoiceDate') or invoice_data.get('date', '') or '')
    date_feats = extract_base_date_features(date_str)
    
    features['date_missing'] = date_feats['date_missing']
    features['month'] = date_feats['month']
    features['day_of_week'] = date_feats['day_of_week']
    features['is_weekend'] = date_feats['is_weekend']
    features['is_month_end'] = date_feats['is_month_end']
    features['days_old'] = date_feats.get('days_old', -1.0)
    features['is_future'] = 1.0 if features['days_old'] < 0 else 0.0

def extract_line_item_features(invoice_data: Dict[str, Any], features: Dict[str, float]):
    line_items = invoice_data.get('lineItems') or invoice_data.get('line_items', [])
    line_count = extract_line_item_count(invoice_data)
    
    features['line_item_count'] = float(line_count)
    features['has_line_items'] = 1.0 if line_count > 0 else 0.0
    
    total = features.get('total', 0)
    features['avg_line_item_value'] = total / line_count if line_count > 0 else total
    
    quantities = []
    unit_prices = []
    calculation_errors = 0
    
    for item in line_items:
        qty = item.get('quantity', 1)
        unit_price = item.get('unit_price', item.get('amount', 0))
        item_amount = item.get('amount', 0)
        
        quantities.append(qty)
        unit_prices.append(unit_price)
        
        expected = qty * unit_price
        if abs(expected - item_amount) > 0.02:
            calculation_errors += 1
    
    features['max_quantity'] = float(max(quantities)) if quantities else 1.0
    features['avg_quantity'] = float(np.mean(quantities)) if quantities else 1.0
    features['max_unit_price'] = float(max(unit_prices)) if unit_prices else total
    features['avg_unit_price'] = float(np.mean(unit_prices)) if unit_prices else total
    features['calculation_mismatches'] = float(calculation_errors)
    
    if line_items and total > 0:
        max_item_amount = max(item.get('amount', 0) for item in line_items)
        dominance = max_item_amount / total
        features['single_item_dominance'] = dominance
    else:
        features['single_item_dominance'] = 1.0
    
    features['has_high_quantity'] = 1.0 if features['max_quantity'] > 100 else 0.0

def extract_completeness_features(invoice_data: Dict[str, Any], features: Dict[str, float]):
    missing_count = 0
    if not (invoice_data.get('invoiceNumber') or invoice_data.get('invoice_number')):
        missing_count += 1
    if not invoice_data.get('issuedTo'):
        missing_count += 1
    if not (invoice_data.get('totalAmount') or invoice_data.get('total')):
        missing_count += 1
    if not (invoice_data.get('invoiceDate') or invoice_data.get('date')):
        missing_count += 1
    
    features['missing_fields_count'] = float(missing_count)
    features['completeness_score'] = 1.0 - (missing_count / 4.0)
