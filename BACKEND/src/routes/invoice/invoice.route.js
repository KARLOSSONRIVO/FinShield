import { Router } from "express";
import { uploadSingle } from "../../common/utils/multer.js";
import { allowRoles } from "../../common/middlewares/rbac.middleware.js";
import { uploadLimiter } from "../../common/middlewares/rateLimit.middleware.js";
import * as InvoiceController from "../../modules/controllers/invoice.controller.js";
import { validateInvoiceUpload, validateReviewBody } from "../../modules/validators/invoice.validator.js";
import { validateInvoiceListQuery, validateMyInvoiceListQuery } from "../../modules/validators/pagination.validator.js";
import { validateInvoiceIdParam } from "../../modules/validators/invoice.validator.js";
import { validateFileType } from "../../common/middlewares/fileType.middleware.js";

const invoiceRouter = Router()

invoiceRouter.get(
    "/list",
    allowRoles("SUPER_ADMIN", "REGULATOR", "AUDITOR", "COMPANY_MANAGER"),
    validateInvoiceListQuery,
    InvoiceController.listInvoices
)

invoiceRouter.get(
    "/my-invoices",
    allowRoles("COMPANY_USER"),
    validateMyInvoiceListQuery,
    InvoiceController.listMyInvoices
)

invoiceRouter.get(
    "/:id",
    allowRoles("SUPER_ADMIN", "REGULATOR", "AUDITOR", "COMPANY_MANAGER", "COMPANY_USER"),
    validateInvoiceIdParam,
    InvoiceController.getInvoiceDetail
)

invoiceRouter.post(
    "/upload",
    uploadLimiter,
    uploadSingle("file"),
    validateFileType,
    validateInvoiceUpload,
    allowRoles("COMPANY_MANAGER", "COMPANY_USER"),
    InvoiceController.uploadAndAnchorInvoice
)

invoiceRouter.patch(
    "/:id/review",
    allowRoles("AUDITOR"),
    validateInvoiceIdParam,
    validateReviewBody,
    InvoiceController.submitReviewDecision
)


export default invoiceRouter
