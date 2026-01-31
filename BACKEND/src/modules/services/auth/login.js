import bcrypt from "bcrypt";
import AppError from "../../../common/errors/AppErrors.js";
import { JWT_EXPIRES_IN } from "../../../config/env.js";
import * as UsersRepository from "../../repositories/user.repositories.js";
import { toUserPublic } from "../../mappers/user.mapper.js";
import { parseDuration } from "./utils.js";
import { createRefreshToken } from "./refresh_helper.js";
import { signAccessToken } from "./token_helper.js";

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
