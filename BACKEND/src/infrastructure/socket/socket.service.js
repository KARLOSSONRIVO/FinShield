import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Redis from "ioredis";
import { JWT_SECRET, CORS_ORIGIN, REDIS_URI } from "../../config/env.js";
import { blacklistHas } from "../redis/cache.service.js";

let io = null;

// ─── Socket.IO Event Constants ──────────────────────────────
export const SocketEvents = {
    // Invoice pipeline
    INVOICE_CREATED:        "invoice:created",
    INVOICE_ANCHOR_SUCCESS: "invoice:anchor:success",
    INVOICE_ANCHOR_FAILED:  "invoice:anchor:failed",
    INVOICE_PROCESSING:     "invoice:processing",
    INVOICE_AI_COMPLETE:    "invoice:ai:complete",
    INVOICE_FLAGGED:        "invoice:flagged",

    // List invalidation signals
    INVOICE_LIST_INVALIDATE: "invoice:list:invalidate",
    USER_LIST_INVALIDATE:    "user:list:invalidate",
    ORG_LIST_INVALIDATE:     "org:list:invalidate",

    // Auditor review
    INVOICE_REVIEWED:       "invoice:reviewed",

    // Audit logs
    AUDIT_CREATED:          "audit:created",

    // Assignments
    ASSIGNMENT_CREATED:     "assignment:created",
    ASSIGNMENT_UPDATED:     "assignment:updated",
    ASSIGNMENT_DEACTIVATED: "assignment:deactivated",
};

// ─── Redis Pub/Sub Channel ──────────────────────────────────
const AI_CHANNEL = "channel:invoice";

/**
 * Initialize Socket.IO on the existing HTTP server.
 * Sets up JWT authentication, room management, and the AI Service Redis subscriber.
 */
export function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN.split(",").map((s) => s.trim()),
            credentials: true,
        },
        // Only use WebSocket transport (skip long-polling for speed)
        transports: ["websocket", "polling"],
    });

    // ── Auth Middleware ──────────────────────────────────────
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) return next(new Error("Authentication required"));

            // Check blacklist
            const isBlacklisted = await blacklistHas(token);
            if (isBlacklisted) return next(new Error("Token revoked"));

            const decoded = jwt.verify(token, JWT_SECRET);
            socket.user = {
                sub: decoded.sub,
                role: decoded.role,
                orgId: decoded.orgId || null,
            };
            next();
        } catch (err) {
            next(new Error("Invalid token"));
        }
    });

    // ── Connection Handler ──────────────────────────────────
    io.on("connection", (socket) => {
        const { sub, role, orgId } = socket.user;

        // Every user gets their own room for targeted events
        socket.join(`user:${sub}`);

        // Company roles join their organization room
        if (orgId) {
            socket.join(`org:${orgId}`);
        }

        // Role-based rooms for platform-wide events
        if (role === "AUDITOR") socket.join("role:AUDITOR");
        if (role === "SUPER_ADMIN") socket.join("role:SUPER_ADMIN");
        if (role === "REGULATOR") socket.join("role:REGULATOR");

        console.log(`[Socket] ${role} ${sub} connected (rooms: user:${sub}${orgId ? `, org:${orgId}` : ""}, role:${role})`);

        socket.on("disconnect", () => {
            console.log(`[Socket] ${role} ${sub} disconnected`);
        });
    });

    // ── AI Service Redis Subscriber ─────────────────────────
    // Separate Redis connection required — subscriber mode blocks other commands
    const subscriber = new Redis(REDIS_URI, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    });

    subscriber.subscribe(AI_CHANNEL, (err) => {
        if (err) {
            console.error("[Socket] Failed to subscribe to AI channel:", err.message);
        } else {
            console.log(`[Socket] Subscribed to Redis channel: ${AI_CHANNEL}`);
        }
    });

    subscriber.on("message", (_channel, message) => {
        try {
            const data = JSON.parse(message);

            if (data.event === "ai_complete") {
                const payload = {
                    invoiceId: data.invoiceId,
                    aiVerdict: data.aiVerdict,
                    aiRiskScore: data.aiRiskScore,
                    riskLevel: data.riskLevel,
                };

                // Notify the uploader and their organization
                if (data.uploadedByUserId) {
                    io.to(`user:${data.uploadedByUserId}`).emit(SocketEvents.INVOICE_AI_COMPLETE, payload);
                }
                if (data.orgId) {
                    io.to(`org:${data.orgId}`).emit(SocketEvents.INVOICE_AI_COMPLETE, payload);
                }

                // If flagged, alert auditors and admins immediately
                if (data.aiVerdict === "flagged") {
                    io.to("role:AUDITOR")
                      .to("role:SUPER_ADMIN")
                      .to("role:REGULATOR")
                      .emit(SocketEvents.INVOICE_FLAGGED, payload);

                    // Dynamic import to avoid circular dependency (socket.service ↔ audit.js)
                    import("../../common/utils/audit.js").then(({ createAuditLog }) => {
                        import("../../common/utils/audit.constants.js").then(({ AuditActions }) => {
                            createAuditLog({
                                actorId:   null,
                                actorRole: "SYSTEM",
                                actor:     { username: "system", email: null },
                                action:    AuditActions.INVOICE_FLAGGED,
                                target:    { type: "Invoice" },
                                metadata:  { invoiceId: data.invoiceId, orgId: data.orgId, aiVerdict: data.aiVerdict, aiRiskScore: data.aiRiskScore, riskLevel: data.riskLevel },
                            });
                        });
                    }).catch((err) => console.error("[Audit] Failed to log INVOICE_FLAGGED:", err.message));
                }

                // Invalidate invoice lists for the org
                if (data.orgId) {
                    io.to(`org:${data.orgId}`).emit(SocketEvents.INVOICE_LIST_INVALIDATE, { orgId: data.orgId });
                }

                console.log(`[Socket] AI complete for invoice ${data.invoiceId} → verdict: ${data.aiVerdict}`);
            }
        } catch (err) {
            console.error("[Socket] Failed to parse AI channel message:", err.message);
        }
    });

    console.log("[Socket] Socket.IO initialized");
    return io;
}

/**
 * Get the Socket.IO server instance.
 * Use this from any service to emit events.
 */
export function getIO() {
    if (!io) {
        console.warn("[Socket] Socket.IO not initialized yet — event will be dropped");
    }
    return io;
}
