import os
from dotenv import load_dotenv
import shutil

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB = os.getenv("MONGO_DB")
IPFS_GATEWAY_BASE = os.getenv("IPFS_GATEWAY_BASE")

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

