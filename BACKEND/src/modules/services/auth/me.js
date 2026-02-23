import AppError from "../../../common/errors/AppErrors.js";
import * as UsersRepository from "../../repositories/user.repositories.js";
import { toUserPublic } from "../../mappers/user.mapper.js";
import { cacheGet, cacheSet } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix, CacheTTL } from "../../../common/utils/cache.constants.js";

export async function me({ actor }) {
    const cacheKey = `${CachePrefix.USER}${actor.sub}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return cached;

    const user = await UsersRepository.findById(actor.sub);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

    const result = toUserPublic(user);
    await cacheSet(cacheKey, result, CacheTTL.USER);
    return result;
}
