# Redis Integration Implementation Plan

**Project:** FinShield - AI_SERVICE & BACKEND  
**Purpose:** Add Redis for scalability, caching, and distributed state management  
**Estimated Time:** 4-6 hours  
**Priority:** High (Required for multi-instance deployment)

---

## 📋 Prerequisites

### 1. Install Redis Locally
```bash
# Windows (via WSL or Chocolatey)
choco install redis-64

# Mac
brew install redis

# Linux
sudo apt-get install redis-server

# Or use Docker
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

### 2. Start Redis
```bash
# Direct
redis-server

# Or Docker
docker start redis

# Verify running
redis-cli ping
# Should return: PONG
```

---

## 🔧 BACKEND Implementation

### Phase 1: Setup Redis Client (15 min)

#### Step 1.1: Install Dependencies
```bash
cd BACKEND
npm install redis@^4.6.0 bull@^4.12.0 rate-limit-redis@^4.2.0 redlock@^5.0.0
```

#### Step 1.2: Add Redis URL to .env
**File:** `BACKEND/.env`
```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
# Production: redis://your-redis-host:6379
```

#### Step 1.3: Create Redis Client Module
**File:** `BACKEND/src/common/redis.js` (NEW FILE)
```javascript
import { createClient } from "redis";
import { REDIS_URL } from "../../config/env.js";

let redisClient = null;
let isConnected = false;

export async function getRedisClient() {
    if (!redisClient) {
        redisClient = createClient({
            url: REDIS_URL,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        console.error("❌ Redis: Max reconnection attempts reached");
                        return new Error("Redis unavailable");
                    }
                    return Math.min(retries * 100, 3000);
                }
            }
        });

        redisClient.on("error", (err) => {
            console.error("❌ Redis Client Error:", err);
            isConnected = false;
        });

        redisClient.on("connect", () => {
            console.log("✅ Redis connected");
            isConnected = true;
        });

        redisClient.on("disconnect", () => {
            console.log("⚠️  Redis disconnected");
            isConnected = false;
        });

        await redisClient.connect();
    }

    return redisClient;
}

export function isRedisConnected() {
    return isConnected;
}

export async function closeRedis() {
    if (redisClient) {
        await redisClient.quit();
        redisClient = null;
        isConnected = false;
    }
}
```

#### Step 1.4: Update env.js Config
**File:** `BACKEND/src/config/env.js`
```javascript
// Add after existing exports
export const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379"
```

#### Step 1.5: Initialize Redis in Server
**File:** `BACKEND/src/server.js`
```javascript
// Add at top
import { getRedisClient, closeRedis } from "./common/redis.js";

// After MongoDB connection, before starting server
try {
    await getRedisClient();
    console.log("✅ Redis initialized");
} catch (error) {
    console.error("❌ Redis initialization failed:", error);
    // Continue without Redis (graceful degradation)
}

// Before process exit handlers
process.on("SIGTERM", async () => {
    console.log("SIGTERM received, closing connections...");
    await closeRedis();
    await mongoose.connection.close();
    process.exit(0);
});
```

---

### Phase 2: Distributed Rate Limiting (30 min)

#### Step 2.1: Update Rate Limit Middleware
**File:** `BACKEND/src/common/middlewares/rateLimit.middleware.js`
```javascript
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import AppError from "../errors/AppErrors.js";
import { getRedisClient, isRedisConnected } from "../redis.js";
import {
    RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX,
    RATE_LIMIT_USER_MAX,
    RATE_LIMIT_AUTH_MAX,
    RATE_LIMIT_UPLOAD_MAX,
} from "../../config/env.js";

function rateLimitHandler(_req, _res, next) {
    next(new AppError("Too many requests, please try again later.", 429, "RATE_LIMITED"));
}

// Helper to create rate limiter with optional Redis
async function createRateLimiter(options) {
    const config = {
        windowMs: options.windowMs,
        max: options.max,
        standardHeaders: true,
        legacyHeaders: false,
        handler: rateLimitHandler,
        keyGenerator: options.keyGenerator,
    };

    // Use Redis if available
    if (isRedisConnected()) {
        try {
            const client = await getRedisClient();
            config.store = new RedisStore({
                client,
                prefix: options.prefix || "rl:",
            });
            console.log(`✅ Rate limiter '${options.prefix}' using Redis`);
        } catch (err) {
            console.warn(`⚠️  Rate limiter '${options.prefix}' falling back to memory store`);
        }
    }

    return rateLimit(config);
}

