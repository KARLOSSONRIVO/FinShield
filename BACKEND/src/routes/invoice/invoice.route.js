import { Router } from "express";
import { uploadSingle } from "../../common/utils/multer.js";
import { allowRoles } from "../../common/middlewares/rbac.middleware.js";
import * as InvoiceController from "../../modules/controllers/invoice.controller.js";
import { validateInvoiceUpload } from "../../modules/validators/invoice.validator.js";

const invoiceRouter = Router()

invoiceRouter.post("/upload", uploadSingle("file"), validateInvoiceUpload, allowRoles("COMPANY_MANAGER", "COMPANY_USER"), InvoiceController.uploadAndAnchorInvoice)


export default invoiceRouter
