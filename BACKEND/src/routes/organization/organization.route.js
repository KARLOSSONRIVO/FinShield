import { Router } from "express";
import { uploadSingle } from "../../common/utils/multer.js";
import { validate } from "../../common/middlewares/validate.middleware.js";
import { allowRoles, requireSameOrgParam } from "../../common/middlewares/rbac.middleware.js";
import { createOrgSchema } from "../../modules/validators/organization.validator.js";
import { validateOrgListQuery } from "../../modules/validators/pagination.validator.js";
import * as OrganizationControllers from "../../modules/controllers/organization.controller.js";

const organizationRouter = Router()

organizationRouter.post('/createOrganization',
    uploadSingle('invoiceTemplate'),
    validate(createOrgSchema),
    allowRoles("SUPER_ADMIN"),
    OrganizationControllers.createOrganization
)

organizationRouter.get('/listOrganizations', allowRoles("SUPER_ADMIN"), validateOrgListQuery, OrganizationControllers.listOrganizations)

organizationRouter.get('/getOrganization/:id', requireSameOrgParam("id"), OrganizationControllers.getOneOrganization)

export default organizationRouter
