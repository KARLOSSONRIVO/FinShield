import bcrypt from "bcrypt";
import AppError from "../../../common/errors/AppErrors.js";
import { JWT_EXPIRES_IN } from "../../../config/env.js";
import * as UsersRepository from "../../repositories/user.repositories.js";
import * as RefreshTokenRepository from "../../repositories/refreshToken.repositories.js";
import { toUserPublic } from "../../mappers/user.mapper.js";
import { parseDuration } from "./utils.js";
import { createRefreshToken } from "./refresh_helper.js";
import { signAccessToken } from "./token_helper.js";
import { cacheDel } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix } from "../../../common/utils/cache.constants.js";

export async function changePassword({ actor, payload, ipAddress }) {
    const user = await UsersRepository.findByIdWithPassword(actor.sub);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    if (user.status !== "active") throw new AppError("Account disabled", 403, "ACCOUNT_DISABLED");

    const ok = await bcrypt.compare(payload.currentPassword, user.passwordHash);
    if (!ok) throw new AppError("Current password is incorrect", 400, "WRONG_PASSWORD");

    const passwordHash = await bcrypt.hash(payload.newPassword, 10);

    const updated = await UsersRepository.updateById(user._id, {
        passwordHash,
        mustChangePassword: false,
    });

    // Invalidate user profile cache
    await cacheDel(`${CachePrefix.USER}${actor.sub}`);

    // Revoke all existing refresh tokens (force re-login on other devices)
    await RefreshTokenRepository.revokeAllByUserId(user._id, {
        revokedByIp: ipAddress,
        reason: "password_change"
    });

    // Issue new tokens
    const accessToken = signAccessToken(updated);
    const { refreshToken } = await createRefreshToken(updated, ipAddress);

    return {
        accessToken,
        refreshToken,
        expiresIn: Math.floor(parseDuration(JWT_EXPIRES_IN) / 1000),
        user: toUserPublic(updated),
        mustChangePassword: false
    };
}
