"use client"

import { createContext, useContext, ReactNode } from "react"
import { useMetaMask } from "@/hooks/blockchain/use-metamask"

type MetaMaskContextType = ReturnType<typeof useMetaMask>

// Create Context
const MetaMaskContext = createContext<MetaMaskContextType | undefined>(undefined)

// Provider Component
export function MetaMaskProvider({ children }: { children: ReactNode }) {
    const metaMaskState = useMetaMask()

    return (
        <MetaMaskContext.Provider value={metaMaskState}>
            {children}
        </MetaMaskContext.Provider>
    )
}

// Custom Hook to consume Context
export function useMetaMaskContext() {
    const context = useContext(MetaMaskContext)
    if (context === undefined) {
        throw new Error("useMetaMaskContext must be used within a MetaMaskProvider")
    }
    return context
}