// Create limiters (will be initialized async)
export const globalLimiter = await createRateLimiter({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
    prefix: "rl:global:",
});

export const authenticatedLimiter = await createRateLimiter({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_USER_MAX,
    prefix: "rl:auth:",
    keyGenerator: (req) => req.auth?.sub || req.auth?.userId || req.ip,
});

export const authLimiter = await createRateLimiter({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_AUTH_MAX,
    prefix: "rl:login:",
});

export const uploadLimiter = await createRateLimiter({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_UPLOAD_MAX,
    prefix: "rl:upload:",
});
```

#### Step 2.2: Test Rate Limiting
```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Test rate limiting
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}' \
  --repeat 25

# Should get 429 after 20 requests (RATE_LIMIT_AUTH_MAX)
```

---

### Phase 3: Bull Queue for Blockchain Anchoring (45 min)

#### Step 3.1: Create Queue Infrastructure
**File:** `BACKEND/src/infrastructure/blockchain/anchorQueue.js` (NEW FILE)
```javascript
import Queue from "bull";
import { REDIS_URL } from "../../config/env.js";
import { anchorInvoice } from "./ethereum.service.js";
import * as InvoiceRepositories from "../../modules/repositories/invoice.repositories.js";
import { unpinByCid } from "../storage/ipfs.service.js";
import { triggerOcr } from "../ai/ocr_client.js";

// Create Bull queue
export const anchorQueue = new Queue("invoice-anchoring", REDIS_URL, {
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 2000,
        },
        removeOnComplete: 100,  // Keep last 100 completed jobs
        removeOnFail: 500,      // Keep last 500 failed jobs
        timeout: 120000,        // 2 minute timeout per job
    },
    settings: {
        stalledInterval: 30000,  // Check for stalled jobs every 30s
        maxStalledCount: 1,      // Retry stalled jobs once
    }
});

// Job processor (runs one at a time)
anchorQueue.process("anchor", 1, async (job) => {
    const { invoiceId, ipfsCid, fileSha, allowAutoOcr } = job.data;
    
    console.log(`📦 Processing anchor job for invoice: ${invoiceId}`);
    
    try {
        // Anchor to blockchain
        const anchored = await anchorInvoice({
            invoiceMongoId: invoiceId,
            ipfsCid,
            sha256Hex: fileSha,
        });

        // Update invoice with anchor data
        await InvoiceRepositories.updateInvoice(invoiceId, {
            anchorTxHash: anchored.txHash,
            anchorBlockNumber: anchored.blockNumber,
            anchoredAt: new Date(),
            anchorStatus: "anchored",
        });

        // Trigger OCR if allowed
        if (allowAutoOcr) {
            await triggerOcr(invoiceId).catch((e) => {
                console.error(`❌ OCR trigger failed for ${invoiceId}:`, e?.message || e);
            });
        }

        console.log(`✅ Invoice ${invoiceId} anchored: ${anchored.txHash}`);
        
        return { success: true, txHash: anchored.txHash };
        
    } catch (error) {
        console.error(`❌ Anchor failed for ${invoiceId}:`, error.message);
        
        // Update invoice as failed
        await InvoiceRepositories.updateInvoice(invoiceId, {
            anchorStatus: "failed",
            anchorError: error?.message || "Anchor failed",
        });

        // Clean up IPFS
        try {
            await unpinByCid(ipfsCid);
            await InvoiceRepositories.updateInvoice(invoiceId, { 
                ipfsCid: null, 
                fileHashSha256: null 
            });
        } catch (ipfsError) {
            console.error(`⚠️  Failed to remove IPFS file ${ipfsCid}:`, ipfsError.message);
        }

        throw error; // Throw to trigger retry
    }
});

// Event handlers
anchorQueue.on("completed", (job, result) => {
    console.log(`✅ Job ${job.id} completed: ${result.txHash}`);
});

anchorQueue.on("failed", (job, err) => {
    console.error(`❌ Job ${job.id} failed after ${job.attemptsMade} attempts:`, err.message);
});

