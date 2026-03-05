import { Router } from "express";
import { allowRoles } from "../../common/middlewares/rbac.middleware.js";
import * as PolicyController from "../../modules/controllers/policy.controller.js";
import {
    validateCreatePolicy,
    validateUpdatePolicy,
    validatePolicyIdParam,
} from "../../modules/validators/policy.validator.js";

const policyRouter = Router();

// ─── Regulator only ───────────────────────────────────────────────────────────

// Create a new policy for a company org
policyRouter.post(
    "/",
    allowRoles("REGULATOR"),
    validateCreatePolicy,
    PolicyController.createPolicy
);

// Update a policy by id
policyRouter.patch(
    "/:id",
    allowRoles("REGULATOR"),
    validateUpdatePolicy,
    PolicyController.updatePolicy
);

// Delete a policy by id
policyRouter.delete(
    "/:id",
    allowRoles("REGULATOR"),
    validatePolicyIdParam,
    PolicyController.deletePolicy
);

// ─── All authenticated roles ──────────────────────────────────────────────────

// Get all global policies
policyRouter.get(
    "/",
    allowRoles("REGULATOR", "COMPANY_MANAGER", "COMPANY_USER"),
    PolicyController.getPolicies
);

export default policyRouter;
