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
