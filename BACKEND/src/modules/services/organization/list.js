import AppError from "../../../common/errors/AppErrors.js";
import * as OrganizationRepositories from "../../repositories/organization.repositories.js";
import { toOrganizationPublic } from "../../mappers/organization.mapper.js";

export async function listOrganizations({ actor, query = {} }) {
    if (!actor || actor.role !== "SUPER_ADMIN") {
        throw new AppError("Unauthorized", 403, "UNAUTHORIZED")
    }
    const { page, limit, search, sortBy, order } = query;
    const result = await OrganizationRepositories.findManyPaginated({ filter: {}, page, limit, search, sortBy, order });
    return {
        items: result.items.map(toOrganizationPublic),
        pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
        },
    };
}
