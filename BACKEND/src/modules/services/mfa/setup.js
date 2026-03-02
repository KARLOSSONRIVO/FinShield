
import * as UsersRepository from "../../repositories/user.repositories.js";
import { generateMfaSecret } from "./generateMfaSecret.js";
import { verifyMfaToken } from "./verifyMfaToken.js";
import AppError from "../../../common/errors/AppErrors.js";
import bcrypt from "bcrypt";
import { cacheDel } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix } from "../../../common/utils/cache.constants.js";
import { createAuditLog } from "../../../common/utils/audit.js";
import { AuditActions } from "../../../common/utils/audit.constants.js";

export async function setupMfa(user) {
    const userId = user.sub || user._id; // JWT payload uses 'sub', DB object uses '_id'
    const userDoc = await UsersRepository.findById(userId);

    if (userDoc.mfaEnabled) {
        throw new AppError("MFA is already enabled", 400, "MFA_ALREADY_ENABLED");
    }
    const { secret, qrCodeUrl } = await generateMfaSecret(userDoc.email);

    await UsersRepository.updateById(userId, { mfaSecret: secret });
    await cacheDel(`${CachePrefix.USER}${userId}`);

    return {
        secret: secret.base32,
        qrCodeUrl
    };
}

export async function enableMfa({ user, token }) {
    const userId = user.sub || user._id;
    // We need to fetch the secret because it's selected: false by default
    const userWithSecret = await UsersRepository.findByIdWithMfaSecret(userId);

    if (userWithSecret.mfaEnabled) {
        throw new AppError("MFA is already enabled", 400, "MFA_ALREADY_ENABLED");
    }

    const isValid = verifyMfaToken(userWithSecret, token);
    if (!isValid) {
        throw new AppError("Invalid MFA code", 400, "INVALID_MFA_CODE");
    }

    await UsersRepository.updateById(userId, { mfaEnabled: true });
    await cacheDel(`${CachePrefix.USER}${userId}`);

    createAuditLog({ actorId: userId, actorRole: user.role, actor: { username: userWithSecret.username, email: userWithSecret.email }, action: AuditActions.MFA_ENABLED, target: { type: "User" }, metadata: { email: userWithSecret.email } });

    return { message: "MFA enabled successfully" };
}

export async function disableMfa({ user, password }) {
    const userId = user.sub || user._id;
    const userWithPassword = await UsersRepository.findByIdWithPassword(userId);

    const ok = await bcrypt.compare(password, userWithPassword.passwordHash);
    if (!ok) {
        throw new AppError("Invalid password", 401, "INVALID_CREDENTIALS");
    }

    await UsersRepository.updateById(userId, { mfaEnabled: false, mfaSecret: null });
    await cacheDel(`${CachePrefix.USER}${userId}`);

    createAuditLog({ actorId: userId, actorRole: user.role, actor: { username: userWithPassword.username, email: userWithPassword.email }, action: AuditActions.MFA_DISABLED, target: { type: "User" }, metadata: { email: userWithPassword.email } });

    return { message: "MFA disabled successfully" };
}
