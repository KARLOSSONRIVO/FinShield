import redisConnection from "./redis.connection.js";
import { CachePrefix, CacheTTL } from "../../common/utils/cache.constants.js";

// Re-export so existing consumers can still import from here if needed
export { CachePrefix, CacheTTL };

// ─── Core Helpers ───────────────────────────────────────────

/**
 * Get a cached value. Returns parsed JSON or null.
 */
export async function cacheGet(key) {
    try {
        const raw = await redisConnection.get(key);
        if (raw === null) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

/**
 * Set a cached value with optional TTL (seconds).
 * If ttl is 0 or omitted, the key never expires.
 */
export async function cacheSet(key, value, ttlSeconds = 0) {
    try {
        const serialized = JSON.stringify(value);
        if (ttlSeconds > 0) {
            await redisConnection.set(key, serialized, "EX", ttlSeconds);
        } else {
            await redisConnection.set(key, serialized);
        }
    } catch {
        // Cache write failure is non-fatal; log silently
    }
}

/**
 * Delete one or more keys.
 */
export async function cacheDel(...keys) {
    try {
        if (keys.length > 0) {
            await redisConnection.del(...keys);
        }
    } catch {
        // Non-fatal
    }
}

/**
 * Delete all keys matching a prefix using SCAN (non-blocking).
 * Example: invalidatePrefix("inv:list:") wipes all invoice list caches.
 */
export async function invalidatePrefix(prefix) {
    try {
        let cursor = "0";
        do {
            const [nextCursor, keys] = await redisConnection.scan(
                cursor,
                "MATCH",
                `${prefix}*`,
                "COUNT",
                100
            );
            cursor = nextCursor;
            if (keys.length > 0) {
                await redisConnection.del(...keys);
            }
        } while (cursor !== "0");
    } catch {
        // Non-fatal
    }
}

/**
 * Add a token to the blacklist SET in Redis with a TTL matching its remaining life.
 * @param {string} token  - The raw JWT string
 * @param {number} expiresAt - Token expiry as Unix timestamp (seconds)
 */
export async function blacklistAdd(token, expiresAt) {
    try {
        const ttl = Math.max(expiresAt - Math.floor(Date.now() / 1000), 1);
        await redisConnection.set(`${CachePrefix.BLACKLIST}${token}`, "1", "EX", ttl);
    } catch {
        // Non-fatal
    }
}

/**
 * Check if a token is in the Redis blacklist.
 * @param {string} token
 * @returns {Promise<boolean>}
 */
export async function blacklistHas(token) {
    try {
        const exists = await redisConnection.exists(`${CachePrefix.BLACKLIST}${token}`);
        return exists === 1;
    } catch {
        return false; // On Redis failure, fall back to DB check
    }
}

/**
 * Build a deterministic hash key from a query/filter object.
 * Used for paginated list caching.
 */
export function buildQueryHash(obj) {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    // Simple djb2 hash — fast, collision-resistant enough for cache keys
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
        hash = hash & hash; // Convert to 32-bit int
    }
    return Math.abs(hash).toString(36);
}
