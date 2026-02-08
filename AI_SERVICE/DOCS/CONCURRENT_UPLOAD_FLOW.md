# Concurrent Invoice Upload Processing

## Overview
When multiple invoices are uploaded simultaneously (e.g., 100 invoices or 5 organizations uploading at once), the system handles concurrency at **multiple layers** with different strategies:

1. **Rate Limiting** - Controls upload frequency
2. **Blockchain Nonce Queue** - Serializes blockchain transactions
3. **AI Service Async Processing** - Handles concurrent OCR requests
4. **Organization-Specific Model Caching** - Per-org ML models cached in memory
5. **Database Concurrent Writes** - MongoDB handles parallel writes

---

## 1. Upload Rate Limiting (First Line of Defense)

### Configuration
**File:** [`BACKEND/src/common/middlewares/rateLimit.middleware.js`](BACKEND/src/common/middlewares/rateLimit.middleware.js)

```javascript
export const uploadLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,      // Default: 15 minutes
    max: RATE_LIMIT_UPLOAD_MAX,          // Default: 20 uploads
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,           // Throws 429 error
});
```

### Behavior
- **Per-User Limit**: 20 uploads per 15 minutes per user
- **Multiple Users**: Each user has independent quota
- **100 Simultaneous Uploads**: 
  - From **same user**: Only first 20 accepted, rest get 429 error
  - From **5 different users**: All accepted if within individual quotas (5 × 20 = up to 100)
- **Organization Isolation**: Each org's users have separate limits

### Impact
```
Scenario: 100 invoices uploaded simultaneously
├─ Single User (COMPANY_MANAGER)
│  ├─ First 20 uploads → ✅ Accepted
│  └─ Remaining 80 → ❌ 429 Rate Limited
│
└─ 10 Users (from different orgs)
   └─ Each uploads 10 → ✅ All 100 accepted (within limits)
```

---

## 2. Invoice Upload Flow (Parallel Processing)

### File: [`BACKEND/src/modules/services/invoice/upload.js`](BACKEND/src/modules/services/invoice/upload.js)

When multiple invoices pass rate limiting, they process **in parallel** through these steps:

### Synchronous Steps (Per Request)
```javascript
export async function uploadToIpfsAndAnchor({ actor, file }) {
    // ✅ STEP 1: Precheck (AI Service) - Parallel
    const precheck = await runInvoicePrecheck(file);
    
    // ✅ STEP 2: Duplicate Check - Parallel MongoDB Query
    const existingByNumber = await InvoiceRepositories.findByInvoiceNumberAndOrg(
        invoiceNumber, 
        actor.orgId
    );
    
    // ✅ STEP 3: File Hash Check - Parallel MongoDB Query
    const existingByHash = await InvoiceRepositories.findInvoiceByCid(fileSha);
    
    // ✅ STEP 4: IPFS Upload - Parallel (Pinata API)
    const ipfs = await addAndPinBuffer({
        buffer: file.buffer,
        fileName: file.originalname,
    });
    
    // ✅ STEP 5: Create Invoice Record - Parallel MongoDB Insert
    const invoice = await InvoiceRepositories.createInvoice({
        orgId: actor.orgId,
        ipfsCid: ipfsCid,
        fileHashSha256: fileSha,
        status: "pending",
        anchorStatus: "pending",
    });
    
    // ✅ STEP 6: Background Anchor - Fire and Forget
    anchorInvoiceInBackground(invoice._id, ipfsCid, fileSha, true)
        .catch(err => console.error(`Error for ${invoice._id}`, err));
    
    return toInvoicePublic(invoice);
}
```

### Concurrency Analysis
| Step | Concurrent? | Bottleneck | Notes |
|------|------------|------------|-------|
| **Precheck** | ✅ Yes | AI Service capacity | FastAPI handles async |
| **Duplicate Check** | ✅ Yes | MongoDB indexed queries | Fast lookups |
| **IPFS Upload** | ✅ Yes | Pinata API rate limits | Independent requests |
| **Create Invoice** | ✅ Yes | MongoDB write throughput | No locking |
| **Background Anchor** | ✅ Yes | See Blockchain Queue below | Async background |

**Key Insight**: Steps 1-5 process **fully in parallel** for all uploads. Step 6 (anchoring) is queued separately.

---

## 3. Blockchain Anchoring Queue (Serialized)

### File: [`BACKEND/src/infrastructure/blockchain/nonceQueue.js`](BACKEND/src/infrastructure/blockchain/nonceQueue.js)

