import AppError from "../../common/errors/AppErrors.js";
import * as AssignmentRepositories from "../repositories/assignment.repositories.js";
import * as UserRepositories from "../repositories/user.repositories.js";
import * as OrganizationRepositories from "../repositories/organization.repositories.js";
import { toAssignmentPublic } from "../mappers/assignment.mapper.js";

export async function createAssignment({ actor, payload }) {
    if (!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    if (actor.role !== "SUPER_ADMIN") {
        throw new AppError("Only SUPER_ADMIN can create assignments", 403, "FORBIDDEN");
    }

    // Validate required fields
    if (!payload.companyOrgId) throw new AppError("companyOrgId is required", 400, "MISSING_COMPANY_ORG_ID");
    if (!payload.auditorUserId) throw new AppError("auditorUserId is required", 400, "MISSING_AUDITOR_USER_ID");

    // Verify auditor exists and is actually an AUDITOR
    const auditor = await UserRepositories.findById(payload.auditorUserId);
    if (!auditor) throw new AppError("Auditor not found", 404, "AUDITOR_NOT_FOUND");
    if (auditor.role !== "AUDITOR") {
        throw new AppError("User must be an AUDITOR to be assigned", 400, "INVALID_AUDITOR_ROLE");
    }
    if (auditor.status !== "active") {
        throw new AppError("Auditor must be active", 400, "INACTIVE_AUDITOR");
    }

    // Verify company exists and is a company type organization
    const company = await OrganizationRepositories.findById(payload.companyOrgId);
    if (!company) throw new AppError("Company not found", 404, "COMPANY_NOT_FOUND");
    if (company.type !== "company") {
        throw new AppError("Organization must be a company type", 400, "INVALID_ORG_TYPE");
    }

    // Check if auditor is already assigned to this specific company
    const existingAssignment = await AssignmentRepositories.findOne({
        auditorUserId: payload.auditorUserId,
        companyOrgId: payload.companyOrgId
    });
    
    if (existingAssignment) {
        if (existingAssignment.status === "active") {
            throw new AppError("Auditor is already assigned to this company", 409, "AUDITOR_ALREADY_ASSIGNED_TO_COMPANY");
        } else {
            // If inactive, reactivate the existing assignment
            const updated = await AssignmentRepositories.updateById(existingAssignment._id, {
                status: "active",
                assignedByUserId: actor.sub,
                assignedAt: new Date(),
                notes: payload.notes || existingAssignment.notes
            });
            const reactivated = await AssignmentRepositories.findById(updated._id);
            return toAssignmentPublic(reactivated);
        }
    }

    const assignment = await AssignmentRepositories.create({
        companyOrgId: payload.companyOrgId,
        auditorUserId: payload.auditorUserId,
        status: payload.status ?? "active",
        assignedByUserId: actor.sub,
        assignedAt: new Date(),
        notes: payload.notes || null
    });

    const created = await AssignmentRepositories.findById(assignment._id);
    return toAssignmentPublic(created);
}

export async function listAssignments({ actor }) {
    if (!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    if (actor.role !== "SUPER_ADMIN") {
        throw new AppError("Only SUPER_ADMIN can list assignments", 403, "FORBIDDEN");
    }

    const filter = {};
    const assignments = await AssignmentRepositories.findMany(filter);
    return assignments.map(toAssignmentPublic);
}

export async function getAssignmentById({ actor, assignmentId }) {
    if (!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    if (actor.role !== "SUPER_ADMIN") {
        throw new AppError("Only SUPER_ADMIN can view assignments", 403, "FORBIDDEN");
    }

    const assignment = await AssignmentRepositories.findById(assignmentId);
    if (!assignment) throw new AppError("Assignment not found", 404, "ASSIGNMENT_NOT_FOUND");
    return toAssignmentPublic(assignment);
}

export async function updateAssignment({ actor, assignmentId, payload }) {
    if (!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    if (actor.role !== "SUPER_ADMIN") {
        throw new AppError("Only SUPER_ADMIN can update assignments", 403, "FORBIDDEN");
    }

    const assignment = await AssignmentRepositories.findById(assignmentId);
    if (!assignment) throw new AppError("Assignment not found", 404, "ASSIGNMENT_NOT_FOUND");

    const updateData = {};
    
    if (payload.status !== undefined) {
        updateData.status = payload.status;
    }
    
    if (payload.notes !== undefined) {
        updateData.notes = payload.notes;
    }

    // Note: We don't allow changing companyOrgId or auditorUserId to maintain data integrity
    // If needed, delete old assignment and create new one

    const updated = await AssignmentRepositories.updateById(assignmentId, updateData);
    return toAssignmentPublic(updated);
}

export async function deleteAssignment({ actor, assignmentId }) {
    if (!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    if (actor.role !== "SUPER_ADMIN") {
        throw new AppError("Only SUPER_ADMIN can delete assignments", 403, "FORBIDDEN");
    }

    const assignment = await AssignmentRepositories.findById(assignmentId);
    if (!assignment) throw new AppError("Assignment not found", 404, "ASSIGNMENT_NOT_FOUND");

    // Soft delete by setting status to inactive, or hard delete
    // For now, we'll do hard delete, but you could change to soft delete
    await AssignmentRepositories.updateById(assignmentId, { status: "inactive" });
    
    return { message: "Assignment deleted successfully" };
}
