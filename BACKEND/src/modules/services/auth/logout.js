import jwt from "jsonwebtoken";
import * as RefreshTokenRepository from "../../repositories/refreshToken.repositories.js";
import * as TokenBlacklistRepository from "../../repositories/tokenBlacklist.repositories.js";

export async function logout({ actor, accessToken, refreshToken, ipAddress, logoutAll = false }) {
    // Blacklist the current access token
    if (accessToken) {
        try {
            const decoded = jwt.decode(accessToken);
            if (decoded && decoded.exp) {
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

    return { message: logoutAll ? "Logged out from all devices" : "Logged out successfully" };
}
