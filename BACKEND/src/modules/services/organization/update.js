import AppError from "../../../common/errors/AppErrors.js";
import * as OrganizationRepositories from "../../repositories/organization.repositories.js";
import { toOrganizationPublic } from "../../mappers/organization.mapper.js";
import { invalidatePrefix } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix } from "../../../common/utils/cache.constants.js";
import { getIO, SocketEvents } from "../../../infrastructure/socket/socket.service.js";
import { createAuditLog } from "../../../common/utils/audit.js";
import { AuditActions } from "../../../common/utils/audit.constants.js";

export async function updateOrganization({ actor, orgId, payload, ip, userAgent }) {
    const existing = await OrganizationRepositories.findById(orgId);
    if (!existing) throw new AppError("Organization not found", 404, "ORG_NOT_FOUND");

    const updates = {};
    if (payload.name   !== undefined) updates.name   = payload.name;
    if (payload.type   !== undefined) updates.type   = payload.type;
    if (payload.status !== undefined) updates.status = payload.status;

    const updated = await OrganizationRepositories.updateById(orgId, updates);

    await invalidatePrefix(CachePrefix.ORGS_LIST);

    const io = getIO();
    if (io) {
        io.to("role:SUPER_ADMIN").emit(SocketEvents.ORG_LIST_INVALIDATE);
    }

    createAuditLog({
        actorId: actor.sub, actorRole: actor.role,
        actor: { username: actor.username ?? null, email: actor.email ?? null },
        action: AuditActions.ORG_UPDATED,
        target: { type: "Organization" },
        metadata: {
            orgId: String(existing._id),
            orgName: existing.name,
            changes: Object.keys(updates),
        },
        ip, userAgent,
    });

    return toOrganizationPublic(updated);
}
