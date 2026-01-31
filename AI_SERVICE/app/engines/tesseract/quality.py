"""
Image quality checks using OpenCV.
"""
import cv2
from .constants import MIN_LAPLACIAN_VARIANCE


def is_image_blurry(path: str) -> bool:
    """Check if an image is too blurry using Laplacian variance."""
    image = cv2.imread(path, cv2.IMREAD_GRAYSCALE)
    variance = cv2.Laplacian(image, cv2.CV_64F).var()
    return variance < MIN_LAPLACIAN_VARIANCE
