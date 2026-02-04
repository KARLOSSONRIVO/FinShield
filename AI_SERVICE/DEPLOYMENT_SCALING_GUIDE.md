# Deployment Scaling Guide: CPU Cores, Workers, and RAM

## Overview
This guide explains how CPU cores, FastAPI workers, ML models, and RAM interact in the FinShield AI Service, particularly for anomaly detection with multiple organizations and concurrent users.

---

## Core Concepts

### 1. CPU Cores (Hardware)
- **Definition**: Physical/logical processing units on your server
- **Fixed by**: Your deployment server's hardware
- **Detection**: Python automatically detects using `multiprocessing.cpu_count()`
- **Examples**:
  - Small VPS: 2 cores
  - Medium server: 4 cores
  - Large server: 8 cores
  - Enterprise: 16+ cores

### 2. FastAPI Workers (Processes)
- **Definition**: Independent Python processes that handle requests concurrently
- **Formula**: `workers = (2 × CPU cores) + 1`
- **Examples**:
  - 2 cores → 5 workers
  - 4 cores → 9 workers
  - 8 cores → 17 workers
- **Purpose**: Each worker can process one invoice verification at a time
- **Behavior**: Workers share CPU time (time-slicing)

### 3. ML Models (Data/Files)
- **Definition**: Trained Isolation Forest models stored in S3
- **Count**: One per organization (variable)
- **Size**: ~5 MB each
- **Storage**: Loaded once into global `MODEL_CACHE` dictionary
- **Sharing**: ALL workers access the SAME cached model
- **Thread-Safety**: Scikit-learn models are read-only, safe for concurrent access

---

## Memory Architecture

### Shared Model Cache
```
MODEL_CACHE = {
    "org_123": <IsolationForest model 5MB>,
    "org_456": <IsolationForest model 5MB>,
    "org_789": <IsolationForest model 5MB>,
}
```
- Models loaded **once** on first request
- **Shared by all workers** (no duplication)
- Stays in RAM until server restarts or cache cleared

### Per-Worker Data
Each active worker uses ~6 MB for:
- Request data (invoice JSON)
- Extracted features (numpy arrays)
- Prediction results
- Local variables

### RAM Formula
```
Total RAM = (Number of Unique Models × 5 MB) + (Active Workers × 6 MB) + System Overhead

Example with 4 cores, 50 organizations:
- Models: 50 × 5 MB = 250 MB (shared)
- Workers: 9 × 6 MB = 54 MB (per-worker data)
- Total: ~300 MB + 100 MB overhead = 400 MB
```

---

## Concurrent Processing Examples

### Scenario 1: Same Organization, Multiple Employees
**Setup**: 4 CPU cores (9 workers), Organization A has 3 employees uploading simultaneously

**What Happens**:
1. Employee 1 uploads → Worker 1 processes
2. Employee 2 uploads → Worker 2 processes  
3. Employee 3 uploads → Worker 3 processes

**Model Usage**: All 3 workers use the SAME cached "org_A" model (5 MB total)

