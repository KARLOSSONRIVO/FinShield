from app.shared.ocr.pdf_ocr import extract_text_from_pdf
from app.shared.ocr.docs_ocr import extract_text_from_doc

def extract_text(path: str, filename: str) -> dict:
    name = filename.lower()

    if name.endswith(".pdf"):
        return {
            "text": extract_text_from_pdf(path),
            "source": "document"
        }

    if name.endswith(".docx"):
        return {
            "text": extract_text_from_doc(path),
            "source": "document"
        }

    raise ValueError("UNSUPPORTED_FILE_TYPE")
