import User from "../models/user.model.js";

export async function create(data) {
  return User.create(data);
}

export async function findById(id) {
    return User.findById(id).exec();
}

export async function findByEmail(email) {
    return User.findOne({ email: email.toLowerCase().trim() }).exec();
}

export async function findByEmailWithPassword(email) {
    return UserModel.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash").exec();
}

export async function findMany(filter = {}) {
    return UserModel.find(filter).sort({ createdAt: -1 }).exec();
}

export async function updateById(id, update) {
    return UserModel.findByIdAndUpdate(id, update, { new: true }).exec();
}
