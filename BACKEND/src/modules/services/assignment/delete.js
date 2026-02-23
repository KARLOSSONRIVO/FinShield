import AppError from "../../../common/errors/AppErrors.js";
import * as AssignmentRepositories from "../../repositories/assignment.repositories.js";
import { cacheDel, invalidatePrefix } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix } from "../../../common/utils/cache.constants.js";

export async function deleteAssignment({ actor, assignmentId }) {
    if (!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
    if (actor.role !== "SUPER_ADMIN") {
        throw new AppError("Only SUPER_ADMIN can delete assignments", 403, "FORBIDDEN")
    }

    const assignment = await AssignmentRepositories.findById(assignmentId)
    if (!assignment) throw new AppError("Assignment not found", 404, "ASSIGNMENT_NOT_FOUND")

    // Soft delete by setting status to inactive, or hard delete
    // For now, we'll do hard delete, but you could change to soft delete
    await AssignmentRepositories.updateById(assignmentId, { status: "inactive" })

    // Invalidate assignment-related caches
    const auditorId = assignment.auditorUserId?._id || assignment.auditorUserId;
    const companyOrgId = assignment.companyOrgId?._id || assignment.companyOrgId;
    await Promise.all([
        cacheDel(`${CachePrefix.ASSIGN_DETAIL}${assignmentId}`),
        invalidatePrefix(CachePrefix.ASSIGN_LIST),
        cacheDel(`${CachePrefix.AUDITOR_ORGS}${auditorId}`),
        cacheDel(`${CachePrefix.AUDITOR_ACTIVE}${companyOrgId}`),
    ]);

    return { message: "Assignment deleted successfully" }
}
