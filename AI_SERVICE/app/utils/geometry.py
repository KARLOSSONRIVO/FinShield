"""
Geometry Utilities.

Helper functions for coordinate normalization and position labeling
used in OCR and Layout Detection.
"""
from typing import Dict


def normalize_bbox(bbox: Dict, img_width: int, img_height: int) -> Dict[str, float]:
    """Convert absolute bbox to normalized coordinates (0-1)."""
    x1 = bbox["left"] / img_width
    y1 = bbox["top"] / img_height
    x2 = (bbox["left"] + bbox["width"]) / img_width
    y2 = (bbox["top"] + bbox["height"]) / img_height
    
    return {
        "x1": round(x1, 4),
        "y1": round(y1, 4),
        "x2": round(x2, 4),
        "y2": round(y2, 4),
    }


def get_position_label(bbox: Dict[str, float]) -> str:
    """Determine position label (e.g., 'top-left') based on normalized bbox."""
    center_x = (bbox["x1"] + bbox["x2"]) / 2
    center_y = (bbox["y1"] + bbox["y2"]) / 2
    
    if center_x < 0.33:
        h_pos = "left"
    elif center_x > 0.66:
        h_pos = "right"
    else:
        h_pos = "center"
    
    if center_y < 0.33:
        v_pos = "top"
    elif center_y > 0.66:
        v_pos = "bottom"
    else:
        v_pos = "middle"
    
    return f"{v_pos}-{h_pos}"
