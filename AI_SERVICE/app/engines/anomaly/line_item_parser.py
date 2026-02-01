"""
Parse line items from invoice text for total verification

Extracts line items and totals from OCR text for mathematical validation.
"""

import re
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


class LineItemParser:
    """Parse line items from invoice OCR text"""
    
    # Keywords that indicate total/summary lines (not line items)
    TOTAL_KEYWORDS = [
        'subtotal',
        'sub total',
        'sub-total',
        'total:',
        'total amount',
        'grand total',
        'amount due',
        'balance due',
        'balance',
        'sum',
        'payment',
        'discount:',
        'shipping:',
        'handling:',
        'tax:',
        'tax(',
        'gst:',
        'vat:',
    ]
    
    def parse_line_items(self, text: str) -> List[Dict]:
        """
        Extract line items from invoice text
        
        Looks for patterns like:
            Item 1          $100.00
            Product A       $250.50
            Service X        125.00
            Qty: 2  Price: $50.00  Total: $100.00
        
        Args:
            text: Full invoice OCR text
        
        Returns:
            List of line items with amounts
            [
                {'description': 'Item 1', 'amount': 100.00},
                {'description': 'Product A', 'amount': 250.50},
                ...
            ]
        
        Example:
            >>> parser = LineItemParser()
            >>> items = parser.parse_line_items(invoice_text)
            >>> total = sum(item['amount'] for item in items)
        """
        line_items = []
        
        if not text:
            return line_items
        
        try:
            lines = text.split('\n')
            
            # Pattern: matches currency amounts (decimal format)
            # Matches the last amount on a line like: "Item 50.00 1 56.00"
            amount_pattern = r'(\d+\.\d{2})\s*$'
            
            # Find the line items section (between header and totals)
            in_items_section = False
            header_keywords = ['description', 'item', 'product', 'service', 'qty', 'quantity', 'unit cost', 'amount']
            
            for line in lines:
                line_stripped = line.strip()
                line_lower = line_stripped.lower()
                
                # Skip empty lines
                if not line_stripped:
                    continue
                
                # Check if we're entering the line items section (header row)
                if not in_items_section and any(kw in line_lower for kw in header_keywords):
                    in_items_section = True
                    continue
                
                # Check if we've reached the totals section (exit line items)
                if in_items_section and self._is_total_line(line_stripped):
                    break
                
                # Parse line items only if we're in the items section
                if in_items_section:
                    # Skip if line looks like a date, phone, or address
                    if self._is_header_content(line_stripped):
                        continue
                    
                    # Find amounts in the line
                    matches = list(re.finditer(amount_pattern, line_stripped))
                    
                    if matches:
                        # Use the last amount (usually the line total)
                        last_match = matches[-1]
                        amount_str = last_match.group(1).replace(',', '')
                        
                        try:
                            amount = float(amount_str)
                            
                            # Filter out unreasonably small amounts (likely noise)
                            if amount >= 1.0 and amount < 1000000:
                                # Extract description (text before the amounts)
                                description = line_stripped[:last_match.start()].strip()
                                
                                # Clean up description (remove extra pipes, numbers)
                                description = re.sub(r'\|', ' ', description).strip()
                                description = re.sub(r'\s+', ' ', description)
                                
                                # Only add if description is meaningful (not just numbers)
                                if description and not description.replace('.', '').replace(',', '').isdigit():
                                    line_items.append({
                                        'description': description,
                                        'amount': amount
                                    })
                        except ValueError:
                            continue
            
            logger.debug(f"Parsed {len(line_items)} line items from text")
            return line_items
            
        except Exception as e:
            logger.error(f"Error parsing line items: {e}")
            return []
    
    def _is_header_content(self, line: str) -> bool:
        """
        Check if line is header/footer content (addresses, phones, dates)
        
        Args:
            line: Text line to check
        
        Returns:
            True if line looks like header content
        """
        line_lower = line.lower()
        
        # Phone numbers
        if re.search(r'\(\d{3}\)\s*\d{3}-\d{4}', line):
            return True
        
        # Email/website
        if '@' in line or 'www.' in line or '.com' in line:
            return True
        
        # Dates (various formats)
        if re.search(r'\d{1,2}/\d{1,2}/\d{2,4}', line) and 'date:' not in line_lower:
            return True
        
        # Invoice numbers
        if line_lower.startswith('no:') or line_lower.startswith('invoice'):
            return True
        
        # Addresses (street numbers)
        if re.search(r'\d+\s+(street|avenue|ave|road|rd|drive|dr|boulevard|blvd)', line_lower):
            return True
        
        # State/ZIP codes
        if re.search(r',\s*[A-Z]{2}\s*\d{5}', line):
            return True
        
        return False
    
    def _is_total_line(self, line: str) -> bool:
        """
        Check if line is a total/subtotal/tax line (not a line item)
        
        Args:
            line: Text line to check
        
        Returns:
            True if line contains total keywords
        """
        line_lower = line.lower()
        return any(keyword in line_lower for keyword in self.TOTAL_KEYWORDS)
    
    def extract_totals(self, text: str) -> Dict[str, Optional[float]]:
        """
        Extract subtotal, tax, and total amounts from invoice text
        
        Args:
            text: Full invoice OCR text
        
        Returns:
            {
                'subtotal': 100.00,
                'tax': 10.00,
                'total': 110.00
            }
        
        Example:
            >>> parser = LineItemParser()
            >>> totals = parser.extract_totals(invoice_text)
            >>> print(f"Total: ${totals['total']}")
        """
        totals = {
            'subtotal': None,
            'tax': None,
            'total': None
        }
        
        if not text:
            return totals
        
        try:
            lines = text.split('\n')
            
            # Pattern for amounts - prefer amounts at end of line with decimals
            amount_pattern = r'(\d{1,3}(?:,\d{3})*\.\d{2})\s*$'
            # Fallback pattern for amounts without decimals
            fallback_pattern = r'(\d{1,3}(?:,\d{3})*)\s*$'
            
            for line in lines:
                line_lower = line.lower()
                
                # Find amount in line (prefer decimal amounts at end)
                amount_match = re.search(amount_pattern, line)
                if not amount_match:
                    # Try fallback for whole numbers
                    amount_match = re.search(fallback_pattern, line)
                
                if not amount_match:
                    continue
                
                amount_str = amount_match.group(1).replace(',', '')
                try:
                    amount = float(amount_str)
                except ValueError:
                    continue
                
                # Categorize by keywords (most specific first)
                if 'subtotal' in line_lower or 'sub total' in line_lower or 'sub-total' in line_lower:
                    totals['subtotal'] = amount
                elif 'tax' in line_lower and 'total' not in line_lower:
                    # Tax line (but not "total tax")
                    totals['tax'] = amount
                elif any(kw in line_lower for kw in ['total', 'amount due', 'balance']):
                    # Only set total if not already set by more specific match
                    if 'subtotal' not in line_lower and totals['total'] is None:
                        totals['total'] = amount
            
            logger.debug(f"Extracted totals: {totals}")
            return totals
            
        except Exception as e:
            logger.error(f"Error extracting totals: {e}")
            return totals
    
    def calculate_expected_total(
        self,
        line_items: List[Dict],
        tax: Optional[float] = None,
        discount: Optional[float] = None
    ) -> float:
        """
        Calculate expected total from line items
        
        Args:
            line_items: List of parsed line items
            tax: Tax amount (optional)
            discount: Discount amount (optional)
        
        Returns:
            Expected total amount
        
        Example:
            >>> items = [{'amount': 100}, {'amount': 200}]
            >>> total = parser.calculate_expected_total(items, tax=30)
            >>> print(total)  # 330.0
        """
        try:
            subtotal = sum(item['amount'] for item in line_items)
            
            if tax:
                subtotal += tax
            
            if discount:
                subtotal -= discount
            
            return max(0.0, subtotal)  # Ensure non-negative
            
        except Exception as e:
            logger.error(f"Error calculating expected total: {e}")
            return 0.0
