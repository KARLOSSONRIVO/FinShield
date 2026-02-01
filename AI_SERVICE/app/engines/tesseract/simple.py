"""
Simple Text Extraction (OCR/Precheck).
"""
from docx import Document
import pdfplumber
import pytesseract


def extract_text_from_pdf(path: str) -> str:
    """Extract text from PDF using pdfplumber with Tesseract fallback."""
    text_blocks = []

    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                text_blocks.append(text)
            else:
                # Fallback to OCR for scanned pages
                img = page.to_image(resolution=300).original
                ocr_text = pytesseract.image_to_string(img, config="--psm 6")
                if ocr_text:
                    text_blocks.append(ocr_text)

    return "\n".join(text_blocks)


def extract_text_from_docx(path: str) -> str:
    """Extract text from DOCX."""
    doc = Document(path)
    blocks = []

    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                if cell.text.strip():
                    blocks.append(cell.text)

    for p in doc.paragraphs:
        if p.text.strip():
            blocks.append(p.text)

    return "\n".join(blocks)


def extract_text_simple(path: str, filename: str) -> dict:
    """Simple text extraction for OCR and precheck services."""
    name = filename.lower()

    if name.endswith(".pdf"):
        return {
            "text": extract_text_from_pdf(path),
            "source": "tesseract"
        }

    if name.endswith(".docx"):
        return {
            "text": extract_text_from_docx(path),
            "source": "python-docx"
        }

    raise ValueError("UNSUPPORTED_FILE_TYPE")
