
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

export function toInvoiceListItem(doc) {
    return {
        id: String(doc._id),
        invoiceNumber: doc.invoiceNumber || "N/A",
        companyName: doc.orgId?.name || null,
        date: doc.invoiceDate || null,
        amount: doc.totalAmount || null,
        aiVerdict: {
            verdict: doc.aiVerdict || null,
            riskScore: doc.aiRiskScore != null ? doc.aiRiskScore : null,
        },
        status: doc.reviewDecision || "pending",
        blockchain: doc.anchorTxHash || null,
    };
}

export function toMyInvoiceItem(doc) {
    return {
        id: String(doc._id),
        invoiceNumber: doc.invoiceNumber || "N/A",
        date: doc.invoiceDate || null,
        amount: doc.totalAmount || null,
        fileName: doc.originalFileName || null,
        status: doc.reviewDecision || "pending",
        anchorStatus: doc.anchorStatus || "pending",
        uploadedAt: doc.createdAt,
    };
}

export function toInvoiceDetail(doc, { ipfsCid = null } = {}) {
    const GATEWAY = "https://gateway.pinata.cloud/ipfs";
    let fileUrl = null;

    if (ipfsCid) {
        const raw = `${GATEWAY}/${ipfsCid}`;
        const isDocx = doc.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        fileUrl = isDocx
            ? `https://docs.google.com/gview?url=${encodeURIComponent(raw)}&embedded=true`
            : raw;
    }

    return {
        id: String(doc._id),
        invoiceNumber: doc.invoiceNumber || "N/A",
        company: doc.orgId?.name || "Unknown",
        invoiceDate: doc.invoiceDate || null,
        totalAmount: doc.totalAmount || null,
        status: doc.reviewDecision || "pending",
        aiAnalysis: {
            verdict: doc.aiVerdict || null,
            riskScore: doc.aiRiskScore != null ? doc.aiRiskScore : null,
            summary: doc.aiSummary || null,
        },
        blockchain: {
            txHash: doc.anchorTxHash || null,
            anchoredAt: doc.anchoredAt || null,
            ipfsCid: ipfsCid,
            fileUrl: fileUrl,
        },
        review: {
            reviewer: doc.reviewedByUserId?.username || null,
            decision: doc.reviewDecision || "pending",
            notes: doc.reviewNotes || null,
            reviewedAt: doc.reviewedAt || null,
        },
    };
}

