import AppError from "../../../common/errors/AppErrors.js";
import * as PolicyRepository from "../../repositories/policy.repositories.js";
import { invalidatePrefix } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix } from "../../../common/utils/cache.constants.js";
import { createAuditLog } from "../../../common/utils/audit.js";
import { AuditActions } from "../../../common/utils/audit.constants.js";

export async function deletePolicy({ actor, policyId, ip, userAgent }) {
    const existing = await PolicyRepository.findById(policyId);
    if (!existing) throw new AppError("Policy not found", 404, "POLICY_NOT_FOUND");

    await PolicyRepository.deleteById(policyId);

    await invalidatePrefix(CachePrefix.POLICY);

    createAuditLog({
        actorId: actor.sub, actorRole: actor.role,
        actor: { username: actor.username ?? null, email: actor.email ?? null },
        action: AuditActions.POLICY_DELETED,
        target: { type: "Policy" },
        metadata: { policyId, title: existing.title },
        ip, userAgent,
    });
}
