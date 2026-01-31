import AppError from "../../../common/errors/AppErrors.js";
import * as AssignmentRepositories from "../../repositories/assignment.repositories.js";
import { toAssignmentPublic } from "../../mappers/assignment.mapper.js";

export async function listAssignments({ actor }) {
    if (!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
    if (actor.role !== "SUPER_ADMIN") {
        throw new AppError("Only SUPER_ADMIN can list assignments", 403, "FORBIDDEN")
    }

    const filter = {};
    const assignments = await AssignmentRepositories.findMany(filter)
    return assignments.map(toAssignmentPublic)
}
