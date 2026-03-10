import asyncHandler from "../../common/utils/asyncHandler.js";
import * as AuditLogService from "../services/auditLog.service.js";

export const listAuditLogs = asyncHandler(async (req, res) => {
    const data = await AuditLogService.listAuditLogs({
        actor: req.auth,
        query: req.query,
    });
    res.json({ ok: true, data });
});
