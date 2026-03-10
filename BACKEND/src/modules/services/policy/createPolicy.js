import AppError from "../../../common/errors/AppErrors.js";
import * as PolicyRepository from "../../repositories/policy.repositories.js";
import { toPolicyItem } from "../../mappers/policy.mapper.js";
import { invalidatePrefix } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix } from "../../../common/utils/cache.constants.js";
import { createAuditLog } from "../../../common/utils/audit.js";
import { AuditActions } from "../../../common/utils/audit.constants.js";

export async function createPolicy({ actor, payload, ip, userAgent }) {
    const { title, content, version } = payload;

    const policy = await PolicyRepository.createOne({
        title,
        content,
        version: version ?? "1.0",
        createdByUserId: actor.sub,
        updatedByUserId: actor.sub,
    });

    await invalidatePrefix(CachePrefix.POLICY);

    createAuditLog({
        actorId: actor.sub, actorRole: actor.role,
        actor: { username: actor.username ?? null, email: actor.email ?? null },
        action: AuditActions.POLICY_CREATED,
        target: { type: "Policy" },
        metadata: { policyId: policy._id, title },
        ip, userAgent,
    });

    return toPolicyItem(policy.toObject ? policy.toObject() : policy);
}
