import AppError from "../../../common/errors/AppErrors.js";
import { JWT_EXPIRES_IN } from "../../../config/env.js";
import * as UsersRepository from "../../repositories/user.repositories.js";
import * as RefreshTokenRepository from "../../repositories/refreshToken.repositories.js";
import { toUserPublic } from "../../mappers/user.mapper.js";
import { parseDuration } from "./utils.js";
import { createRefreshToken } from "./refresh_helper.js";
import { signAccessToken } from "./token_helper.js";

export async function refresh({ refreshToken, ipAddress, userAgent }) {
    if (!refreshToken) throw new AppError("Refresh token required", 400, "REFRESH_TOKEN_REQUIRED");

    // Find the refresh token in database (including revoked ones to check for reuse)
    // We search by token string only, without isRevoked filter
    const storedToken = await RefreshTokenRepository.findByToken(refreshToken);

    if (!storedToken) {
        throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
    }

    // Reuse Detection: If token is already revoked/replaced, someone is using an old token!
    // This could be a theft attempt. Revoke EVERYTHING for this user.
    if (storedToken.isRevoked || storedToken.replacedByToken) {
        console.warn(`SECURITY ALERT: Reuse of revoked token detected for user ${storedToken.userId}. Revoking all sessions.`);
        
        await RefreshTokenRepository.revokeAllByUserId(storedToken.userId, {
            revokedByIp: ipAddress,
            reason: "token_reuse_detected"
        });

        throw new AppError("Refresh token was already used. Security alert: Please log in again.", 401, "TOKEN_REUSE_DETECTED");
    }

    // Check if expired
    if (storedToken.expiresAt < new Date()) {
        await RefreshTokenRepository.revokeByToken(refreshToken);
        throw new AppError("Refresh token expired", 401, "REFRESH_TOKEN_EXPIRED");
    }

    // Get user
    const user = await UsersRepository.findById(storedToken.userId);
    if (!user) throw new AppError("User not found", 401, "USER_NOT_FOUND");
    if (user.status !== "active") throw new AppError("User is not active", 401, "USER_NOT_ACTIVE");

    // Rotate refresh token (revoke old, create new)
    const { refreshToken: newRefreshToken, expiresAt } = await createRefreshToken(user, ipAddress, userAgent);
    await RefreshTokenRepository.revokeByToken(refreshToken, {
        revokedByIp: ipAddress,
        replacedByToken: newRefreshToken
    });

    // Issue new access token
    const accessToken = signAccessToken(user);

    return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: Math.floor(parseDuration(JWT_EXPIRES_IN) / 1000),
        user: toUserPublic(user),
    };
}
