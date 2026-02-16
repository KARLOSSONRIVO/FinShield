# Weighted Layer Scoring for Verification Pipeline

## Problem

Currently, all 3 verification layers contribute equally (33.33% each) to the overall `aiRiskScore`. This doesn't reflect reality — a fraud detection hit is far more significant than a layout mismatch.

## Proposed Weights

| Layer | Current Weight | Proposed Weight | Justification |
|-------|---------------|----------------|---------------|
| **Fraud Detection** | 33.33% | **50%** | Uses supervised ML trained on confirmed fraud. A hit here means the invoice matches known fraud patterns — the strongest signal. |
| **Anomaly Detection** | 33.33% | **30%** | Uses unsupervised ML to catch statistical outliers. Important but can produce false positives (e.g., a legitimately large purchase). |
| **Layout Validation** | 33.33% | **20%** | Heuristic-based template comparison. Useful but layout changes can be legitimate (new templates, vendor updates). Least reliable fraud indicator. |

### Why This Ranking?

1. **Fraud (50%)**: This layer is trained on **labeled, confirmed fraud data**. If the Random Forest says "this looks like fraud", it's based on patterns from actual fraudulent invoices. This is the most direct and reliable signal.

2. **Anomaly (30%)**: Catches things the fraud model hasn't seen before ("unknown unknowns"). Important for novel fraud, but statistical outliers can also be legitimate business events.

3. **Layout (20%)**: A structural check that catches basic template forgery. However, layout mismatches are often benign (template updates, different vendor formats). Lowest fraud signal.

### Scoring Examples

| Scenario | Layout (×0.20) | Anomaly (×0.30) | Fraud (×0.50) | Old Score | New Score | Impact |
|----------|:---:|:---:|:---:|:---:|:---:|---|
| All clean (1.0 each) | 0.20 | 0.30 | 0.50 | **1.00** | **1.00** | No change |
| Layout fails only | 0.00 | 0.30 | 0.50 | **0.67** | **0.80** | Less punishing (layout issues shouldn't tank the score) |
| Fraud fails only | 0.20 | 0.30 | 0.00 | **0.67** | **0.50** | More punishing (fraud hit matters more) |
| Anomaly + Fraud fail | 0.20 | 0.00 | 0.00 | **0.33** | **0.20** | More punishing |

## Proposed Changes

### Verification Pipeline

#### [MODIFY] [runner.py](file:///c:/Users/lNooisYl/Documents/IT/WEBDEV/FinShield/AI_SERVICE/app/pipelines/verification/runner.py)

1. Add a `LAYER_WEIGHTS` dictionary mapping layer names to their weights
2. Replace the simple average calculation with a weighted average
3. Handle dynamic weight normalization when stages are skipped

```diff
 class VerificationPipeline:
     SCORE_CLEAN_THRESHOLD = 0.80
     SCORE_FLAGGED_THRESHOLD = 0.50
+
+    # Layer weights for overall score calculation
+    # Fraud is most important (supervised ML on confirmed fraud)
+    # Anomaly is second (unsupervised, catches unknown patterns)
+    # Layout is third (heuristic, prone to false positives)
+    LAYER_WEIGHTS = {
+        "fraud_detection": 0.50,
+        "anomaly_detection": 0.30,
+        "layout_detection": 0.20,
+    }
+    DEFAULT_WEIGHT = 0.33  # Fallback for unknown layers
```

Replace the scoring logic (lines 95-99):

```diff
-        # Calculate overall score (average of active stages)
-        if active_scores:
-            overall_score = sum(active_scores) / len(active_scores)
-        else:
-            overall_score = 1.0
+        # Calculate overall score (weighted average of active stages)
+        if active_scores:
+            total_weight = sum(w for _, w in active_scores)
+            overall_score = sum(s * w for s, w in active_scores) / total_weight
+        else:
+            overall_score = 1.0
```

And update the score collection (lines 91-93):

```diff
-            if result.verdict != LayerVerdict.SKIP:
-                active_scores.append(result.score)
+            if result.verdict != LayerVerdict.SKIP:
+                weight = self.LAYER_WEIGHTS.get(result.layer_name, self.DEFAULT_WEIGHT)
+                active_scores.append((result.score, weight))
```

## Verification Plan

### Manual Verification

Since there are no existing automated tests for this pipeline, verification will be done by reviewing the code logic and confirming the math:

1. **Code Review**: Verify the weighted average formula produces correct results for edge cases:
   - All 3 layers active: weights sum to 1.0, weighted average is correct
   - 1 layer skipped: remaining weights are re-normalized
   - All layers skipped: score defaults to 1.0

2. **User Testing**: After deployment, the user can verify by checking `aiRiskScore` values in the database and confirming that fraud-heavy invoices receive higher risk scores than layout-only issues.
