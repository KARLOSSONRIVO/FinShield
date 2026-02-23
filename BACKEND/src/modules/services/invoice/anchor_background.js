import { Worker } from 'bullmq';
import redisConnection from '../../../infrastructure/redis/redis.connection.js';
import { ANCHOR_QUEUE_NAME } from '../../../infrastructure/queue/anchor.queue.js';
import { anchorInvoice } from "../../../infrastructure/blockchain/ethereum.service.js";
import * as InvoiceRepositories from "../../repositories/invoice.repositories.js";
import { triggerOcr } from "../../../infrastructure/ai/ocr_client.js";
import { unpinByCid } from "../../../infrastructure/storage/ipfs.service.js";
import { cacheDel, invalidatePrefix } from "../../../infrastructure/redis/cache.service.js";
import { CachePrefix } from "../../../common/utils/cache.constants.js";
import { getIO, SocketEvents } from "../../../infrastructure/socket/socket.service.js";

/* ============================
 * BACKGROUND ANCHOR WORKER
 * ============================ */
export const anchorWorker = new Worker(ANCHOR_QUEUE_NAME, async (job) => {
    const { invoiceId, ipfsCid, fileSha, allowAutoOcr, uploadedByUserId, orgId } = job.data;

    console.log(`[Worker] Started processing anchor job for invoice ${invoiceId}`);
    const io = getIO();

    try {
        const anchored = await anchorInvoice({
            invoiceMongoId: invoiceId,
            ipfsCid,
            sha256Hex: fileSha,
        });

        await InvoiceRepositories.updateInvoice(invoiceId, {
            anchorTxHash: anchored.txHash,
            anchorBlockNumber: anchored.blockNumber,
            anchoredAt: new Date(),
            anchorStatus: "anchored",
        });

        // Invalidate invoice caches after anchor status change
        await Promise.all([
            cacheDel(`${CachePrefix.INV_DETAIL}${invoiceId}`),
            invalidatePrefix(CachePrefix.INV_LIST),
            invalidatePrefix(CachePrefix.INV_MY),
            invalidatePrefix(CachePrefix.LEDGER),
        ]);

        // ── Emit anchor success to uploader + organization ──
        if (io) {
            const anchorPayload = { invoiceId, txHash: anchored.txHash, blockNumber: anchored.blockNumber };
            if (uploadedByUserId) io.to(`user:${uploadedByUserId}`).emit(SocketEvents.INVOICE_ANCHOR_SUCCESS, anchorPayload);
            if (orgId) {
                io.to(`org:${orgId}`).emit(SocketEvents.INVOICE_ANCHOR_SUCCESS, anchorPayload);
                io.to(`org:${orgId}`).emit(SocketEvents.INVOICE_LIST_INVALIDATE, { orgId });
            }
        }

        // ✅ OCR ONLY FOR DOCUMENTS
        if (allowAutoOcr) {
            // Notify uploader that AI processing is starting
            if (io && uploadedByUserId) {
                io.to(`user:${uploadedByUserId}`).emit(SocketEvents.INVOICE_PROCESSING, { invoiceId, stage: "ai" });
            }

            // We do not await this, OCR trigger is fire-and-forget
            triggerOcr(invoiceId).catch((e) => {
                console.error(`❌ OCR trigger failed for ${invoiceId}:`, e?.message || e);
            });
        }

        console.log(`✅ Invoice ${invoiceId} anchored: ${anchored.txHash}`);
        return anchored.txHash;
    } catch (e) {
        console.error(`❌ Anchor failed for ${invoiceId}:`, e.message);

        // Update DB so user knows it failed (if this is the final attempt)
        // Bullmq handles retries automatically based on queue config
        await InvoiceRepositories.updateInvoice(invoiceId, {
            anchorStatus: "failed",
            anchorError: e?.message || "Anchor failed",
        });

        // Invalidate invoice caches after failure status update
        await Promise.all([
            cacheDel(`${CachePrefix.INV_DETAIL}${invoiceId}`),
            invalidatePrefix(CachePrefix.INV_LIST),
            invalidatePrefix(CachePrefix.INV_MY),
        ]);

        // ── Emit anchor failure to uploader + admins ──
        const isFinalAttempt = job.attemptsMade >= job.opts.attempts - 1;
        if (io) {
            const failPayload = { invoiceId, error: e?.message || "Anchor failed", isFinalAttempt };
            if (uploadedByUserId) io.to(`user:${uploadedByUserId}`).emit(SocketEvents.INVOICE_ANCHOR_FAILED, failPayload);
            io.to("role:SUPER_ADMIN").emit(SocketEvents.INVOICE_ANCHOR_FAILED, failPayload);
            if (orgId) {
                io.to(`org:${orgId}`).emit(SocketEvents.INVOICE_LIST_INVALIDATE, { orgId });
            }
        }

        // 🗑️ Remove file from IPFS when anchoring fails entirely
        // We only want to delete it if we are sure we aren't retrying
        if (isFinalAttempt) {
            try {
                await unpinByCid(ipfsCid);
                console.log(`🗑️ Removed IPFS pin for failed invoice ${invoiceId}`);
            } catch (ipfsError) {
                console.error(`⚠️ Failed to remove IPFS file ${ipfsCid}:`, ipfsError.message);
            }
        }

        // Rethrow the error so BullMQ knows the job failed and can apply backoff retries
        throw e;
    }
}, {
    connection: redisConnection,
    concurrency: 5, // Process up to 5 anchors concurrently
});

anchorWorker.on('completed', (job) => {
    console.log(`[Worker] ✨ Job ${job.id} completed successfully`);
});

anchorWorker.on('failed', (job, err) => {
    console.error(`[Worker] 💥 Job ${job.id} failed: ${err.message}`);
});
