"use client";

import { createContext, useContext, ReactNode } from "react";
import { useSocket } from "@/hooks/global/use-socket";
import { useAuth } from "@/hooks/global/use-auth";
import type { SocketEvent } from "@/lib/socket-events";

type SocketRef = { socket: React.RefObject<import("socket.io-client").Socket | null> };
type SocketContextType = SocketRef & {
    on: <T = unknown>(event: SocketEvent | string, handler: (data: T) => void) => () => void;
    off: (event: SocketEvent | string, handler?: (...args: any[]) => void) => void;
};

export const SocketContext = createContext<SocketContextType | null>(null);

/**
 * SocketProvider wraps the app, getting the user's token directly from
 * AuthProvider and managing one single global WebSocket connection.
 */
export function SocketProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();

    // Read the token reactively: re-evaluates whenever `user` changes (login/logout).
    // When user is null (logged out), pass null → socket disconnects.
    // When user is set (logged in), read localStorage → socket connects.
    const token = user ? (typeof window !== 'undefined' ? localStorage.getItem('token') : null) : null;
    const socketCtx = useSocket(token);

    return (
        <SocketContext.Provider value={socketCtx}>
            {children}
        </SocketContext.Provider>
    );
}
