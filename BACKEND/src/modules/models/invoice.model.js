import mongoose from "mongoose";


export const INVOICE_STATUS = ["pending", "anchored", "failed"]

const InvoiceSchema = new mongoose.Schema({
    ipfsCid:{type: String, required: true,index: true},
    fileHashSha256:{type: String, required: true,index: true},
    anchorTxHash:{type: String, index: true},
    anchorBlockNumber:{type: Number , default: null},
    anchoredAt:{type:Date, default: null},
    anchorStatus: { type: String, enum: INVOICE_STATUS, default: "pending", index: true }, // pending|anchored|failed
    anchorError: { type: String, default: null },
}, { timestamps: true })

InvoiceSchema.index({ ipfsCid: 1, anchorStatus: 1 })
InvoiceSchema.index({ fileHashSha256: 1 , anchorStatus: 1})
InvoiceSchema.index({ anchorTxHash: 1 , anchorStatus: 1})

const Invoice = mongoose.models.Invoice || mongoose.model("Invoice", InvoiceSchema)

export default Invoice