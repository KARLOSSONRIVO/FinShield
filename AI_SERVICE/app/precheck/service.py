import tempfile
import os

from app.shared.ocr.extractor import extract_text
from app.shared.ocr.quality import is_image_blurry
from app.shared.ocr.constants import MIN_TEXT_LENGTH
from app.shared.ocr.invoice_detector import is_likely_invoice
from app.precheck.schemas import PreCheckResponse

SUPPORTED_EXTENSIONS = (".png", ".jpg", ".jpeg", ".pdf", ".docx")

async def run_precheck(file):
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
        # 1️⃣ Image blur check (images only)
        if filename.endswith((".png", ".jpg", ".jpeg")):
            if is_image_blurry(path):
                return PreCheckResponse(
                    processable=False,
                    reason="IMAGE_TOO_BLURRY"
                )

        # 2️⃣ Extract text (OCR or parsing)
        try:
            text = extract_text(path, filename)
        except Exception:
            return PreCheckResponse(
                processable=False,
                reason="TEXT_EXTRACTION_FAILED"
            )

        # 3️⃣ Minimum text viability
        if not text or len(text.strip()) < MIN_TEXT_LENGTH:
            return PreCheckResponse(
                processable=False,
                reason="INSUFFICIENT_TEXT"
            )

        # 4️⃣ Invoice-likeness decision (THIS WAS MISSING)
        if not is_likely_invoice(text):
            return PreCheckResponse(
                processable=False,
                reason="DOCUMENT_NOT_INVOICE"
            )

        # 5️⃣ Optional warnings (non-blocking)
        warnings = []

        return PreCheckResponse(
            processable=True,
            warnings=warnings,
            extractedText=text
        )

    finally:
        os.remove(path)
