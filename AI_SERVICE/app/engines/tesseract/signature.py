from typing import Dict, Any, List
import statistics
from app.core.constants import FIELD_LAYOUT_PATTERNS as FIELD_PATTERNS


def build_layout_signature(pages: List[Dict]) -> Dict[str, Any]:
    """
    Build a layout signature for template comparison.
    
    Captures both field-based and structural features to detect
    different invoice templates even if they have the same fields.
    """
    
    detected_fields = {}
    field_positions = {}
    
    if not pages:
        return {
            "fields": [], 
            "positions": {}, 
            "element_count": 0,
            "structural_features": {}
        }
    
    first_page = pages[0]
    elements = first_page.get("elements", [])
    
    # Extract field-based signature (existing logic)
    for element in elements:
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
    
    # Extract structural features to differentiate templates
    structural_features = _extract_structural_features(elements)
    
    return {
        "fields": list(detected_fields.keys()),
        "positions": field_positions,
        "detected_fields": detected_fields,
        "element_count": len(elements),
        "structural_features": structural_features,
    }


def _extract_structural_features(elements: List[Dict]) -> Dict[str, Any]:
    """
    Extract structural features from layout elements.
    
    These features capture the visual structure and layout patterns
    beyond just field names, helping distinguish different templates.
    """
    if not elements:
        return {}
    
    # Extract all bounding boxes
    bboxes = [e["bbox"] for e in elements if "bbox" in e]
    if not bboxes:
        return {}
    
    # Calculate element size statistics (bbox is dict with x1, y1, x2, y2)
    widths = [bbox["x2"] - bbox["x1"] for bbox in bboxes]
    heights = [bbox["y2"] - bbox["y1"] for bbox in bboxes]
    areas = [w * h for w, h in zip(widths, heights)]
    
    # Calculate position distributions
    x_positions = [(bbox["x1"] + bbox["x2"]) / 2 for bbox in bboxes]  # Center X
    y_positions = [(bbox["y1"] + bbox["y2"]) / 2 for bbox in bboxes]  # Center Y
    
    # Spatial density (elements per quadrant)
    max_x = max(bbox["x2"] for bbox in bboxes)
    max_y = max(bbox["y2"] for bbox in bboxes)
    mid_x = max_x / 2
    mid_y = max_y / 2
    
    quadrants = {
        "top_left": 0,
        "top_right": 0,
        "bottom_left": 0,
        "bottom_right": 0
    }
    
    for x, y in zip(x_positions, y_positions):
        if y < mid_y:
            if x < mid_x:
                quadrants["top_left"] += 1
            else:
                quadrants["top_right"] += 1
        else:
            if x < mid_x:
                quadrants["bottom_left"] += 1
            else:
                quadrants["bottom_right"] += 1
    
    # Text length distribution
    text_lengths = [len(e.get("text", "")) for e in elements]
    
    # Calculate statistics
    def safe_stats(values):
        if not values:
            return {"mean": 0, "median": 0, "stdev": 0}
        return {
            "mean": statistics.mean(values),
            "median": statistics.median(values),
            "stdev": statistics.stdev(values) if len(values) > 1 else 0
        }
    
    return {
        "element_count": len(elements),
        "size_stats": {
            "width": safe_stats(widths),
            "height": safe_stats(heights),
            "area": safe_stats(areas),
        },
        "position_distribution": {
            "x": safe_stats(x_positions),
            "y": safe_stats(y_positions),
        },
        "quadrant_density": quadrants,
        "text_length_stats": safe_stats(text_lengths),
        "page_dimensions": {
            "width": max_x,
            "height": max_y
        }
    }
