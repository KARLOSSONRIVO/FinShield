import re
import logging
from typing import List, Dict, Optional
from .validators import is_header_content, is_total_line

logger = logging.getLogger(__name__)

def parse_line_items(text: str) -> List[Dict]:
    line_items = []
    
    if not text:
        return line_items
    
    try:
        lines = text.split('\n')
        amount_pattern = r'(?:[₱$P]\s*\d{1,3}(?:,?\d{3})*(?:\.\d{2})?|\s{2,}\d{1,3}(?:,?\d{3})*(?:\.\d{2})?|\d{1,3}(?:,?\d{3})*\.\d{2})'
        
        in_items_section = False
        header_keywords = ['description', 'item', 'product', 'service', 'qty', 'quantity', 'unit cost', 'amount']
        
        for line in lines:
            line_stripped = line.strip()
            line_lower = line_stripped.lower()
            
            if not line_stripped:
                continue
            
            if not in_items_section and any(kw in line_lower for kw in header_keywords):
                in_items_section = True
                continue
            
            if in_items_section and is_total_line(line_stripped):
                break
            
            if in_items_section:
                if is_header_content(line_stripped):
                    continue
                
                matches = list(re.finditer(amount_pattern, line_stripped))
                
                if matches:
                    last_match = matches[-1]
                    amount_str = last_match.group(0).strip().replace(',', '')
                    amount_str = re.sub(r'[₱$P]', '', amount_str).strip()
                    
                    try:
                        amount = float(amount_str)
                        
                        if amount >= 1.0 and amount < 1000000:
                            first_match = matches[0]
                            description = line_stripped[:first_match.start()].strip()
                            
                            description = re.sub(r'\|', ' ', description).strip()
                            description = re.sub(r'[₱$P]\s*', '', description).strip()
                            description = re.sub(r'\s+', ' ', description)
                            
                            quantity = 1
                            unit_price = amount
                            
                            if len(matches) >= 3:
                                try:
                                    unit_price_str = matches[-3].group(0).strip().replace(',', '')
                                    unit_price_str = re.sub(r'[₱$P]', '', unit_price_str).strip()
                                    qty_str = matches[-2].group(0).strip().replace(',', '')
                                    qty_str = re.sub(r'[₱$P]', '', qty_str).strip()
                                    
                                    unit_price = float(unit_price_str)
                                    quantity = int(float(qty_str))
                                except (ValueError, IndexError):
                                    pass
                            elif len(matches) == 2:
                                try:
                                    first_num_str = matches[0].group(0).strip().replace(',', '')
                                    first_num_str = re.sub(r'[₱$P]', '', first_num_str).strip()
                                    first_num = float(first_num_str)
                                    
                                    if abs(first_num - amount) < 0.01:
                                        unit_price = first_num
                                        quantity = 1
                                    elif first_num < 100 and abs(first_num * (amount / first_num) - amount) < 0.01:
                                        quantity = int(first_num)
                                        unit_price = amount / first_num
                                except (ValueError, ZeroDivisionError):
                                    pass
                            
                            if description and not description.replace('.', '').replace(',', '').isdigit():
                                line_items.append({
                                    'description': description,
                                    'quantity': quantity,
                                    'unit_price': round(unit_price, 2),
                                    'amount': amount
                                })
                    except ValueError:
                        continue
        
        logger.debug(f"Parsed {len(line_items)} line items from text")
        return line_items
        
    except Exception as e:
        logger.error(f"Error parsing line items: {e}")
        return []

def extract_totals(text: str) -> Dict[str, Optional[float]]:
    totals = {
        'subtotal': None,
        'tax': None,
        'total': None
    }
    
    if not text:
        return totals
    
    try:
        lines = text.split('\n')
        amount_pattern = r'[₱$P]?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*$'
        fallback_pattern = r'[₱$P]?\s*(\d{1,3}(?:,\d{3})*)\s*$'
        
        for line in lines:
            line_lower = line.lower()
            
            amount_match = re.search(amount_pattern, line)
            if not amount_match:
                amount_match = re.search(fallback_pattern, line)
            
            if not amount_match:
                continue
            
            amount_str = amount_match.group(1).replace(',', '')
            try:
                amount = float(amount_str)
            except ValueError:
                continue
            
            if 'subtotal' in line_lower or 'sub total' in line_lower or 'sub-total' in line_lower:
                totals['subtotal'] = amount
            elif 'tax' in line_lower and 'total' not in line_lower:
                totals['tax'] = amount
            elif any(kw in line_lower for kw in ['total', 'amount due', 'balance']):
                if 'subtotal' not in line_lower and totals['total'] is None:
                    totals['total'] = amount
        
        logger.debug(f"Extracted totals: {totals}")
        return totals
        
    except Exception as e:
        logger.error(f"Error extracting totals: {e}")
        return totals
