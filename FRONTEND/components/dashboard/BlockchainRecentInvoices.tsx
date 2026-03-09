"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Blocks } from "lucide-react"
import { useBlockchain } from "@/hooks/blockchain/use-blockchain"
import { Skeleton } from "@/components/ui/skeleton"

// Define the type based on the blockchain service response
interface BlockchainInvoice {
    id: string
    invoiceNumber: string
    companyName?: string
    amount?: number
    status: 'anchored' | 'pending' | 'verified' | string
    transactionHash?: string
    blockHash?: string
    blockNumber?: number
    anchoredAt: string
    timestamp?: string
    fromAddress?: string
    toAddress?: string
    metadata?: Record<string, any>
}

export function BlockchainRecentInvoices() {
    const { invoices, isLoading } = useBlockchain({ initialLimit: 6 })

    const blockchainInvoices = (invoices || []) as BlockchainInvoice[]

    const getStatusBadge = (status: string) => {
        const statusColors: Record<string, string> = {
            anchored: "bg-emerald-600 text-white", // Changed to green
            pending: "bg-yellow-500 text-white",
            verified: "bg-emerald-600 text-white",
        }
        return statusColors[status?.toLowerCase()] || "bg-gray-400 text-white"
    }

    const formatDate = (timestamp: string) => {
        if (!timestamp) return "—"
        try {
            const date = new Date(timestamp)
            return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}` // Format: 1/1/1970
        } catch {
            return "—"
        }
    }

    const truncateHash = (hash?: string) => {
        if (!hash) return "—"
        return `${hash.slice(0, 6)}...${hash.slice(-4)}`
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Blocks className="h-5 w-5" />
                        Blockchain Activity
                    </CardTitle>
                    <CardDescription>Recent on-chain anchors</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center justify-between p-4 border border-border rounded-xl">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="h-10 w-10 rounded-lg" />
                                    <div>
                                        <Skeleton className="h-4 w-24 mb-2" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Skeleton className="h-4 w-20 mb-2" />
                                    <Skeleton className="h-5 w-16 rounded-md" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Blocks className="h-5 w-5" />
                    Blockchain Activity
                </CardTitle>
                <CardDescription>Recent on-chain anchors</CardDescription>
            </CardHeader>
            <CardContent>
                {blockchainInvoices.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8 border-2 border-dashed rounded-xl">
                        No blockchain activity found.
                    </p>
                ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {blockchainInvoices.map((invoice) => (
                            <div
                                key={invoice.id}
                                className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/50 transition-colors bg-card"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                                        <Blocks className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-base">{invoice.invoiceNumber || "—"}</p>
                                        <p className="text-xs font-medium text-muted-foreground">
                                            {invoice.companyName || truncateHash(invoice.fromAddress || invoice.id)}
                                        </p>
                                        {invoice.blockNumber && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Block #{invoice.blockNumber.toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">
                                        {formatDate(invoice.anchoredAt || invoice.timestamp || "")}
                                    </p>
                                    {invoice.amount != null && (
                                        <p className="text-sm font-bold">${invoice.amount.toLocaleString()}</p>
                                    )}
                                    <Badge className={`${getStatusBadge(invoice.status)} rounded-md px-2 py-0 text-[10px] font-bold capitalize`}>
                                        {invoice.status || "unknown"}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}