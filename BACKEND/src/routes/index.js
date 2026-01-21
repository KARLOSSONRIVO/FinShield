import { Router } from "express";
import { requireAuth } from "../common/middlewares/auth.middleware.js";
import { enforceMustChangePassword } from "../common/middlewares/rbac.middleware.js";

import healthRoutes from "./health/health.route.js";
import organizationRouter from "./organization/organization.route.js";
import userRouter from "./User/user.route.js";
import authRouter from "./auth/auth.route.js";
import sessionRouter from "./session/session.route.js";
import assignmentRouter from "./assignment/assignment.route.js";
import invoiceRouter from "./invoice/invoice.route.js";
import docsRouter from "./docs/docs.route.js";


const router = Router();

// API Documentation (public)
router.use("/api-docs", docsRouter);

// Public routes (no auth required)
router.use("/health", healthRoutes)

// Auth routes (login is public, others require auth)
router.use("/auth", authRouter)

// Session routes (has its own auth middleware)
router.use("/session", sessionRouter)

// Protected routes - require authentication
router.use(requireAuth);

// Enforce password change for all authenticated routes (except change-password)
router.use(enforceMustChangePassword({ exceptPaths: ["/auth/change-password"] }))

router.use("/organization", organizationRouter)
router.use("/user", userRouter);
router.use("/assignment", assignmentRouter)
router.use("/invoice", invoiceRouter)
export default router;