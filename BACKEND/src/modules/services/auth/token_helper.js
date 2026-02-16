import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../../../config/env.js";

export function signAccessToken(user, options = {}) {
    const payload = {
        sub: String(user._id),
        orgId: user.orgId ? String(user.orgId) : null,
        role: user.role,
        email: user.email,
        mustChangePassword: !!user.mustChangePassword,
        ...options.payload // Allow extra payload
    };

    const signOptions = {
        expiresIn: options.expiresIn || JWT_EXPIRES_IN,
    };

    return jwt.sign(payload, JWT_SECRET, signOptions);
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}
