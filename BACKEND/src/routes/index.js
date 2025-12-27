import { Router } from "express";

import healthRoutes from "./health/health.router.js";
import OrganizationRouter from "./organization/organization.router.js";
import userRouter from "./User/user.router.js";
const router = Router();

router.use("/health", healthRoutes);
router.use("/organization", OrganizationRouter);
router.use("/user", userRouter);
export default router;