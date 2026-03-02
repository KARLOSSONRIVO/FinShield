import * as InvoiceRepository from "../../repositories/invoice.repositories.js";
import Assignment from "../../models/assignment.model.js";
import AppError from "../../../common/errors/AppErrors.js";
import { cacheDel, invalidatePrefix } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix } from "../../../common/utils/cache.constants.js";
import { getIO, SocketEvents } from "../../../infrastructure/socket/socket.service.js";

/**
 * AUDITOR-only: Submit or change the review decision + notes on an invoice
 * in a single operation.
 *
 * Business rules:
 *  - AI analysis must be complete (aiVerdict !== null)
 *  - Both reviewDecision and reviewNotes are required in the same request
 *  - AUDITOR must have an active Assignment for invoice.orgId
 *  - Re-submittable — reviewedAt is refreshed on every call
 */
export async function submitReviewDecision({ actor, invoiceId, reviewDecision, reviewNotes }) {
    if (!actor) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    if (actor.role !== "AUDITOR") throw new AppError("Invoice not found", 404);

    const doc = await InvoiceRepository.findById(invoiceId);
    if (!doc) throw new AppError("Invoice not found", 404);

    const invoiceOrgId = String(doc.orgId);

    // ── Access Control ──────────────────────────────────────────────────────
    const assignment = await Assignment.findOne({
        auditorUserId: actor.sub,
        companyOrgId: invoiceOrgId,
        status: "active",
    }).lean();

    if (!assignment) throw new AppError("Invoice not found", 404);

    // ── Business Guards ─────────────────────────────────────────────────────
    if (!doc.aiVerdict) {
        throw new AppError("Invoice AI analysis is not yet complete", 400, "AI_PENDING");
    }

    // Track whether this is a first submission or a change
    const isUpdate = doc.reviewDecision !== "pending";

    // ── Write ───────────────────────────────────────────────────────────────
    const reviewedAt = new Date();
    await InvoiceRepository.updateInvoice(invoiceId, {
        reviewDecision,
        reviewNotes,
        reviewedByUserId: actor.sub,
        reviewedAt,
    });

    // ── Cache Invalidation ──────────────────────────────────────────────────
    await Promise.all([
        cacheDel(`${CachePrefix.INV_DETAIL}${invoiceId}`),
        invalidatePrefix(CachePrefix.INV_LIST),
        invalidatePrefix(CachePrefix.INV_MY),
        invalidatePrefix(CachePrefix.LEDGER),
    ]);

    // ── Socket Events ───────────────────────────────────────────────────────
    const uploadedByUserId = String(doc.uploadedByUserId);
    const orgId = String(doc.orgId);

    const io = getIO();
    io?.to(`user:${uploadedByUserId}`)
      .to(`org:${orgId}`)
      .to(`role:SUPER_ADMIN`)
      .emit(SocketEvents.INVOICE_REVIEWED, {
          invoiceId,
          reviewDecision,
          reviewedBy: actor.sub,
      });

    return { invoiceId, reviewDecision, reviewNotes, reviewedAt, isUpdate };
}
