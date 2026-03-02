import asyncHandler from "../../common/utils/asyncHandler.js";
import * as InvoiceService from "../services/invoice.service.js";

function getClientIp(req) {
    return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.ip;
}

export const uploadAndAnchorInvoice = asyncHandler(async (req, res) => {
 await InvoiceService.uploadToIpfsAndAnchor({
    actor: req.auth,
    file: req.file,
    fields: req.body, // 🔴 REQUIRED
    ip: getClientIp(req),
    userAgent: req.headers["user-agent"] ?? null,
  });

  res.json({ ok: true, message: "Invoice uploaded and anchored successfully" });
});

export const listInvoices = asyncHandler(async (req, res) => {
  const data = await InvoiceService.listInvoices({
    actor: req.auth,
    query: req.query,
  });

  res.json({ ok: true, data });
});

export const listMyInvoices = asyncHandler(async (req, res) => {
  const data = await InvoiceService.listMyInvoices({
    actor: req.auth,
    query: req.query,
  });

  res.json({ ok: true, data });
});

export const getInvoiceDetail = asyncHandler(async (req, res) => {
  const data = await InvoiceService.getInvoiceDetail({
    actor: req.auth,
    invoiceId: req.params.id,
  });

  res.json({ ok: true, data });
});

export const submitReviewDecision = asyncHandler(async (req, res) => {
  const data = await InvoiceService.submitReviewDecision({
    actor: req.auth,
    invoiceId: req.params.id,
    reviewDecision: req.body.reviewDecision,
    reviewNotes: req.body.reviewNotes,
    ip: getClientIp(req),
    userAgent: req.headers["user-agent"] ?? null,
  });

  const message = data.isUpdate
    ? "Review decision updated successfully"
    : "Review decision submitted successfully";

  res.json({ ok: true, message });
});
