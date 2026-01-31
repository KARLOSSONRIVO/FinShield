"""
Precheck Service - Pre-validation logic for invoice files.
"""
import tempfile
import os

from app.engines.tesseract.extractor import extract_text_simple
from app.engines.tesseract.quality import is_image_blurry
from app.engines.tesseract.constants import MIN_TEXT_LENGTH
from app.engines.tesseract.invoice_detector import is_likely_invoice
from app.schemas.precheck import PreCheckResponse

SUPPORTED_EXTENSIONS = (".png", ".jpg", ".jpeg", ".pdf", ".docx")


async def run_precheck(file):
    """
    Run pre-validation checks on an uploaded invoice file.
    
    Checks:
    1. File type support
    2. Image blur detection
    3. Text extraction viability
    4. Minimum text length
    5. Invoice-likeness score
    """
    filename = file.filename.lower()

    if not filename.endswith(SUPPORTED_EXTENSIONS):
        return PreCheckResponse(
            processable=False,
            reason="UNSUPPORTED_FILE_TYPE"
        )

    with tempfile.NamedTemporaryFile(delete=False) as tmp:
        content = await file.read()
        tmp.write(content)
        path = tmp.name

    try:
        # Image blur check (images only)
        if filename.endswith((".png", ".jpg", ".jpeg")):
            if is_image_blurry(path):
                return PreCheckResponse(
                    processable=False,
                    reason="IMAGE_TOO_BLURRY"
                )

        # Extract text (OCR or parsing)
        try:
            result = extract_text_simple(path, filename)
            text = result["text"]
        except Exception:
            return PreCheckResponse(
                processable=False,
                reason="TEXT_EXTRACTION_FAILED"
            )

        # Minimum text viability
        if not text or len(text.strip()) < MIN_TEXT_LENGTH:
            return PreCheckResponse(
                processable=False,
                reason="INSUFFICIENT_TEXT"
            )

        # Invoice-likeness check
        if not is_likely_invoice(text):
            return PreCheckResponse(
                processable=False,
                reason="DOCUMENT_NOT_INVOICE"
            )

        # Optional warnings (non-blocking)
        warnings = []

        return PreCheckResponse(
            processable=True,
            warnings=warnings,
            extractedText=text
        )

    finally:
        os.remove(path)
