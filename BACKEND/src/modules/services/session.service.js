import AppError from "../../common/errors/AppErrors.js";
import * as RefreshTokenRepository from "../repositories/refreshToken.repositories.js";

export async function getActiveSessions({ actor }) {
    const sessions = await RefreshTokenRepository.findActiveByUserId(actor.sub)
    return sessions.map(s => ({
        id: s._id,
        createdAt: s.createdAt,
        userAgent: s.userAgent,
        createdByIp: s.createdByIp,
        expiresAt: s.expiresAt,
    }))
}

export async function revokeSession({ actor, sessionId, ipAddress }) {
    const sessions = await RefreshTokenRepository.findActiveByUserId(actor.sub)
    const target = sessions.find(s => String(s._id) === sessionId)
    if (!target) throw new AppError("Session not found", 404, "SESSION_NOT_FOUND")

    await RefreshTokenRepository.revokeByToken(target.token, { revokedByIp: ipAddress })
    return { message: "Session revoked successfully" }
}

export async function revokeAllSessions({ actor, ipAddress }) {
    await RefreshTokenRepository.revokeAllByUserId(actor.sub, { revokedByIp: ipAddress })
    return { message: "All sessions revoked successfully" }
}

export async function getSessionCount({ actor }) {
    const count = await RefreshTokenRepository.countActiveByUserId(actor.sub)
    return { count }
}
