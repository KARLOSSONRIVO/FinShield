"use client"

import { useState, useEffect, useCallback } from "react"
import { BrowserProvider, Eip1193Provider } from "ethers"
import { toast } from "sonner"

export interface MetaMaskState {
    account: string | null
    chainId: number | null
    isConnected: boolean
    isConnecting: boolean
    error: string | null
}

// Ensure TypeScript knows about window.ethereum
declare global {
    interface Window {
        ethereum?: Eip1193Provider & {
            on: (event: string, callback: (...args: any[]) => void) => void
            removeListener: (event: string, callback: (...args: any[]) => void) => void
        }
    }
}

export function useMetaMask() {
    const [state, setState] = useState<MetaMaskState>({
        account: null,
        chainId: null,
        isConnected: false,
        isConnecting: false,
        error: null,
    })

    const isSepolia = state.chainId === 11155111

    const updateAccountAndChain = useCallback(async () => {
        if (!window.ethereum) return

        try {
            const provider = new BrowserProvider(window.ethereum)
            const accounts = await provider.listAccounts()
            const network = await provider.getNetwork()

            if (accounts.length > 0) {
                setState((prev) => ({
                    ...prev,
                    account: accounts[0].address,
                    chainId: Number(network.chainId),
                    isConnected: true,
                }))
            } else {
                setState((prev) => ({
                    ...prev,
                    account: null,
                    isConnected: false,
                }))
            }
        } catch (error: any) {
            // Silently ignore background read errors to prevent spam, just clear state
            setState((prev) => ({
                ...prev,
                account: null,
                isConnected: false,
            }))
        }
    }, [])

    useEffect(() => {
        if (typeof window !== "undefined" && window.ethereum) {
            // Initial check
            updateAccountAndChain()

            // Listeners
            const handleAccountsChanged = (accounts: string[]) => {
                if (accounts.length === 0) {
                    setState((prev) => ({ ...prev, account: null, isConnected: false }))
                } else {
                    setState((prev) => ({ ...prev, account: accounts[0], isConnected: true }))
                }
            }

            const handleChainChanged = (chainIdHex: string) => {
                const chainId = parseInt(chainIdHex, 16)
                setState((prev) => ({ ...prev, chainId }))
                // Recommended by MetaMask docs to reload on chain change
                window.location.reload()
            }

            window.ethereum.on("accountsChanged", handleAccountsChanged)
            window.ethereum.on("chainChanged", handleChainChanged)

            return () => {
                window.ethereum?.removeListener("accountsChanged", handleAccountsChanged)
                window.ethereum?.removeListener("chainChanged", handleChainChanged)
            }
        }
    }, [updateAccountAndChain])

    const connectWallet = async () => {
        if (!window.ethereum) {
            setState((prev) => ({ ...prev, error: "MetaMask is not installed" }))
            return
        }

        setState((prev) => ({ ...prev, isConnecting: true, error: null }))

        try {
            const provider = new BrowserProvider(window.ethereum)
            await provider.send("eth_requestAccounts", [])
            await updateAccountAndChain()
        } catch (error: any) {
            setState((prev) => ({ ...prev, error: error.message || "Failed to connect" }))
        } finally {
            setState((prev) => ({ ...prev, isConnecting: false }))
        }
    }

    const switchToSepolia = async () => {
        if (!window.ethereum) return

        try {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: "0xaa36a7" }], // 11155111 in hex
            })
        } catch (error: any) {
            // 4902 means the chain hasn't been added yet
            if (error.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [
                            {
                                chainId: "0xaa36a7",
                                chainName: "Sepolia test network",
                                rpcUrls: ["https://rpc.sepolia.org"],
                                nativeCurrency: {
                                    name: "Sepolia Ether",
                                    symbol: "SEP",
                                    decimals: 18,
                                },
                                blockExplorerUrls: ["https://sepolia.etherscan.io"],
                            },
                        ],
                    })
                } catch (addError) {
                    toast.error("Failed to add Sepolia network to MetaMask.")
                }
            } else {
                toast.error("Failed to switch to Sepolia network.")
            }
        }
    }

    const verifyTxOnChain = async (txHash: string): Promise<boolean> => {
        if (!window.ethereum) throw new Error("MetaMask is not installed. Please install it to verify on-chain.");
        if (!isSepolia) throw new Error("Please switch to the Sepolia network.");

        const provider = new BrowserProvider(window.ethereum)
        const receipt = await provider.getTransactionReceipt(txHash)

        // receipt.status === 1 means the transaction was successful
        // If receipt is null, the tx is not found
        return receipt !== null && receipt.status === 1
    }

    return {
        ...state,
        isSepolia,
        connectWallet,
        switchToSepolia,
        verifyTxOnChain,
    }
}
