import jwt from 'jsonwebtoken';
import AppError from '../errors/AppErrors.js';
import { JWT_SECRET } from '../../config/env.js';

export function authMiddleware(req, _res, next) {
    const authHeader = req.headers.authorization|| ""
    const [type, token] = authHeader.split(" ")

    if (type !== "Bearer" || !token) {
        return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"))
    }

    try{
        const payload = jwt.verify(token, JWT_SECRET)
        req.user = payload
        req.auth = payload
        next();
    }catch (err) {
        return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"))
    }
}

export { authMiddleware as requireAuth }