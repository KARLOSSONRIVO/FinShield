import mongoose, { Schema } from "mongoose";
import { ALL_AUDIT_ACTIONS } from "../../common/utils/audit.constants.js";

const auditLogSchema = new Schema(
    {
        // ─── Actor (top-level for fast indexing) ──────────────────────────────
        actorId:   { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
        actorRole: { type: String, default: null, index: true },

        // Snapshot of actor details at write time (preserved even if user is deleted)
        actor: {
            username: { type: String, default: null },
            email:    { type: String, default: null },
        },

        // ─── Action ───────────────────────────────────────────────────────────
        action: {
            type:     String,
            required: true,
            enum:     ALL_AUDIT_ACTIONS,
            index:    true,
        },

        // ─── Target ───────────────────────────────────────────────────────────
        target: {
            type: { type: String, default: null },   // "User" | "Invoice" | "Organization" | "Assignment" | "Review"
        },

        // ─── Human-readable pre-computed sentence ─────────────────────────────
        summary: { type: String, required: true },

        // ─── Flexible action-specific data ────────────────────────────────────
        metadata: { type: Schema.Types.Mixed, default: {} },

        // ─── Network context ──────────────────────────────────────────────────
        ip:        { type: String, default: null },
        userAgent: { type: String, default: null },

        // ─── Archive lifecycle ────────────────────────────────────────────────
        archivedAt:      { type: Date, default: null, index: true },       // null = still hot
        archiveKey:      { type: String, default: null },                  // S3 object key
        archiveFileHash: { type: String, default: null },                  // SHA-256 of .jsonl.gz
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
        versionKey: false,
    }
);

// Compound index: most common query (admin fetches logs by date desc)
auditLogSchema.index({ createdAt: -1 });

// Index for archival job (find hot logs older than 90 days)
auditLogSchema.index({ archivedAt: 1, createdAt: 1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
