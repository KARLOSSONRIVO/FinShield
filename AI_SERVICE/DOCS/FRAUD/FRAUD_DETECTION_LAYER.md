# Fraud Detection Layer (Current)

## Purpose
Fraud detection is the third verification layer and combines deterministic checks with ML probability scoring.

Code location:
- `app/pipelines/verification/stages/fraud/layer.py`

## Inputs
Expected context fields:
- `invoice_data`
- `organization_id`
- `invoice_id`

## Rule Components (Always Run)
Rule engines:
- duplicate detector
- customer validator
- pattern analyzer
- temporal checker

Current rule weights:
- duplicate: 0.30
- customer/vendor: 0.20
- pattern: 0.25
- temporal: 0.25

Rule score:
$$
rule\_score = (dup \times 0.30) + (customer \times 0.20) + (pattern \times 0.25) + (temporal \times 0.25)
$$

## ML Component
Model loader:
- `app/engines/fraud/model_loader.py`

Feature extractor:
- `app/engines/fraud/feature_extractor.py`

Hybrid weighting when model exists:
- rules: 0.75
- ML: 0.25

Hybrid score:
$$
final\_score = (rule\_score \times 0.75) + (ml\_score \times 0.25)
$$

Safety clamp:
- if `rule_score < 0.55`, final score is capped to not exceed rule score.

## Verdict Thresholds
Current fraud layer thresholds:
- pass: score >= 0.70
- warn: score >= 0.40
- fail: score < 0.40

## Outputs
Layer returns:
- `verdict`
- `score`
- `details` (rule and ML diagnostics)
- `flags` (detected fraud signals)

## Training
Fraud retraining script:
- `scripts/train_fraud_model.py`

Default schedule trigger source:
- `scripts/scheduler.py` (monthly job)

## Model Storage
Fraud loader uses shared model utility and constants-backed key/pathing.
- S3 access through shared utility in `app/utils/ml.py`
- local fallback load supported by fraud model loader

## Change Note (March 2026)
Updated to current rule weights, hybrid ratio, clamp behavior, and thresholds.
