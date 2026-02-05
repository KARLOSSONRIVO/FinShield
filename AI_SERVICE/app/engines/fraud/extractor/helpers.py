import numpy as np
import logging
from datetime import datetime
from typing import Dict, Any, List

logger = logging.getLogger(__name__)

def extract_amount_features(invoice_data: Dict[str, Any], features: Dict[str, float]):
    total = float(invoice_data.get('totalAmount') or invoice_data.get('total', 0) or 0)
    subtotal = float(invoice_data.get('subtotalAmount') or invoice_data.get('subtotal', 0) or 0)
    tax = float(invoice_data.get('taxAmount') or invoice_data.get('tax', 0) or 0)
    
    features['total'] = total
    features['subtotal'] = subtotal
    features['tax'] = tax
    features['tax_ratio'] = tax / total if total > 0 else 0
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
    features['date_missing'] = 1.0 if not date_str.strip() else 0.0
    
    try:
        invoice_date = None
        for fmt in ['%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%Y/%m/%d']:
            try:
                invoice_date = datetime.strptime(date_str.split('T')[0], fmt)
                break
            except ValueError:
                continue
        
        if invoice_date:
            today = datetime.now()
            features['days_old'] = float((today - invoice_date).days)
            features['is_future'] = 1.0 if invoice_date > today else 0.0
            features['is_weekend'] = 1.0 if invoice_date.weekday() >= 5 else 0.0
            features['month'] = float(invoice_date.month)
            features['day_of_week'] = float(invoice_date.weekday())
            features['is_month_end'] = 1.0 if invoice_date.day >= 28 else 0.0
        else:
            raise ValueError("Could not parse date")
    except Exception:
        features['days_old'] = -1.0
        features['is_future'] = 0.0
        features['is_weekend'] = 0.0
        features['month'] = 0.0
        features['day_of_week'] = -1.0
        features['is_month_end'] = 0.0

def extract_line_item_features(invoice_data: Dict[str, Any], features: Dict[str, float]):
    line_items = invoice_data.get('lineItems') or invoice_data.get('line_items', [])
    line_count = len(line_items) if line_items else 0
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
