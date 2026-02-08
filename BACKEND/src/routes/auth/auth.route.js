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

const authRouter = Router();

authRouter.post("/login", authLimiter, validate(loginSchema), AuthController.login);

authRouter.post("/refresh", authLimiter, validate(refreshSchema), AuthController.refresh);

// Protected routes - auth required
authRouter.use(requireAuth);

authRouter.post("/logout", validate(logoutSchema), AuthController.logout);

// These routes require password change enforcement
authRouter.use(enforceMustChangePassword({ exceptPaths: ["/auth/change-password"] }));

authRouter.get("/me", AuthController.me);
    
authRouter.post("/change-password", validate(changePasswordSchema), AuthController.changePassword);

export default authRouter;

