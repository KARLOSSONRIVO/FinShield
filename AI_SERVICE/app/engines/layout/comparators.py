"""
Layout Comparator Functions.

Helper functions for comparing specific aspects of invoice layouts.
"""
from typing import Dict, Any, List

def compare_field_presence(
    extracted: Dict, 
    template: Dict
) -> Dict[str, Any]:
    """Check if expected fields are present in the invoice."""
    template_fields = set(template.get("fields", []))
    invoice_fields = set(extracted.get("fields", []))
    
    if not template_fields:
        return {"score": 1.0, "match_ratio": 1.0, "missing": [], "extra": [], "flags": []}
    
    # Fields in template but not in invoice
    missing = list(template_fields - invoice_fields)
    
    # Fields in invoice but not in template (could be suspicious)
    extra = list(invoice_fields - template_fields)
    
    # Common fields
    common = template_fields & invoice_fields
    
    # Score based on presence of template fields
    match_ratio = len(common) / len(template_fields) if template_fields else 1.0
    
    flags = []
    if missing:
        flags.append(f"MISSING_FIELDS:{','.join(missing)}")
    if len(extra) > len(template_fields) * 0.5:
        flags.append("SUSPICIOUS_EXTRA_FIELDS")
    
    return {
        "score": match_ratio,
        "match_ratio": match_ratio,
        "template_count": len(template_fields),
        "invoice_count": len(invoice_fields),
        "common": list(common),
        "missing": missing,
        "extra": extra,
        "flags": flags,
    }

def compare_field_positions(
    extracted: Dict, 
    template: Dict
) -> Dict[str, Any]:
    """Compare positions of matched fields."""
    template_positions = template.get("positions", {})
    invoice_positions = extracted.get("positions", {})
    
    if not template_positions:
        return {"score": 1.0, "matched": 0, "mismatched": 0, "flags": []}
    
    matched = 0
    mismatched = 0
    mismatched_fields = []
    
    for field, template_pos in template_positions.items():
        invoice_pos = invoice_positions.get(field)
        
        if invoice_pos is None:
            continue  # Field not present, handled by presence check
        
        if template_pos == invoice_pos:
            matched += 1
        else:
            mismatched += 1
            mismatched_fields.append({
                "field": field,
                "expected": template_pos,
                "actual": invoice_pos
            })
    
    total = matched + mismatched
    score = matched / total if total > 0 else 1.0
    
    flags = []
    if mismatched_fields:
        flags.append(f"POSITION_MISMATCH:{len(mismatched_fields)}")
    
    return {
        "score": score,
        "matched": matched,
        "mismatched": mismatched,
        "mismatched_details": mismatched_fields,
        "flags": flags,
    }

def compare_element_count(
    extracted: Dict, 
    template: Dict
) -> Dict[str, Any]:
    """Compare element density."""
    template_count = template.get("element_count", 0)
    invoice_count = extracted.get("element_count", 0)
    
    if template_count == 0:
        return {"score": 1.0, "ratio": 1.0, "flags": []}
    
    # Calculate ratio (should be close to 1.0)
    ratio = invoice_count / template_count
    
    # Score based on how close ratio is to 1.0
    # Perfect match = 1.0, way off = 0.0
    if ratio > 1:
        deviation = ratio - 1
    else:
        deviation = 1 - ratio
    
    score = max(0, 1 - deviation)
    
    flags = []
    if ratio < 0.5:
        flags.append("LOW_ELEMENT_COUNT")
    elif ratio > 2.0:
        flags.append("HIGH_ELEMENT_COUNT")
    
    return {
        "score": score,
        "template_count": template_count,
        "invoice_count": invoice_count,
        "ratio": round(ratio, 2),
        "flags": flags,
    }

def compare_structure(
    extracted: Dict, 
    template: Dict,
    position_tolerance: float = 0.15
) -> Dict[str, Any]:
    """Compare overall document structure."""
    template_detected = template.get("detected_fields", {})
    invoice_detected = extracted.get("detected_fields", {})
    
    if not template_detected:
        return {"score": 1.0, "flags": []}
    
    position_scores = []
    
    for field, template_info in template_detected.items():
        invoice_info = invoice_detected.get(field)
        
        if not invoice_info:
            continue
        
        template_bbox = template_info.get("bbox", {})
        invoice_bbox = invoice_info.get("bbox", {})
        
        if template_bbox and invoice_bbox:
            # Calculate center distance
            t_cx = (template_bbox.get("x1", 0) + template_bbox.get("x2", 0)) / 2
            t_cy = (template_bbox.get("y1", 0) + template_bbox.get("y2", 0)) / 2
            i_cx = (invoice_bbox.get("x1", 0) + invoice_bbox.get("x2", 0)) / 2
            i_cy = (invoice_bbox.get("y1", 0) + invoice_bbox.get("y2", 0)) / 2
            
            distance = ((t_cx - i_cx) ** 2 + (t_cy - i_cy) ** 2) ** 0.5
            
            # Convert distance to score (0 distance = 1.0, >tolerance = 0.0)
            pos_score = max(0, 1 - (distance / position_tolerance))
            position_scores.append(pos_score)
    
    if not position_scores:
        return {"score": 1.0, "flags": []}
    
    avg_score = sum(position_scores) / len(position_scores)
    
    flags = []
    if avg_score < 0.5:
        flags.append("STRUCTURE_MISMATCH")
    
    return {
        "score": avg_score,
        "fields_compared": len(position_scores),
        "flags": flags,
    }


