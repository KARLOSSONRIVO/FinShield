import crypto from "crypto";
import * as RefreshTokenRepository from "../../repositories/refreshToken.repositories.js";
import { JWT_REFRESH_EXPIRES_IN } from "../../../config/env.js";
import { parseDuration } from "./utils.js";

export async function createRefreshToken(user, ipAddress, userAgent) {
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
