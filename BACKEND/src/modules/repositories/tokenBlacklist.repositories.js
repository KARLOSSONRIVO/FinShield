import TokenBlacklist from "../models/tokenBlacklist.model.js";

export async function create(data) {
    return TokenBlacklist.create(data);
}

export async function isBlacklisted(token) {
    const found = await TokenBlacklist.findOne({ token });
    return !!found;
}

export async function blacklistMany(tokens) {
    if (!tokens.length) return;
    return TokenBlacklist.insertMany(tokens, { ordered: false }).catch(err => {
        // Ignore duplicate key errors (token already blacklisted)
        if (err.code !== 11000) throw err;
    });
}

export async function findByUserId(userId) {
    return TokenBlacklist.find({ userId });
}

export async function deleteExpired() {
    return TokenBlacklist.deleteMany({ expiresAt: { $lt: new Date() } });
}
