import Invoice from "../models/invoice.model.js";

export async function createInvoice(data) {
    return Invoice.create(data)
}

export async function updateInvoice(id, data) {
    return Invoice.findByIdAndUpdate(id, data, { new: true })
}

export async function findById(id) {
    return Invoice.findById(id)
}

export async function findByOrgId(orgId) {
    return Invoice.find({ orgId }).sort({ createdAt: -1 })
}

export async function findByStatus(status) {
    return Invoice.find({ anchorStatus: status }).sort({ createdAt: -1 })
}

export async function findPendingAnchors() {
    return Invoice.find({ anchorStatus: "pending" }).sort({ createdAt: 1 })
}

export async function findInvoiceByCid(fileSha) {
  return await Invoice.findOne({ fileHashSha256: fileSha });
}

export async function findByInvoiceNumberAndOrg(invoiceNumber, orgId) {
  return await Invoice.findOne({ 
    invoiceNumber: invoiceNumber,
    orgId: orgId,
    anchorStatus: { $in: ["anchored", "pending"] } // Only check non-failed invoices
  });
}