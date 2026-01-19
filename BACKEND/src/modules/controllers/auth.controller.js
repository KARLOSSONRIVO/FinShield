import asyncHandler from "../../common/utils/asyncHandler.js";
import * as AuthService from "../services/auth.service.js";

// Helper to get client IP
function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
           req.socket?.remoteAddress || 
           req.ip;
}

export const login = asyncHandler(async (req, res) => {
    const data = await AuthService.login({ 
        payload: req.body,
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent']
    });
    res.json({ ok: true, data });
});

export const refresh = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const data = await AuthService.refresh({ 
        refreshToken,
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent']
    });
    res.json({ ok: true, data });
});

export const logout = asyncHandler(async (req, res) => {
    const authHeader = req.headers.authorization || "";
    const [, accessToken] = authHeader.split(" ");
    const { refreshToken, logoutAll } = req.body;
    
    const data = await AuthService.logout({ 
        actor: req.auth,
        accessToken,
        refreshToken,
        ipAddress: getClientIp(req),
        logoutAll: !!logoutAll
    });
    res.json({ ok: true, data });
});

export const me = asyncHandler(async (req, res) => {
    const data = await AuthService.me({ actor: req.auth });
    res.json({ ok: true, data });
});

export const changePassword = asyncHandler(async (req, res) => {
    const data = await AuthService.changePassword({ 
        actor: req.auth, 
        payload: req.body,
        ipAddress: getClientIp(req)
    });
    res.json({ ok: true, data });
});

