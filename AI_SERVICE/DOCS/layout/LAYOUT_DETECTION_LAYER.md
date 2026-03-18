# Layout Detection Layer (Current)

## Purpose
Layout detection is stage 1 of verification. It compares extracted invoice structure to organization template structure.

Code location:
- `app/pipelines/verification/stages/layout/layer.py`

Comparison engine:
- `app/engines/layout/comparison_engine.py`

## Inputs
Expected context fields:
- `extracted_layout`
- `template_layout`

## Decision Flow
1. If template missing or no template fields:
- verdict: skip
- score: 1.0
- flag: `NO_TEMPLATE`

2. If extracted layout missing or no extracted fields:
- verdict: fail
- score: 0.0
- flag: `EXTRACTION_FAILED`

3. Otherwise run comparison engine and score weighted components.

## Current Thresholds
Layout layer thresholds currently in code:
- pass: score >= 0.70
- warn: score >= 0.45
- fail: score < 0.45

These are intentionally less strict than older documentation to reduce false warnings from minor positional drift.

## Comparison Weights
Engine weights:
- field presence: 0.10
- field positions: 0.15
- element count: 0.10
- structure: 0.05
- structural features: 0.60

If structural features are unavailable, weights are redistributed across remaining components.

## Critical Field Penalty
Critical fields:
- `invoice_number`
- `total`
- `invoice_date`

If critical fields are missing, engine applies heavy penalty by halving total score and adds `CRITICAL_FIELDS_MISSING:...` flag.

## Output Shape
Layer result includes:
- `verdict`
- `score`
- `flags`
- `details`

Engine details intentionally omit per-field mismatch internals to keep downstream summaries generic and avoid exposing low-level layout coordinates.

## Change Note (March 2026)
Updated from legacy thresholds and aligned to current comparison engine behavior.
