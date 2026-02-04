import AppError from "../../../common/errors/AppErrors.js";
import * as UsersRepositories from "../../repositories/user.repositories.js";
import { toUserPublic } from "../../mappers/user.mapper.js";

export async function updateUser({ actor, userId, status, reason }) {
    if (!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
    if (actor.role !== "SUPER_ADMIN") throw new AppError("Forbidden", 403, "FORBIDDEN")

    if (status === "disabled" && String(actor.sub) === String(userId)) {
        throw new AppError("You cannot disable your own account", 400, "CANNOT_DISABLE_SELF")
    }

    const user = await UsersRepositories.findById(userId);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND")

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

    return toUserPublic(updated);
}
