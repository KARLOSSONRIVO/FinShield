import { Router } from "express";
import { validate } from "../../common/middlewares/validate.middleware.js";
import { revokeSessionSchema } from "../../modules/validators/session.validator.js";
import { requireAuth } from "../../common/middlewares/auth.middleware.js";
import { enforceMustChangePassword } from "../../common/middlewares/rbac.middleware.js";
import * as SessionController from "../../modules/controllers/session.controller.js";

const sessionRouter = Router()

// All session routes require authentication
sessionRouter.use(requireAuth)
sessionRouter.use(enforceMustChangePassword())

// Get all active sessions for the current user
sessionRouter.get("/", SessionController.getSessions)

// Get session count
sessionRouter.get("/count", SessionController.getSessionCount)

// Revoke all sessions (logout from all devices)
sessionRouter.delete("/all", SessionController.revokeAllSessions)

// Revoke a specific session
sessionRouter.delete("/:sessionId", validate(revokeSessionSchema), SessionController.revokeSession)

export default sessionRouter
