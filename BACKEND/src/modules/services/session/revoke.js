import AppError from "../../../common/errors/AppErrors.js";
import * as RefreshTokenRepository from "../../repositories/refreshToken.repositories.js";

export async function revokeSession({ actor, sessionId, ipAddress }) {
    const sessions = await RefreshTokenRepository.findActiveByUserId(actor.sub)
    const target = sessions.find(s => String(s._id) === sessionId)
    if (!target) throw new AppError("Session not found", 404, "SESSION_NOT_FOUND")

    await RefreshTokenRepository.revokeByToken(target.token, { revokedByIp: ipAddress })
    return { message: "Session revoked successfully" }
}
