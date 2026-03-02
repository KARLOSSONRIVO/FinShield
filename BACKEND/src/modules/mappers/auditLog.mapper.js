/**
 * Map an AuditLog document to the shape sent to the client.
 *
 * @param {Object} log - Mongoose lean document or model instance
 * @returns {Object}
 */
export function toAuditLogItem(log) {
    return {
        id:        String(log._id),
        actorId:   log.actorId   ? String(log.actorId)  : null,
        actorRole: log.actorRole ?? null,
        actor: {
            username: log.actor?.username ?? null,
            email:    log.actor?.email    ?? null,
        },
        action:     log.action,
        targetType: log.target?.type ?? null,
        summary:    log.summary,
        metadata:  log.metadata  ?? {},
        ip:        log.ip        ?? null,
        userAgent: log.userAgent ?? null,
        // Archive status
        isArchived:      !!log.archivedAt,
        archivedAt:      log.archivedAt ?? null,
        archiveKey:      log.archiveKey ?? null,
        archiveFileHash: log.archiveFileHash ?? null,
        createdAt: log.createdAt,
    };
}
