import os
from dotenv import load_dotenv
import shutil
from pydantic_settings import BaseSettings

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB")
IPFS_GATEWAY_BASE = os.getenv("IPFS_GATEWAY_BASE")

# Redis Configuration
REDIS_URL = os.getenv("REDIS_URL")

# AWS S3 Configuration for Model Storage
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
MODEL_BUCKET_NAME = os.getenv("MODEL_BUCKET_NAME", "finshield-models")

# Anomaly Detection Settings
ANOMALY_MIN_INVOICES = int(os.getenv("ANOMALY_MIN_INVOICES"))
ANOMALY_MATH_TOLERANCE = float(os.getenv("ANOMALY_MATH_TOLERANCE"))

# Model Training Optimization Settings
ANOMALY_MAX_TRAINING_SAMPLES = int(os.getenv("ANOMALY_MAX_TRAINING_SAMPLES"))
ANOMALY_RECENT_WEIGHT = float(os.getenv("ANOMALY_RECENT_WEIGHT"))  # 80% recent, 20% historical
ANOMALY_RECENT_DAYS = int(os.getenv("ANOMALY_RECENT_DAYS"))  # Last 90 days considered "recent"
MAX_PARALLEL_TRAINING = int(os.getenv("MAX_PARALLEL_TRAINING"))  # Train 3 orgs simultaneously

# Incremental Training Settings
ANOMALY_MIN_NEW_INVOICES = int(os.getenv("ANOMALY_MIN_NEW_INVOICES"))  # Retrain if 500+ new invoices
ANOMALY_RETRAIN_INTERVAL_DAYS = int(os.getenv("ANOMALY_RETRAIN_INTERVAL_DAYS"))  # Force retrain after 7 days


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
    ANOMALY_MAX_TRAINING_SAMPLES: int = ANOMALY_MAX_TRAINING_SAMPLES
    ANOMALY_RECENT_WEIGHT: float = ANOMALY_RECENT_WEIGHT
    ANOMALY_RECENT_DAYS: int = ANOMALY_RECENT_DAYS
    MAX_PARALLEL_TRAINING: int = MAX_PARALLEL_TRAINING
    ANOMALY_MIN_NEW_INVOICES: int = ANOMALY_MIN_NEW_INVOICES
    ANOMALY_RETRAIN_INTERVAL_DAYS: int = ANOMALY_RETRAIN_INTERVAL_DAYS
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Allow extra fields like UVICORN_* in .env


settings = Settings()

