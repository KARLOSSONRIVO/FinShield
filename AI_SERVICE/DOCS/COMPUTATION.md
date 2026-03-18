# Verification Computation (Current)

This document describes how the AI service computes final invoice risk and verdict.

## Source of Truth
- Scoring policy is defined in `app/agent/prompt.py`.
- Orchestration is executed in `app/agent/orchestrator.py`.
- Persisted database fields are applied in `app/services/ocr_service.py`.

## Layer Weights
The orchestrator uses three layers and applies weighted scoring:
- Layout detection: 0.10
- Anomaly detection: 0.35
- Fraud detection: 0.55

Base weighted score:

$$
\text{overall\_score} = (S_{layout} \times 0.10) + (S_{anomaly} \times 0.35) + (S_{fraud} \times 0.55)
$$

If any layer returns skip, remaining weights are re-normalized proportionally.

## Hard Caps
After base weighted score, the orchestrator applies hard caps using flag matches.
The lowest matching cap wins.

Examples of cap rules:
- `DUPLICATE_EXACT` -> max 0.20
- `DUPLICATE_NUMBER` -> max 0.25
- `TEMPORAL_FUTURE` -> max 0.35
- `MATH_MISCALCULATION` -> max 0.35
- `HIGH_TAX_RATE (>50%)` -> max 0.20
- `HIGH_TAX_RATE (>25%)` -> max 0.35
- `SINGLE_ITEM` -> max 0.45
- `ROUND_NUMBER (>= $10k)` -> max 0.40

Domain override rules in the prompt can enforce stricter caps than the generic list.

## Compound Penalty
After caps, a compound penalty is applied for multiple severe flags.

Severe list includes items such as:
- `TEMPORAL_FUTURE`
- `DUPLICATE_EXACT`
- `DUPLICATE_NUMBER`
- `PATTERN_ROUND`
- `ROUND_NUMBER`
- `MATH_MISCALCULATION`
- `HIGH_TAX_RATE`
- `SINGLE_ITEM`

Penalty rule:
- If severe_count <= 2: no compound penalty
- If severe_count > 2:

$$
\text{penalty} = \min((\text{severe\_count} - 2) \times 0.10, 0.50)
$$

$$
\text{overall\_score} = \text{overall\_score} \times (1 - \text{penalty})
$$

## Verdict Thresholds
Final thresholds:
- overall_score >= 0.85 -> clean, risk_level low
- overall_score >= 0.50 -> flagged, risk_level medium
- overall_score < 0.50 -> fraudulent, risk_level high

## Stored Risk Field
The API stores `aiRiskScore` on a 0 to 100 riskier-is-higher scale:

$$
aiRiskScore = \text{round}((1 - overall\_score) \times 100, 2)
$$

This transformation is performed in `app/services/ocr_service.py`.

## Output Fields Returned by AI Service
The OCR endpoint returns:
- `aiRiskScore`
- `aiVerdict` (clean or flagged in DB mapping)
- `riskLevel`
- `aiSummary`
- `layerResults`
- `allFlags`

## Change Note (March 2026)
This replaced the older static pipeline-runner documentation.
Scoring policy is now prompt-governed and enforced by the agent orchestrator flow.
