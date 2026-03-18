# AI Service Anomaly Guide (Current)

## Overview
This guide describes anomaly detection as implemented in the current AI service.

Anomaly detection is one of three verification tools called by the agent orchestrator:
- Layout detection
- Anomaly detection
- Fraud detection

The orchestrator and score policy are defined in:
- `app/agent/orchestrator.py`
- `app/agent/prompt.py`

## Anomaly Layer Behavior
Implementation location:
- `app/pipelines/verification/stages/anomaly/layer.py`

Current design:
- Rule checks always run
- ML score runs when an org model is available
- Final anomaly score combines:
  - rules: 60%
  - ML: 40%

Current anomaly verdict thresholds:
- pass: score >= 0.75
- warn: score >= 0.50
- fail: score < 0.50

## Training Pipeline
Primary training script:
- `scripts/train_anomaly_models.py`

Supported commands:
```bash
python scripts/train_anomaly_models.py --check
python scripts/train_anomaly_models.py --all
python scripts/train_anomaly_models.py --org-id <ORG_ID>
```

Training script behavior:
- Fetches eligible organizations from MongoDB
- Applies incremental retrain decision
- Uses smart sampling for large datasets
- Trains Isolation Forest
- Uploads model to S3 and clears cache

## Key Runtime Config
From `.env` / settings:
- `ANOMALY_MIN_INVOICES` (minimum clean invoices to be eligible)
- `ANOMALY_MAX_TRAINING_SAMPLES`
- `ANOMALY_RECENT_WEIGHT`
- `ANOMALY_RECENT_DAYS`
- `ANOMALY_MIN_NEW_INVOICES` (current default in repo: 400)
- `ANOMALY_RETRAIN_INTERVAL_DAYS`
- `MAX_PARALLEL_TRAINING` (present in env; current train-all execution is sequential)

## Model Storage and Loading
Model loader:
- `app/engines/anomaly/model_loader.py`

Current S3 key format:
- `models/{org_id}/anomaly.pkl.gz`

Cache behavior:
- Shared Redis binary cache first
- Local fallback cache second
- S3 download on miss

Shared cache helper lives in:
- `app/utils/ml.py`

## Scheduler Integration
Scheduler entrypoint:
- `scripts/run_scheduler.py`

Schedule definitions:
- `scripts/scheduler.py`

Current schedule:
- health ping every 10 minutes
- anomaly training job every 3 days (2 AM start date anchor)
- fraud retraining monthly

## Change Note (March 2026)
This document replaces older references to `scripts/train_models.py` and aligns with the current anomaly implementation, model pathing, and scheduler behavior.
