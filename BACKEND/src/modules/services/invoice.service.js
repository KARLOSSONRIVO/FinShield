import AppError from "../../common/errors/AppErrors.js";
import { sha256Hex } from "../../common/utils/hash.js";
import { addAndPinBuffer } from "../../infrastructure/storage/ipfs.service.js";    
import { anchorInvoice } from "../../infrastructure/blockchain/ethereum.service.js";   
import * as InvoiceRepositories from "../repositories/invoice.repositories.js";
import { toInvoicePublic } from "../mappers/invoice.mapper.js";

export async function uploadToIpfsAndAnchor({ actor,file }){
    if (!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
       // Only COMPANY_MANAGER and COMPANY_USER can upload invoices
    if (actor.role !== "COMPANY_MANAGER" && actor.role !== "COMPANY_USER") {
        throw new AppError("Only COMPANY_MANAGER and COMPANY_USER can upload invoices", 403, "FORBIDDEN");
    }
    if (!actor.orgId) throw new AppError("Company organization ID is required", 400, "MISSING_COMPANY_ORG_ID");
    // File validation is handled by validateInvoiceUpload middleware

    const fileSha = sha256Hex(file.buffer)

    const ipfs = await addAndPinBuffer({buffer: file.buffer})

    const invoice = await InvoiceRepositories.createInvoice({
        ipfsCid: ipfs.cid,
        fileHashSha256: fileSha,
        anchorStatus: "pending",
    })
    

    try {
        const anchored = await anchorInvoice({
          invoiceMongoId: invoice._id,
          ipfsCid: ipfs.cid,
          sha256Hex: fileSha,
        });
    
        invoice.anchorTxHash = anchored.txHash;
        invoice.anchorBlockNumber = anchored.blockNumber;
        invoice.anchoredAt = new Date();
        invoice.anchorStatus = "anchored";
        await invoice.save();
      } catch (e) {
        invoice.anchorStatus = "failed";
        invoice.anchorError = e?.message ? String(e.message) : "Anchor failed";
        await invoice.save();
        throw e;
      }
    
    return toInvoicePublic(invoice)
}