anchorQueue.on("stalled", (job) => {
    console.warn(`⚠️  Job ${job.id} stalled, will retry`);
});

// Queue invoice for anchoring
export async function queueInvoiceAnchor({ invoiceId, ipfsCid, fileSha, allowAutoOcr }) {
    const job = await anchorQueue.add("anchor", {
        invoiceId,
        ipfsCid,
        fileSha,
        allowAutoOcr,
    }, {
        priority: 1,
        jobId: invoiceId, // Prevent duplicate jobs
    });
    
    console.log(`📋 Queued anchor job ${job.id} for invoice: ${invoiceId}`);
    return job;
}

// Get queue stats
export async function getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
        anchorQueue.getWaitingCount(),
        anchorQueue.getActiveCount(),
        anchorQueue.getCompletedCount(),
        anchorQueue.getFailedCount(),
        anchorQueue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
}

// Clean up old jobs (call periodically)
export async function cleanQueue() {
    await anchorQueue.clean(24 * 60 * 60 * 1000, "completed"); // Remove completed > 24h
    await anchorQueue.clean(7 * 24 * 60 * 60 * 1000, "failed");  // Remove failed > 7 days
}
```

#### Step 3.2: Replace Background Anchoring
**File:** `BACKEND/src/modules/services/invoice/upload.js`
```javascript
// BEFORE (remove this):
// import { anchorInvoiceInBackground } from "./anchor_background.js";

// AFTER (add this):
import { queueInvoiceAnchor } from "../../../infrastructure/blockchain/anchorQueue.js";

// In uploadToIpfsAndAnchor function, replace:
// anchorInvoiceInBackground(invoice._id, ipfsCid, fileSha, documentFile)
//     .catch(err => console.error(`Error for ${invoice._id}`, err));

// With:
await queueInvoiceAnchor({
    invoiceId: invoice._id.toString(),
    ipfsCid,
    fileSha,
    allowAutoOcr: documentFile,
}).catch(err => {
    console.error(`Failed to queue anchor for ${invoice._id}:`, err);
});
```

#### Step 3.3: Remove Old Nonce Queue (Optional)
**File:** `BACKEND/src/infrastructure/blockchain/nonceQueue.js`
```javascript
// This can be deleted since Bull queue handles serialization
// Keep ethereum.service.js but remove nonceQueue import
```

**File:** `BACKEND/src/infrastructure/blockchain/ethereum.service.js`
```javascript
// Remove: import { nonceQueue } from "./nonceQueue.js";

// Update anchorInvoice to remove nonceQueue.enqueue wrapper
export async function anchorInvoice({ invoiceMongoId, ipfsCid, sha256Hex }) {
    const invoiceId32 = toBytes32FromString("invoice", invoiceMongoId);
    const cidHash32 = toBytes32FromString("cid", ipfsCid);
    const fileHash32 = sha256HexToBytes32(sha256Hex);

    // Get current nonce
    const nonce = await web3.eth.getTransactionCount(account.address, "pending");

    const method = contract.methods.anchor(invoiceId32, cidHash32, fileHash32);
    const gasEstimate = await method.estimateGas({ from: account.address });
    const gas = gasEstimate.toString();

    // EIP-1559 fee data
    const block = await web3.eth.getBlock("pending");
    const baseFeePerGas = BigInt(block.baseFeePerGas);
    const maxPriorityFeePerGas = BigInt(web3.utils.toWei("2", "gwei"));
    const maxFeePerGas = baseFeePerGas * 2n + maxPriorityFeePerGas;

    const receipt = await method.send({
        from: account.address,
        gas,
        nonce: nonce.toString(),
        maxFeePerGas: maxFeePerGas.toString(),
        maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
        type: "0x2",
    });

    return {
        txHash: receipt.transactionHash,
        blockNumber: typeof receipt.blockNumber === "bigint" 
            ? Number(receipt.blockNumber) 
            : receipt.blockNumber,
        from: account.address
    };
}
```

#### Step 3.4: Add Queue Dashboard (Optional)
```bash
npm install bull-board@^2.1.0
```

**File:** `BACKEND/src/routes/admin/queue.route.js` (NEW FILE)
```javascript
import express from "express";
import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { anchorQueue } from "../../infrastructure/blockchain/anchorQueue.js";
import { requireAuth, requireRole } from "../../common/middlewares/auth.middleware.js";

