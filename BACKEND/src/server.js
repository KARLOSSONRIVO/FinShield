import app from "./app.js";
import http from "http";
import { PORT } from "./config/env.js";
import { connectDB, disconnectDB } from "./infrastructure/db/database.js";
import { anchorWorker } from "./modules/services/invoice/anchor_background.js";
import { initSocket } from "./infrastructure/socket/socket.service.js";

const server = http.createServer(app)

// Initialize Socket.IO on the HTTP server
initSocket(server);

async function bootstrap() {
    try {
        await connectDB()

        server.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}/health`)
        })

        process.on("SIGINT", async () => {
            console.log("Shutting down server...")
            await anchorWorker.close()
            await disconnectDB()
            process.exit(0)
        })

        process.on("SIGTERM", async () => {
            console.log("Shutting down server...")
            await anchorWorker.close()
            await disconnectDB()
            process.exit(0)
        })
    } catch (error) {
        console.error("Failed to start server:", error)
        process.exit(1)
    }
}


bootstrap()