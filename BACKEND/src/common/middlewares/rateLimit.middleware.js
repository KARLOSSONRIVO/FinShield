import rateLimit from "express-rate-limit";
import AppError from "../errors/AppErrors.js";
import {
    RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX,
    RATE_LIMIT_USER_MAX,
    RATE_LIMIT_AUTH_MAX,
    RATE_LIMIT_UPLOAD_MAX,
} from "../../config/env.js";

function rateLimitHandler(_req, _res, next) {
    next(new AppError("Too many requests, please try again later.", 429, "RATE_LIMITED"));
}

export const globalLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
});

export const authenticatedLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_USER_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.auth?.sub || req.auth?.userId || req.ip,
    handler: rateLimitHandler,
});

export const authLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_AUTH_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
});

export const uploadLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_UPLOAD_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
});
