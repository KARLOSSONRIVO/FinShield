
export function toInvoicePublic(invoiceDoc) {
    return {
        id: String(invoiceDoc._id),
        orgId: invoiceDoc.orgId ? String(invoiceDoc.orgId) : null,
        uploadedByUserId: invoiceDoc.uploadedByUserId ? String(invoiceDoc.uploadedByUserId) : null,
        originalFileName: invoiceDoc.originalFileName || null,
        fileSizeBytes: invoiceDoc.fileSizeBytes || null,
        ipfsCid: invoiceDoc.ipfsCid,
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
