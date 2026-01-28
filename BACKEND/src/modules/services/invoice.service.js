import AppError from "../../common/errors/AppErrors.js";
import { sha256Hex } from "../../common/utils/hash.js";
import { addAndPinBuffer, removeFromIpfs } from "../../infrastructure/storage/ipfs.service.js";
import { anchorInvoice } from "../../infrastructure/blockchain/ethereum.service.js";
import { runInvoicePrecheck } from "../../infrastructure/ai/precheck_client.js";
import * as InvoiceRepositories from "../repositories/invoice.repositories.js";
import * as AssignmentRepositories from "../repositories/assignment.repositories.js";
import { isDocument } from "../../common/utils/fileTypHelpers.js"; 
import { toInvoicePublic } from "../mappers/invoice.mapper.js";

/* ============================
 * BACKGROUND ANCHOR
 * ============================ */
async function anchorInvoiceInBackground(invoiceId, ipfsCid, fileSha, allowAutoOcr) {
  try {
    const anchored = await anchorInvoice({
      invoiceMongoId: invoiceId,
      ipfsCid,
      sha256Hex: fileSha,
    });

    await InvoiceRepositories.updateInvoice(invoiceId, {
      anchorTxHash: anchored.txHash,
      anchorBlockNumber: anchored.blockNumber,
      anchoredAt: new Date(),
      anchorStatus: "anchored",
    });

    // ✅ OCR ONLY FOR DOCUMENTS
    if (allowAutoOcr) {
      triggerOcr(invoiceId).catch((e) => {
        console.error(`❌ OCR trigger failed for ${invoiceId}:`, e?.message || e);
      });
    }

    console.log(`✅ Invoice ${invoiceId} anchored: ${anchored.txHash}`);
  } catch (e) {
    await InvoiceRepositories.updateInvoice(invoiceId, {
      anchorStatus: "failed",
      anchorError: e?.message || "Anchor failed",
    });

    console.error(`❌ Anchor failed for ${invoiceId}:`, e.message);
  }
}

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
    await InvoiceRepositories.updateInvoice(invoiceId, {
      anchorStatus: "failed",
      anchorError: "IPFS upload failed: " + e.message,
    });
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

    aiRiskScore: null,
    aiVerdict: null,

    anchorStatus: "pending",
    status: "pending",
  });

  try {
    /* ============================
     * STEP 5: BACKGROUND ANCHOR
     * ============================ */
    await anchorInvoiceInBackground(
      invoice._id,
      ipfsCid,
      fileSha,
      documentFile // ← only process OCR for docs
    );

  } catch (error) {
    // If Blockchain anchoring failed, mark invoice as failed and remove the file from IPFS
    await InvoiceRepositories.updateInvoice(invoice._id, {
      anchorStatus: "failed",
      anchorError: "Blockchain anchoring failed: " + error.message,
    });

    // Remove file from IPFS in case of failure
    await removeFromIpfs(ipfsCid);

    // Throw error to stop further processing
    throw new AppError("Blockchain anchoring failed. Invoice marked as failed.", 500);
  }

  return {
    ...toInvoicePublic(invoice),
    requiresManualInput: false, // No manual input required for docs
  };
}
