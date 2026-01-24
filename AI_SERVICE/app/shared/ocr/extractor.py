from .image_ocr import extract_text_from_image
from .pdf_ocr import extract_text_from_pdf
from .docs_ocr import extract_text_from_doc

def extract_text(path: str, filename: str) -> str:
    if filename.endswith(".pdf"):
        return extract_text_from_pdf(path)

    if filename.endswith(".docx"):
        return extract_text_from_doc(path)

    if filename.endswith((".png", ".jpg", ".jpeg")):
        return extract_text_from_image(path)

    raise ValueError("Unsupported file type")
