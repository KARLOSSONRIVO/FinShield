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
