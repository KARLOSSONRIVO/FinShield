import { Worker } from 'bullmq';
import redisConnection from '../../../infrastructure/redis/redis.connection.js';
import { ANCHOR_QUEUE_NAME } from '../../../infrastructure/queue/anchor.queue.js';
import { anchorInvoice } from "../../../infrastructure/blockchain/ethereum.service.js";
import * as InvoiceRepositories from "../../repositories/invoice.repositories.js";
import { triggerOcr } from "../../../infrastructure/ai/ocr_client.js";
import { unpinByCid } from "../../../infrastructure/storage/ipfs.service.js";

/* ============================
 * BACKGROUND ANCHOR WORKER
 * ============================ */
export const anchorWorker = new Worker(ANCHOR_QUEUE_NAME, async (job) => {
    const { invoiceId, ipfsCid, fileSha, allowAutoOcr } = job.data;

    console.log(`[Worker] Started processing anchor job for invoice ${invoiceId}`);

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

        // ✅ OCR ONLY FOR DOCUMENTS
        if (allowAutoOcr) {
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

        // 🗑️ Remove file from IPFS when anchoring fails entirely
        // We only want to delete it if we are sure we aren't retrying
        if (job.attemptsMade >= job.opts.attempts - 1) {
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
