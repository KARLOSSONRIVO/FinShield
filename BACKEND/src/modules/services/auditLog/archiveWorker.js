import { Worker } from "bullmq";
import redisConnection from "../../../infrastructure/redis/redis.connection.js";
import { ARCHIVE_QUEUE_NAME } from "../../../infrastructure/queue/archive.queue.js";
import { archiveAuditLogs } from "./archive.js";

/**
 * BullMQ Worker: picks up archive jobs enqueued by the nightly cron.
 * Retries up to 3 times with exponential backoff (configured on the queue).
 */
export const archiveWorker = new Worker(
    ARCHIVE_QUEUE_NAME,
    async (job) => {
        console.log(`[ArchiveWorker] Processing job ${job.id} — triggered at ${job.data.triggeredAt}`);
        const result = await archiveAuditLogs();
        console.log(`[ArchiveWorker] Job ${job.id} complete:`, result);
        return result;
    },
    {
        connection: redisConnection,
        concurrency: 1, // Only one archive run at a time
    }
);

archiveWorker.on("failed", (job, err) => {
    console.error(`[ArchiveWorker] Job ${job?.id} failed: ${err.message}`);
});
