import AppError from "../../../common/errors/AppErrors.js";
import * as AuditLogRepository from "../../repositories/auditLog.repositories.js";
import { toAuditLogItem } from "../../mappers/auditLog.mapper.js";

/**
 * Return a paginated list of audit logs.
 * Restricted to SUPER_ADMIN only.
 *
 * @param {Object} params
 * @param {Object} params.actor  - JWT payload from req.auth
 * @param {Object} params.query  - Validated query parameters
 * @returns {{ items, total, page, limit, totalPages }}
 */
export async function listAuditLogs({ actor, query = {} }) {
    if (!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    if (actor.role !== "SUPER_ADMIN") throw new AppError("Forbidden", 403, "FORBIDDEN");

    const page  = Math.max(1, parseInt(query.page  ?? 1, 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? 50, 10)));

    const from = query.from ? new Date(query.from) : undefined;
    const to   = query.to   ? new Date(query.to)   : undefined;

    const { items, total } = await AuditLogRepository.findAllPaginated({
        page,
        limit,
        action:    query.action    || undefined,
        actorRole: query.actorRole || undefined,
        search:    query.search    || undefined,
        from,
        to,
    });

    return {
        items:      items.map(toAuditLogItem),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}