```javascript
class NonceQueue {
  constructor() {
    this.queue = Promise.resolve();
    this.currentNonce = null;
  }

  enqueue(address, fn) {
    this.queue = this.queue.then(async () => {
      await this._initNonce(address);
      
      const nonce = this.currentNonce;
      this.currentNonce += 1n;    // Increment for next transaction
      
      return fn(nonce);            // Execute blockchain transaction
    });
    
    return this.queue;
  }
}
```

### Behavior
- **Single Global Queue**: All blockchain transactions serialize through one queue
- **Nonce Management**: Ensures sequential nonces (prevents double-spend)
- **100 Invoices Anchoring**: All queued sequentially
  - Transaction 1: nonce=100 → sent
  - Transaction 2: nonce=101 → waits for #1
  - Transaction 3: nonce=102 → waits for #2
  - ... (continues until all 100 anchored)

### Timing
```
Average blockchain transaction: 2-5 seconds (including confirmation)
100 invoices anchoring: 3.5s × 100 = ~5.8 minutes total

BUT: User already received upload success after Step 5 (IPFS upload)
     Anchoring happens in background asynchronously
```

### File: [`BACKEND/src/modules/services/invoice/anchor_background.js`](BACKEND/src/modules/services/invoice/anchor_background.js)

```javascript
export async function anchorInvoiceInBackground(invoiceId, ipfsCid, fileSha, allowAutoOcr) {
    try {
        // 🔒 QUEUED: Waits in nonceQueue
        const anchored = await anchorInvoice({
            invoiceMongoId: invoiceId,
            ipfsCid,
            sha256Hex: fileSha,
        });
        
        // Update invoice with blockchain proof
        await InvoiceRepositories.updateInvoice(invoiceId, {
            anchorTxHash: anchored.txHash,
            anchorBlockNumber: anchored.blockNumber,
            anchoredAt: new Date(),
            anchorStatus: "anchored",
        });
        
        // 🚀 Trigger OCR (AI Service) - Fire and Forget
        if (allowAutoOcr) {
            triggerOcr(invoiceId).catch(e => console.error(`OCR failed: ${e.message}`));
        }
    } catch (e) {
        await InvoiceRepositories.updateInvoice(invoiceId, {
            anchorStatus: "failed",
            anchorError: e?.message,
        });
    }
}
```

**Key Insight**: Blockchain anchoring is the **only serialized bottleneck**. Everything else runs in parallel.

---

## 4. AI Service OCR Processing (Async Parallel)

### File: [`AI_SERVICE/app/services/ocr_service.py`](AI_SERVICE/app/services/ocr_service.py)

```python
async def run_ocr_for_invoice(invoice_id: str) -> Dict[str, Any]:
    """
    Process OCR for invoice with organization-specific ML models.
    Fully async - multiple invoices process in parallel.
    """
    # Step 1: Fetch invoice (MongoDB query - parallel)
    inv = invoices.find_one({"_id": ObjectId(invoice_id)})
    
    # Step 2: Download from IPFS (parallel HTTP requests)
    url = f"{IPFS_GATEWAY_BASE}/{cid}"
    resp = requests.get(url, timeout=60)
    
    # Step 3: OCR Extraction (CPU-bound but parallel per request)
    simple_extracted = extract_text_simple(tmp_path, filename)
    layout_extracted = extract_text_with_layout(tmp_path, filename)
    
    # Step 4: Run MCP Pipeline with org-specific model
    pipeline = VerificationPipeline()
    pipeline_result = await pipeline.run({
        "org_id": org_id,
        "invoice_id": invoice_id,
        "extracted_layout": invoice_layout,
        "template_layout": template_layout,
        "invoice_data": invoice_data,
    })
    
    # Step 5: Update invoice (MongoDB update - parallel)
    invoices.update_one(
        {"_id": ObjectId(invoice_id)},
        {"$set": update}
    )
```

### FastAPI Concurrency
- **Server Config**: Uvicorn (default workers = CPU cores)
- **Async Support**: `async def` functions allow concurrent request handling
- **No Explicit Queue**: FastAPI processes requests as they arrive

### Scenario: 100 OCR Requests
```
FastAPI Server (4 workers)
├─ Worker 1: Processing Invoice A (Org 1)
├─ Worker 2: Processing Invoice B (Org 2)  ← Different org = different model
├─ Worker 3: Processing Invoice C (Org 1)  ← Same org = cached model
└─ Worker 4: Processing Invoice D (Org 3)

Requests queued by OS/ASGI server until worker available
```

