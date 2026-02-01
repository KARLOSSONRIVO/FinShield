import os
from dotenv import load_dotenv
import shutil
from pydantic_settings import BaseSettings

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB")
IPFS_GATEWAY_BASE = os.getenv("IPFS_GATEWAY_BASE")

# AWS S3 Configuration for Model Storage
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
MODEL_BUCKET_NAME = os.getenv("MODEL_BUCKET_NAME", "finshield-models")

# Anomaly Detection Settings
ANOMALY_MIN_INVOICES = int(os.getenv("ANOMALY_MIN_INVOICES", "30"))
ANOMALY_MATH_TOLERANCE = float(os.getenv("ANOMALY_MATH_TOLERANCE", "0.02"))


class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # MongoDB
    MONGO_URI: str = MONGO_URI
    MONGO_DB: str = MONGO_DB
    
    # IPFS
    IPFS_GATEWAY_BASE: str = IPFS_GATEWAY_BASE
    
    # AWS S3 for Models
    AWS_ACCESS_KEY_ID: str = AWS_ACCESS_KEY_ID
    AWS_SECRET_ACCESS_KEY: str = AWS_SECRET_ACCESS_KEY
    AWS_REGION: str = AWS_REGION
    MODEL_BUCKET_NAME: str = MODEL_BUCKET_NAME
    
    # Anomaly Detection
    ANOMALY_MIN_INVOICES: int = ANOMALY_MIN_INVOICES
    ANOMALY_MATH_TOLERANCE: float = ANOMALY_MATH_TOLERANCE
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()

# Tesseract / Poppler Configuration
def _find_poppler_path() -> str | None:
    """Find Poppler installation path on Windows."""
    if shutil.which("pdftoppm"):
        return None
    
    possible_paths = [
        r"C:\ProgramData\poppler\Library\bin",
        r"C:\Program Files\poppler\Library\bin",
        r"C:\Program Files\poppler\bin",
        r"C:\poppler\Library\bin",
        r"C:\poppler\bin",
        r"C:\tools\poppler\Library\bin",
        os.path.expanduser(r"~\poppler\Library\bin"),
    ]
    
    for path in possible_paths:
        if os.path.exists(os.path.join(path, "pdftoppm.exe")):
            return path
    
    return None

POPPLER_PATH = _find_poppler_path()

