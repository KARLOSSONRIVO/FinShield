
import asyncHandler from "../../common/utils/asyncHandler.js";
import * as MfaService from "../services/mfa.service.js";

// Helper to get client IP
function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip;
}

export const setup = asyncHandler(async (req, res) => {
    const data = await MfaService.setupMfa(req.auth);
    res.json({ ok: true, data });
});

export const enable = asyncHandler(async (req, res) => {
    const { token } = req.body;
    const data = await MfaService.enableMfa({
        user: req.auth,
        token
    });
    res.json({ ok: true, data });
});

export const disable = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const data = await MfaService.disableMfa({
        user: req.auth,
        password
    });
    res.json({ ok: true, data });
});
