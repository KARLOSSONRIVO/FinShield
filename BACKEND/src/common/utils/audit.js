import * as AuditLogRepository from "../../modules/repositories/auditLog.repositories.js";
import { buildAuditSummary } from "./auditSummary.js";
import { toAuditLogItem } from "../../modules/mappers/auditLog.mapper.js";
import { getIO, SocketEvents } from "../../infrastructure/socket/socket.service.js";

/**
 * Fire-and-forget audit log creation.
 * Never throws — log failures are swallowed and printed to stderr.
 * Emits `audit:created` to the `role:SUPER_ADMIN` socket room after write.
 *
 * @param {Object}  params
 * @param {*}               params.actorId    - MongoDB ObjectId or null (e.g. failed login)
 * @param {string|null}     params.actorRole  - JWT role string or null
 * @param {{ username, email }} params.actor  - Snapshot fields
 * @param {string}          params.action     - One of AuditActions
 * @param {{ type, id }|null} params.target   - Target entity descriptor or null
 * @param {Object}          [params.metadata] - Action-specific key/value pairs
 * @param {string|null}     [params.ip]       - Client IP address
 * @param {string|null}     [params.userAgent]- HTTP User-Agent header
 */
export function createAuditLog({
    actorId   = null,
    actorRole = null,
    actor     = { username: null, email: null },
    action,
    target    = null,
    metadata  = {},
    ip        = null,
    userAgent = null,
}) {
    // Intentionally NOT awaited — fire-and-forget
    (async () => {
        try {
            const summary = buildAuditSummary(action, { ...metadata, email: actor?.email });

            const log = await AuditLogRepository.createLog({
                actorId,
                actorRole,
                actor,
                action,
                target,
                summary,
                metadata,
                ip,
                userAgent,
            });

            // Push real-time notification to all connected SUPER_ADMIN clients
            const io = getIO();
            if (io) {
                io.to("role:SUPER_ADMIN").emit(SocketEvents.AUDIT_CREATED, toAuditLogItem(log));
            }
        } catch (err) {
            console.error("[AuditLog] Failed to write audit log:", err.message);
        }
    })();
}
