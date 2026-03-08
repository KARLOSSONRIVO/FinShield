import AppError from "../../../common/errors/AppErrors.js";
import * as TermsRepository from "../../repositories/termsAndConditions.repositories.js";
import { toTermsItem } from "../../mappers/termsAndConditions.mapper.js";
import { invalidatePrefix } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix } from "../../../common/utils/cache.constants.js";
import { createAuditLog } from "../../../common/utils/audit.js";
import { AuditActions } from "../../../common/utils/audit.constants.js";

export async function updateTerms({ actor, termsId, payload, ip, userAgent }) {
    const existing = await TermsRepository.findById(termsId);
    if (!existing) throw new AppError("Terms not found", 404, "TERMS_NOT_FOUND");

    const updates = {};
    if (payload.title   !== undefined) updates.title   = payload.title;
    if (payload.content !== undefined) updates.content = payload.content;

    if (payload.version !== undefined) {
        updates.version = payload.version;
    } else {
        const [major, minor] = (existing.version ?? "1.0").split(".").map(Number);
        updates.version = `${major}.${(minor ?? 0) + 1}`;
    }

    updates.updatedByUserId = actor.sub;

    const updated = await TermsRepository.updateById(termsId, updates);

    await invalidatePrefix(CachePrefix.TERMS);

    createAuditLog({
        actorId: actor.sub, actorRole: actor.role,
        actor: { username: actor.username ?? null, email: actor.email ?? null },
        action: AuditActions.TERMS_UPDATED,
        target: { type: "TermsAndConditions" },
        metadata: { termsId, title: existing.title, changes: Object.keys(updates) },
        ip, userAgent,
    });

    return toTermsItem(updated);
}
