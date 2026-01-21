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

sessionRouter.get("/", SessionController.getSessions)

sessionRouter.get("/count", SessionController.getSessionCount)

sessionRouter.delete("/all", SessionController.revokeAllSessions)

sessionRouter.delete("/:sessionId", validate(revokeSessionSchema), SessionController.revokeSession)

export default sessionRouter
