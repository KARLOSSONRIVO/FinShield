import AppError from "../../../common/errors/AppErrors.js";
import { sha256Hex } from "../../../common/utils/hash.js";
import { addAndPinBuffer } from "../../../infrastructure/storage/ipfs.service.js";
import { runInvoicePrecheck } from "../../../infrastructure/ai/precheck_client.js";
import * as InvoiceRepositories from "../../repositories/invoice.repositories.js";
import * as AssignmentRepositories from "../../repositories/assignment.repositories.js";
import { isDocument } from "../../../common/utils/fileTypHelpers.js";
import { toInvoicePublic } from "../../mappers/invoice.mapper.js";
import { addAnchorJob } from "../../../infrastructure/queue/anchor.queue.js";
import { extractInvoiceNumber } from "../../../common/utils/invoiceParser.js";
import { cacheGet, cacheSet, invalidatePrefix } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix, CacheTTL } from "../../../common/utils/cache.constants.js";
import { getIO, SocketEvents } from "../../../infrastructure/socket/socket.service.js";
import { createAuditLog } from "../../../common/utils/audit.js";
import { AuditActions } from "../../../common/utils/audit.constants.js";

/* ============================
 * MAIN UPLOAD SERVICE
 * ============================ */
export async function uploadToIpfsAndAnchor({ actor, file, ip, userAgent }) {
    if (!actor) throw new AppError("Unauthorized", 401);

    if (!["COMPANY_MANAGER", "COMPANY_USER"].includes(actor.role)) {
        throw new AppError("Forbidden", 403);
    }

    if (!actor.orgId) {
        throw new AppError("Missing organization", 400);
    }

    // Check cached auditor status first, fall back to DB
    const auditorCacheKey = `${CachePrefix.AUDITOR_ACTIVE}${actor.orgId}`;
    let hasAuditor = await cacheGet(auditorCacheKey);
    if (hasAuditor === null) {
        hasAuditor = await AssignmentRepositories.hasActiveAuditor(actor.orgId);
        await cacheSet(auditorCacheKey, hasAuditor, CacheTTL.AUDITOR_ACTIVE);
    }
    if (!hasAuditor) {
        throw new AppError("No auditor assigned", 403);
    }

    /* ============================
     * STEP 1: PRECHECK
     * ============================ */
    const precheck = await runInvoicePrecheck(file);

    if (!precheck.processable) {
        throw new AppError(
            "Invoice precheck failed: " + (precheck.reason || "Unknown reason"),
            400,
            "INVOICE_PRECHECK_FAILED"
        );
    }

    /* ============================
     * STEP 2: CONTENT-BASED DUPLICATE CHECK
     * ============================ */
    // Extract invoice number from precheck text for duplicate detection
    const extractedText = precheck.extractedText || "";
    const invoiceNumber = extractInvoiceNumber(extractedText);

    if (invoiceNumber) {
        const existingByNumber = await InvoiceRepositories.findByInvoiceNumberAndOrg(
            invoiceNumber,
            actor.orgId
        );

        if (existingByNumber) {
            throw new AppError(
                `Duplicate invoice detected: Invoice #${invoiceNumber} already exists for this organization`,
                400,
                "DUPLICATE_INVOICE_NUMBER"
            );
        }
    }

    /* ============================
     * STEP 3: FILE TYPE DECISION (Only PDF and DOC supported now)
     * ============================ */
    const mimeType = file.mimetype || "";
    const documentFile = isDocument(mimeType); // Only check for documents

    if (!documentFile) {
        throw new AppError("Unsupported file type. Only PDF and DOC files are allowed.", 400);
    }

    /* ============================
     * STEP 4: HASH CHECK + IPFS UPLOAD
     * ============================ */
    const fileSha = sha256Hex(file.buffer);

    // Check if exact same file already exists (byte-for-byte duplicate)
    const existingByHash = await InvoiceRepositories.findInvoiceByCid(fileSha);
    if (existingByHash) {
        throw new AppError(
            "Duplicate file detected: This exact file has already been uploaded",
            400,
            "DUPLICATE_FILE_HASH"
        );
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
     * STEP 5: CREATE INVOICE
     * ============================ */
    const invoice = await InvoiceRepositories.createInvoice({
        orgId: actor.orgId,
        uploadedByUserId: actor.sub,

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
    });

    /* ============================
     * STEP 6: BACKGROUND ANCHOR
     * ============================ */
    await addAnchorJob({
        invoiceId: invoice._id.toString(),
        ipfsCid: ipfsCid,
        fileSha: fileSha,
        allowAutoOcr: documentFile,
        uploadedByUserId: actor.sub,
        orgId: actor.orgId,
    });

    // Invalidate invoice list caches after new upload
    await Promise.all([
        invalidatePrefix(CachePrefix.INV_LIST),
        invalidatePrefix(CachePrefix.INV_MY),
    ]);

    // ── Notify organization that a new invoice was uploaded ──
    const io = getIO();
    if (io) {
        io.to(`org:${actor.orgId}`).emit(SocketEvents.INVOICE_CREATED, {
            invoiceId: invoice._id.toString(),
            uploadedBy: actor.sub,
        });
        io.to(`org:${actor.orgId}`).emit(SocketEvents.INVOICE_LIST_INVALIDATE, { orgId: actor.orgId });
    }

    createAuditLog({
        actorId: actor.sub, actorRole: actor.role,
        actor: { username: actor.username ?? null, email: actor.email ?? null },
        action: AuditActions.INVOICE_UPLOADED,
        target: { type: "Invoice" },
        metadata: { invoiceId: invoice._id.toString(), orgId: actor.orgId, uploaderEmail: actor.email, fileName: file.originalname },
        ip, userAgent,
    });

    return {
        ...toInvoicePublic(invoice),
        requiresManualInput: false, // No manual input required for docs
    };
}