def compare_structural_features(
    extracted: Dict,
    template: Dict
) -> Dict[str, Any]:
    """
    Compare structural features to detect different templates.
    
    Compares element distributions, sizes, and spatial patterns
    to catch templates that have the same fields but different layouts.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    template_features = template.get("structural_features", {})
    invoice_features = extracted.get("structural_features", {})
    
    if not template_features or not invoice_features:
        logger.warning("Missing structural features - defaulting to score 1.0")
        return {"score": 1.0, "flags": [], "details": {}}
    
    scores = []
    details = {}
    flags = []
    
    # Compare quadrant density (spatial distribution)
    template_quads = template_features.get("quadrant_density", {})
    invoice_quads = invoice_features.get("quadrant_density", {})
    
    if template_quads and invoice_quads:
        quad_scores = []
        for quad in ["top_left", "top_right", "bottom_left", "bottom_right"]:
            t_count = template_quads.get(quad, 0)
            i_count = invoice_quads.get(quad, 0)
            
            # Skip quadrants where both are 0 - they don't provide meaningful comparison
            if t_count == 0 and i_count == 0:
                continue
            # If one has elements and other doesn't, that's a major mismatch
            elif t_count == 0 or i_count == 0:
                quad_scores.append(0.0)
            else:
                # Calculate similarity (ratio should be close to 1)
                ratio = min(t_count, i_count) / max(t_count, i_count)
                quad_scores.append(ratio)
        
        # If we have any quadrant scores to compare, use them
        if quad_scores:
            quad_avg = sum(quad_scores) / len(quad_scores)
            scores.append(quad_avg)
            details["quadrant_similarity"] = round(quad_avg, 3)
            
            if quad_avg < 0.85:  # Stricter threshold for quadrant similarity
                flags.append("SPATIAL_DISTRIBUTION_MISMATCH")
    
    # Compare element size patterns
    template_sizes = template_features.get("size_stats", {})
    invoice_sizes = invoice_features.get("size_stats", {})
    
    if template_sizes and invoice_sizes:
        size_scores = []
        
        for dimension in ["width", "height", "area"]:
            t_stats = template_sizes.get(dimension, {})
            i_stats = invoice_sizes.get(dimension, {})
            
            t_mean = t_stats.get("mean", 0)
            i_mean = i_stats.get("mean", 0)
            
            if t_mean > 0:
                # Calculate similarity based on mean size
                ratio = min(t_mean, i_mean) / max(t_mean, i_mean)
                size_scores.append(ratio)
        
        if size_scores:
            size_avg = sum(size_scores) / len(size_scores)
            scores.append(size_avg)
            details["size_similarity"] = round(size_avg, 3)
            
            if size_avg < 0.7:
                flags.append("ELEMENT_SIZE_MISMATCH")
    
    # Compare text length distribution
    template_text = template_features.get("text_length_stats", {})
    invoice_text = invoice_features.get("text_length_stats", {})
    
    if template_text and invoice_text:
        t_mean = template_text.get("mean", 0)
        i_mean = invoice_text.get("mean", 0)
        
        if t_mean > 0:
            text_ratio = min(t_mean, i_mean) / max(t_mean, i_mean)
            scores.append(text_ratio)
            details["text_length_similarity"] = round(text_ratio, 3)
            
            if text_ratio < 0.7:
                flags.append("TEXT_PATTERN_MISMATCH")
    
    # Calculate overall structural score with weighted components
    # Quadrant distribution is the most reliable indicator of different templates
    if scores:
        # Weight quadrant similarity more heavily (60%) vs size/text patterns (40%)
        quadrant_score = details.get("quadrant_similarity", 1.0)
        other_scores = [s for i, s in enumerate(scores) if i > 0]  # Skip first score (quadrant)
        
        if other_scores:
            other_avg = sum(other_scores) / len(other_scores)
            overall_score = (quadrant_score * 0.6) + (other_avg * 0.4)
        else:
            overall_score = quadrant_score
    else:
        overall_score = 1.0
    
    logger.info(f"Structural comparison: score={overall_score:.3f}, details={details}, flags={flags}")
    
    return {
        "score": overall_score,
        "details": details,
        "flags": flags,
    }
