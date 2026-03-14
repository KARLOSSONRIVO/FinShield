import AppError from "../../../common/errors/AppErrors.js";
import * as OrganizationRepositories from "../../repositories/organization.repositories.js";
import { toOrganizationPublic } from "../../mappers/organization.mapper.js";
import { processInvoiceTemplate } from "./process_template.js";
import { invalidatePrefix } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix } from "../../../common/utils/cache.constants.js";
import { getIO, SocketEvents } from "../../../infrastructure/socket/socket.service.js";
import { createAuditLog } from "../../../common/utils/audit.js";
import { AuditActions } from "../../../common/utils/audit.constants.js";

export async function createOrganization({ actor, payload, file, ip, userAgent }) {
    if (!actor || actor.role !== "SUPER_ADMIN") {
        throw new AppError("Unauthorized", 403, "UNAUTHORIZED");
    }

    // Create organization first
    const org = await OrganizationRepositories.createOrganization({
        type: payload.type,
        name: payload.name,
        status: payload.status ?? "active",
    });

    // Handle template upload if provided
    if (file) {
        await processInvoiceTemplate(org._id, file);
    }

    // Invalidate org list cache
    await invalidatePrefix(CachePrefix.ORGS_LIST);

    // Notify admins that org list changed
    const io = getIO();
    if (io) {
        io.to("role:SUPER_ADMIN").emit(SocketEvents.ORG_LIST_INVALIDATE);
    }

    createAuditLog({
        actorId: actor.sub, actorRole: actor.role,
        actor: { username: actor.username ?? null, email: actor.email ?? null },
        action: AuditActions.ORG_CREATED,
        target: { type: "Organization" },
        metadata: { orgName: payload.name, orgType: payload.type, actorEmail: actor.email },
        ip, userAgent,
    });

    if (file) {
        createAuditLog({
            actorId: actor.sub, actorRole: actor.role,
            actor: { username: actor.username ?? null, email: actor.email ?? null },
            action: AuditActions.ORG_TEMPLATE_UPLOADED,
            target: { type: "Organization" },
            metadata: { orgName: payload.name, orgId: String(org._id), fileName: file.originalname },
            ip, userAgent,
        });
    }

    return toOrganizationPublic(org);
}
