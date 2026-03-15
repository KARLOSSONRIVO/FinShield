"use client";

import { useEffect } from "react";
import type { SocketEvent } from "@/lib/socket-events";

type SocketRef = { socket: React.RefObject<import("socket.io-client").Socket | null> };
type SocketCtx = SocketRef & { on: (event: string, handler: (data: any) => void) => () => void };

/**
 * Subscribe to a single Socket.IO event. Handles cleanup automatically.
 * Accepts a null socketCtx so it can be called unconditionally (Rules of Hooks safe).
 *
 * @param socketCtx - The return value of useSocket(), or null if not yet connected
 * @param event     - The event name to listen for
 * @param handler   - Callback when the event fires
 */
export function useSocketEvent<T = unknown>(
    socketCtx: SocketCtx | null,
    event: SocketEvent | string,
    handler: (data: T) => void
) {
    useEffect(() => {
        if (!socketCtx || !socketCtx.socket.current) return;
        const unsub = socketCtx.on(event, handler);
        return unsub;
    }, [socketCtx, event, handler]);
}

