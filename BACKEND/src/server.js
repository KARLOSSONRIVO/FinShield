import app from "./app.js";
import http from "http";
import { PORT } from "./config/env.js";
import { connectDB, disconnectDB } from "./infrastructure/db/database.js";
import { anchorWorker } from "./modules/services/invoice/anchor_background.js";
import { archiveWorker } from "./modules/services/auditLog/archiveWorker.js";
import { addArchiveJob } from "./infrastructure/queue/archive.queue.js";
import { initSocket } from "./infrastructure/socket/socket.service.js";
import cron from "node-cron";

const server = http.createServer(app)

// Initialize Socket.IO on the HTTP server
initSocket(server);

// ─── Nightly audit log archival cron ───────────────────────────────────────
// Runs at 02:00 AM server time every day
cron.schedule("0 2 * * *", async () => {
    console.log("[Cron] Triggering nightly audit log archival");
    try {
        await addArchiveJob();
    } catch (err) {
        console.error("[Cron] Failed to enqueue archive job:", err.message);
    }
});

async function bootstrap() {
    try {
        await connectDB()

        server.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}/health`)
        })

        process.on("SIGINT", async () => {
            console.log("Shutting down server...")
            await anchorWorker.close()
            await archiveWorker.close()
            await disconnectDB()
            process.exit(0)
        })

        process.on("SIGTERM", async () => {
            console.log("Shutting down server...")
            await anchorWorker.close()
            await archiveWorker.close()
            await disconnectDB()
            process.exit(0)
        })
    } catch (error) {
        console.error("Failed to start server:", error)
        process.exit(1)
    }
}


bootstrap()