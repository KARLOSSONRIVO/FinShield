import mongoose from "mongoose";

export const ORG_TYPES = ["platform", "company"]
export const ORG_STATUS = ["active", "inactive"]

const OrganizationSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, },
    type: { type: String, enum: ORG_TYPES, required: true, },
    status: { type: String, enum: ORG_STATUS, default: "active", },
    invoiceTemplate: {
        s3Key: { type: String, default: null },
        fileName: { type: String, default: null },
        uploadedAt: { type: Date, default: null },
        extractedText: { type: String, default: null },
        // Layout signature for template comparison
        layoutSignature: {
            fields: [{ type: String }],  // Detected field names
            positions: { type: Map, of: String },  // Field → position mapping
            detectedFields: { type: Map, of: Object },  // Field → full details
            elementCount: { type: Number, default: 0 },
            structural_features: { type: Object, default: {} },  // Spatial distribution, size stats, text patterns (snake_case to match Python)
        },
        totalElements: { type: Number, default: 0 },
        source: { type: String, default: null },  // "paddleocr" or "python-docx"
    },
    createdAt: { type: Date, default: Date.now, },
    updatedAt: { type: Date, default: Date.now, },
})

OrganizationSchema.index({ name: 1, type: 1 }, { unique: true });

const Organization = mongoose.model("Organization", OrganizationSchema)

export default Organization