import AppError from "../../../common/errors/AppErrors.js";
import Policy from "../../models/policy.model.js";
import * as OrganizationRepository from "../../repositories/organization.repositories.js";
import { toPolicyItem } from "../../mappers/policy.mapper.js";
import { invalidatePrefix } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix } from "../../../common/utils/cache.constants.js";
import { createAuditLog } from "../../../common/utils/audit.js";
import { AuditActions } from "../../../common/utils/audit.constants.js";

/**
 * Bulk upsert policies for an org.
 * Each item in `policies` is matched by { orgId, type }.
 * If a doc for that type already exists → it is updated.
 * If it doesn't exist → it is inserted.
 */
export async function bulkUpsertPolicies({ actor, orgId, policies, ip, userAgent }) {
    const org = await OrganizationRepository.findById(orgId);
    if (!org) throw new AppError("Organization not found", 404, "ORG_NOT_FOUND");
    if (org.type !== "company") {
        throw new AppError("Policies can only be assigned to company organizations", 400, "INVALID_ORG_TYPE");
    }

    const now = new Date();

    const bulkOps = policies.map(({ type, title, content, version }) => ({
        updateOne: {
            filter: { orgId, type },
            update: {
                $set: {
                    title,
                    content,
                    version:         version ?? "1.0",
                    isActive:        true,
                    updatedByUserId: actor.sub,
                    updatedAt:       now,
                },
                $setOnInsert: {
                    orgId,
                    type,
                    createdByUserId: actor.sub,
                    createdAt:       now,
                },
            },
            upsert: true,
        },
    }));

    await Policy.bulkWrite(bulkOps, { ordered: false });

    // Return all current policies for the org after upsert
    const result = await Policy.find({ orgId }).sort({ type: 1 }).lean();

    await invalidatePrefix(`${CachePrefix.POLICY}${orgId}`);

    createAuditLog({
        actorId: actor.sub, actorRole: actor.role,
        actor: { username: actor.username ?? null, email: actor.email ?? null },
        action: AuditActions.POLICY_BULK_UPSERTED,
        target: { type: "Policy" },
        metadata: {
            orgId,
            orgName:    org.name,
            count:      policies.length,
            types:      policies.map((p) => p.type),
            actorEmail: actor.email,
        },
        ip, userAgent,
    });

    return result.map(toPolicyItem);
}
