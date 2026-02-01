"""
Tesseract OCR Extractor.

This module acts as a facade, exposing functionality from:
- .simple (Basic text extraction)
- .layout (Layout extraction with bounding boxes)
"""
# Re-export key functions for backward compatibility
from .simple import extract_text_simple
from .layout import extract_text_with_layout
