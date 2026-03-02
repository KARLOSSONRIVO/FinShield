import AppError from "../../../common/errors/AppErrors.js";
import * as AssignmentRepositories from "../../repositories/assignment.repositories.js";
import * as UserRepositories from "../../repositories/user.repositories.js";
import * as OrganizationRepositories from "../../repositories/organization.repositories.js";
import { toAssignmentPublic } from "../../mappers/assignment.mapper.js";
import { cacheDel, invalidatePrefix } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix } from "../../../common/utils/cache.constants.js";
import { getIO, SocketEvents } from "../../../infrastructure/socket/socket.service.js";
import { createAuditLog } from "../../../common/utils/audit.js";
import { AuditActions } from "../../../common/utils/audit.constants.js";

export async function createAssignment({ actor, payload, ip, userAgent }) {
    if (!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
    if (actor.role !== "SUPER_ADMIN") {
        throw new AppError("Only SUPER_ADMIN can create assignments", 403, "FORBIDDEN")
    }

    // Note: companyOrgId and auditorUserId are validated by Zod validator at route level
    // Verify auditor exists and is actually an AUDITOR
    const auditor = await UserRepositories.findById(payload.auditorUserId)
    if (!auditor) throw new AppError("Auditor not found", 404, "AUDITOR_NOT_FOUND")
    if (auditor.role !== "AUDITOR") {
        throw new AppError("User must be an AUDITOR to be assigned", 400, "INVALID_AUDITOR_ROLE")
    }
    if (auditor.status !== "active") {
        throw new AppError("Auditor must be active", 400, "INACTIVE_AUDITOR")
    }

    // Verify company exists and is a company type organization
    const company = await OrganizationRepositories.findById(payload.companyOrgId)
    if (!company) throw new AppError("Company not found", 404, "COMPANY_NOT_FOUND")
    if (company.type !== "company") {
        throw new AppError("Organization must be a company type", 400, "INVALID_ORG_TYPE")
    }

    // Check if auditor is already assigned to this specific company
    const existingAssignment = await AssignmentRepositories.findOne({
        auditorUserId: payload.auditorUserId,
        companyOrgId: payload.companyOrgId
    })

    // Helper to invalidate assignment-related caches
    const invalidateAssignmentCaches = async () => {
        await Promise.all([
            invalidatePrefix(CachePrefix.ASSIGN_LIST),
            cacheDel(`${CachePrefix.AUDITOR_ORGS}${payload.auditorUserId}`),
            cacheDel(`${CachePrefix.AUDITOR_ACTIVE}${payload.companyOrgId}`),
        ]);
    };

    if (existingAssignment) {
        if (existingAssignment.status === "active") {
            throw new AppError("Auditor is already assigned to this company", 409, "AUDITOR_ALREADY_ASSIGNED_TO_COMPANY")
        } else {
            // If inactive, reactivate the existing assignment
            const updated = await AssignmentRepositories.updateById(existingAssignment._id, {
                status: "active",
                assignedByUserId: actor.sub,
                assignedAt: new Date(),
                notes: payload.notes || existingAssignment.notes
            })
            const reactivated = await AssignmentRepositories.findById(updated._id);

            await invalidateAssignmentCaches();

            const io = getIO();
            if (io) {
                io.to(`user:${payload.auditorUserId}`).emit(SocketEvents.ASSIGNMENT_CREATED, {
                    assignmentId: reactivated._id.toString(),
                    companyOrgId: payload.companyOrgId,
                });
                io.to(`role:SUPER_ADMIN`).emit(SocketEvents.ASSIGNMENT_CREATED, {
                    assignmentId: reactivated._id.toString(),
                    auditorUserId: payload.auditorUserId,
                    companyOrgId: payload.companyOrgId,
                });
            }

            createAuditLog({
                actorId: actor.sub, actorRole: actor.role,
                actor: { username: actor.username ?? null, email: actor.email ?? null },
                action: AuditActions.ASSIGNMENT_CREATED,
                target: { type: "Assignment" },
                metadata: { assignmentId: reactivated._id.toString(), auditorUserId: payload.auditorUserId, companyOrgId: payload.companyOrgId, reactivated: true, actorEmail: actor.email },
                ip, userAgent,
            });

            return toAssignmentPublic(reactivated)
        }
    }

    const assignment = await AssignmentRepositories.create({
        companyOrgId: payload.companyOrgId,
        auditorUserId: payload.auditorUserId,
        status: payload.status ?? "active",
        assignedByUserId: actor.sub,
        assignedAt: new Date(),
        notes: payload.notes || null
    })

    const created = await AssignmentRepositories.findById(assignment._id)

    await invalidateAssignmentCaches();

    const io = getIO();
    if (io) {
        io.to(`user:${payload.auditorUserId}`).emit(SocketEvents.ASSIGNMENT_CREATED, {
            assignmentId: created._id.toString(),
            companyOrgId: payload.companyOrgId,
        });
        io.to(`role:SUPER_ADMIN`).emit(SocketEvents.ASSIGNMENT_CREATED, {
            assignmentId: created._id.toString(),
            auditorUserId: payload.auditorUserId,
            companyOrgId: payload.companyOrgId,
        });
    }

    createAuditLog({
        actorId: actor.sub, actorRole: actor.role,
        actor: { username: actor.username ?? null, email: actor.email ?? null },
        action: AuditActions.ASSIGNMENT_CREATED,
        target: { type: "Assignment" },
        metadata: { assignmentId: created._id.toString(), auditorUserId: payload.auditorUserId, companyOrgId: payload.companyOrgId, actorEmail: actor.email },
        ip, userAgent,
    });

    return toAssignmentPublic(created)
}
