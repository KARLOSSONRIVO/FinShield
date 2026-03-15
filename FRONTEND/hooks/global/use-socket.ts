"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { SocketEvent } from "@/lib/socket-events";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

/**
 * Manages a single Socket.IO connection for the authenticated user.
 * Automatically connects when a token is provided and disconnects on cleanup.
 *
 * @param token - JWT access token (pass null/undefined when logged out)
 * @returns socket ref + on/off helpers
 */
export function useSocket(token: string | null | undefined) {
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!token) return;

        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ["websocket"],
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        socket.on("connect", () => {
            // Socket connected
        });

        socket.on("connect_error", (err) => {
            // Silently swallow or safely log without breaking UX
            // toast.error("Connection error: " + err.message);
        });

        socket.on("disconnect", (_reason) => {
            // Socket disconnected
        });

        socketRef.current = socket;

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [token]);

    /** Subscribe to a Socket.IO event. Returns an unsubscribe function. */
    const on = useCallback(
        <T = unknown>(event: SocketEvent | string, handler: (data: T) => void) => {
            socketRef.current?.on(event, handler as any);
            return () => {
                socketRef.current?.off(event, handler as any);
            };
        },
        []
    );

    /** Unsubscribe from a Socket.IO event. */
    const off = useCallback(
        (event: SocketEvent | string, handler?: (...args: any[]) => void) => {
            socketRef.current?.off(event, handler);
        },
        []
    );

    return { socket: socketRef, on, off };
}
