import { Router } from "express";
import multer from "multer";
import { allowRoles } from "../../common/middlewares/rbac.middleware.js";
import * as InvoiceController from "../../modules/controllers/invoice.controller.js";
import { validateInvoiceUpload } from "../../modules/validators/invoice.validator.js";

const invoiceRouter = Router()

const upload = multer ({ storage: multer.memoryStorage(), limits:{fileSize: 10 * 1024 * 1024}})

invoiceRouter.post("/upload", upload.single("file"), validateInvoiceUpload, allowRoles("COMPANY_MANAGER", "COMPANY_USER"), InvoiceController.uploadAndAnchorInvoice)

export default invoiceRouter