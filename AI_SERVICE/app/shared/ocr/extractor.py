from app.shared.ocr.image_ocr import extract_text_from_image
from app.shared.ocr.pdf_ocr import extract_text_from_pdf
from app.shared.ocr.docs_ocr import extract_text_from_doc

def extract_text(path: str, filename: str):
    name = filename.lower()

    if name.endswith((".png", ".jpg", ".jpeg")):
        # returns (text, words)
        return extract_text_from_image(path)

    if name.endswith(".pdf"):
        return extract_text_from_pdf(path), None

    if name.endswith(".docx"):
        return extract_text_from_doc(path), None

    raise ValueError("UNSUPPORTED_FILE_TYPE")
