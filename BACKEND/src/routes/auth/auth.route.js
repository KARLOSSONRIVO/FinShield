import { Router } from "express";
import { validate } from "../../common/middlewares/validate.middleware.js";
import { loginSchema, changePasswordSchema } from "../../modules/validators/auth.validator.js";
import { requireAuth } from "../../common/middlewares/auth.middleware.js";
import { enforceMustChangePassword } from "../../common/middlewares/rbac.middleware.js";
import * as AuthController from "../../modules/controllers/auth.controller.js";

const authRouter = Router();

// Public route - no auth required
authRouter.post("/login", validate(loginSchema), AuthController.login)

// Protected routes - auth required
authRouter.use(requireAuth)
authRouter.use(enforceMustChangePassword({ exceptPaths: ["/auth/change-password"] }))

authRouter.get("/me", AuthController.me)
authRouter.post("/change-password", validate(changePasswordSchema), AuthController.changePassword)

export default authRouter