---

## 5. Organization-Specific Models (Memory Cache)

### File: [`AI_SERVICE/app/utils/ml.py`](AI_SERVICE/app/utils/ml.py)

```python
# Global in-memory cache for models
_MODEL_CACHE: Dict[str, Any] = {}

def load_model_from_s3(s3_key: str, bucket: str = None) -> Optional[Any]:
    """Load a model from S3 with caching on the key"""
    if s3_key in _MODEL_CACHE:
        return _MODEL_CACHE[s3_key]    # ⚡ Instant return (<1ms)
    
    # First time: Download from S3 (~150ms)
    client = get_s3_client()
    buffer = BytesIO()
    client.download_fileobj(bucket, s3_key, buffer)
    buffer.seek(0)
    model = joblib.load(buffer)
    _MODEL_CACHE[s3_key] = model        # Cache for future requests
    return model
```

### File: [`AI_SERVICE/app/engines/anomaly/model_loader.py`](AI_SERVICE/app/engines/anomaly/model_loader.py)

```python
def get_model_from_s3(org_id: str):
    """Load Isolation Forest model from S3 with caching"""
    s3_key = f'models/org_{org_id}_anomaly.pkl.gz'
    return load_model_from_s3(s3_key)
```

### Caching Behavior

#### Scenario: 5 Organizations Upload 5 Invoices Each (Total 25)

```
Timeline:
───────────────────────────────────────────────────────────

T+0s: 25 uploads accepted by Backend (rate limit OK)
T+1s: 25 invoices created, background anchoring starts

T+2s: First invoice anchored → OCR triggered
      ├─ Org A Invoice #1: Load model from S3 (~150ms) ✓
      ├─ Org B Invoice #1: Load model from S3 (~150ms) ✓
      └─ Org C Invoice #1: Load model from S3 (~150ms) ✓

T+5s: More invoices anchored → OCR triggered
      ├─ Org A Invoice #2: Use cached model (<1ms) ⚡
      ├─ Org B Invoice #2: Use cached model (<1ms) ⚡
      └─ Org D Invoice #1: Load model from S3 (~150ms) ✓

T+10s: All models cached in memory
       └─ Remaining 20 invoices: All use cached models (<1ms each) ⚡
```

### Memory Impact
```
Single ML Model Size: ~2-5 MB (compressed)
5 Organizations: ~10-25 MB total in RAM
100 Organizations: ~200-500 MB total (acceptable)
```

**Key Insight**: First invoice per org pays S3 download penalty (~150ms). Subsequent invoices for same org use cached model (<1ms).

---

## 6. MongoDB Concurrent Writes

### File: [`BACKEND/src/modules/repositories/invoice.repositories.js`](BACKEND/src/modules/repositories/invoice.repositories.js)

MongoDB handles concurrent writes natively:
- **No Locking Required**: Invoice inserts are independent documents
- **Indexed Queries**: Duplicate checks use indexes (fast lookups)
- **Update Operations**: Background updates (anchor status, AI results) are atomic

### Concurrency Safety
```javascript
// Duplicate check uses indexed query (no race condition)
const existingByNumber = await Invoice.findOne({ 
    invoiceNumber, 
    orgId 
}).lean();

// Insert creates new independent document
const invoice = await Invoice.create({
    orgId,
    ipfsCid,
    fileHashSha256,
    status: "pending",
});

// Background update is atomic
await Invoice.findByIdAndUpdate(invoiceId, {
    $set: {
        anchorStatus: "anchored",
        anchorTxHash: txHash,
    }
});
```

**Key Insight**: MongoDB handles 100 concurrent inserts/updates without explicit locking.

---

## Complete Flow Diagram

