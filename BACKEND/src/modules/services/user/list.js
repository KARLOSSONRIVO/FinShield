import AppError from "../../../common/errors/AppErrors.js";
import * as UsersRepositories from "../../repositories/user.repositories.js";
import { toUserPublic } from "../../mappers/user.mapper.js";

export async function listUsers({ actor, orgId }) {
    if (!actor) throw new AppError("Unauthorized", 403, "UNAUTHORIZED")

    if (actor.role === "SUPER_ADMIN") {
        const filter = orgId ? { orgId } : {}
        const users = await UsersRepositories.findMany(filter)
        return users.map(toUserPublic)
    }

    throw new AppError("Forbidden", 403, "FORBIDDEN")
}
