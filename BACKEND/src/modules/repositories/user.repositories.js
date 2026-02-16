import User from "../models/user.model.js";

export async function create(data) {
    return User.create(data);
}

export async function findById(id) {
    return User.findById(id).exec()
}

export async function findByIdWithPassword(id) {
    return User.findById(id).select("+passwordHash").exec()
}

export async function findByIdWithMfaSecret(id) {
    return User.findById(id).select("+mfaSecret").exec()
}

export async function findByEmail(email) {
    return User.findOne({ email: email.toLowerCase().trim() }).exec()
}

export async function findByEmailWithPassword(email) {
    return User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash").exec()
}

export async function findMany(filter = {}) {
    return User.find(filter).sort({ createdAt: -1 }).exec()
}

export async function updateById(id, update) {
    return User.findByIdAndUpdate(id, update, { new: true }).exec()
}

/**
 * Increment failed login attempts for a user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function incrementFailedAttempts(userId) {
    await User.findByIdAndUpdate(userId, {
        $inc: { failedLoginAttempts: 1 }
    }).exec();
}

/**
 * Lock user account until a specific time
 * @param {string} userId - User ID
 * @param {Date} lockUntil - Date until which account should be locked
 * @returns {Promise<void>}
 */
export async function lockAccount(userId, lockUntil) {
    await User.findByIdAndUpdate(userId, {
        accountLockedUntil: lockUntil
    }).exec();
}

/**
 * Reset failed login attempts and unlock account
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function resetFailedAttempts(userId) {
    await User.findByIdAndUpdate(userId, {
        failedLoginAttempts: 0,
        accountLockedUntil: null
    }).exec();
}

