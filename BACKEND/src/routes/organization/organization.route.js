import { Router } from "express";
import { validate } from "../../common/middlewares/validate.middleware.js";
import { allowRoles, requireSameOrgParam } from "../../common/middlewares/rbac.middleware.js";
import { createOrgSchema } from "../../modules/validators/organization.validator.js";
import * as OrganizationControllers from "../../modules/controllers/organization.controller.js";

const organizationRouter = Router()

// Auth and password change enforcement handled in index.js

organizationRouter.post('/createOrganization', validate(createOrgSchema), allowRoles("SUPER_ADMIN"), OrganizationControllers.createOrganization)

organizationRouter.get('/listOrganizations', allowRoles("SUPER_ADMIN"), OrganizationControllers.listOrganizations)

organizationRouter.get('/getOrganization/:id', requireSameOrgParam("id"), OrganizationControllers.getOneOrganization)

export default organizationRouter