const router = express.Router();

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
    queues: [new BullAdapter(anchorQueue)],
    serverAdapter,
});

router.use(
    "/queues",
    requireAuth,
    requireRole(["SUPER_ADMIN"]),
    serverAdapter.getRouter()
);

export default router;
```

**Add to main routes:** `BACKEND/src/routes/index.js`
```javascript
import queueRouter from "./admin/queue.route.js";
router.use("/admin", queueRouter);
```

**Access at:** `http://localhost:5000/admin/queues`

---

### Phase 4: JWT Token Blacklist (20 min)

#### Step 4.1: Create Token Blacklist Module
**File:** `BACKEND/src/common/auth/tokenBlacklist.js` (NEW FILE)
```javascript
import { getRedisClient, isRedisConnected } from "../redis.js";

// In-memory fallback
const memoryBlacklist = new Set();

export async function blacklistToken(token, expiresInSeconds) {
    if (isRedisConnected()) {
        try {
            const client = await getRedisClient();
            await client.setEx(`blacklist:${token}`, expiresInSeconds, "1");
            return;
        } catch (err) {
            console.error("Redis blacklist error:", err);
        }
    }
    
    // Fallback to memory
    memoryBlacklist.add(token);
    setTimeout(() => memoryBlacklist.delete(token), expiresInSeconds * 1000);
}

export async function isTokenBlacklisted(token) {
    if (isRedisConnected()) {
        try {
            const client = await getRedisClient();
            const result = await client.get(`blacklist:${token}`);
            return result === "1";
        } catch (err) {
            console.error("Redis blacklist check error:", err);
        }
    }
    
    // Fallback to memory
    return memoryBlacklist.has(token);
}

export async function removeFromBlacklist(token) {
    if (isRedisConnected()) {
        try {
            const client = await getRedisClient();
            await client.del(`blacklist:${token}`);
        } catch (err) {
            console.error("Redis blacklist remove error:", err);
        }
    }
    
    memoryBlacklist.delete(token);
}
```

#### Step 4.2: Update Auth Middleware
**File:** `BACKEND/src/common/middlewares/auth.middleware.js`
```javascript
import { isTokenBlacklisted } from "../auth/tokenBlacklist.js";

export async function requireAuth(req, res, next) {
    try {
        // ... existing token extraction ...
        
        const token = extractToken(req);
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Check if token is blacklisted
        if (await isTokenBlacklisted(token)) {
            throw new AppError("Token has been revoked", 401, "TOKEN_REVOKED");
        }
        
        req.auth = decoded;
        req.auth.token = token; // Store for logout
        next();
    } catch (error) {
        // ... existing error handling ...
    }
}
```

#### Step 4.3: Update Logout Handler
**File:** `BACKEND/src/modules/controllers/auth.controller.js`
```javascript
import { blacklistToken } from "../../common/auth/tokenBlacklist.js";
import { JWT_EXPIRES_IN } from "../../config/env.js";

export async function logout(req, res) {
    const token = req.auth.token;
    const expiresAt = req.auth.exp;
    const now = Math.floor(Date.now() / 1000);
    const ttl = expiresAt - now;
    
    if (ttl > 0) {
        await blacklistToken(token, ttl);
    }
    
    res.json({ message: "Logged out successfully" });
}
```

---

### Phase 5: API Response Caching (15 min)

