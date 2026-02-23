import AppError from "../../../common/errors/AppErrors.js";
import * as AssignmentRepositories from "../../repositories/assignment.repositories.js";
import { toAssignmentPublic } from "../../mappers/assignment.mapper.js";
import { cacheGet, cacheSet } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix, CacheTTL } from "../../../common/utils/cache.constants.js";

export async function getAssignmentById({ actor, assignmentId }) {
    if (!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
    if (actor.role !== "SUPER_ADMIN") {
        throw new AppError("Only SUPER_ADMIN can view assignments", 403, "FORBIDDEN")
    }

    const cacheKey = `${CachePrefix.ASSIGN_DETAIL}${assignmentId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const assignment = await AssignmentRepositories.findById(assignmentId);
    if (!assignment) throw new AppError("Assignment not found", 404, "ASSIGNMENT_NOT_FOUND")

    const result = toAssignmentPublic(assignment);
    await cacheSet(cacheKey, result, CacheTTL.ASSIGN_DETAIL);
    return result;
}
