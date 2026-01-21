import mongoose from "mongoose";


export const INVOICE_STATUS = ["pending", "anchored", "failed"]

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
    originalFileName: { type: String, default: null },
    fileSizeBytes: { type: Number, default: null },
    ipfsCid: { type: String, required: true, index: true },
    fileHashSha256: { type: String, required: true, index: true },
    anchorTxHash: { type: String, index: true },
    anchorBlockNumber: { type: Number, default: null },
    anchoredAt: { type: Date, default: null },
    anchorStatus: { type: String, enum: INVOICE_STATUS, default: "pending", index: true },
    anchorError: { type: String, default: null },
}, { timestamps: true })

InvoiceSchema.index({ orgId: 1, createdAt: -1 })
InvoiceSchema.index({ ipfsCid: 1, anchorStatus: 1 })
InvoiceSchema.index({ fileHashSha256: 1, anchorStatus: 1 })
InvoiceSchema.index({ anchorTxHash: 1, anchorStatus: 1 })

const Invoice = mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema)

export default Invoice