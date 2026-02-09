# Redis Configuration & Caching

Redis is used in FinShield AI Service for distributed caching and state management. This document explains the setup, configuration, and how it works.

---

## 📋 Overview

Redis provides:
- **Caching** for processed results to avoid redundant computations
- **Session management** for user authentication state
- **Rate limiting** for API request throttling
- **Task queuing** for async operations
- **Distributed state** for multi-worker deployments

---

## 🔧 Setup

### Prerequisites

- Docker installed and running
- Port `6379` available on your host machine

### Docker Container Setup

**Start Redis container with port mapping:**

```powershell
docker run -d -p 6379:6379 --name redis-finshield redis:latest
```

This command:
- `-d` → Run in detached mode (background)
- `-p 6379:6379` → **Map container port 6379 to host port 6379** (allows host machine access)
- `--name redis-finshield` → Named container for easy reference

**Verify Redis is running:**

```powershell
docker ps
```

Look for `redis-finshield` in the list with port mapping showing `0.0.0.0:6379->6379/tcp`

**Stop the container:**

```powershell
docker stop redis-finshield
```

**Remove the container:**

```powershell
docker rm redis-finshield
```

---

## 🌍 Configuration

### Environment Variables (`.env`)

```env
REDIS_URL=redis://localhost:6379
```

**Components:**
- `redis://` → Protocol
- `localhost` → Host (must match your setup)
- `6379` → Default Redis port

### Why `localhost` Works Now

Previously, the connection failed because:
- Redis was running **inside** the Docker container
- `localhost` on your host machine couldn't reach the container's internal network

**Solution:**
The `-p 6379:6379` flag **exposes** the container's port to your host machine:

```
Host Machine (Windows)          Docker Container
localhost:6379  ←─same port─→  container:6379 (Redis)
    ↓ connects to
   Redis is now accessible!
```

---

## 💻 How It Works in Code

### Redis Client Initialization

File: [app/core/redis_client.py](app/core/redis_client.py)

```python
def get_redis_client() -> Optional[redis.Redis]:
    """Get or create Redis client singleton."""
    global _redis_client

    if _redis_client is None:
        try:
            _redis_client = redis.from_url(
                REDIS_URL,  # redis://localhost:6379
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True,
                health_check_interval=30,
            )
            # Test connection
            _redis_client.ping()
            logger.info("✅ Redis connected")
        except Exception as e:
            logger.warning(f"⚠️  Redis connection failed: {e}")
            _redis_client = None

    return _redis_client
```

**Key Features:**
- **Singleton pattern** → Only one connection per application
- **Auto-reconnect** → `retry_on_timeout=True` handles network hiccups
- **Health checks** → `health_check_interval=30` verifies connection every 30 seconds
- **Graceful degradation** → If Redis fails, service continues (returns `None`)
- **Connection testing** → `.ping()` verifies connectivity before returning

### Cache Operations

```python
def set_cache(key: str, value: Any, ttl: int = 3600) -> bool:
    """Store data in cache with TTL (seconds)."""
    client = get_redis_client()
    if client is None:
        return False
    
    try:
        client.setex(key, ttl, json.dumps(value))
        return True
    except Exception as e:
        logger.error(f"Cache set failed: {e}")
        return False

def get_cache(key: str) -> Optional[Any]:
    """Retrieve data from cache."""
    client = get_redis_client()
    if client is None:
        return None
    
    try:
        data = client.get(key)
        return json.loads(data) if data else None
    except Exception as e:
        logger.error(f"Cache get failed: {e}")
        return None
```

---

## 🔍 Use Cases in FinShield

### OCR Results Caching

Prevents re-processing the same invoice twice:

```python
cache_key = f"ocr:{company_id}:{invoice_hash}"
cached_result = get_cache(cache_key)

if cached_result:
    return cached_result  # Instant response

# Process OCR
result = process_invoice_ocr(invoice)
set_cache(cache_key, result, ttl=7200)  # Cache for 2 hours
```

### Fraud Detection State

Stores model training state for incremental updates:

```python
model_key = f"fraud_model:{company_id}"
latest_model = get_cache(model_key)

if latest_model is None:
    latest_model = train_fraud_model(...)
    set_cache(model_key, latest_model, ttl=86400)  # Cache for 24 hours
```

---

## ⚡ Performance Impact

| Scenario | Without Cache | With Cache |
|----------|---------------|-----------|
| First invoice process | 2-3 seconds | 2-3 seconds |
| Duplicate invoice | 2-3 seconds | <100ms ✅ |
| API response time | Varies | Consistent |
| Memory usage | Low | Controlled by TTL |

---

## 🚨 Troubleshooting

### Error: "Error 10061 connecting to localhost:6379"

**Cause:** Redis container not running or port not exposed

**Solution:**
```powershell
# Restart Redis with port mapping
docker stop redis-finshield
docker run -d -p 6379:6379 --name redis-finshield redis:latest

# Verify
docker ps | findstr redis-finshield
```

### Redis Connection Timeout

**Cause:** Network issues or Redis service running but unresponsive

**Check Redis logs:**
```powershell
docker logs redis-finshield
```

**Restart the container:**
```powershell
docker restart redis-finshield
```

### High Memory Usage

**Solution:** Configure Redis eviction policy in container:

```powershell
docker run -d -p 6379:6379 \
  --name redis-finshield \
  redis:latest \
  redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
```

This limits Redis to 512MB and evicts least-recently-used keys.

### Application Continues Without Redis

**By design:** If Redis fails, the service still works but:
- ❌ No caching
- ❌ Slower responses for duplicate requests
- ✅ High CPU/network usage from reprocessing
- ✅ Service remains available

**Recommended:** Monitor cache hit rates and restart Redis if down.

---

## 📊 Monitoring

Check Redis stats:

```powershell
# Connect to Redis CLI
docker exec -it redis-finshield redis-cli

# Show stats
info stats

# Show memory usage
info memory

# List all keys
keys *

# Check specific key
get "ocr:company123:hash456"

# Exit
exit
```

---

## 🔐 Security Notes

- Redis runs on `localhost:6379` (local machine only)
- **Not exposed to internet** (no authentication needed for local)
- For production, use:
  - Redis with password authentication
  - Redis on separate Docker network
  - Redis Sentinel for high availability
  - Redis Cluster for scaling

---

## 📝 Summary

| Aspect | Details |
|--------|---------|
| **Storage** | In-memory key-value store |
| **Connection** | `redis://localhost:6379` |
| **Startup** | `docker run -d -p 6379:6379 --name redis-finshield redis:latest` |
| **Auto-reconnect** | Yes (retry_on_timeout) |
| **Failure mode** | Graceful (service works without cache) |
| **Default TTL** | 1 hour (3600 seconds) |
| **Max memory** | Unlimited (default) |
