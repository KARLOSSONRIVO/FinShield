import { Router } from "express";
import { validate } from "../../common/middlewares/validate.middleware.js";
import { allowRoles, requireSameOrgParam } from "../../common/middlewares/rbac.middleware.js";
import { createOrgSchema } from "../../modules/validators/organization.validator.js";
import * as OrganizationControllers from "../../modules/controllers/organization.controller.js";

const organizationRouter = Router()

// Auth and password change enforcement handled in index.js

// Only SUPER_ADMIN can create organizations
organizationRouter.post('/createOrganization', validate(createOrgSchema), allowRoles("SUPER_ADMIN"), OrganizationControllers.createOrganization)

// Only SUPER_ADMIN can list all organizations
organizationRouter.get('/listOrganizations', allowRoles("SUPER_ADMIN"), OrganizationControllers.listOrganizations)

// SUPER_ADMIN can access any org, others can only access their own
organizationRouter.get('/getOrganization/:id', requireSameOrgParam("id"), OrganizationControllers.getOneOrganization)

export default organizationRouter