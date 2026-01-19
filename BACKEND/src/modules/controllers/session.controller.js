import asyncHandler from "../../common/utils/asyncHandler.js";
import * as SessionService from "../services/session.service.js";

// Helper to get client IP
function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
           req.socket?.remoteAddress || 
           req.ip
}

export const getSessions = asyncHandler(async (req, res) => {
    const data = await SessionService.getActiveSessions({ actor: req.auth })
    res.json({ ok: true, data })
})

export const revokeSession = asyncHandler(async (req, res) => {
    const data = await SessionService.revokeSession({ 
        actor: req.auth, 
        sessionId: req.params.sessionId,
        ipAddress: getClientIp(req)
    })
    res.json({ ok: true, data })
})

export const revokeAllSessions = asyncHandler(async (req, res) => {
    const data = await SessionService.revokeAllSessions({ 
        actor: req.auth,
        ipAddress: getClientIp(req)
    })
    res.json({ ok: true, data })
})

export const getSessionCount = asyncHandler(async (req, res) => {
    const data = await SessionService.getSessionCount({ actor: req.auth })
    res.json({ ok: true, data })
})
