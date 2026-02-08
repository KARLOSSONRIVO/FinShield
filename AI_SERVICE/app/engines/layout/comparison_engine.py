"""
Layout Comparison Engine.

Handles the core logic of comparing an extracted invoice layout
against an organization's template layout.
"""
from typing import Dict, Any, List
from app.engines.layout.comparators import (
    compare_field_presence,
    compare_field_positions,
    compare_element_count,
    compare_structure,
    compare_structural_features
)

class LayoutComparisonEngine:
    """
    Engine for comparing invoice layouts against templates.
    """
    
    # Thresholds for scoring
    POSITION_TOLERANCE = 0.15  # 15% tolerance for position matching
    
    # Weights for scoring components
    # Structural features weighted heavily to catch template differences
    WEIGHTS = {
        "field_presence": 0.10,
        "field_positions": 0.15,
        "element_count": 0.10,
        "structure": 0.05,
        "structural_features": 0.60,  # High weight to catch template differences
    }
    
    # Critical fields that MUST be present
    CRITICAL_FIELDS = ["invoice_number", "total", "invoice_date"]

    def compare(
        self, 
        extracted: Dict[str, Any], 
        template: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Run full comparison between extracted layout and template.
        
        Returns:
            Dict containing:
            - total_score: float (0.0 to 1.0)
            - flags: List[str]
            - details: Dict (component breakdown)
        """
        # Run all comparisons
        field_presence = compare_field_presence(extracted, template)
        field_positions = compare_field_positions(extracted, template)
        element_count = compare_element_count(extracted, template)
        structure = compare_structure(
            extracted, 
            template, 
            position_tolerance=self.POSITION_TOLERANCE
        )
        structural_features = compare_structural_features(extracted, template)
        
        # Calculate weighted score, adjusting weights if structural features unavailable
        weights_to_use = self.WEIGHTS.copy()
        
        # If structural features are missing, redistribute that weight to other components
        if not template.get("structural_features") or not extracted.get("structural_features"):
            # Redistribute structural_features weight proportionally
            structural_weight = weights_to_use["structural_features"]
            weights_to_use["structural_features"] = 0
            
            # Redistribute to other components proportionally
            remaining_weight = 1.0 - structural_weight
            for key in ["field_presence", "field_positions", "element_count", "structure"]:
                weights_to_use[key] = weights_to_use[key] / remaining_weight
        
        total_score = (
            field_presence["score"] * weights_to_use["field_presence"] +
            field_positions["score"] * weights_to_use["field_positions"] +
            element_count["score"] * weights_to_use["element_count"] +
            structure["score"] * weights_to_use["structure"] +
            structural_features["score"] * weights_to_use["structural_features"]
        )
        
        # Collect flags
        flags = []
        flags.extend(field_presence.get("flags", []))
        flags.extend(field_positions.get("flags", []))
        flags.extend(element_count.get("flags", []))
        flags.extend(structure.get("flags", []))
        flags.extend(structural_features.get("flags", []))
        
        # Check critical field failures
        critical_missing = [
            f for f in self.CRITICAL_FIELDS 
            if f in field_presence.get("missing", [])
        ]
        
        if critical_missing:
            flags.append(f"CRITICAL_FIELDS_MISSING:{','.join(critical_missing)}")
            total_score *= 0.5  # Heavy penalty for missing critical fields
            
        return {
            "total_score": total_score,
            "flags": flags,
            "details": {
                "field_presence": field_presence,
                "field_positions": field_positions,
                "element_count": element_count,
                "structure": structure,
                "structural_features": structural_features,
            }
        }
