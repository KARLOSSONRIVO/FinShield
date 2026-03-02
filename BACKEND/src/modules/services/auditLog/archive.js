import { createHash } from "crypto";
import { gzip } from "zlib";
import { promisify } from "util";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, AWS_S3_BUCKET_NAME } from "../../../config/env.js";
import * as AuditLogRepository from "../../repositories/auditLog.repositories.js";
import { createAuditLog } from "../../../common/utils/audit.js";
import { AuditActions } from "../../../common/utils/audit.constants.js";

const gzipAsync = promisify(gzip);

const RETENTION_DAYS = 90;
const BATCH_SIZE     = 1000;

// ─── Lazy S3 client ──────────────────────────────────────────────────────────
let s3Client = null;
function getS3Client() {
    if (!s3Client) {
        s3Client = new S3Client({
            region: AWS_REGION,
            credentials: {
                accessKeyId:     AWS_ACCESS_KEY_ID,
                secretAccessKey: AWS_SECRET_ACCESS_KEY,
            },
        });
    }
    return s3Client;
}

/**
 * Run the nightly audit log archival pipeline.
 *
 * Steps:
 *  1. Find hot logs older than RETENTION_DAYS in batches of BATCH_SIZE
 *  2. Group by calendar date
 *  3. Serialize each group to JSONL → gzip → compute SHA-256
 *  4. Upload to S3
 *  5. Mark logs as archived in MongoDB (only after S3 confirms)
 *  6. Emit ARCHIVE_EXECUTED audit log entry
 *
 * Idempotent: archivedAt:null filter prevents double-archiving on retry.
 */
export async function archiveAuditLogs() {
    if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_S3_BUCKET_NAME) {
        console.warn("[Archive] S3 not configured — skipping audit log archival");
        return { skipped: true, reason: "S3_NOT_CONFIGURED" };
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

    console.log(`[Archive] Starting audit log archival. Cutoff: ${cutoff.toISOString()}`);

    const logs = await AuditLogRepository.findHotLogsOlderThan(cutoff, BATCH_SIZE);

    if (logs.length === 0) {
        console.log("[Archive] No logs eligible for archival.");
        return { archived: 0 };
    }

    // Group by calendar date (YYYY-MM-DD based on createdAt)
    const byDate = {};
    for (const log of logs) {
        const dateKey = log.createdAt.toISOString().slice(0, 10); // "YYYY-MM-DD"
        if (!byDate[dateKey]) byDate[dateKey] = [];
        byDate[dateKey].push(log);
    }

    let totalArchived = 0;
    const client = getS3Client();

    for (const [dateKey, dateLogs] of Object.entries(byDate)) {
        const [year, month, day] = dateKey.split("-");
        const batchId = Date.now();

        // ── 1. Serialize to JSONL ──────────────────────────────────────────
        const jsonl = dateLogs.map((l) => JSON.stringify(l)).join("\n");

        // ── 2. Gzip compress ──────────────────────────────────────────────
        const compressed = await gzipAsync(Buffer.from(jsonl, "utf-8"));

        // ── 3. SHA-256 hash of the compressed file ────────────────────────
        const hash = createHash("sha256").update(compressed).digest("hex");

        // ── 4. S3 key ─────────────────────────────────────────────────────
        const s3Key = `audit-logs/${year}/${month}/${day}/audit-${dateKey}-${batchId}.jsonl.gz`;

        // ── 5. Upload to S3 ───────────────────────────────────────────────
        await client.send(
            new PutObjectCommand({
                Bucket:      AWS_S3_BUCKET_NAME,
                Key:         s3Key,
                Body:        compressed,
                ContentType: "application/gzip",
                Metadata: {
                    date:           dateKey,
                    recordCount:    String(dateLogs.length),
                    "sha256":       hash,
                },
            })
        );

        // ── 6. Delete from MongoDB only after S3 confirms ─────────────────
        const ids = dateLogs.map((l) => l._id);
        await AuditLogRepository.deleteByIds(ids);

        totalArchived += dateLogs.length;
        console.log(`[Archive] Archived ${dateLogs.length} logs for ${dateKey} → ${s3Key}`);
    }

    console.log(`[Archive] Done. Total archived: ${totalArchived}`);

    // Emit an archive-executed audit log (system actor)
    createAuditLog({
        actorId:   null,
        actorRole: "SYSTEM",
        actor:     { username: "system", email: null },
        action:    AuditActions.ARCHIVE_EXECUTED,
        target:    null,
        metadata:  { count: totalArchived, cutoffDate: cutoff.toISOString() },
    });

    return { archived: totalArchived };
}
