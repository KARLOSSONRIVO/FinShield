import app from "./app.js";
import http from "http";
import { PORT } from "./config/env.js";
import { connectDB,disconnectDB } from "./infrastructure/db/database.js";

const server = http.createServer(app)

async function bootstrap() {
    try {
        await connectDB()

        server.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}/health`)
        })

        process.on("SIGINT", async () => {
            console.log("Shutting down server...")
            await disconnectDB()
            process.exit(0)
        })

        process.on("SIGTERM", async () => {
            console.log("Shutting down server...")
            await disconnectDB()
            process.exit(0)
        })
    } catch (error) {
        console.error("Failed to start server:", error)
        process.exit(1)
    }
}


bootstrap()