#### Step 5.1: Create Cache Middleware
**File:** `BACKEND/src/common/middlewares/cache.middleware.js` (NEW FILE)
```javascript
import { getRedisClient, isRedisConnected } from "../redis.js";

export function cacheResponse(durationSeconds = 300) {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== "GET") {
            return next();
        }

        // Skip if Redis not available
        if (!isRedisConnected()) {
            return next();
        }

        const orgId = req.auth?.orgId || "public";
        const cacheKey = `cache:${req.originalUrl}:${orgId}`;

        try {
            const client = await getRedisClient();
            const cached = await client.get(cacheKey);

            if (cached) {
                console.log(`✅ Cache HIT: ${cacheKey}`);
                return res.json(JSON.parse(cached));
            }

            console.log(`⚠️  Cache MISS: ${cacheKey}`);

            // Override res.json to cache response
            const originalJson = res.json.bind(res);
            res.json = function (data) {
                // Cache the response
                client.setEx(cacheKey, durationSeconds, JSON.stringify(data))
                    .catch(err => console.error("Cache set error:", err));
                
                return originalJson(data);
            };

            next();
        } catch (err) {
            console.error("Cache middleware error:", err);
            next();
        }
    };
}

// Helper to invalidate cache
export async function invalidateCache(pattern) {
    if (!isRedisConnected()) return;

    try {
        const client = await getRedisClient();
        const keys = await client.keys(pattern);
        
        if (keys.length > 0) {
            await client.del(keys);
            console.log(`🗑️  Invalidated ${keys.length} cache keys matching: ${pattern}`);
        }
    } catch (err) {
        console.error("Cache invalidation error:", err);
    }
}
```

#### Step 5.2: Apply to Routes
**File:** `BACKEND/src/routes/invoice/invoice.route.js`
```javascript
import { cacheResponse } from "../../common/middlewares/cache.middleware.js";

// Cache invoice list for 60 seconds
router.get(
    "/",
    requireAuth,
    cacheResponse(60),
    getAllInvoices
);

// Cache individual invoice for 30 seconds
router.get(
    "/:id",
    requireAuth,
    cacheResponse(30),
    getInvoiceById
);
```

#### Step 5.3: Invalidate on Updates
**File:** `BACKEND/src/modules/services/invoice/update.service.js`
```javascript
import { invalidateCache } from "../../../common/middlewares/cache.middleware.js";

export async function updateInvoice(invoiceId, updateData) {
    const updated = await InvoiceRepositories.updateInvoice(invoiceId, updateData);
    
    // Invalidate cache for this organization
    const invoice = await InvoiceRepositories.findById(invoiceId);
    await invalidateCache(`cache:*/invoices*:${invoice.orgId}`);
    
    return updated;
}
```

---

## 🔧 AI_SERVICE Implementation

### Phase 6: Organization Template Caching (30 min)

#### Step 6.1: Install Redis
```bash
cd AI_SERVICE
pip install redis>=5.0.0
```

#### Step 6.2: Add to .env
**File:** `AI_SERVICE/.env`
```env
# Redis Configuration
REDIS_URL=redis://localhost:6379
```

#### Step 6.3: Create Redis Client
**File:** `AI_SERVICE/app/core/redis_client.py` (NEW FILE)
```python
import os
import redis
import json
from typing import Optional, Any
import logging

logger = logging.getLogger(__name__)

# Redis client singleton
_redis_client: Optional[redis.Redis] = None

def get_redis_client() -> redis.Redis:
    """Get or create Redis client"""
    global _redis_client
    
    if _redis_client is None:
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        try:
            _redis_client = redis.from_url(
                redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30
            )
            # Test connection
            _redis_client.ping()
            logger.info("✅ Redis connected")
        except Exception as e:
            logger.warning(f"⚠️  Redis connection failed: {e}")
            _redis_client = None
    
    return _redis_client

def is_redis_available() -> bool:
    """Check if Redis is available"""
    try:
        client = get_redis_client()
        return client is not None and client.ping()
    except:
        return False

def cache_set(key: str, value: Any, ttl: int = 3600) -> bool:
    """Set value in cache with TTL"""
    try:
        client = get_redis_client()
        if client:
            client.setex(key, ttl, json.dumps(value))
            return True
    except Exception as e:
        logger.error(f"Cache set error: {e}")
    return False

def cache_get(key: str) -> Optional[Any]:
    """Get value from cache"""
    try:
        client = get_redis_client()
        if client:
            data = client.get(key)
            if data:
                return json.loads(data)
    except Exception as e:
        logger.error(f"Cache get error: {e}")
    return None

def cache_delete(key: str) -> bool:
    """Delete key from cache"""
    try:
        client = get_redis_client()
        if client:
            client.delete(key)
            return True
    except Exception as e:
        logger.error(f"Cache delete error: {e}")
    return False

def cache_invalidate_pattern(pattern: str) -> int:
    """Delete all keys matching pattern"""
    try:
        client = get_redis_client()
        if client:
            keys = client.keys(pattern)
            if keys:
                deleted = client.delete(*keys)
                logger.info(f"🗑️  Invalidated {deleted} cache keys: {pattern}")
                return deleted
    except Exception as e:
        logger.error(f"Cache invalidation error: {e}")
    return 0
```

