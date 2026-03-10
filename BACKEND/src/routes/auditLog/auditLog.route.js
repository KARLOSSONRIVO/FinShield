import { Router } from "express";
import { allowRoles } from "../../common/middlewares/rbac.middleware.js";
import * as AuditLogController from "../../modules/controllers/auditLog.controller.js";
import { validateAuditLogQuery } from "../../modules/validators/auditLog.validator.js";

const auditLogRouter = Router();

/**
 * GET /audit-logs
 * Paginated audit log list — SUPER_ADMIN only.
 * Supports filters: action, actorRole, search, from, to, page, limit
 */
auditLogRouter.get(
    "/",
    allowRoles("SUPER_ADMIN"),
    validateAuditLogQuery,
    AuditLogController.listAuditLogs
);

export default auditLogRouter;
