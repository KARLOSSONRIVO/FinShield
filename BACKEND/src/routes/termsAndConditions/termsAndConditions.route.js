import { Router } from "express";
import { allowRoles } from "../../common/middlewares/rbac.middleware.js";
import * as TermsController from "../../modules/controllers/termsAndConditions.controller.js";
import {
    validateCreateTerms,
    validateUpdateTerms,
    validateTermsIdParam,
} from "../../modules/validators/termsAndConditions.validator.js";

const termsRouter = Router();

// ─── REGULATOR only ───────────────────────────────────────────────────────────

// Create a new Terms and Conditions document
termsRouter.post(
    "/",
    allowRoles("REGULATOR", "SUPER_ADMIN"),
    validateCreateTerms,
    TermsController.createTerms
);

// Update a T&C document by id
termsRouter.patch(
    "/:id",
    allowRoles("REGULATOR", "SUPER_ADMIN"),
    validateUpdateTerms,
    TermsController.updateTerms
);

// Delete a T&C document by id
termsRouter.delete(
    "/:id",
    allowRoles("REGULATOR", "SUPER_ADMIN"),
    validateTermsIdParam,
    TermsController.deleteTerms
);

// ─── Read roles: COMPANY_MANAGER, AUDITOR, COMPANY_USER ──────────────────────

// Get all Terms and Conditions
termsRouter.get(
    "/",
    allowRoles("REGULATOR", "COMPANY_MANAGER", "AUDITOR", "COMPANY_USER","SUPER_ADMIN"),
    TermsController.getTerms
);

export default termsRouter;
