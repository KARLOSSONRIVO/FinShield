import { Router } from "express";
import { allowRoles } from "../../common/middlewares/rbac.middleware.js";
import { validateLedgerQuery } from "../../modules/validators/pagination.validator.js";
import * as BlockchainController from "../../modules/controllers/blockchain.controller.js";

const blockchainRouter = Router();

blockchainRouter.get("/ledger",allowRoles("SUPER_ADMIN","REGULATOR","AUDITOR"),validateLedgerQuery,BlockchainController.getLedger);

export default blockchainRouter;
