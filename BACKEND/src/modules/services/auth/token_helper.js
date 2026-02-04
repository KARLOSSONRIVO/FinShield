import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../../../config/env.js";

export function signAccessToken(user) {
    return jwt.sign(
        {
            sub: String(user._id),
            orgId: user.orgId ? String(user.orgId) : null,
            role: user.role,
            email: user.email,
            mustChangePassword: !!user.mustChangePassword,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}
