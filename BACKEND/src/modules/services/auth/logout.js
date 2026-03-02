import jwt from "jsonwebtoken";
import * as RefreshTokenRepository from "../../repositories/refreshToken.repositories.js";
import * as TokenBlacklistRepository from "../../repositories/tokenBlacklist.repositories.js";
import { blacklistAdd } from "../../../infrastructure/redis/cache.service.js";
import { createAuditLog } from "../../../common/utils/audit.js";
import { AuditActions } from "../../../common/utils/audit.constants.js";

export async function logout({ actor, accessToken, refreshToken, ipAddress, logoutAll = false }) {
    // Blacklist the current access token
    if (accessToken) {
        try {
            const decoded = jwt.decode(accessToken);
            if (decoded && decoded.exp) {
                // Add to Redis blacklist (instant lookup on subsequent requests)
                await blacklistAdd(accessToken, decoded.exp);

                // Also persist to MongoDB (durable fallback)
                await TokenBlacklistRepository.create({
                    token: accessToken,
                    userId: actor.sub,
                    expiresAt: new Date(decoded.exp * 1000),
                    reason: "logout",
                    revokedByIp: ipAddress,
                });
            }
        } catch (err) {
            // Ignore errors when blacklisting
        }
    }

    // Revoke refresh token(s)
    if (logoutAll) {
        // Logout from all devices
        await RefreshTokenRepository.revokeAllByUserId(actor.sub, { revokedByIp: ipAddress });
    } else if (refreshToken) {
        // Logout current session only
        await RefreshTokenRepository.revokeByToken(refreshToken, { revokedByIp: ipAddress });
    }

    createAuditLog({ actorId: actor.sub, actorRole: actor.role, actor: { username: actor.username ?? null, email: actor.email ?? null }, action: AuditActions.LOGOUT, target: { type: "User" }, metadata: { logoutAll: !!logoutAll }, ip: ipAddress, userAgent: null });

    return { message: logoutAll ? "Logged out from all devices" : "Logged out successfully" };
}
