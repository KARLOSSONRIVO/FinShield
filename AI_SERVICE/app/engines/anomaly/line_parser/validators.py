import re
from app.core.constants import TOTAL_KEYWORDS

def is_header_content(line: str) -> bool:
    line_lower = line.lower()
    
    if re.search(r'\(\d{3}\)\s*\d{3}-\d{4}', line):
        return True
    
    if '@' in line or 'www.' in line or '.com' in line:
        return True
    
    if re.search(r'\d{1,2}/\d{1,2}/\d{2,4}', line) and 'date:' not in line_lower:
        return True
    
    if line_lower.startswith('no:') or line_lower.startswith('invoice'):
        return True
    
    if re.search(r'\d+\s+(street|avenue|ave|road|rd|drive|dr|boulevard|blvd)', line_lower):
        return True
    
    if re.search(r',\s*[A-Z]{2}\s*\d{5}', line):
        return True
    
    return False

def is_total_line(line: str) -> bool:
    line_lower = line.lower()
    return any(keyword in line_lower for keyword in TOTAL_KEYWORDS)
