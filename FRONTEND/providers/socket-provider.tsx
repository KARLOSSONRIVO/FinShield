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

    // Provide the JWT to authenticate the socket. If the user logs out, token is empty -> socket disconnects.
    // Note: Assuming `user.token` or similar exists; adjust based on exactly where the JWT lives.
    // For the standard useAuth, we usually have an accessToken saved in localStorage/cookies.
    // We'll read it straight from localStorage since that's a common pattern in this project structure.

    // A safe way to get the token directly if it's not on the `user` object in context:
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    // Re-run useSocket when the user status changes (meaning they logged in/out)
    const expandedToken = user ? token : null;
    const socketCtx = useSocket(expandedToken);

    return (
        <SocketContext.Provider value={socketCtx}>
            {children}
        </SocketContext.Provider>
    );
}
