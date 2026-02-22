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

export async function findAnchoredLedger({ page = 1, limit = 20, search, sortBy = "anchoredAt", order = "desc" }) {
  const filter = { anchorStatus: "anchored", anchorTxHash: { $ne: null } };

  if (search) {
    filter.$or = [
      { invoiceNumber: { $regex: search, $options: "i" } },
      { anchorTxHash: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: order === "asc" ? 1 : -1 };

  const [items, total] = await Promise.all([
    Invoice.find(filter)
      .populate("orgId", "name")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Invoice.countDocuments(filter),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}