**RAM**: 5 MB (model) + 18 MB (3 workers' data) = 23 MB

**Processing**: Parallel (all 3 invoices processed simultaneously)

---

### Scenario 2: Different Organizations, Simultaneous Uploads
**Setup**: 4 CPU cores (9 workers), Org 1 uploads 4 invoices, Org 2 uploads 4 invoices at the same time

**What Happens**:
1. 8 invoices arrive simultaneously
2. 8 workers activate (Worker 1-8)
3. Each worker processes one invoice
4. Workers 1-4 use "org_1" model
5. Workers 5-8 use "org_2" model

**Model Usage**: 
- "org_1" model: 5 MB (shared by Workers 1-4)
- "org_2" model: 5 MB (shared by Workers 5-8)
- Total: 10 MB

**RAM**: 10 MB (2 models) + 48 MB (8 workers' data) = 58 MB

**Processing**: All 8 invoices processed in parallel

**CPU**: All 9 workers share 4 CPU cores through time-slicing (context switching)

---

### Scenario 3: More Requests Than Workers
**Setup**: 4 CPU cores (9 workers), 15 invoices uploaded simultaneously

**What Happens**:
1. First 9 invoices: Processed immediately by 9 workers
2. Remaining 6 invoices: Queued in FastAPI
3. As workers finish, they pick up queued invoices
4. Total processing time: 2 batches (9 + 6)

**Model Usage**: Depends on how many unique organizations (e.g., 3 orgs = 15 MB)

**RAM**: (Models) + (9 workers × 6 MB) = varies based on organizations

**Processing**: Parallel for first 9, sequential for remaining 6

---

## Key Insights

### ✅ RAM Behavior
- **Models**: RAM increases with MORE ORGANIZATIONS (each unique model = 5 MB)
- **Workers**: RAM increases with MORE CONCURRENT REQUESTS (each active worker = 6 MB)
- **Models are NOT duplicated**: 9 workers using same model = 5 MB, NOT 45 MB

### ✅ CPU Behavior
- **Fixed**: Based on deployment server hardware
- **Workers share cores**: 9 workers on 4 cores = time-slicing
- **More models ≠ More cores needed**: 100 organization models still use same 4 cores
- **More concurrent requests = More workers needed = More cores recommended**

### ✅ Processing Behavior
- **Parallel**: If requests ≤ available workers
- **Queued**: If requests > available workers
- **Each worker**: Handles ONE invoice at a time

---

## Deployment Server Examples

### Small Server (2 cores)
- **Workers**: 5
- **Concurrent Invoices**: 5 at once
- **RAM (50 orgs)**: 250 MB (models) + 30 MB (workers) = 280 MB
- **Best For**: Testing, small businesses

### Medium Server (4 cores)
- **Workers**: 9
- **Concurrent Invoices**: 9 at once
- **RAM (50 orgs)**: 250 MB (models) + 54 MB (workers) = 304 MB
- **Best For**: 10-50 organizations, moderate traffic

### Large Server (8 cores)
- **Workers**: 17
- **Concurrent Invoices**: 17 at once
- **RAM (100 orgs)**: 500 MB (models) + 102 MB (workers) = 602 MB
- **Best For**: 100+ organizations, high traffic

### Enterprise Server (16 cores)
- **Workers**: 33
- **Concurrent Invoices**: 33 at once
- **RAM (200 orgs)**: 1000 MB (models) + 198 MB (workers) = 1198 MB
- **Best For**: Large enterprises, very high traffic

---

## Optimization Strategies

### 1. Vertical Scaling (More Powerful Server)
- **More CPU cores** → More workers → More concurrent processing
- **More RAM** → Cache more organization models
- **When to use**: Single-region deployment, simpler management

### 2. Horizontal Scaling (Multiple Servers)
- Use load balancer (AWS ALB, Nginx)
- Each server: Own CPU cores + workers
- Shared model cache using Redis (optional)
- **When to use**: Very high traffic, multi-region

### 3. Model Cache Management
- Set cache expiration for inactive organizations
- Clear cache periodically: `POST /anomaly/clear-cache`
- Monitor memory usage: `docker stats` or server metrics

### 4. Worker Tuning
- **Default**: `(2 × cores) + 1` (balanced)
- **CPU-bound tasks**: Use fewer workers (cores + 1)
- **I/O-bound tasks**: Use more workers (4 × cores)
- **Our case**: Anomaly detection is mixed (I/O for S3, CPU for ML), default is good

---

## Common Misconceptions

### ❌ WRONG: "More organizations = Need more CPU cores"
**✅ RIGHT**: More organizations = Need more RAM (for model storage)

### ❌ WRONG: "Each worker loads its own copy of the model"
**✅ RIGHT**: All workers share the same model from MODEL_CACHE

### ❌ WRONG: "9 workers need 9 CPU cores"
**✅ RIGHT**: 9 workers can run on 4 cores through time-slicing

### ❌ WRONG: "RAM increases when 2 workers use the same model"
**✅ RIGHT**: RAM for model stays constant (5 MB), only worker data increases (6 MB per worker)

---

## Monitoring and Troubleshooting

### Check Current Resources
```bash
# Linux/Mac
htop  # CPU and RAM usage
ps aux | grep uvicorn  # Worker processes

# Windows
Task Manager → Performance tab
```

### Python Memory Profiling
```python
import psutil
import os

# Current process
process = psutil.Process(os.getpid())
print(f"RAM: {process.memory_info().rss / 1024 / 1024:.2f} MB")

# Model cache size
import sys
print(f"Cache size: {sys.getsizeof(MODEL_CACHE) / 1024 / 1024:.2f} MB")
```

### Performance Metrics to Track
1. **Request Queue Length**: If consistently > 0, need more workers/cores
2. **Memory Usage**: Should stabilize after all models loaded
3. **CPU Usage**: Should be 70-90% under load (good utilization)
4. **Response Time**: If increasing, need scaling

---

## Conclusion

The FinShield AI Service uses a **shared model architecture** where:
- **CPU cores** are hardware-fixed and shared by all workers
- **Workers** handle concurrent requests in parallel (limited by cores)
- **Models** are loaded once and shared by all workers (memory-efficient)
- **RAM** increases with unique models (organizations) and active workers (concurrent requests)

**Key Takeaway**: You need more cores for handling MORE CONCURRENT REQUESTS, not for handling MORE ORGANIZATIONS. Organizations only affect RAM, not CPU requirements.
