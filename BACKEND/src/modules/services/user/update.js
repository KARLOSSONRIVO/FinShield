import AppError from "../../../common/errors/AppErrors.js";
import * as UsersRepositories from "../../repositories/user.repositories.js";
import { toUserPublic } from "../../mappers/user.mapper.js";
import { cacheDel, invalidatePrefix } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix } from "../../../common/utils/cache.constants.js";
import { getIO, SocketEvents } from "../../../infrastructure/socket/socket.service.js";
import { createAuditLog } from "../../../common/utils/audit.js";
import { AuditActions } from "../../../common/utils/audit.constants.js";

export async function updateUser({ actor, userId, status, reason, ip, userAgent }) {
    if (!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
    
    // Only SUPER_ADMIN and COMPANY_MANAGER can update users
    if (actor.role !== "SUPER_ADMIN" && actor.role !== "COMPANY_MANAGER") {
        throw new AppError("Forbidden", 403, "FORBIDDEN")
    }

    // Cannot disable own account
    if (status === "disabled" && String(actor.sub) === String(userId)) {
        throw new AppError("You cannot disable your own account", 400, "CANNOT_DISABLE_SELF")
    }

    const user = await UsersRepositories.findById(userId);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND")

    // COMPANY_MANAGER specific restrictions
    if (actor.role === "COMPANY_MANAGER") {
        // Can only update COMPANY_USER (employees)
        if (user.role !== "COMPANY_USER") {
            throw new AppError("Company managers can only update employee accounts", 403, "FORBIDDEN_ROLE")
        }

        // Must be in the same organization
        if (String(user.orgId) !== String(actor.orgId)) {
            throw new AppError("You can only update employees in your organization", 403, "FORBIDDEN_ORG")
        }
    }

    const updateData = {
        status,
        updatedAt: new Date(),
    };

    if (status === "disabled") {
        updateData.disabledByUserId = actor.sub;
        updateData.disabledAt = new Date();
        updateData.disableReason = reason;
    } else if (status === "active") {
        updateData.disabledByUserId = null;
        updateData.disabledAt = null;
        updateData.disableReason = null;
    }

    const updated = await UsersRepositories.updateById(userId, updateData)

    // Invalidate user caches
    await Promise.all([
        cacheDel(`${CachePrefix.USER}${userId}`),
        invalidatePrefix(CachePrefix.USERS_LIST),
        invalidatePrefix(CachePrefix.USERS_EMP),
    ]);

    // Notify admins that user list changed
    const io = getIO();
    if (io) {
        io.to("role:SUPER_ADMIN").emit(SocketEvents.USER_LIST_INVALIDATE);
    }

    const auditAction = status === "disabled" ? AuditActions.USER_DISABLED
        : status === "active"   ? AuditActions.USER_ENABLED
        : AuditActions.USER_UPDATED;

    createAuditLog({
        actorId: actor.sub, actorRole: actor.role,
        actor: { username: actor.username ?? null, email: actor.email ?? null },
        action: auditAction,
        target: { type: "User" },
        metadata: { targetEmail: user.email, newStatus: status, actorEmail: actor.email, reason: reason ?? null },
        ip, userAgent,
    });

    return toUserPublic(updated);
}
