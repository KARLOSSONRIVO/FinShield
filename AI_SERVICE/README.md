# FinShield AI Service

FastAPI-based AI/ML microservice for invoice processing, OCR, template analysis, anomaly checks, and fraud-related pipelines.

## Features
- OCR processing for anchored invoices
- Template processing and extraction
- Precheck endpoint for uploaded files
- Redis-backed cache support
- Separate scheduler process for background model tasks

## Tech Stack
- Python 3.11+
- FastAPI + Uvicorn/Gunicorn
- Redis
- Tesseract OCR + Poppler
- Scikit-learn / sentence-transformers

## Project Structure
- `app/main.py` - FastAPI entrypoint
- `app/api/` - API routers (`/precheck`, `/ocr`, `/template`)
- `scripts/run_scheduler.py` - Background scheduler runner
- `dev.py` - Local development launcher
- `docker-compose.yml` - API + Redis + scheduler containers

## Prerequisites
### Local development
- Python 3.11+
- Pip
- Redis running locally (`redis://localhost:6379`)
- System packages required by OCR stack:
  - Tesseract OCR
  - Poppler

### Docker development
- Docker Desktop
- Docker Compose

## Environment Variables
This service reads variables from `.env`.

Minimum required variables for local usage:
- `MONGO_URI`
- `MONGO_DB`
- `SERVICE_URL`
- `IPFS_GATEWAY_BASE`
- `CHAIN_RPC_URL`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `MODEL_BUCKET_NAME`
- `GROQ_API_KEY`
- `REDIS_URL`

Optional server variables:
- `UVICORN_WORKERS`
- `UVICORN_HOST`
- `UVICORN_PORT`
- `UVICORN_RELOAD`

## Install and Run (Local)
1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Start Redis (if not already running):
```bash
redis-server
```

3. Start the API:
```bash
python dev.py
```

The API is available at `http://localhost:8000`.

## Run with Docker Compose
From the `AI_SERVICE` folder:
```bash
docker compose up --build
```

Services started:
- `ai_service` on port `8000`
- `redis` on port `6379`
- `ai_scheduler` (background jobs)

Stop services:
```bash
docker compose down
```

## API Endpoints
- `GET /` - Service health
- `POST /precheck/` - Pre-validate uploaded invoice file
- `POST /ocr/{invoice_id}` - Run OCR + verification flow for invoice
- `POST /template/process` - Process template file (PDF/DOCX)
- `POST /template/invalidate/{org_id}` - Invalidate cached template data

## Health Check
```bash
curl http://localhost:8000/
```

Expected response includes:
- service name
- status
- version
- redis connection status

## Production Notes
- Docker image uses Gunicorn (`gunicorn app.main:app -c gunicorn.conf.py`).
- Scheduler must remain a separate process/container to avoid duplicate jobs.
- For Linux production, set worker count through `UVICORN_WORKERS`.

## Troubleshooting
- Redis connection errors:
  - Confirm `REDIS_URL` and Redis process/container status.
- OCR errors:
  - Ensure Tesseract and Poppler are installed and available in PATH.
- Startup failures:
  - Verify all required `.env` values are present and valid.
