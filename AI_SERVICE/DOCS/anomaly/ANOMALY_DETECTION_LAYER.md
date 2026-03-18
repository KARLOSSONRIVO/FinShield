# Anomaly Detection Layer (Current)

## Purpose
The anomaly layer validates mathematical consistency and detects contextual outliers per organization.

Code location:
- `app/pipelines/verification/stages/anomaly/layer.py`

## Inputs
Expected context fields:
- `invoice_data`
- `organization_id`
- `raw_text` (for line item parser fallback)

## Processing Steps
1. Run rule checks (always):
- line-item total verification
- date validity
- amount sanity
- round-number detection

2. Compute rule score with weights:
- line items: 0.50
- date: 0.20
- amount: 0.15
- round number: 0.15

3. Attempt org model load via:
- `app/engines/anomaly/model_loader.py`

4. If model exists:
- extract features
- predict anomaly score
- combine with rule score (rules 0.6, ML 0.4)
- add plain-English ML anomaly flag if ML score < 0.5

5. If model does not exist:
- final score = rule score

## Verdict Thresholds
- pass: final score >= 0.75
- warn: final score >= 0.50
- fail: final score < 0.50

## Returned Result
Layer returns:
- `verdict`
- `score`
- `details` (currently minimal; includes model usage indicator)
- `flags` (human-readable issues)

The layer avoids exposing raw internal score breakdowns in details to prevent LLM overfitting on internal intermediate values.

## Feature Extraction Summary
Current anomaly features (`app/engines/anomaly/feature_extractor.py`):
- total amount
- subtotal
- tax amount
- tax rate
- line item count
- invoice day of week
- rounded amount flag
- subtotal/total ratio
- days since last clean invoice

## Training and Refresh
Training command:
```bash
python scripts/train_anomaly_models.py --all
```

Single org retrain:
```bash
python scripts/train_anomaly_models.py --org-id <ORG_ID>
```

Scheduler can trigger periodic retrain checks through:
- `scripts/scheduler.py`

## Change Note (March 2026)
Updated to current layer implementation and removed older thresholds/script references.
