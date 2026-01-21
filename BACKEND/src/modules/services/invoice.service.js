import AppError from "../../common/errors/AppErrors.js";
import { sha256Hex } from "../../common/utils/hash.js";
import { addAndPinBuffer } from "../../infrastructure/storage/ipfs.service.js";    
import { anchorInvoice } from "../../infrastructure/blockchain/ethereum.service.js";   
import * as InvoiceRepositories from "../repositories/invoice.repositories.js";
import { toInvoicePublic } from "../mappers/invoice.mapper.js";

/**
 * Anchors an invoice on the blockchain (runs in background)
 * Updates the invoice record with the result
 */
async function anchorInvoiceInBackground(invoiceId, ipfsCid, fileSha) {
    try {
        const anchored = await anchorInvoice({
            invoiceMongoId: invoiceId,
            ipfsCid: ipfsCid,
            sha256Hex: fileSha,
        })

        await InvoiceRepositories.updateInvoice(invoiceId, {
            anchorTxHash: anchored.txHash,
            anchorBlockNumber: anchored.blockNumber,
            anchoredAt: new Date(),
            anchorStatus: "anchored",
        })

        console.log(`✅ Invoice ${invoiceId} anchored successfully: ${anchored.txHash}`)
    } catch (e) {
        await InvoiceRepositories.updateInvoice(invoiceId, {
            anchorStatus: "failed",
            anchorError: e?.message ? String(e.message) : "Anchor failed",
        })

        console.error(`❌ Invoice ${invoiceId} anchor failed:`, e.message)
    }
}

export async function uploadToIpfsAndAnchor({ actor, file }) {
    if (!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED")
    
    // Only COMPANY_MANAGER and COMPANY_USER can upload invoices
    if (actor.role !== "COMPANY_MANAGER" && actor.role !== "COMPANY_USER") {
        throw new AppError("Only COMPANY_MANAGER and COMPANY_USER can upload invoices", 403, "FORBIDDEN")
    }
    if (!actor.orgId) throw new AppError("Company organization ID is required", 400, "MISSING_COMPANY_ORG_ID")
    
    // File validation is handled by validateInvoiceUpload middleware
    const fileSha = sha256Hex(file.buffer)

    // Step 1: Upload to IPFS (usually fast 1-3 seconds)
    const ipfs = await addAndPinBuffer({
        buffer: file.buffer,
        fileName: file.originalname || `invoice-${Date.now()}`
    })

    // Step 2: Create invoice record with pending status
    const invoice = await InvoiceRepositories.createInvoice({
        orgId: actor.orgId,
        uploadedByUserId: actor.sub,
        ipfsCid: ipfs.cid,
        fileHashSha256: fileSha,
        originalFileName: file.originalname || null,
        fileSizeBytes: file.buffer.length,
        anchorStatus: "pending",
    })

    // Step 3: Anchor on blockchain in background (don't await - fire and forget)
    // This runs asynchronously and updates the invoice when complete
    anchorInvoiceInBackground(invoice._id, ipfs.cid, fileSha)

    // Step 4: Return immediately with pending status
    return toInvoicePublic(invoice)
}