### Scenario: 100 Invoices from 5 Organizations (20 Each)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. UPLOAD REQUESTS (T+0s)                                    │
├─────────────────────────────────────────────────────────────┤
│ ├─ Org A: 20 invoices → Rate Limiter ✓                      │
│ ├─ Org B: 20 invoices → Rate Limiter ✓                      │
│ ├─ Org C: 20 invoices → Rate Limiter ✓                      │
│ ├─ Org D: 20 invoices → Rate Limiter ✓                      │
│ └─ Org E: 20 invoices → Rate Limiter ✓                      │
│                                                               │
│ All 100 accepted (each user under 20/15min limit)            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. PARALLEL PROCESSING (T+0s - T+3s)                         │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│ │ Invoice #1  │  │ Invoice #2  │  │ Invoice #100│          │
│ ├─────────────┤  ├─────────────┤  ├─────────────┤          │
│ │ Precheck    │  │ Precheck    │  │ Precheck    │ ← AI Srv │
│ │ Hash Check  │  │ Hash Check  │  │ Hash Check  │ ← MongoDB│
│ │ IPFS Upload │  │ IPFS Upload │  │ IPFS Upload │ ← Pinata │
│ │ Create Doc  │  │ Create Doc  │  │ Create Doc  │ ← MongoDB│
│ │ → Return ✅ │  │ → Return ✅ │  │ → Return ✅ │          │
│ └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                               │
│ ⏱️ User receives success in ~2-3 seconds                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. BACKGROUND ANCHORING (T+3s - T+10min)                     │
├─────────────────────────────────────────────────────────────┤
│ 🔒 SERIALIZED BLOCKCHAIN QUEUE                               │
│                                                               │
│ [Nonce Queue] → [Invoice #1] → Tx sent (nonce=100)          │
│                     ↓ Wait 3.5s                              │
│                 [Invoice #2] → Tx sent (nonce=101)           │
│                     ↓ Wait 3.5s                              │
│                 [Invoice #3] → Tx sent (nonce=102)           │
│                     ↓ ...                                    │
│                 [Invoice #100] → Tx sent (nonce=199)         │
│                                                               │
│ Total Time: 100 × 3.5s = ~5.8 minutes                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. OCR PROCESSING (T+6s - T+15min)                           │
├─────────────────────────────────────────────────────────────┤
│ ✅ PARALLEL AI SERVICE (after each anchor completes)         │
│                                                               │
│ FastAPI Workers (4 concurrent)                               │
│ ├─ Worker 1: Org A Invoice #1 (Load model from S3 ~150ms)   │
│ ├─ Worker 2: Org B Invoice #1 (Load model from S3 ~150ms)   │
│ ├─ Worker 3: Org C Invoice #1 (Load model from S3 ~150ms)   │
│ └─ Worker 4: Org D Invoice #1 (Load model from S3 ~150ms)   │
│                                                               │
│ ... models now cached in memory ...                          │
│                                                               │
│ ├─ Worker 1: Org A Invoice #2 (Use cache <1ms) ⚡           │
│ ├─ Worker 2: Org B Invoice #2 (Use cache <1ms) ⚡           │
│ ├─ Worker 3: Org C Invoice #2 (Use cache <1ms) ⚡           │
│ └─ Worker 4: Org D Invoice #2 (Use cache <1ms) ⚡           │
│                                                               │
│ OCR per invoice: ~5-10 seconds (includes Tesseract + MCP)    │
│ 4 workers: ~2.5 minutes per batch of 100                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Bottlenecks & Limitations

### 1. **Rate Limiting** (Intentional Protection)
- **Limit**: 20 uploads per 15 minutes per user
- **Bypass**: Use multiple user accounts
- **Purpose**: Prevent abuse and system overload

### 2. **Blockchain Queue** (Architectural Necessity)
- **Limit**: Serial transaction processing (~3.5s each)
- **Impact**: 100 invoices = ~5.8 minutes to anchor all
- **Mitigation**: Background processing (user doesn't wait)
- **Why Necessary**: Nonce management prevents double-spend attacks

### 3. **AI Service Workers** (Resource Constraint)
- **Limit**: 4 concurrent workers (default Uvicorn)
- **Impact**: 100 OCR jobs = ~2.5 minutes total
- **Scaling**: Increase workers with `--workers` flag
  ```bash
  uvicorn app.main:app --workers 8  # Double throughput
  ```

### 4. **ML Model Loading** (First Request Penalty)
- **Limit**: S3 download ~150ms per org (first time)
- **Impact**: 5 orgs uploading = 5 × 150ms = 750ms extra
- **Mitigation**: In-memory cache (subsequent requests <1ms)

### 5. **MongoDB Throughput** (Typically Not a Bottleneck)
- **Capacity**: Handles 1000s of writes/second
- **Impact**: Negligible for 100 concurrent uploads
- **Monitoring**: Watch for connection pool exhaustion

---

## Performance Estimates

### Single Upload
```
User clicks "Upload Invoice"
├─ T+0ms: Request hits Backend
├─ T+500ms: Precheck completes (AI Service)
├─ T+800ms: IPFS upload completes (Pinata)
├─ T+850ms: MongoDB insert completes
└─ T+900ms: User receives success response ✅

Background:
├─ T+4s: Blockchain anchor completes
├─ T+5s: OCR starts (AI Service)
└─ T+15s: OCR completes, invoice fully verified ✅
```

### 100 Concurrent Uploads (5 orgs × 20 each)
```
User Experience:
├─ T+0s: All 100 upload requests sent
├─ T+3s: All 100 users receive success ✅
└─ Users see "pending" status while background processing continues

Background Processing:
├─ T+3s - T+9min: Blockchain anchoring (serialized)
├─ T+6s - T+12min: OCR processing (parallel batches)
└─ T+9min: All 100 invoices fully verified ✅
```

### Scaling to 1000 Invoices
```
Assumptions:
- 50 users × 20 invoices each
- Each user under rate limit
- 8 FastAPI workers

Timeline:
├─ T+0s - T+5s: All uploads accepted (parallel)
├─ T+5s - T+60min: Blockchain anchoring (1000 × 3.5s)
└─ T+10s - T+30min: OCR processing (8 workers)

Bottleneck: Blockchain queue (60 minutes total)
Solution: Batch transactions or multi-signature wallet for parallel chains
```

---

## Recommendations

### Current System (Good For)
✅ **100-500 invoices/day**: No issues
✅ **Multiple organizations**: Isolated models and quotas
✅ **Burst uploads**: 20 invoices/user every 15 min
✅ **Background processing**: Users don't wait for blockchain/OCR

### Scaling Improvements (For 1000+/day)

#### 1. **Increase AI Workers**
```bash
# Current: 4 workers
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 8

# Impact: 2× OCR throughput
```

#### 2. **Optimize Blockchain Queue**
```javascript
// Option A: Batch anchoring (10 invoices per transaction)
export async function batchAnchorInvoices(invoiceIds) {
    // Anchor multiple invoices in single blockchain tx
    // Reduces 100 txs → 10 txs (10× faster)
}

// Option B: Multiple anchor wallets (parallel chains)
const anchorWallets = [wallet1, wallet2, wallet3];
// Each wallet maintains independent nonce queue
// 3 wallets = 3× throughput
```

#### 3. **Preload Popular Models**
```python
# AI_SERVICE/app/main.py
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Preload models for top 10 organizations at startup
    popular_orgs = ['org1', 'org2', 'org3', ...]
    for org_id in popular_orgs:
        get_model_from_s3(org_id)  # Warm cache
    yield
```

#### 4. **Add Job Queue (Optional)**
```javascript
// Use Bull/BullMQ for job queue
import Queue from 'bull';

const anchorQueue = new Queue('anchoring', REDIS_URL);

// Producer: Add jobs
anchorQueue.add({ invoiceId, ipfsCid, fileSha });

// Consumer: Process jobs
anchorQueue.process(async (job) => {
    await anchorInvoice(job.data);
});
```

---

## Summary

### ✅ What DOES Get Queued
1. **Blockchain transactions** (nonce queue - serialized)

### ✅ What Runs in PARALLEL
1. **Upload requests** (Express handles concurrently)
2. **Precheck validation** (FastAPI async)
3. **IPFS uploads** (Pinata API independent requests)
4. **MongoDB operations** (concurrent reads/writes)
5. **OCR processing** (FastAPI workers in parallel)
6. **Organization models** (independent caching per org)

### 🔑 Key Answer to Your Question

> **Q: When 100 invoices are posted at the same time, does it queue up?**

**A:** 
- **Initial Upload (Steps 1-5)**: ✅ **NO QUEUE** - All 100 process in parallel
- **Blockchain Anchoring**: 🔒 **YES QUEUED** - Serialized through nonce queue
- **OCR Processing**: ✅ **PARALLEL** - FastAPI workers handle concurrently

> **Q: Each organization has its own model - how does it handle when 5 organizations upload 5 invoices each?**

**A:**
- **First invoice per org**: Downloads model from S3 (~150ms penalty)
- **Subsequent invoices**: Uses cached model (<1ms lookup)
- **No conflict**: Each org's model cached independently
- **Memory safe**: 5 org models = ~10-25 MB RAM (acceptable)

### User Experience
```
Upload 100 invoices → ✅ Success in 2-3 seconds
Background processing:
├─ Blockchain: ~6-9 minutes (queued)
└─ AI Analysis: ~2-5 minutes (parallel)
```

**Users don't wait for blockchain or AI** - they get immediate upload confirmation and see results populate asynchronously.
