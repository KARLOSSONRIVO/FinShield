import AppError from "../../common/errors/AppErrors.js";
import { sha256Hex } from "../../common/utils/hash.js";
import { addAndPinBuffer } from "../../infrastructure/storage/ipfs.service.js";
import { anchorInvoice } from "../../infrastructure/blockchain/ethereum.service.js";
import { runInvoicePrecheck } from "../../infrastructure/ai/precheck_client.js";
import { triggerOcr } from "../../infrastructure/ai/ocr_client.js";
import * as InvoiceRepositories from "../repositories/invoice.repositories.js";
import * as AssignmentRepositories from "../repositories/assignment.repositories.js";
import { isDocument } from "../../common/utils/fileTypHelpers.js";
import { toInvoicePublic } from "../mappers/invoice.mapper.js";

/* ============================
 * BACKGROUND ANCHOR
 * ============================ */
export async function anchorInvoiceInBackground(
  invoiceId,
  ipfsCid,
  fileSha,
  allowAutoOcr
) {
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
export async function uploadToIpfsAndAnchor({ actor, file, fields }) {
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
   * STEP 2: FILE TYPE
   * ============================ */
  const mimeType = file.mimetype || "";

  if (!isDocument(mimeType)) {
    throw new AppError("Unsupported file type. Only PDF and DOCX are allowed.", 400);
  }

  /* ============================
   * STEP 3: HASH + IPFS
   * ============================ */
  const fileSha = sha256Hex(file.buffer);

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

    originalFileName: file.originalname || null,
    mimeType,

    // OCR will populate these fields
    invoiceNumber: null,
    invoiceDate: null,
    totalAmount: null,

    status: "pending",
    anchorStatus: "pending",

    aiRiskScore: null,
    aiVerdict: null,
  });

  /* ============================
   * STEP 5: BACKGROUND ANCHOR
   * ============================ */
  anchorInvoiceInBackground(
    invoice._id,
    ipfs.cid,
    fileSha,
    true // Always trigger OCR for documents
  );

  return toInvoicePublic(invoice);
}
