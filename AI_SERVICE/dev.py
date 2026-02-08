"""
Development server startup script.
Uses Uvicorn directly (works on Windows/Mac/Linux).

For production deployment, use: gunicorn app.main:app -c gunicorn.conf.py
"""
import os
import uvicorn
from dotenv import load_dotenv

load_dotenv()

if __name__ == "__main__":
    workers = int(os.getenv("UVICORN_WORKERS", "1"))
    host = os.getenv("UVICORN_HOST", "0.0.0.0")
    port = int(os.getenv("UVICORN_PORT", "8000"))
    
    print(f"🚀 Starting AI Service (Development) with {workers} worker(s) on {host}:{port}")
    print(f"   Production deployment: Use Gunicorn on Linux/Docker\n")
    
    # On Windows, uvicorn workers must be 1
    if workers > 1 and os.name == 'nt':
        print("⚠️  Note: Multiple workers limited on Windows, using 1 worker")
        workers = 1
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        workers=workers,
        log_level="info"
    )
