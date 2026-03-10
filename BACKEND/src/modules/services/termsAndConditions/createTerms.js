import * as TermsRepository from "../../repositories/termsAndConditions.repositories.js";
import { toTermsItem } from "../../mappers/termsAndConditions.mapper.js";
import { invalidatePrefix } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix } from "../../../common/utils/cache.constants.js";
import { createAuditLog } from "../../../common/utils/audit.js";
import { AuditActions } from "../../../common/utils/audit.constants.js";

export async function createTerms({ actor, payload, ip, userAgent }) {
    const { title, content, version } = payload;

    const doc = await TermsRepository.createOne({
        title,
        content,
        version: version ?? "1.0",
        createdByUserId: actor.sub,
        updatedByUserId: actor.sub,
    });

    await invalidatePrefix(CachePrefix.TERMS);

    createAuditLog({
        actorId: actor.sub, actorRole: actor.role,
        actor: { username: actor.username ?? null, email: actor.email ?? null },
        action: AuditActions.TERMS_CREATED,
        target: { type: "TermsAndConditions" },
        metadata: { termsId: doc._id, title },
        ip, userAgent,
    });

    return toTermsItem(doc.toObject ? doc.toObject() : doc);
}
