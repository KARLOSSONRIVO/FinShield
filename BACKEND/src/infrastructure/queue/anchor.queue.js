import { Queue } from 'bullmq';
import redisConnection from '../redis/redis.connection.js';

export const ANCHOR_QUEUE_NAME = 'anchor-invoice-queue';

export const anchorQueue = new Queue(ANCHOR_QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 5, // Retry up to 5 times
        backoff: {
            type: 'exponential',
            delay: 2000, // 2s, 4s, 8s, 16s...
        },
        removeOnComplete: true, // Keep Redis clean
        removeOnFail: false,    // Keep failed jobs for inspection
    }
});

/**
 * Add an invoice to the background anchoring queue
 * @param {Object} data 
 * @param {string} data.invoiceId - MongoDB ID of the invoice
 * @param {string} data.ipfsCid - The IPFS CID
 * @param {string} data.fileSha - the SHA-256 hash of the file
 * @param {boolean} data.allowAutoOcr - Should OCR be triggered after anchoring?
 */
export async function addAnchorJob(data) {
    console.log(`[Queue] Adding invoice ${data.invoiceId} to anchor queue`);
    return await anchorQueue.add('anchor-job', data);
}
