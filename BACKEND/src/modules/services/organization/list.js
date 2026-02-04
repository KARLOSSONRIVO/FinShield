import AppError from "../../../common/errors/AppErrors.js";
import * as OrganizationRepositories from "../../repositories/organization.repositories.js";
import { toOrganizationPublic } from "../../mappers/organization.mapper.js";

export async function listOrganizations({ actor }) {
    if (!actor || actor.role !== "SUPER_ADMIN") {
        throw new AppError("Unauthorized", 403, "UNAUTHORIZED")
    }
    const orgs = await OrganizationRepositories.findMany({})
    return orgs.map(toOrganizationPublic);
}
