"""
Tesseract Extraction Submodules.

This package contains extraction logic for different use cases:
- simple: Basic text extraction for OCR/precheck
- layout: Layout extraction with bounding boxes for template/AI services
"""
from .simple import extract_text_simple
from .layout import extract_text_with_layout

__all__ = ["extract_text_simple", "extract_text_with_layout"]
