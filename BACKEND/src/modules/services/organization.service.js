import AppError from "../../common/errors/AppErrors.js";
import Organization from "../models/organization.model.js";
import * as OrganizationRepositories from "../repositories/organization.repositories.js";

export async function createOrganization({actor, payload}){
    if(!actor || actor.role !== "SUPER_ADMIN"){
        throw new AppError("Unauthorized", 403, "UNAUTHORIZED");
    }

    if(payload.type === "platform"){
        const existingPlatform = await OrganizationRepositories.findOne({type: "platform"});
        if(existingPlatform){
            throw new AppError("Platform already exists", 409, "PLATFORM_ALREADY_EXISTS");
        }
    }

    const org = await OrganizationRepositories.createOrganization({
        type: payload.type,
        name: payload.name,
        status: payload.status ?? "active",
    })

    return org;
}
export async function listOrganizations({actor}){
    if(!actor || actor.role !== "SUPER_ADMIN"){
        throw new AppError("Unauthorized", 403, "UNAUTHORIZED");
    }
    const orgs = await OrganizationRepositories.findMany({});
    return orgs;
}

export async function getOrganizationById({actor, orgId}){
    if(!actor) throw new AppError("Unauthorized", 403, "UNAUTHORIZED");

    if(actor.role !== "SUPER_ADMIN" && String(actor.orgId) !== String(orgId)){
        throw new AppError("Forbidden",403,"FORBIDDEN")
    }

    const org = await OrganizationRepositories.findById(orgId);
    if(!org) throw new AppError("Organization not found", 404, "ORGANIZATION_NOT_FOUND");
    return org;
}