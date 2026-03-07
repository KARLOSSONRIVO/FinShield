# Anomaly Detection Layer - Team Documentation

## 📋 Table of Contents
- [Overview](#overview)
- [How It Works](#how-it-works)
- [The Two-Part System](#the-two-part-system)
- [Feature Extraction](#feature-extraction)
- [Rule-Based Checks](#rule-based-checks)
- [ML Model Detection](#ml-model-detection)
- [Scoring & Verdicts](#scoring--verdicts)
- [Model Training](#model-training)
- [API Endpoints](#api-endpoints)
- [Configuration](#configuration)

---

## Overview

The **Anomaly Detection Layer** is the second stage in our 3-layer verification pipeline. It validates invoices using a **hybrid approach** that combines:

1. **Rule-Based Checks (60%)** - Universal mathematical and logical validation
2. **ML Model (40%)** - Organization-specific pattern detection using Isolation Forest

> **Note on prompt weights**: The agent prompt weights the anomaly layer at **35%** of the overall score (layout 10%, fraud 55%). The 60/40 split above is the *internal* anomaly layer weighting between rules and ML.

**Purpose**: Detect invoices that deviate from normal patterns, even if they pass basic validation.

**Location**: `app/pipelines/verification/stages/anomaly.py`

---

## How It Works

### The Flow

```
Invoice Uploaded
    ↓
OCR Extraction (text, amounts, dates)
    ↓
[Anomaly Detection Layer]
    ├─ Rule-Based Checks (Always Runs)
    │   ├─ Math Verification (50%)
    │   ├─ Date Validation (20%)
    │   ├─ Amount Sanity (15%)
    │   └─ Round Number Detection (15%)
    │
    └─ ML Model (If Available)
        ├─ Extract 9 Features
        ├─ Load Org-Specific Model from S3
        ├─ Predict Anomaly Score
        └─ explain_ml_anomaly() → plain-English flag text
    ↓
Combined Score (60% rules + 40% ML)
    ↓
Verdict: PASS (score≥0.75) | WARN (score≥0.50) | FAIL (score<0.50)
```

> **PASS threshold**: 0.75 | **WARN threshold**: 0.50 (layout layer uses different thresholds: 0.70/0.45)

---

## The Two-Part System

### Part 1: Rule-Based Checks (60% weight)

**Always runs**, no ML model needed. Catches obvious errors:

| Check | Weight | What It Does |
|-------|--------|--------------|
| **Math Verification** | 50% | Verifies subtotal + tax = total |
| **Date Validation** | 20% | Checks for future/old dates |
| **Amount Sanity** | 15% | Flags negative or extreme amounts |
| **Round Numbers** | 15% | Detects suspiciously round amounts |

### Part 2: ML Model (40% weight)

**Only runs if organization has a trained model**. Detects subtle patterns:

- Learns what's "normal" for each organization
- Compares new invoices against historical patterns
- Flags invoices that deviate from expected behavior (when `ml_score < 0.5`)
- `explain_ml_anomaly(features, ml_score)` in `ml.py` produces a plain-English reason string describing what triggered the flag (e.g. "invoice amount ($X) differs from this organisation's usual invoice amounts", "unusually high tax rate", "weekend submission with unusually long gap since last invoice")
- The LLM receives only `{"model_used": bool}` in `details` — raw check scores are **not** passed to the LLM. All ML explanations live in the `flags` list text only.

---

## Feature Extraction

Before the ML model can analyze an invoice, we extract **9 numerical features**:

**Code**: `app/engines/anomaly/feature_extractor.py`

### The 9 Features

| # | Feature | Description | Example |
|---|---------|-------------|---------|
| 1 | `total_amount` | Final invoice total | `$224.00` |
| 2 | `subtotal` | Pre-tax amount | `$200.00` |
| 3 | `tax_amount` | Tax charged | `$24.00` |
| 4 | `tax_rate` | Calculated: tax/subtotal | `0.12` (12%) |
| 5 | `line_item_count` | Number of line items | `5` |
| 6 | `invoice_day_of_week` | 0=Monday, 6=Sunday | `2` (Tuesday) |
| 7 | `amount_rounded` | Binary: round number? | `0` (not round) |
| 8 | `subtotal_tax_ratio` | Calculated: subtotal/total | `0.89` |
| 9 | `days_since_last` | Days since last invoice | `7` |

**Example Feature Vector**:
```python
[224.0, 200.0, 24.0, 0.12, 5, 2, 0, 0.89, 7]
```

---

## Rule-Based Checks

### 1. Math Verification (50% weight)

**Checks**: Does `subtotal + tax = total`?

```python
# Example: Your invoice
subtotal = $200.00
tax = $24.00
total = $224.00

expected = $200 + $24 = $224
discrepancy = |$224 - $224| = $0 (0%)

✓ Score: 1.0 (Perfect!)
```

**Scoring**:
- ≤ 2% discrepancy → Score: `1.0` ✓
- ≤ 5% discrepancy → Score: `0.6` ⚠️
- ≤ 10% discrepancy → Score: `0.3` ⚠️
- > 10% discrepancy → Score: `0.0` ✗

### 2. Date Validation (20% weight)

**Checks**: Is the invoice date logical?

```python
# Check 1: Future dates (> 30 days)
if invoice_date > today + 30 days:
    Score: 0.0 ✗
    Issue: "Invoice dated X days in future"

# Check 2: Very old (> 1 year)
if invoice_date < today - 365 days:
    Score: 0.5 ⚠️
    Issue: "Invoice dated X days ago (over 1 year)"

# Otherwise
Score: 1.0 ✓
```

### 3. Amount Sanity (15% weight)

**Checks**: Is the amount reasonable?

```python
if total <= 0:
    Score: 0.0 ✗
    Issue: "Invalid total amount"

if total > $1,000,000:
    Score: 0.3 ⚠️
    Issue: "Unusually high amount"

# Otherwise
Score: 1.0 ✓
```

### 4. Round Number Detection (15% weight)

**Checks**: Is it suspiciously round?

```python
if total % 1000 == 0:  # e.g., $5,000
    Score: 0.5 ⚠️
    Issue: "Suspiciously round amount"

if total % 100 == 0:   # e.g., $500
    Score: 0.7 ⚠️
    Issue: "Round amount detected"

# Otherwise
Score: 1.0 ✓
```

### Calculating Rule Score

```python
rule_score = (
    math_score × 0.50 +
    date_score × 0.20 +
    amount_score × 0.15 +
    round_score × 0.15
)
```

---

## ML Model Detection

### How It Works

**Code**: `app/engines/anomaly/model_loader.py`

1. **Load Organization-Specific Model**
   ```python
   model = get_model_from_s3(organization_id)
   # → s3://finshield-models/models/org_{id}_anomaly.pkl.gz
   ```

2. **Extract Features**
   ```python
   features = feature_extractor.extract_features(invoice_data, org_id, db)
   # → [224.0, 200.0, 24.0, 0.12, 5, 2, 0, 0.89, 7]
   ```

3. **Predict Anomaly Score**
   ```python
   raw_score = model.decision_function([features])[0]
   # Normalize to 0-1 range (1.0 = normal, 0.0 = anomaly)
   ml_score = (raw_score + 1.5) / 3.0
   ```

### Performance & Caching

To ensure low latency, models are **cached in memory** after loading:

- **First Request**: Downloads from S3 (~150ms) → Caches in memory
- **Subsequent Requests**: Serves from memory (< 1ms) ⚡
- **Cache Invalidation**: Automatically cleared after retraining

**Code**: `app/engines/anomaly/model_loader.py` (Global `MODEL_CACHE` dict)

### What the Model Learns

Each organization's model is trained **only on their historical invoices**:

**Example: Coffee Shop**
```
Trained on 5,000 historical invoices
Learned patterns:
- Typical amount: $700-$1,200
- Typical items: 10-20
- Typical frequency: Every 2-7 days
- Typical tax rate: 8-10%
- Typical days: Monday-Friday
```

**Example: Law Firm**
```
Trained on 3,000 historical invoices
Learned patterns:
- Typical amount: $8,000-$18,000
- Typical items: 1-3
- Typical frequency: Every 28-32 days (monthly)
- Typical tax rate: 10-12%
```

### Isolation Forest Algorithm

- **No labels needed** - Learns from normal invoices only
- **Builds 100 decision trees** - Each tree isolates anomalies
- **Measures isolation depth**:
  - Normal invoices: Hard to isolate (many splits needed)
  - Anomalous invoices: Easy to isolate (few splits needed)

---

## Scoring & Verdicts

### Combining Scores

**If model exists**:
```python
final_score = (rule_score × 0.6) + (ml_score × 0.4)
```

**If no model**:
```python
final_score = rule_score  # 100% rules
```

### Verdict Thresholds

| Score Range | Verdict | Risk Level | Meaning |
|-------------|---------|------------|---------|
| ≥ 0.75 | **PASS** | Low | Invoice looks normal |
| 0.50 - 0.74 | **WARN** | Medium | Potential issues, review recommended |
| < 0.50 | **FAIL** | High | Anomaly detected, high risk |

### Example Calculation

```python
# Invoice Data
Rule Checks:
- Math: 1.0 (perfect)
- Date: 1.0 (normal)
- Amount: 1.0 (reasonable)
- Round: 0.7 (round to $100)

Rule Score = (1.0×0.5) + (1.0×0.2) + (1.0×0.15) + (0.7×0.15)
           = 0.50 + 0.20 + 0.15 + 0.105
           = 0.955

ML Score = 0.85 (model says mostly normal)

Final Score = (0.955 × 0.6) + (0.85 × 0.4)
            = 0.573 + 0.34
            = 0.913

Verdict: PASS ✓ (score ≥ 0.75)
Risk Level: Low
```

---

## Model Training

### When Models Are Trained

**Automatic**: Every **3 days at 2:00 AM** via APScheduler

**Manual**: `python scripts/train_anomaly_models.py --all`

### Training Schedule Explained

The training **job runs every 3 days**, but models only **retrain when needed**:

**Retraining happens if**:
1. **No model exists** (first-time), OR
2. **400+ new invoices** since last training, OR
3. **7+ days** since last training

**Otherwise**: Training is **skipped** to save resources.

### Why Every 3 Days?

This schedule provides the **best of both worlds**:

- **High-activity orgs** (400+ invoices/3 days): Retrain **every 3 days** ⚡
- **Low-activity orgs** (< 400 invoices): Retrain **every 7-10 days** 📅
- **Resource efficient**: Skips unnecessary retraining ✅

### Example: High-Activity Organization

```
Coffee Shop (100+ invoices/day)

Day 1 (Feb 4, 2 AM): Initial training ✓
Day 4 (Feb 7, 2 AM):
  - New invoices: 450 >= 400 ✓
  - Days since: 3 < 7 ✗
  - Action: RETRAIN ✓ (hit invoice threshold!)

Day 7 (Feb 10, 2 AM):
  - New invoices: 480 >= 400 ✓
  - Days since: 3 < 7 ✗
  - Action: RETRAIN ✓ (hit invoice threshold again!)

Result: Retrains every 3 days (model stays fresh!)
```

### Example: Low-Activity Organization

```
Law Firm (monthly invoices)

Day 1 (Feb 4, 2 AM): Initial training ✓
Day 4 (Feb 7, 2 AM):
  - New invoices: 50 < 400 ✗
  - Days since: 3 < 7 ✗
  - Action: SKIP ⏭️

Day 7 (Feb 10, 2 AM):
  - New invoices: 100 < 400 ✗
  - Days since: 6 < 7 ✗
  - Action: SKIP ⏭️

Day 10 (Feb 13, 2 AM):
  - New invoices: 150 < 400 ✗
  - Days since: 9 >= 7 ✓
  - Action: RETRAIN ✓ (7+ days passed!)

Result: Retrains every 9 days (ensures weekly-ish updates)
```

### Training Process

**Code**: `scripts/train_anomaly_models.py`

```python
# 1. Fetch clean invoices for organization
invoices = db.invoices.find({
    'organizationId': org_id,
    'aiVerdict': 'clean',
    'total': {'$exists': True}
})

# 2. Smart sampling (max 10,000 invoices)
# - 80% recent (last 90 days)
# - 20% historical
sampled = smart_sample_invoices(invoices, max=10000)

# 3. Extract features from each invoice
features = [extract_features(inv) for inv in sampled]

# 4. Train Isolation Forest
model = IsolationForest(contamination=0.1, n_estimators=100)
model.fit(features)

# 5. Save to S3
save_model_to_s3(org_id, model, metadata)
```

### Requirements

- **Minimum**: 30 clean invoices (configurable: `ANOMALY_MIN_INVOICES=30`)
- **Optimal**: 1,000+ invoices for robust patterns
- **Maximum used**: 10,000 (smart sampling if more exist)

---

## API Endpoints

### POST `/anomaly/{invoice_id}`

Run anomaly detection on a specific invoice.

**Request**:
```bash
POST /anomaly/507f1f77bcf86cd799439011
```

**Response**:
```json
{
  "ok": true,
  "data": {
    "verdict": "pass",
    "score": 0.913,
    "risk_level": "low",
    "details": {
      "rule_score": 0.955,
      "ml_score": 0.85,
      "checks": {
        "line_items": 1.0,
        "date": 1.0,
        "amount": 1.0,
        "round_number": 0.7
      }
    },
    "flags": ["Round amount detected: $500.00"]
  }
}
```

---

## Configuration

**File**: `app/core/config.py`

### Key Settings

```python
# Training
ANOMALY_MAX_TRAINING_SAMPLES = 10000  # Max samples per org
ANOMALY_RECENT_WEIGHT = 0.8           # 80% recent data
ANOMALY_RECENT_DAYS = 90              # Definition of "recent"
MAX_PARALLEL_TRAINING = 3             # Concurrent training workers

# Incremental Training
ANOMALY_MIN_INVOICES = 30             # Min invoices to train
ANOMALY_MIN_NEW_INVOICES = 400        # Retrain threshold
ANOMALY_RETRAIN_INTERVAL_DAYS = 7     # Max staleness

# Validation
ANOMALY_MATH_TOLERANCE = 0.02         # 2% tolerance for math
```

### Verdict Thresholds

```python
SCORE_PASS_THRESHOLD = 0.75   # ≥ 0.75 = PASS
SCORE_WARN_THRESHOLD = 0.50   # 0.50-0.74 = WARN
                              # < 0.50 = FAIL
```

### Hybrid Weights

```python
WEIGHT_RULES = 0.6  # 60% rule-based
WEIGHT_ML = 0.4     # 40% ML model
```

---

## Key Files

| File | Purpose |
|------|---------|
| `app/pipelines/verification/stages/anomaly.py` | Main anomaly detection stage |
| `app/engines/anomaly/feature_extractor.py` | Extract 9 features from invoices |
| `app/engines/anomaly/model_loader.py` | Load/save models from S3 |
| `app/engines/anomaly/line_item_parser.py` | Parse line items for math validation |
| `scripts/train_anomaly_models.py` | Training script (manual/scheduled) |
| `app/api/anomaly.py` | API endpoint |

---

## Common Questions

### Q: What if an organization doesn't have a model?
**A**: The system uses **100% rule-based checks**. The ML model is optional.

### Q: How long does training take?
**A**: ~2-5 minutes per organization (with 10,000 samples).

### Q: Can I force retrain a model?
**A**: Yes! `python scripts/train_anomaly_models.py --org-id <ORG_ID>`

### Q: Where are models stored?
**A**: AWS S3: `s3://finshield-models/models/org_{id}_anomaly.pkl.gz`

### Q: How accurate is the ML model?
**A**: Depends on training data quality. With 1,000+ clean invoices, typically 90%+ accuracy.

### Q: What happens if the model fails to load?
**A**: Falls back to 100% rule-based checks. No errors thrown.

---

## Summary

The Anomaly Detection Layer provides **two layers of defense**:

1. **Rule-Based (60%)**: Catches obvious errors (bad math, invalid dates)
2. **ML Model (40%)**: Catches subtle patterns (unusual for this org)

**Result**: Robust fraud detection that adapts to each organization's unique invoice patterns!

---

**For Questions**: Contact the AI/ML team or check the detailed docs in the `brain/` artifacts folder.
