import { Router } from "express";
import { requireAuth } from "../../common/middlewares/auth.middleware.js";
import { validate } from "../../common/middlewares/validate.middleware.js";
import { createOrgSchema } from "../../modules/validators/organization.validators.js";
import * as OrganizationControllers from "../../modules/controllers/organization.controllers.js";

const OrganizationRouter = Router();

OrganizationRouter.use(requireAuth)

OrganizationRouter.post('/createOrganization',validate(createOrgSchema),OrganizationControllers.createOrganization)
OrganizationRouter.get('/listOrganizations',OrganizationControllers.listOrganizations)
OrganizationRouter.get('/getOrganization/:id',OrganizationControllers.getOneOrganization)

export default OrganizationRouter;