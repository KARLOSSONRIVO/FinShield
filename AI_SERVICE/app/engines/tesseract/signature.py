"""
Layout Signature Builder.
"""
from typing import Dict, Any, List


def build_layout_signature(pages: List[Dict]) -> Dict[str, Any]:
    """Build a layout signature for template comparison."""
    FIELD_PATTERNS = {
        "invoice_number": [
            "invoice no.", "invoice no", "invoice #", "invoice number", 
            "inv no", "inv #", "no:", "no.", "inv.", "invoice"
        ],
        "invoice_date": [
            "invoice date", "date:", "date", "issue date", "dated", 
            "01/", "02/", "03/", "04/", "05/", "06/", "07/", "08/", "09/", "10/", "11/", "12/"
        ],
        "due_date": ["due date", "payment due", "due:", "due "],
        "total": [
            "total", "grand total", "total amount", "amount due", 
            "balance due", "balance", "net amount", "total due"
        ],
        "subtotal": ["subtotal", "sub total", "sub-total", "sub total"],
        "tax": ["tax", "vat", "gst", "sales tax", "tax:"],
        "vendor": [
            "from:", "seller:", "vendor:", "bill from", "company", 
            "company name", "seller", "vendor"
        ],
        "customer": [
            "to:", "bill to:", "customer:", "client:", "sold to", 
            "issued to", "ship to", "deliver to", "issued", "billed to"
        ],
    }
    
    detected_fields = {}
    field_positions = {}
    
    if not pages:
        return {"fields": [], "positions": {}, "element_count": 0}
    
    first_page = pages[0]
    
    for element in first_page.get("elements", []):
        text_lower = element["text"].lower().strip()
        
        for field_name, patterns in FIELD_PATTERNS.items():
            if field_name in detected_fields:
                continue
                
            for pattern in patterns:
                if pattern in text_lower:
                    detected_fields[field_name] = {
                        "text": element["text"],
                        "bbox": element["bbox"],
                        "position": element["position"],
                        "confidence": element["confidence"],
                    }
                    field_positions[field_name] = element["position"]
                    break
    
    return {
        "fields": list(detected_fields.keys()),
        "positions": field_positions,
        "detected_fields": detected_fields,
        "element_count": len(first_page.get("elements", [])),
    }
