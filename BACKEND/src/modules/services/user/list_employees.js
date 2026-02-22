import AppError from "../../../common/errors/AppErrors.js";
import * as UsersRepositories from "../../repositories/user.repositories.js";
import { toUserPublic } from "../../mappers/user.mapper.js";

export async function listEmployees({ actor, query = {} }) {
    if (!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED")

    if (actor.role !== "COMPANY_MANAGER") {
        throw new AppError("Forbidden - Only company managers can access employees", 403, "FORBIDDEN")
    }

    if (!actor.orgId) {
        throw new AppError("Organization not found for user", 400, "ORG_NOT_FOUND")
    }

    const { page, limit, search, sortBy, order } = query;
    const filter = {
        orgId: actor.orgId,
        role: "COMPANY_USER",
        _id: { $ne: actor.userId || actor.sub },
    };

    const result = await UsersRepositories.findManyPaginated({ filter, page, limit, search, sortBy, order });

    return {
        items: result.items.map(toUserPublic),
        pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        },
    };
}
