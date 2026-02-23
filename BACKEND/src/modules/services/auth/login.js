
import bcrypt from "bcrypt";
import AppError from "../../../common/errors/AppErrors.js";
import { JWT_EXPIRES_IN } from "../../../config/env.js";
import * as UsersRepository from "../../repositories/user.repositories.js";
import { toUserPublic } from "../../mappers/user.mapper.js";
import { parseDuration } from "./utils.js";
import { createRefreshToken } from "./refresh_helper.js";
import { signAccessToken, verifyToken } from "./token_helper.js";
import { verifyMfaToken } from "../mfa/verifyMfaToken.js";
import { cacheDel } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix } from "../../../common/utils/cache.constants.js";

export async function login({ payload, ipAddress, userAgent }) {
    const user = await UsersRepository.findByEmailWithPassword(payload.email);
    if (!user) throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");

    if (user.status !== "active") throw new AppError("User is not active", 401, "USER_NOT_ACTIVE");

    // Check if account is locked
    if (user.accountLockedUntil && new Date() < user.accountLockedUntil) {
        const remainingMinutes = Math.ceil((user.accountLockedUntil - new Date()) / 1000 / 60);
        throw new AppError(
            `Account is locked due to too many failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
            401,
            "ACCOUNT_LOCKED"
        );
    }

    // Verify password
    const ok = await bcrypt.compare(payload.password, user.passwordHash);

    if (!ok) {
        // Increment failed attempts
        await UsersRepository.incrementFailedAttempts(user._id);

        // Check if we need to lock the account (after 5th failed attempt)
        const updatedUser = await UsersRepository.findById(user._id);
        if (updatedUser.failedLoginAttempts >= 5) {
            const lockUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
            await UsersRepository.lockAccount(user._id, lockUntil);
            throw new AppError(
                "Account locked due to too many failed login attempts. Please try again in 5 minutes.",
                401,
                "ACCOUNT_LOCKED"
            );
        }

        throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }

    // Reset failed attempts on successful login
    if (user.failedLoginAttempts > 0 || user.accountLockedUntil) {
        await UsersRepository.resetFailedAttempts(user._id);
    }

    await UsersRepository.updateById(user._id, { lastLoginAt: new Date() });
    await cacheDel(`${CachePrefix.USER}${user._id}`);

    // MFA Check
    if (user.mfaEnabled) {
        const tempToken = signAccessToken(user, { expiresIn: '5m', payload: { scope: 'mfa_pending' } });
        return {
            mfaRequired: true,
            tempToken,
            expiresIn: 300 // 5 minutes
        };
    }

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

export async function verifyMfaLogin({ tempToken, token, ipAddress, userAgent }) {
    const decoded = verifyToken(tempToken);

    if (!decoded || !decoded.sub) {
        throw new AppError("Invalid or expired session", 401, "INVALID_SESSION");
    }

    if (decoded.scope !== 'mfa_pending') {
        throw new AppError("Invalid token scope", 401, "INVALID_TOKEN_SCOPE");
    }

    const user = await UsersRepository.findByIdWithMfaSecret(decoded.sub);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

    if (!user.mfaEnabled) {
        throw new AppError("MFA is not enabled for this user", 400, "MFA_NOT_ENABLED");
    }

    const isVerified = verifyMfaToken(user, token);
    if (!isVerified) {
        throw new AppError("Invalid MFA code", 401, "INVALID_MFA_CODE");
    }

    const accessToken = signAccessToken(user);
    const { refreshToken } = await createRefreshToken(user, ipAddress, userAgent);

    return {
        accessToken,
        refreshToken,
        expiresIn: Math.floor(parseDuration(JWT_EXPIRES_IN) / 1000),
        user: toUserPublic(user),
        mustChangePassword: user.mustChangePassword,
    };
}
