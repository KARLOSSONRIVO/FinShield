from typing import List, Dict, Optional
from .line_parser import (
    TOTAL_KEYWORDS,
    is_header_content,
    is_total_line,
    parse_line_items,
    extract_totals,
    calculate_expected_total
)

class LineItemParser:
    TOTAL_KEYWORDS = TOTAL_KEYWORDS
    
    def parse_line_items(self, text: str) -> List[Dict]:
        return parse_line_items(text)
    
    def _is_header_content(self, line: str) -> bool:
        return is_header_content(line)
    
    def _is_total_line(self, line: str) -> bool:
        return is_total_line(line)
    
    def extract_totals(self, text: str) -> Dict[str, Optional[float]]:
        return extract_totals(text)
    
    def calculate_expected_total(
        self,
        line_items: List[Dict],
        tax: Optional[float] = None,
        discount: Optional[float] = None
    ) -> float:
        return calculate_expected_total(line_items, tax, discount)
