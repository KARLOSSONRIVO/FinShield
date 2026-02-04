# FinShield AI Service Guide

## Overview

This guide consolidates the architectural details, deployment strategies, and training optimizations for the FinShield AI Service (Anomaly Detection). It explains how the system scales, how models are trained efficiently, and how to configure the service for production.

---

## 1. Deployment & Scaling

Understanding how CPU, RAM, and Workers interact is crucial for scaling the service.

### Core Architecture
- **CPU Cores**: Shared by all workers. More cores allow more concurrent workers.
- **Workers (Processes)**: Independent instances of the program.
    - **One Worker handles One Invoice at a time.**
    - If 9 workers exist, 9 invoices can be processed simultaneously. Additional invoices wait in queue.
    - Rule of Thumb: `Workers = (2 × CPU Cores) + 1`
- **RAM**: Used primarily for storing models.
    - **Models are Shared**: All workers share a single copy of loaded models (Read-Only).
    - **Formula**: `Total RAM ≈ (Num Models × 5MB) + (Num Workers × 6MB) + Overhead`

### 💡 Concept Analogy: The Kitchen
To understand the difference:
- **The Worker** = **The Chef** (Executes the task).
- **The Model** = **The Recipe Book** (Knowledge/Rules used by the chef).
- **The Invoice** = **The Order** (The item being processed).
- **RAM** = **Counter Space** (Needed to open recipe books and work on orders).

*Multiple Chefs (Workers) can read from the same Recipe Book (Model) simultaneously to cook different Orders (Invoices).*

**Key Distinction**:
- **Invoices Sent (Traffic)** = How many orders **arrive**.
- **Workers (Capacity)** = How many orders can be cooked **at the exact same time**.

### 🧮 CPU & Worker Formula
Just like RAM, CPU capacity can be calculated. We use the formula `(Cores × 2) + 1` to ensure processors are kept busy but not overloaded.

| Server | Physical Cores | Calculation | Total Workers (Capacity) |
|---|---|---|---|
| **Small** | 2 | `(2 × 2) + 1` | **5** |
| **Medium** | 4 | `(4 × 2) + 1` | **9** |
| **Large** | 8 | `(8 × 2) + 1` | **17** |
| **Enterprise** | 16 | `(16 × 2) + 1` | **33** |

*Each "Worker" creates one independent "lane" for processing an invoice.*

### Sizing Examples
| Server Size | Cores | Workers | Concurrent Reqs | Max RAM (50 Orgs) | Best For |
|---|---|---|---|---|---|
| **Small** | 2 | 5 | 5 | ~280 MB | Testing / Low Traffic |
| **Medium** | 4 | 9 | 9 | ~304 MB | Moderate Traffic (10-50 Orgs) |
| **Large** | 8 | 17 | 17 | ~602 MB | High Traffic (100+ Orgs) |
| **Enterprise**| 16 | 33 | 33 | ~1.2 GB | Very High Traffic (200+ Orgs) |

**Key Scaling Insight**:
- Add **RAM** if you have more **Organizations**.
- Add **CPU Cores** if you have more **Concurrent Users**.

---

## 2. Model Training Architecture

The training system is optimized for speed and efficiency using two main strategies: **Optimization** (Smart Sampling + Parallelism) and **Incremental Training**.

### A. Optimization (Speed)
Instead of training sequentially on full datasets, the system uses:
1.  **Smart Sampling**:
    - Uses only **10,000 samples** max per organization.
    - **80% Recent Data** (Last 90 days): Captures current trends.
    - **20% Historical Data**: Maintains baseline.
    - *Impact*: Reduces training time by 10x per org (20 min → 2 min).

2.  **Parallel Processing**:
    - Trains multiple organizations simultaneously using `ProcessPoolExecutor`.
    - Default: **3 concurrent workers**.
    - *Impact*: Reduces total training time by ~3x.

### B. Incremental Training (Efficiency)
The system avoids retraining perfectly good models. It runs daily at 2 AM but only acts if needed.

**Retraining Triggers**:
| Condition | Action | Reason |
|---|---|---|
| **No Model Exists** | **TRAIN** | First-time setup. |
| **> 500 New Invoices** | **TRAIN** | Enough new data to warrant an update. |
| **> 7 Days Since Last Train** | **TRAIN** | Forced refresh to prevent staleness. |
| **None of above** | **SKIP** | Model is up-to-date. Saves resources. |

---

## 3. Configuration

Key environment variables to tune the system.

### Training & Incremental Logic
| Variable | Default | Description |
|---|---|---|
| `ANOMALY_MAX_TRAINING_SAMPLES` | `10000` | Max invoices to use for training per org. |
| `ANOMALY_RECENT_WEIGHT` | `0.8` | 80% of samples come from recent invoice history. |
| `ANOMALY_RECENT_DAYS` | `90` | Definition of "recent" in days. |
| `MAX_PARALLEL_TRAINING` | `3` | Number of organizations to train at the same time. |
| `ANOMALY_MIN_NEW_INVOICES` | `500` | Min new invoices required to trigger retraining. |
| `ANOMALY_RETRAIN_INTERVAL_DAYS`| `7` | Max days to wait before forced retraining. |

### Manual Commands
Run these from the root directory:
```bash
# Check which orgs are eligible/need training
python scripts/train_models.py --check

# Train all organizations (respects incremental rules)
python scripts/train_models.py --all

# Force train a specific organization
python scripts/train_models.py --org-id <ORG_ID>
```

---

## 4. Monitoring & Troubleshooting

### metrics to Watch
1.  **Skip Rate**: In a mature system, 40-70% of daily runs should generally SKIP. If 0% skip, check `ANOMALY_MIN_NEW_INVOICES`.
2.  **Training Time**: Should be 30-60 mins for ~50 distinct active organizations.
3.  **RAM Usage**: Ensure it stabilizes after cache warm-up.

### Common Issues
-   **Training too slow**: Increase `MAX_PARALLEL_TRAINING` (if CPU permits) or decrease `ANOMALY_MAX_TRAINING_SAMPLES`.
-   **Models not updating**: Check if `ANOMALY_MIN_NEW_INVOICES` is too high for low-volume orgs.
-   **Memory Errors**: Decrease `MAX_PARALLEL_TRAINING`.

### S3 Storage
Models and metadata are stored in S3:
-   `s3://finshield-models/models/org_{id}_anomaly.pkl.gz` (Model)
-   `s3://finshield-models/models/org_{id}_metadata.json` (Training stats & timestamp)

---
*For in-depth details, refer to the source files: `MODEL_TRAINING_OPTIMIZATION.md`, `DEPLOYMENT_SCALING_GUIDE.md`, and `INCREMENTAL_TRAINING.md`.*
