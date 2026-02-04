import AppError from "../../../common/errors/AppErrors.js";
import * as AssignmentRepositories from "../../repositories/assignment.repositories.js";

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

    return { message: "Assignment deleted successfully" }
}
