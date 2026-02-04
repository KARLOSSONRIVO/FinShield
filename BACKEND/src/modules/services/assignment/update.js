import AppError from "../../../common/errors/AppErrors.js";
import * as AssignmentRepositories from "../../repositories/assignment.repositories.js";
import { toAssignmentPublic } from "../../mappers/assignment.mapper.js";

export async function updateAssignment({ actor, assignmentId, payload }) {
    if (!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
    if (actor.role !== "SUPER_ADMIN") {
        throw new AppError("Only SUPER_ADMIN can update assignments", 403, "FORBIDDEN")
    }

    const assignment = await AssignmentRepositories.findById(assignmentId)
    if (!assignment) throw new AppError("Assignment not found", 404, "ASSIGNMENT_NOT_FOUND")

    const updateData = {};

    if (payload.status !== undefined) {
        updateData.status = payload.status
    }

    if (payload.notes !== undefined) {
        updateData.notes = payload.notes
    }

    // Note: We don't allow changing companyOrgId or auditorUserId to maintain data integrity
    // If needed, delete old assignment and create new one

    const updated = await AssignmentRepositories.updateById(assignmentId, updateData)
    return toAssignmentPublic(updated)
}
