
export function toInvoicePublic(invoiceDoc) {
    return {
        id: String(invoiceDoc._id),
        orgId: invoiceDoc.orgId ? String(invoiceDoc.orgId) : null,
        uploadedByUserId: invoiceDoc.uploadedByUserId ? String(invoiceDoc.uploadedByUserId) : null,
        invoiceNumber: invoiceDoc.invoiceNumber || null,
        fileHashSha256: invoiceDoc.fileHashSha256,
        anchorTxHash: invoiceDoc.anchorTxHash || null,
        anchorBlockNumber: invoiceDoc.anchorBlockNumber || null,
        anchoredAt: invoiceDoc.anchoredAt || null,
        anchorStatus: invoiceDoc.anchorStatus,
        anchorError: invoiceDoc.anchorError || null,
        createdAt: invoiceDoc.createdAt,
        updatedAt: invoiceDoc.updatedAt,
    }
}

export function toLedgerEntry(doc) {
    return {
        id: String(doc._id),
        invoiceNumber: doc.invoiceNumber || "N/A",
        company: doc.orgId?.name || "Unknown",
        transactionHash: doc.anchorTxHash,
        anchoredAt: doc.anchoredAt,
        status: doc.anchorStatus,
    };
}

