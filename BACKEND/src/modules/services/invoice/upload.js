import AppError from "../../../common/errors/AppErrors.js";
import { sha256Hex } from "../../../common/utils/hash.js";
import { addAndPinBuffer } from "../../../infrastructure/storage/ipfs.service.js";
import { runInvoicePrecheck } from "../../../infrastructure/ai/precheck_client.js";
import * as InvoiceRepositories from "../../repositories/invoice.repositories.js";
import * as AssignmentRepositories from "../../repositories/assignment.repositories.js";
import { isDocument } from "../../../common/utils/fileTypHelpers.js";
import { toInvoicePublic } from "../../mappers/invoice.mapper.js";
import { anchorInvoiceInBackground } from "./anchor_background.js";

/* ============================
 * MAIN UPLOAD SERVICE
 * ============================ */
export async function uploadToIpfsAndAnchor({ actor, file }) {
    if (!actor) throw new AppError("Unauthorized", 401);

    if (!["COMPANY_MANAGER", "COMPANY_USER"].includes(actor.role)) {
        throw new AppError("Forbidden", 403);
    }

    if (!actor.orgId) {
        throw new AppError("Missing organization", 400);
    }

    const hasAuditor = await AssignmentRepositories.hasActiveAuditor(actor.orgId);
    if (!hasAuditor) {
        throw new AppError("No auditor assigned", 403);
    }

    /* ============================
     * STEP 1: PRECHECK
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
     * STEP 2: FILE TYPE DECISION (Only PDF and DOC supported now)
     * ============================ */
    const mimeType = file.mimetype || "";
    const documentFile = isDocument(mimeType); // Only check for documents

    if (!documentFile) {
        throw new AppError("Unsupported file type. Only PDF and DOC files are allowed.", 400);
    }

    /* ============================
     * STEP 3: HASH + IPFS
     * ============================ */
    const fileSha = sha256Hex(file.buffer);

    // Check if the CID already exists in the database (avoid duplicate upload)
    const existingInvoice = await InvoiceRepositories.findInvoiceByCid(fileSha);
    if (existingInvoice) {
        throw new AppError("Duplicate invoice detected", 400, "DUPLICATE_INVOICE");
    }

    let ipfsCid = null;

    try {
        // Upload to IPFS
        const ipfs = await addAndPinBuffer({
            buffer: file.buffer,
            fileName: file.originalname || `invoice-${Date.now()}`,
        });

        ipfsCid = ipfs.cid;

    } catch (e) {
        // IPFS upload failed, mark invoice as failed and return
        // Note: Invoice doesn't exist yet, so we can't update it. Just throw.
        throw new AppError("Failed to upload invoice to IPFS.", 500);
    }

    /* ============================
     * STEP 4: CREATE INVOICE
     * ============================ */
    const invoice = await InvoiceRepositories.createInvoice({
        orgId: actor.orgId,
        uploadedByUserId: actor.sub,

        ipfsCid: ipfsCid,
        fileHashSha256: fileSha,

        originalFileName: file.originalname || null,
        mimeType,

        // ⚠️ IMPORTANT CHANGE
        invoiceNumber: null,
        invoiceDate: null,
        totalAmount: null,
        issuedTo: null,

        aiRiskScore: null,
        aiVerdict: null,

        anchorStatus: "pending",
        status: "pending",
    });

    /* ============================
     * STEP 5: BACKGROUND ANCHOR
     * ============================ */
    anchorInvoiceInBackground(
        invoice._id,
        ipfsCid,
        fileSha,
        documentFile // ← only process OCR for docs
    ).catch(err => {
        console.error(`Error starting background anchor for ${invoice._id}`, err);
    });

    return {
        ...toInvoicePublic(invoice),
        requiresManualInput: false, // No manual input required for docs
    };
}
