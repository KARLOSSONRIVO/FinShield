"""
Gunicorn configuration for production deployment.
Optimized for Linux/Docker environments (e.g., Render, Railway, Heroku).

Usage:
    gunicorn app.main:app -c gunicorn.conf.py
"""
import os
import multiprocessing

# Number of worker processes
# Formula: (CPU_CORES × 2) + 1
# If UVICORN_WORKERS is set, use it; otherwise auto-calculate
workers = int(os.getenv("UVICORN_WORKERS", (multiprocessing.cpu_count() * 2) + 1))

# Worker class - use Uvicorn workers for ASGI
worker_class = "uvicorn.workers.UvicornWorker"

# Bind address
bind = f"{os.getenv('UVICORN_HOST', '0.0.0.0')}:{os.getenv('UVICORN_PORT', '8000')}"

# Logging
accesslog = "-"  # Log to stdout
errorlog = "-"   # Log to stderr
loglevel = "info"

# Worker timeout settings
graceful_timeout = 120  # Time to wait for workers to finish requests on shutdown
timeout = 120           # Workers silent for more than this are killed and restarted

# Connection settings
keepalive = 5           # Seconds to wait for requests on a Keep-Alive connection

# Performance optimization
preload_app = True      # Load application code before forking workers (faster startup)

# Worker lifecycle
max_requests = 1000     # Restart workers after this many requests (prevents memory leaks)
max_requests_jitter = 50  # Add random jitter to max_requests to avoid all workers restarting at once

# For debugging (uncomment if needed)
# reload = True         # Auto-reload on code changes (development only)
# reload_extra_files = []  # Additional files to watch
