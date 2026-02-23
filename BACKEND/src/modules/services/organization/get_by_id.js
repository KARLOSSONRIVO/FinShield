import AppError from "../../../common/errors/AppErrors.js";
import * as OrganizationRepositories from "../../repositories/organization.repositories.js";
import { toOrganizationPublic } from "../../mappers/organization.mapper.js";
import { cacheGet, cacheSet } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix, CacheTTL } from "../../../common/utils/cache.constants.js";

export async function getOrganizationById({ actor, orgId }) {
    if (!actor) throw new AppError("Unauthorized", 403, "UNAUTHORIZED")

    // SUPER_ADMIN can access any organization, others can only access their own
    if (actor.role !== "SUPER_ADMIN") {
        if (!actor.orgId || String(actor.orgId) !== String(orgId)) {
            throw new AppError("Forbidden", 403, "FORBIDDEN")
        }
    }

    const cacheKey = `${CachePrefix.ORG}${orgId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const org = await OrganizationRepositories.findById(orgId);
    if (!org) throw new AppError("Organization not found", 404, "ORGANIZATION_NOT_FOUND")

    const result = toOrganizationPublic(org);
    await cacheSet(cacheKey, result, CacheTTL.ORG);
    return result;
}
