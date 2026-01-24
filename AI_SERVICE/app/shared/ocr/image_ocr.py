import pytesseract
from PIL import Image

def extract_text_from_image(path: str) -> str:
    image = Image.open(path)
    return pytesseract.image_to_string(image)
