import AppError from "../../../common/errors/AppErrors.js";
import * as TermsRepository from "../../repositories/termsAndConditions.repositories.js";
import { invalidatePrefix } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix } from "../../../common/utils/cache.constants.js";
import { createAuditLog } from "../../../common/utils/audit.js";
import { AuditActions } from "../../../common/utils/audit.constants.js";

export async function deleteTerms({ actor, termsId, ip, userAgent }) {
    const existing = await TermsRepository.findById(termsId);
    if (!existing) throw new AppError("Terms not found", 404, "TERMS_NOT_FOUND");

    await TermsRepository.deleteById(termsId);

    await invalidatePrefix(CachePrefix.TERMS);

    createAuditLog({
        actorId: actor.sub, actorRole: actor.role,
        actor: { username: actor.username ?? null, email: actor.email ?? null },
        action: AuditActions.TERMS_DELETED,
        target: { type: "TermsAndConditions" },
        metadata: { termsId, title: existing.title },
        ip, userAgent,
    });
}
