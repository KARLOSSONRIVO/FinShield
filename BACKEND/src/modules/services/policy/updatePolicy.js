import AppError from "../../../common/errors/AppErrors.js";
import * as PolicyRepository from "../../repositories/policy.repositories.js";
import { toPolicyItem } from "../../mappers/policy.mapper.js";
import { invalidatePrefix } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix } from "../../../common/utils/cache.constants.js";
import { createAuditLog } from "../../../common/utils/audit.js";
import { AuditActions } from "../../../common/utils/audit.constants.js";

export async function updatePolicy({ actor, policyId, payload, ip, userAgent }) {
    const existing = await PolicyRepository.findById(policyId);
    if (!existing) throw new AppError("Policy not found", 404, "POLICY_NOT_FOUND");

    const updates = {};
    if (payload.title   !== undefined) updates.title   = payload.title;
    if (payload.content !== undefined) updates.content = payload.content;

    // Auto-increment minor version on every update unless caller explicitly provides one
    if (payload.version !== undefined) {
        updates.version = payload.version;
    } else {
        const [major, minor] = (existing.version ?? "1.0").split(".").map(Number);
        updates.version = `${major}.${(minor ?? 0) + 1}`;
    }

    updates.updatedByUserId = actor.sub;

    const updated = await PolicyRepository.updateById(policyId, updates);

    await invalidatePrefix(CachePrefix.POLICY);

    createAuditLog({
        actorId: actor.sub, actorRole: actor.role,
        actor: { username: actor.username ?? null, email: actor.email ?? null },
        action: AuditActions.POLICY_UPDATED,
        target: { type: "Policy" },
        metadata: { policyId, title: existing.title, changes: Object.keys(updates) },
        ip, userAgent,
    });

    return toPolicyItem(updated);
}
