import mongoose from "mongoose";

export const ANCHOR_STATUS = ["pending", "anchored", "failed"]
export const AI_VERDICT = ["clean", "flagged"]
export const AI_RISK_LEVEL = ["low", "medium", "high"]
export const REVIEW_DECISION = ["pending", "approved", "rejected"]


const InvoiceSchema = new mongoose.Schema({
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true
    },
    uploadedByUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    invoiceNumber: { type: String, default: null, index: true },
    invoiceDate: { type: Date, default: null },
    totalAmount: { type: Number, default: null },
    subtotalAmount: { type: Number, default: null },
    taxAmount: { type: Number, default: null },
    lineItems: { type: Array, default: [] },
    issuedTo: { type: String, default: null },
    fileHashSha256: { type: String, required: true, index: true },
    originalFileName: { type: String, default: null },
    mimeType: { type: String, default: null },
    ocrText: { type: String, default: null },
    anchorTxHash: { type: String, index: true },
    anchorBlockNumber: { type: Number, default: null },
    anchoredAt: { type: Date, default: null },
    anchorStatus: { type: String, enum: ANCHOR_STATUS, default: "pending", index: true },
    anchorError: { type: String, default: null },
    aiRiskScore: { type: Number, default: null },
    aiVerdict: { type: String, enum: AI_VERDICT, default: null },
    aiSummary: { type: String, default: null },
    riskLevel: { type: String, enum: AI_RISK_LEVEL, default: null },

    reviewedByUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    reviewedAt: {
        type: Date,
        default: null
    },
    // Auditor's final decision - used for ML training labels
    // approved = legitimate invoice, rejected = fraudulent
    reviewDecision: {
        type: String,
        enum: REVIEW_DECISION,
        default: "pending",
        index: true
    },
    reviewNotes: {
        type: String,
        default: null
    }
}, { timestamps: true })

InvoiceSchema.index({ orgId: 1, createdAt: -1 })
InvoiceSchema.index({ fileHashSha256: 1, anchorStatus: 1 })
InvoiceSchema.index({ anchorTxHash: 1, anchorStatus: 1 })
// Audit & compliance queries
InvoiceSchema.index({ orgId: 1, reviewDecision: 1, createdAt: -1 });
// Content-based duplicate detection
InvoiceSchema.index({ orgId: 1, invoiceNumber: 1 }, { sparse: true });
// ML training data queries (find reviewed invoices)
InvoiceSchema.index({ reviewDecision: 1, updatedAt: -1 });

const Invoice = mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema)

export default Invoice