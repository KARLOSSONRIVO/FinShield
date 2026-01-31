import * as RefreshTokenRepository from "../../repositories/refreshToken.repositories.js";

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
