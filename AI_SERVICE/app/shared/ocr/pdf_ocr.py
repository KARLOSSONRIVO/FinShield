import pdfplumber
import tempfile
import pytesseract
from PIL import Image

def extract_text_from_pdf(path: str) -> str:
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
