# Anomaly Detection Implementation (Current)

## Scope
This document captures what is currently implemented in the AI service for anomaly detection.

## Runtime Layer
Primary layer implementation:
- `app/pipelines/verification/stages/anomaly/layer.py`

Supporting modules:
- Rules: `app/pipelines/verification/stages/anomaly/rules.py`
- ML helpers: `app/pipelines/verification/stages/anomaly/ml.py`
- Feature extraction: `app/engines/anomaly/feature_extractor.py`
- Model loading: `app/engines/anomaly/model_loader.py`
- Line-item parser: `app/engines/anomaly/line_item_parser.py`

## Current Scoring Logic
Internal anomaly-layer composition:
- rules score weight: 0.6
- ML score weight: 0.4

Rule-check weights:
- line item math: 0.50
- date validity: 0.20
- amount sanity: 0.15
- round-number check: 0.15

Verdict thresholds in anomaly layer:
- pass: >= 0.75
- warn: >= 0.50
- fail: < 0.50

## Feature Vector
Feature extractor currently builds a 9-feature vector:
1. total amount
2. subtotal
3. tax amount
4. tax rate
5. line-item count
6. invoice day of week
7. rounded amount flag
8. subtotal/total ratio
9. days since last clean invoice

## Model Lifecycle
Training script:
- `scripts/train_anomaly_models.py`

Current training pipeline:
1. identify organizations eligible by min invoice count
2. run incremental retrain check
3. fetch clean invoices
4. apply smart sampling when above max sample threshold
5. extract feature matrix
6. train Isolation Forest
7. persist model metadata
8. upload model to S3
9. clear cache

S3 model key format:
- `models/{org_id}/anomaly.pkl.gz`

## Incremental Retrain Rules
Incremental retrain decisions are driven by training metadata and thresholds from settings.
Typical conditions considered:
- model missing
- enough new invoices since last train
- elapsed retrain interval days

## Cache Strategy
Model loading uses shared utility cache strategy:
- Redis binary cache first
- local in-process cache fallback
- S3 fetch on miss

Shared cache helper:
- `app/utils/ml.py`

## Scheduler Execution
Scheduled execution is handled separately from API workers:
- process runner: `scripts/run_scheduler.py`
- schedule definition: `scripts/scheduler.py`

Anomaly training schedule currently configured as:
- every 3 days, anchored from a 2 AM start date

## Notes
- The current `train_all_organizations` implementation executes sequentially.
- `MAX_PARALLEL_TRAINING` exists in settings/env but is not actively used to parallelize all-org training in current script flow.

## Change Note (March 2026)
This replaces older planning content and stale references to `scripts/train_models.py`.
