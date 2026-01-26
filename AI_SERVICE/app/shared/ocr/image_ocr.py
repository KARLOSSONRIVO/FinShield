import cv2
import pytesseract
import numpy as np

def preprocess_image(path: str):
    img = cv2.imread(path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.normalize(gray, None, 0, 255, cv2.NORM_MINMAX)
    gray = cv2.medianBlur(gray, 3)
    thresh = cv2.adaptiveThreshold(
        gray, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 31, 2
    )
    return thresh

def extract_words_with_confidence(path: str):
    img = preprocess_image(path)

    data = pytesseract.image_to_data(
        img,
        output_type=pytesseract.Output.DICT,
        config="--oem 3 --psm 6"
    )

    words = []
    n = len(data["text"])

    for i in range(n):
        text = data["text"][i].strip()
        conf = int(data["conf"][i])

        if text and conf > 0:
            words.append({
                "text": text,
                "confidence": conf / 100.0
            })

    return words

def extract_text_from_image(path: str):
    words = extract_words_with_confidence(path)
    text = " ".join(w["text"] for w in words)
    return text
