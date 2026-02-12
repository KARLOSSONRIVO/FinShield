import { Router } from "express";
import { validate } from "../../common/middlewares/validate.middleware.js";
import {
    loginSchema,
    changePasswordSchema,
    refreshSchema,
    logoutSchema
} from "../../modules/validators/auth.validator.js";
import { requireAuth } from "../../common/middlewares/auth.middleware.js";
import { enforceMustChangePassword } from "../../common/middlewares/rbac.middleware.js";
import { authLimiter } from "../../common/middlewares/rateLimit.middleware.js";
import * as AuthController from "../../modules/controllers/auth.controller.js";
import * as MfaController from "../../modules/controllers/mfa.controller.js";

const authRouter = Router();

authRouter.post("/login", authLimiter, validate(loginSchema), AuthController.login);
authRouter.post("/login/mfa", authLimiter, AuthController.verifyMfa);

authRouter.post("/refresh", authLimiter, validate(refreshSchema), AuthController.refresh);

// Protected routes - auth required
authRouter.use(requireAuth);

authRouter.post("/logout", validate(logoutSchema), AuthController.logout);

// MFA Management Routes
authRouter.post("/mfa/setup", MfaController.setup);
authRouter.post("/mfa/enable", MfaController.enable);
authRouter.post("/mfa/disable", MfaController.disable);

// These routes require password change enforcement
authRouter.use(enforceMustChangePassword({ exceptPaths: ["/auth/change-password", "/auth/mfa/setup", "/auth/mfa/enable", "/auth/mfa/disable"] }));

authRouter.get("/me", AuthController.me);

authRouter.post("/change-password", validate(changePasswordSchema), AuthController.changePassword);

export default authRouter;

