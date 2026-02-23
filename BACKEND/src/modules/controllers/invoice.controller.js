import asyncHandler from "../../common/utils/asyncHandler.js";
import * as InvoiceService from "../services/invoice.service.js";


export const uploadAndAnchorInvoice = asyncHandler(async (req, res) => {
  const data = await InvoiceService.uploadToIpfsAndAnchor({
    actor: req.auth,
    file: req.file,
    fields: req.body, // 🔴 REQUIRED
  });

  res.json({ ok: true, data });
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
