# FinShield AI Service Docs

This folder contains implementation documentation for the AI microservice used by FinShield.

## What Changed (March 2026)
- Verification orchestration now runs through the LLM agent orchestrator in `app/agent/orchestrator.py`.
- Scoring rules (weights, hard caps, compound penalties, verdict thresholds) are defined in `app/agent/prompt.py`.
- OCR service stores `aiRiskScore` as `round((1 - overall_score) * 100, 2)` in `app/services/ocr_service.py`.
- Template API endpoint is `POST /template/process` (not `/template/analyze`).
- Template cache invalidation endpoint is `POST /template/invalidate/{org_id}`.
- Scheduler runs as a dedicated process via `scripts/run_scheduler.py` and should not run inside each API worker.
- Scheduler cadence in `scripts/scheduler.py`:
  - Health ping every 10 minutes
  - Anomaly retraining every 3 days (2 AM start)
  - Fraud retraining monthly (day 1 at 3 AM)
- Redis usage includes:
  - Text client for JSON cache
  - Binary client for shared model caching across workers
  - Pub/Sub publish helper for AI completion events

## Runtime Endpoints
- `GET /` health status
- `POST /precheck/` invoice pre-validation
- `POST /ocr/{invoice_id}` OCR + AI verification
- `POST /template/process` template extraction
- `POST /template/invalidate/{org_id}` template cache invalidation
- `GET /docs` Swagger UI
- `GET /redoc` ReDoc

## Core Documents
- `COMPUTATION.md` scoring and verdict computation used by the orchestrator
- `CONCURRENT_UPLOAD_FLOW.md` current AI-side concurrency behavior
- `REDIS_SETUP.md` Redis setup and cache design
- `anomaly/AI_SERVICE_GUIDE.md` anomaly architecture and operation notes
- `anomaly/ANOMALY_DETECTION_IMPLEMENTATION.md` anomaly implementation details
- `anomaly/ANOMALY_DETECTION_LAYER.md` anomaly layer behavior
- `FRAUD/FRAUD_DETECTION_LAYER.md` fraud layer behavior
- `layout/LAYOUT_DETECTION_LAYER.md` layout layer behavior

## Notes
- This docs index is aligned to the current code paths and endpoint names.
- Legacy references such as `start.sh`, `RENDER_DEPLOYMENT.md`, and `MODEL_CACHING_COMPARISON.md` are not part of this folder at this time.
