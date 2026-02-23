import AppError from "../../../common/errors/AppErrors.js";
import * as OrganizationRepositories from "../../repositories/organization.repositories.js";
import { toOrganizationPublic } from "../../mappers/organization.mapper.js";
import { processInvoiceTemplate } from "./process_template.js";
import { invalidatePrefix } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix } from "../../../common/utils/cache.constants.js";
import { getIO, SocketEvents } from "../../../infrastructure/socket/socket.service.js";

export async function createOrganization({ actor, payload, file }) {
    if (!actor || actor.role !== "SUPER_ADMIN") {
        throw new AppError("Unauthorized", 403, "UNAUTHORIZED");
    }

    if (payload.type === "platform") {
        const existingPlatform = await OrganizationRepositories.findOne({ type: "platform" });
        if (existingPlatform) {
            throw new AppError("Platform already exists", 409, "PLATFORM_ALREADY_EXISTS");
        }
    }

    // Create organization first
    const org = await OrganizationRepositories.createOrganization({
        type: payload.type,
        name: payload.name,
        status: payload.status ?? "active",
    });

    // Handle template upload if provided
    if (file) {
        await processInvoiceTemplate(org._id, file);
    }

    // Invalidate org list cache
    await invalidatePrefix(CachePrefix.ORGS_LIST);

    // Notify admins that org list changed
    const io = getIO();
    if (io) {
        io.to("role:SUPER_ADMIN").emit(SocketEvents.ORG_LIST_INVALIDATE);
    }

    return toOrganizationPublic(org);
}
