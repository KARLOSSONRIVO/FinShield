"use client";

import { useEffect } from "react";
import type { SocketEvent } from "@/lib/socket-events";

type SocketRef = { socket: React.RefObject<import("socket.io-client").Socket | null> };

/**
 * Subscribe to a single Socket.IO event. Handles cleanup automatically.
 *
 * @param socketCtx - The return value of useSocket()
 * @param event     - The event name to listen for
 * @param handler   - Callback when the event fires
 */
export function useSocketEvent<T = unknown>(
    socketCtx: SocketRef & { on: (event: string, handler: (data: T) => void) => () => void },
    event: SocketEvent | string,
    handler: (data: T) => void
) {
    useEffect(() => {
        if (!socketCtx.socket.current) return;
        const unsub = socketCtx.on(event, handler);
        return unsub;
    }, [socketCtx, event, handler]);
}