#### Step 6.4: Update OCR Service with Caching
**File:** `AI_SERVICE/app/services/ocr_service.py`
```python
from app.core.redis_client import cache_get, cache_set, is_redis_available

def _get_org_template_layout(org_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetch the organization's template layout signature from cache or database.
    """
    cache_key = f"org:template:{org_id}"
    
    # Try cache first
    if is_redis_available():
        cached = cache_get(cache_key)
        if cached:
            logger.info(f"✅ Template cache HIT for org: {org_id}")
            return cached
        logger.info(f"⚠️  Template cache MISS for org: {org_id}")
    
    # Fetch from MongoDB
    try:
        org = organizations.find_one({"_id": ObjectId(org_id)})
        if not org:
            return None
        
        template = org.get("invoiceTemplate", {})
        layout_sig = template.get("layoutSignature", {})
        
        if layout_sig:
            result = {
                "fields": list(layout_sig.get("fields", [])),
                "positions": dict(layout_sig.get("positions", {})),
                "detected_fields": dict(layout_sig.get("detectedFields", {})),
                "element_count": layout_sig.get("elementCount", 0),
                "structural_features": dict(layout_sig.get("structural_features", {})),
            }
            
            # Cache for 1 hour
            if is_redis_available():
                cache_set(cache_key, result, ttl=3600)
            
            return result
            
    except Exception as e:
        logger.error(f"Error fetching org template: {e}")
    
    return None
```

#### Step 6.5: Add Template Update Endpoint (Invalidate Cache)
**File:** `AI_SERVICE/app/api/template.py`
```python
from app.core.redis_client import cache_invalidate_pattern

@router.post("/template/invalidate/{org_id}")
async def invalidate_template_cache(org_id: str):
    """Invalidate template cache when organization updates template"""
    deleted = cache_invalidate_pattern(f"org:template:{org_id}")
    return {
        "success": True,
        "deleted": deleted,
        "message": f"Cache invalidated for org: {org_id}"
    }
```

---

## 🧪 Testing Plan

### Test 1: Redis Connection
```bash
# Start Redis
redis-server

# Backend
cd BACKEND
npm run dev
# Should see: "✅ Redis connected"

# AI Service
cd AI_SERVICE
python dev.py
# Should see: "✅ Redis connected"
```

### Test 2: Rate Limiting (Distributed)
```bash
# Terminal 1: Start Backend Instance 1 on port 5000
PORT=5000 npm run dev

# Terminal 2: Start Backend Instance 2 on port 5001
PORT=5001 npm run dev

# Terminal 3: Test rate limiting across both instances
for i in {1..15}; do
  curl -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' &
  curl -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}' &
done
wait

# Should hit rate limit at 20 total requests across BOTH instances
```

### Test 3: Bull Queue
```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Upload invoice
curl -X POST http://localhost:5000/api/invoices/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test-invoice.pdf"

# Check Redis for queued job
redis-cli
> KEYS bull:invoice-anchoring:*
> HGETALL bull:invoice-anchoring:1

# Should see job data in Redis
```

### Test 4: Token Blacklist
```bash
# Login and get token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpass"}' \
  | jq -r '.token')

# Use token (should work)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/invoices

# Logout (blacklist token)
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# Try to use token again (should fail with 401)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/invoices

# Check Redis
redis-cli
> KEYS blacklist:*
```

### Test 5: API Caching
```bash
# First request (cache miss)
time curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/invoices

# Second request (cache hit, should be faster)
time curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/invoices

# Check Redis
redis-cli
> KEYS cache:*
> GET "cache:/api/invoices:YOUR_ORG_ID"
```

### Test 6: Template Caching (AI Service)
```bash
# First OCR (cache miss)
curl -X POST http://localhost:8000/ocr/INVOICE_ID

# Check logs for: "⚠️ Template cache MISS"

# Second OCR for same org (cache hit)
curl -X POST http://localhost:8000/ocr/ANOTHER_INVOICE_SAME_ORG

# Check logs for: "✅ Template cache HIT"
```

