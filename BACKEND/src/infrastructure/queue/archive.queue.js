import { Queue } from "bullmq";
import redisConnection from "../redis/redis.connection.js";

export const ARCHIVE_QUEUE_NAME = "audit-archive-queue";

export const archiveQueue = new Queue(ARCHIVE_QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type:  "exponential",
            delay: 5000, // 5s, 10s, 20s
        },
        removeOnComplete: true,
        removeOnFail:     false,
    },
});

/**
 * Enqueue a nightly archive run.
 * Called by the node-cron scheduler in server.js.
 *
 * @param {Object} [data={}] - Optional job metadata
 */
export async function addArchiveJob(data = {}) {
    console.log("[ArchiveQueue] Enqueueing nightly audit log archive job");
    return archiveQueue.add("archive-job", { triggeredAt: new Date().toISOString(), ...data });
}
