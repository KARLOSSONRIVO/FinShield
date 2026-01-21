import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import AppError from "../../common/errors/AppErrors.js";
import { JWT_EXPIRES_IN, JWT_SECRET, JWT_REFRESH_EXPIRES_IN } from "../../config/env.js";
import * as UsersRepository from "../repositories/user.repositories.js";
import * as RefreshTokenRepository from "../repositories/refreshToken.repositories.js";
import * as TokenBlacklistRepository from "../repositories/tokenBlacklist.repositories.js";
import { toUserPublic } from "../mappers/user.mapper.js";

/**
 * Parse duration string (e.g., "7d", "1h", "30m") to milliseconds
 */
function parseDuration(duration) {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 3600000; // Default 1 hour
    const value = parseInt(match[1]);
    const unit = match[2];
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return value * multipliers[unit];
}

export async function login({ payload, ipAddress, userAgent }) {
    const user = await UsersRepository.findByEmailWithPassword(payload.email);
    if (!user) throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");

    if (user.status !== "active") throw new AppError("User is not active", 401, "USER_NOT_ACTIVE");

    const ok = await bcrypt.compare(payload.password, user.passwordHash);
    if (!ok) throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");

    await UsersRepository.updateById(user._id, { lastLoginAt: new Date() });

    const accessToken = signAccessToken(user);
    const { refreshToken, expiresAt } = await createRefreshToken(user, ipAddress, userAgent);

    return {
        accessToken,
        refreshToken,
        expiresIn: Math.floor(parseDuration(JWT_EXPIRES_IN) / 1000),
        user: toUserPublic(user),
        mustChangePassword: user.mustChangePassword,
    };
}

export async function refresh({ refreshToken, ipAddress, userAgent }) {
    if (!refreshToken) throw new AppError("Refresh token required", 400, "REFRESH_TOKEN_REQUIRED");

    // Find the refresh token in database
    const storedToken = await RefreshTokenRepository.findByToken(refreshToken);
    if (!storedToken) throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");

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

export async function me({ actor }) {
    const user = await UsersRepository.findById(actor.sub);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    return toUserPublic(user);
}

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

function signAccessToken(user) {
    return jwt.sign(
        {
            sub: String(user._id),
            orgId: user.orgId ? String(user.orgId) : null,
            role: user.role,
            email: user.email,
            mustChangePassword: !!user.mustChangePassword,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

async function createRefreshToken(user, ipAddress, userAgent) {
    const token = crypto.randomBytes(64).toString("hex");
    const expiresAt = new Date(Date.now() + parseDuration(JWT_REFRESH_EXPIRES_IN));

    await RefreshTokenRepository.create({
        userId: user._id,
        token,
        expiresAt,
        createdByIp: ipAddress,
        userAgent,
    });

    return { refreshToken: token, expiresAt };
}
