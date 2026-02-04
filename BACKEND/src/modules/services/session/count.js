import * as RefreshTokenRepository from "../../repositories/refreshToken.repositories.js";

export async function getSessionCount({ actor }) {
    const count = await RefreshTokenRepository.countActiveByUserId(actor.sub)
    return { count }
}
