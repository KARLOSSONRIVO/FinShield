import AuditLog from "../models/auditLog.model.js";

/**
 * Insert a single audit log document.
 * @param {Object} data
 * @returns {Promise<AuditLog>}
 */
export async function createLog(data) {
    return AuditLog.create(data);
}

/**
 * Paginated query for the admin audit log viewer.
 *
 * @param {Object} options
 * @param {number} options.page
 * @param {number} options.limit
 * @param {string} [options.action]      - filter by specific action
 * @param {string} [options.actorRole]   - filter by actor role
 * @param {string} [options.search]      - full-text search on summary
 * @param {Date}   [options.from]        - createdAt >= from
 * @param {Date}   [options.to]          - createdAt <= to
 * @returns {Promise<{ items: AuditLog[], total: number }>}
 */
export async function findAllPaginated({ page = 1, limit = 50, action, actorRole, search, from, to } = {}) {
    const filter = {};

    if (action)     filter.action     = action;
    if (actorRole)  filter.actorRole  = actorRole;
    if (search)     filter.summary    = { $regex: search, $options: "i" };

    if (from || to) {
        filter.createdAt = {};
        if (from) filter.createdAt.$gte = from;
        if (to)   filter.createdAt.$lte = to;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
        AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        AuditLog.countDocuments(filter),
    ]);

    return { items, total };
}

/**
 * Find hot logs (not yet archived) older than `cutoffDate`.
 * Batched by `batchSize`, sorted oldest-first for consistent JSONL output.
 *
 * @param {Date}   cutoffDate
 * @param {number} batchSize
 * @returns {Promise<AuditLog[]>}
 */
export async function findHotLogsOlderThan(cutoffDate, batchSize = 1000) {
    return AuditLog.find({
        archivedAt: null,
        createdAt:  { $lt: cutoffDate },
    })
        .sort({ createdAt: 1 })
        .limit(batchSize)
        .lean();
}

/**
 * Mark a batch of logs as archived after S3 upload succeeds.
 *
 * @param {string[]} ids           - Array of MongoDB ObjectId strings
 * @param {string}   archiveKey    - S3 object key
 * @param {string}   archiveFileHash - SHA-256 hex of the .jsonl.gz file
 */
export async function markAsArchived(ids, archiveKey, archiveFileHash) {
    return AuditLog.updateMany(
        { _id: { $in: ids } },
        {
            $set: {
                archivedAt:      new Date(),
                archiveKey,
                archiveFileHash,
            },
        }
    );
}
