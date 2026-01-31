import * as RefreshTokenRepository from "../../repositories/refreshToken.repositories.js";

export async function revokeAllSessions({ actor, ipAddress }) {
    await RefreshTokenRepository.revokeAllByUserId(actor.sub, { revokedByIp: ipAddress })
    return { message: "All sessions revoked successfully" }
}