---

## 🚀 Deployment

### Render.com Setup

#### 1. Add Redis Add-on
1. Go to Dashboard → Your service
2. Click "Add-ons" → "Redis"
3. Select plan (512MB recommended)
4. Render automatically sets `REDIS_URL` environment variable

#### 2. Update Environment Variables
```env
# Render sets this automatically
REDIS_URL=redis://red-xxxxx:6379

# Or Redis Cloud/Upstash external
REDIS_URL=rediss://user:pass@host:port
```

#### 3. No Code Changes Needed!
Redis integration is already set up with fallbacks, so:
- ✅ Works with or without Redis
- ✅ Graceful degradation if Redis unavailable
- ✅ Auto-connects on startup

### Docker Deployment

**File:** `docker-compose.yml`
```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  backend:
    build: ./BACKEND
    ports:
      - "5000:5000"
    environment:
      - REDIS_URL=redis://redis:6379
      - MONGO_URI=${MONGO_URI}
    depends_on:
      - redis
    restart: unless-stopped

  ai-service:
    build: ./AI_SERVICE
    ports:
      - "8000:8000"
    environment:
      - REDIS_URL=redis://redis:6379
      - MONGO_URI=${MONGO_URI}
    depends_on:
      - redis
    restart: unless-stopped

volumes:
  redis-data:
```

---

## 📊 Performance Monitoring

### Redis CLI Commands
```bash
# Connect to Redis
redis-cli

# Check memory usage
> INFO memory

# Monitor commands in real-time
> MONITOR

# Check connected clients
> CLIENT LIST

# View keys by pattern
> KEYS *
> KEYS rl:*           # Rate limit keys
> KEYS cache:*       # Cache keys
> KEYS blacklist:*   # Token blacklist

# Check queue
> KEYS bull:invoice-anchoring:*

# Get queue stats
> HGETALL bull:invoice-anchoring:meta

# Clear all (DANGER!)
> FLUSHALL
```

### Bull Board Dashboard
Access at: `http://localhost:5000/admin/queues`

View:
- Active jobs
- Completed jobs
- Failed jobs
- Retry jobs
- Job details and logs

---

## 🔧 Troubleshooting

### Issue: Redis connection refused
```bash
# Check if Redis is running
redis-cli ping

# Start Redis
redis-server

# Or Docker
docker start redis
```

### Issue: Bull jobs not processing
```bash
# Check queue processor is running
redis-cli
> KEYS bull:invoice-anchoring:active

# Restart backend to restart processor
```

### Issue: Cache not invalidating
```javascript
// Force clear all cache
redis-cli
> KEYS cache:*
> DEL cache:*
```

### Issue: Memory growing
```bash
# Check Redis memory
redis-cli INFO memory

# Set max memory in redis.conf
maxmemory 512mb
maxmemory-policy allkeys-lru
```

---

## ✅ Completion Checklist

### BACKEND
- [ ] Redis client module created
- [ ] Rate limiting using Redis
- [ ] Bull queue for anchoring
- [ ] Old nonceQueue removed
- [ ] JWT blacklist implemented
- [ ] API caching middleware
- [ ] Cache invalidation on updates
- [ ] Bull Board dashboard (optional)
- [ ] All tests passing

### AI_SERVICE
- [ ] Redis client module created
- [ ] Template caching implemented
- [ ] Cache invalidation endpoint
- [ ] Tests passing

### Deployment
- [ ] Redis added to Render
- [ ] Environment variables set
- [ ] Both services deployed
- [ ] Monitoring configured

---

## 📚 Next Steps

After Redis integration:
1. Monitor performance improvements
2. Tune cache TTLs based on usage
3. Set up Redis persistence (AOF/RDB)
4. Configure Redis maxmemory policy
5. Add Redis backup strategy
6. Consider Redis Cluster for high availability

---

**Estimated Total Time:** 4-6 hours  
**Recommended Order:** Follow phases 1-6 sequentially  
**Testing:** Test each phase before moving to next  

Good luck with the implementation! 🚀
