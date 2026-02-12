import RefreshToken from "../models/refreshToken.model.js";

export async function create(data) {
    return RefreshToken.create(data);
}

/**
 * Find a refresh token by its token string.
 * @param {string} token - The token string
 * @param {boolean} includeRevoked - Whether to include revoked tokens (default: true for security checks)
 */
export async function findByToken(token) {
    // We intentionally return revoked tokens so the service can detect reuse
    return RefreshToken.findOne({ token });
}

export async function findActiveByUserId(userId) {
    return RefreshToken.find({ 
        userId, 
        isRevoked: false, 
        expiresAt: { $gt: new Date() } 
    });
}

export async function revokeByToken(token, { revokedByIp = null, replacedByToken = null } = {}) {
    return RefreshToken.findOneAndUpdate(
        { token },
        { 
            isRevoked: true, 
            revokedAt: new Date(),
            revokedByIp,
            replacedByToken
        },
        { new: true }
    );
}

export async function revokeAllByUserId(userId, { revokedByIp = null, reason = "logout" } = {}) {
    return RefreshToken.updateMany(
        { userId, isRevoked: false },
        { 
            isRevoked: true, 
            revokedAt: new Date(),
            revokedByIp
        }
    );
}

export async function deleteExpired() {
    return RefreshToken.deleteMany({ expiresAt: { $lt: new Date() } });
}

export async function countActiveByUserId(userId) {
    return RefreshToken.countDocuments({ 
        userId, 
        isRevoked: false, 
        expiresAt: { $gt: new Date() } 
    });
}
