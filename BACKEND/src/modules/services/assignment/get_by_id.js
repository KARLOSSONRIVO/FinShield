import AppError from "../../../common/errors/AppErrors.js";
import * as AssignmentRepositories from "../../repositories/assignment.repositories.js";
import { toAssignmentPublic } from "../../mappers/assignment.mapper.js";

export async function getAssignmentById({ actor, assignmentId }) {
    if (!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
    if (actor.role !== "SUPER_ADMIN") {
        throw new AppError("Only SUPER_ADMIN can view assignments", 403, "FORBIDDEN")
    }

    const assignment = await AssignmentRepositories.findById(assignmentId);
    if (!assignment) throw new AppError("Assignment not found", 404, "ASSIGNMENT_NOT_FOUND")
    return toAssignmentPublic(assignment)
}
