# FinShield AI Service

Invoice processing and fraud detection microservice with OCR, layout analysis, anomaly detection, and fraud detection capabilities.

---

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
pip install -r requirements.txt
```

### Running the Service

**Windows Development:**
```powershell
python dev.py
```

**Linux/Mac Development:**
```bash
python dev.py
# Or use Gunicorn:
gunicorn app.main:app -c gunicorn.conf.py
```

**Production (Linux/Docker only):**
```bash
gunicorn app.main:app -c gunicorn.conf.py
# Or use the start script:
chmod +x start.sh && ./start.sh
```

> ⚠️ **Note:** Gunicorn requires Linux/Mac/WSL. On Windows, use `python dev.py` for development.

> 💡 Worker count auto-adjusts based on CPU cores. Override in `.env` with `UVICORN_WORKERS`.

---

## ⚙️ Configuration

Edit `.env` file:

```env
# Development (1 worker for local testing)
UVICORN_WORKERS=1

# Production (adjust based on your server)
# 1 CPU = 3 workers
# 2 CPU = 5 workers
# 4 CPU = 9 workers
UVICORN_WORKERS=5
```

---

## 🌐 API Endpoints

Server runs at: `http://0.0.0.0:8000`

### Main Endpoints:
- `GET /` - Health check
- `POST /precheck` - Pre-validate invoice before upload
- `POST /ocr/{invoice_id}` - Run OCR and AI verification on anchored invoice
- `POST /template/analyze` - Analyze organization invoice template

### Interactive Documentation:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## 📊 Performance

### Development (1 worker):
```
100 invoices → ~16 minutes (sequential)
Good for: Local testing
```

### Production (5 workers, 2 CPU):
```
100 invoices → ~3-4 minutes (parallel)
Good for: 1000-5000 invoices/day
```

### Production (9 workers, 4 CPU):
```
100 invoices → ~2 minutes (parallel)
Good for: 10,000+ invoices/day
```

Each invoice takes ~5-10 seconds to process (OCR + AI analysis).

---

## 🚢 Deployment

### Render.com
See [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) for complete setup guide.

**Quick config:**
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn app.main:app -c gunicorn.conf.py`
- **Environment Variables:** Set `UVICORN_WORKERS` based on plan

### Docker
```dockerfile
FROM python:3.11-slim
RUN apt-get update && apt-get install -y tesseract-ocr poppler-utils
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "app.main:app", "-c", "gunicorn.conf.py"]
```

---

## 🏗️ Architecture

### 3-Layer AI Verification Pipeline:

1. **Layout Detection Layer (60% weight)**
   - Compares invoice structure with organization template
   - Detects structural anomalies in document layout

2. **Anomaly Detection Layer (passive)**
   - Rule-based checks (60%): Line items, dates, amounts, round numbers
   - ML-based checks (40%): Isolation Forest per organization
   - Organization-specific models cached in memory

3. **Fraud Detection Layer (passive)**
   - Duplicate detection across organization history
   - Pattern analysis for known fraud schemes
   - Temporal anomaly checking
   - Customer validation

### ML Model Management:
- **Storage:** AWS S3
- **Training:** Automated weekly (Sundays 2 AM)
- **Cache:** In-memory per organization
- **First load:** ~150ms from S3
- **Subsequent:** <1ms (cached)

---

## 📁 Project Structure

```
AI_SERVICE/
├── app/
│   ├── main.py              # FastAPI application
│   ├── api/                 # API endpoints
│   ├── services/            # Business logic
│   ├── engines/             # OCR & AI engines
│   ├── pipelines/           # Verification pipeline
│   └── core/                # Config & utilities
├── scripts/                 # Training & scheduling
├── models/                  # ML model artifacts
├── gunicorn.conf.py        # Production server config
├── start.sh                # Quick start script
└── .env                    # Configuration
```
Windows:
```powershell
# Run development server
python dev.py

# With auto-reload (edit dev.py and add reload=True to uvicorn.run())
```

### Linux/Mac:
```bash
# Option 1: Use dev.py
python dev.py

# Option 2: Use Gunicorn with reload
gunicorn app.main:app -c gunicorn.conf.py --reload
```

Then run:
```bash
gunicorn app.main:app -c gunicorn.conf.py
```

### Run tests:
```bash
pytest tests/
```

---

## 📚 Documentation

- **[RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md)** - Complete Render.com deployment guide
- **[CONCURRENT_UPLOAD_FLOW.md](DOCS/CONCURRENT_UPLOAD_FLOW.md)** - How concurrent uploads are handled
- **[AI_SERVICE_GUIDE.md](DOCS/anomaly/AI_SERVICE_GUIDE.md)** - Architecture and scaling guide

---

## 🔐 Environment Variables

Required in `.env`:

```env
# MongoDB
MONGO_URI=mongodb+srv://...
MONGO_DB=finshield

# IPFS
IPFS_GATEWAY_BASE=https://gateway.pinata.cloud/ipfs

# AWS S3 (ML Models)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-southeast-2
MODEL_BUCKET_NAME=finshield-models

# Server
UVICORN_WORKERS=1
UVICORN_HOST=0.0.0.0
UVICORN_PORT=8000
```

---

## 📝 License

Private - FinShield Project
