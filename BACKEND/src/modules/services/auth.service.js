import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AppError from "../../common/errors/AppErrors.js";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../../config/env.js";
import * as UsersRepository from "../repositories/user.repositories.js";
import { toUserPublic } from "../mappers/user.mapper.js";

export async function login ({payload}){
    const user = await UsersRepository.findByEmailWithPassword(payload.email)
    if(!user) throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS")

    if(user.status !== "active") throw new AppError("User is not active", 401, "USER_NOT_ACTIVE")

    const ok = await bcrypt.compare(payload.password, user.passwordHash)
    if(!ok) throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS")

    await UsersRepository.updateById(user._id, {lastLoginAt: new Date()})

    const token = signToken(user)

    return{
        token,
        user: toUserPublic(user),
        mustChangePassword: user.mustChangePassword,
    }
}

export async function me({ actor }) {
    const user = await UsersRepository.findById(actor.sub)
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND")
    return toUserPublic(user)
  }

export async function changePassword({actor, payload}){
    const user = await UsersRepository.findByIdWithPassword(actor.sub)
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND")
    if (user.status !== "active") throw new AppError("Account disabled", 403, "ACCOUNT_DISABLED")

    const ok = await bcrypt.compare(payload.currentPassword, user.passwordHash)
    if (!ok) throw new AppError("Current password is incorrect", 400, "WRONG_PASSWORD")

    const passwordHash = await bcrypt.hash(payload.newPassword, 10)

    const updated = await UsersRepository.updateById(user._id, {
    passwordHash,
    mustChangePassword: false,
    });

    const token = signToken(updated)

  return { token, user: toUserPublic(updated), mustChangePassword: false }
}

function signToken(user) {
  return jwt.sign(
    {
      sub: String(user._id),
      orgId: user.orgId ? String(user.orgId) : null, // SUPER_ADMIN may not have orgId
      role: user.role,
      email: user.email,
      mustChangePassword: !!user.mustChangePassword,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}
