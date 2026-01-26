import AppError from "../../common/errors/AppErrors.js";
import { sha256Hex } from "../../common/utils/hash.js";
import { addAndPinBuffer } from "../../infrastructure/storage/ipfs.service.js";
import { anchorInvoice } from "../../infrastructure/blockchain/ethereum.service.js";
import { runInvoicePrecheck } from "../../infrastructure/ai/precheck_client.js";
import { triggerOcr } from "../../infrastructure/ai/ocr_client.js";
import * as InvoiceRepositories from "../repositories/invoice.repositories.js";
import * as AssignmentRepositories from "../repositories/assignment.repositories.js";
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
        
        // ✅ AUTO OCR AFTER ANCHOR
        triggerOcr(invoiceId).catch((e) => {
        console.error(`❌ OCR trigger failed for ${invoiceId}:`, e?.message || e);
        });

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
    if (!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");

    if (actor.role !== "COMPANY_MANAGER" && actor.role !== "COMPANY_USER") {
        throw new AppError("Only COMPANY_MANAGER and COMPANY_USER can upload invoices", 403, "FORBIDDEN");
    }

    if (!actor.orgId) {
        throw new AppError("Company organization ID is required", 400, "MISSING_COMPANY_ORG_ID");
    }

    const hasAuditor = await AssignmentRepositories.hasActiveAuditor(actor.orgId);
    if (!hasAuditor) {
        throw new AppError(
            "Cannot upload invoices: Your company has no auditor assigned.",
            403,
            "NO_AUDITOR_ASSIGNED"
        );
    }

    /* ============================
     * ✅ STEP 1: PRE-CHECK (OCR)
     * ============================ */
    const precheck = await runInvoicePrecheck(file);

    if (!precheck.processable) {
        throw new AppError(
            "Invoice rejected during pre-check",
            400,
            precheck.reason || "PRECHECK_FAILED"
        );
    }

    /* ============================
     * STEP 2: FILE HASH
     * ============================ */
    const fileSha = sha256Hex(file.buffer);

    /* ============================
     * STEP 3: IPFS UPLOAD
     * ============================ */
    const ipfs = await addAndPinBuffer({
        buffer: file.buffer,
        fileName: file.originalname || `invoice-${Date.now()}`
    });

    /* ============================
     * STEP 4: CREATE INVOICE
     * ============================ */
    const invoice = await InvoiceRepositories.createInvoice({
       orgId: actor.orgId,
        uploadedByUserId: actor.sub,
        ipfsCid: ipfs.cid,
        fileHashSha256: fileSha,

        // ✅ metadata for OCR routing
        originalFileName: file.originalname || null,
        mimeType: file.mimetype || null,

        // extracted later by OCR/AI
        invoiceNumber: null,
        invoiceDate: null,
        totalAmount: null,

        aiRiskScore: null,
        aiVerdict: null,

        anchorStatus: "pending",
        status: "pending",
    });

    /* ============================
     * STEP 5: BACKGROUND ANCHOR
     * ============================ */
    anchorInvoiceInBackground(invoice._id, ipfs.cid, fileSha);

    return toInvoicePublic(invoice);
}