import jwt from 'jsonwebtoken';
import AppError from '../errors/AppErrors.js';
import { JWT_SECRET } from '../../config/env.js';
import * as TokenBlacklistRepository from '../../modules/repositories/tokenBlacklist.repositories.js';

export async function authMiddleware(req, _res, next) {
    const authHeader = req.headers.authorization || "";
    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
        return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    }

    try {
        // Check if token is blacklisted
        const isBlacklisted = await TokenBlacklistRepository.isBlacklisted(token);
        if (isBlacklisted) {
            return next(new AppError("Token has been revoked", 401, "TOKEN_REVOKED"));
        }

        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        req.auth = payload;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new AppError("Token expired", 401, "TOKEN_EXPIRED"));
        }
        return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    }
}

export { authMiddleware as requireAuth };