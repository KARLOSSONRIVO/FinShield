"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { InvoiceService } from "@/services/invoice.service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText, Brain, Link2, ClipboardCheck, ImageIcon, X, Loader2 } from "lucide-react"
import Link from "next/link"

interface InvoiceDetailViewProps {
    id: string
    backUrl: string
    backLabel?: string
}

export function InvoiceDetailView({ id, backUrl, backLabel = "Back to Invoices" }: InvoiceDetailViewProps) {
    const [imageOpen, setImageOpen] = useState(false)
    const [iframeLoaded, setIframeLoaded] = useState(false)

    // Lock background scroll when lightbox is open, and set a safety timeout for the spinner
    useEffect(() => {
        let timeout: NodeJS.Timeout
        if (imageOpen) {
            document.body.style.overflow = "hidden"
            // Safety fallback: if browser blocks the PDF or Google Docs Viewer interceptor fails,
            // remove the spinner after 4 seconds so it doesn't hang forever.
            timeout = setTimeout(() => setIframeLoaded(true), 4000)
        } else {
            document.body.style.overflow = ""
            setIframeLoaded(false) // reset loader for next open
        }
        return () => {
            document.body.style.overflow = ""
            clearTimeout(timeout)
        }
    }, [imageOpen])

    const { data, isLoading, isError } = useQuery({
        queryKey: ["invoice-detail", id],
        queryFn: async () => {
            const res = await InvoiceService.getById(id)
            return res.data
        },
        enabled: !!id
    })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
        )
    }

    if (isError || !data) {
        return (
            <div className="p-6 text-center space-y-4">
                <p className="text-muted-foreground">Invoice not found or you don't have access.</p>
                <Link href={backUrl}>
                    <Button variant="outline">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {backLabel}
                    </Button>
                </Link>
            </div>
        )
    }

    const riskScore = data.aiAnalysis?.riskScore ?? 0
    const verdict = data.aiAnalysis?.verdict ?? "clean"
    const isClean = verdict === "clean"
    const verdictColor = isClean ? "bg-emerald-600" : "bg-yellow-500 text-black"
    const barColor = riskScore < 30 ? "bg-emerald-500" : riskScore < 70 ? "bg-yellow-500" : "bg-red-600"

    // Image URL from blockchain IPFS fileUrl
    const imageUrl = data.blockchain?.fileUrl || null

    const hasRealReview = data.review?.decision && (data.review.decision as string) !== "pending"

    return (
        <div className="space-y-6">

            {/* ── Hidden preload object — fetches PDF immediately so it's cached by the time user clicks ── */}
            {imageUrl && (
                <object
                    data={imageUrl}
                    type="application/pdf"
                    title="preload"
                    aria-hidden
                    tabIndex={-1}
                    style={{ width: 0, height: 0, position: 'absolute' }}
                    onLoad={() => setIframeLoaded(true)}
                />
            )}

            {/* ── Lightbox Dialog ───────────────────────────────────────── */}
            {imageOpen && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm"
                    style={{ height: "100dvh" }}
                    onClick={() => setImageOpen(false)}
                >
                    <div
                        className="relative w-full max-w-4xl mx-4 flex flex-col"
                        style={{ height: "90dvh" }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setImageOpen(false)}
                            className="absolute -top-10 right-0 text-white/80 hover:text-white transition-colors z-10"
                        >
                            <X className="h-8 w-8" />
                        </button>

                        {imageUrl ? (
                            <div className="relative w-full h-full flex flex-col gap-2">
                                <div className="flex justify-end pr-2 gap-4 items-center">
                                    <span className="text-white/60 text-sm">If the preview doesn't load:</span>
                                    <a
                                        href={imageUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-400 hover:text-emerald-300 text-sm font-bold flex items-center gap-1"
                                    >
                                        <Link2 className="h-4 w-4" />
                                        Open in New Tab
                                    </a>
                                </div>
                                <div className="relative w-full flex-1 min-h-0 bg-white/5 rounded-lg overflow-hidden">
                                    {!iframeLoaded && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                            <Loader2 className="h-10 w-10 text-white animate-spin" />
                                        </div>
                                    )}
                                    {/* Same URL as preload — browser serves from cache instantly */}
                                    <object
                                        data={imageUrl}
                                        type="application/pdf"
                                        title="Invoice"
                                        className="w-full h-full rounded-lg border-0"
                                        onLoad={() => setIframeLoaded(true)}
                                    >
                                        <div className="flex items-center justify-center h-full bg-card rounded-lg flex-col gap-4">
                                            <p className="text-muted-foreground text-sm">Your browser doesn't support embedded PDFs.</p>
                                            <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">
                                                Open PDF directly
                                            </a>
                                        </div>
                                    </object>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-card rounded-xl p-16 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                                <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
                                <p className="text-sm">Image not available</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <div className="h-12 w-12 bg-muted rounded-lg flex items-center justify-center border border-border">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">{data.invoiceNumber}</h2>
                        <p className="text-muted-foreground font-medium">{data.company || "FinShield Platform"}</p>
                    </div>
                </div>
                <Link href={backUrl}>
                    <Button variant="ghost" className="gap-2 font-bold hover:bg-transparent hover:underline">
                        <ArrowLeft className="h-4 w-4" />
                        {backLabel}
                    </Button>
                </Link>
            </div>

            {/* ── 2-Column Grid ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Card 1: Invoice Details */}
                <Card className="border border-border shadow-sm rounded-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg font-bold">
                            <FileText className="h-5 w-5" />
                            Invoice Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-y-4">
                            <div>
                                <p className="text-xs font-bold text-foreground uppercase">Invoice Number</p>
                                <p className="text-sm font-medium mt-1 text-muted-foreground">{data.invoiceNumber}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-foreground uppercase">Invoice Date</p>
                                <p className="text-sm font-medium mt-1 text-muted-foreground">
                                    {data.invoiceDate ? new Date(data.invoiceDate).toLocaleDateString() : "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-foreground uppercase">Total Amount</p>
                                <p className="text-xl font-extrabold mt-1">
                                    {data.totalAmount != null ? `$${data.totalAmount.toLocaleString()}` : "N/A"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-foreground uppercase">Company</p>
                                <p className="text-sm font-medium mt-1 text-muted-foreground">{data.company || "—"}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-foreground uppercase">Status</p>
                                <p className="text-sm font-medium mt-1 capitalize text-muted-foreground">{data.status}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Card 2: AI Fraud Analysis */}
                <Card className="border border-border shadow-sm rounded-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg font-bold">
                            <Brain className="h-5 w-5" />
                            AI Fraud Analysis
                        </CardTitle>
                        <CardDescription>Automated anomaly detection results</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center bg-muted/40 p-3 rounded-lg border border-border">
                            <span className="font-bold text-sm">AI Verdict</span>
                            <Badge className={`${verdictColor} rounded-md px-4 capitalize text-xs font-bold`}>
                                {verdict}
                            </Badge>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-sm">Risk Score</span>
                                <span className="font-bold text-sm">{riskScore.toFixed(2)}%</span>
                            </div>
                            <div className="h-3 w-full bg-muted rounded-full overflow-hidden border border-border">
                                <div
                                    className={`h-full ${barColor} transition-all duration-500`}
                                    style={{ width: `${Math.min(riskScore, 100)}%` }}
                                />
                            </div>
                        </div>
                        {data.aiAnalysis?.summary && (
                            <div className="bg-muted/40 p-3 rounded-lg border border-border">
                                <p className="text-xs font-bold text-foreground uppercase mb-1">AI Summary</p>
                                <p className="text-sm text-muted-foreground">{data.aiAnalysis.summary}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Card 3: Blockchain Verification */}
                <Card className="border border-border shadow-sm rounded-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg font-bold">
                            <Link2 className="h-5 w-5" />
                            Blockchain Verification
                        </CardTitle>
                        <CardDescription>Tamper-proof ledger record</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {data.blockchain?.txHash ? (
                            <>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground mb-1 uppercase">Transaction Hash</p>
                                    <div className="bg-muted p-2 rounded border border-border text-xs font-mono text-muted-foreground break-all">
                                        {data.blockchain.txHash}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground mb-1 uppercase">Anchored At</p>
                                    <p className="font-bold text-sm">
                                        {new Date(data.blockchain.anchoredAt).toLocaleString()}
                                    </p>
                                </div>
                                <Badge className="bg-emerald-600 text-white px-3 rounded-md text-xs font-bold">
                                    ✓ Verified on Blockchain
                                </Badge>
                            </>
                        ) : (
                            <p className="text-muted-foreground text-sm">Pending blockchain verification.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Card 4: Invoice Image */}
                <Card className="border border-border shadow-sm rounded-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg font-bold">
                            <ImageIcon className="h-5 w-5" />
                            Invoice Image
                        </CardTitle>
                        <CardDescription>View scanned invoice used for AI assessment</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center gap-4 py-6">
                        <div className="h-16 w-16 bg-muted rounded-xl flex items-center justify-center border border-border">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => setImageOpen(true)}
                                disabled={!imageUrl}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6"
                            >
                                View Image
                            </Button>
                        </div>
                        {!imageUrl && (
                            <p className="text-xs text-muted-foreground">Not anchored yet — no file available</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Review History — full width ────────────────────────────── */}
            <Card className="border border-border shadow-sm rounded-xl">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                        <ClipboardCheck className="h-5 w-5" />
                        Review History
                    </CardTitle>
                    <CardDescription>Auditor decisions and notes</CardDescription>
                </CardHeader>
                <CardContent>
                    {hasRealReview ? (
                        <div className="p-4 border border-border rounded-xl space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-sm">{data.review!.reviewer || "Auditor"}</span>
                                <Badge className={`${data.review!.decision === "fraudulent" ? "bg-red-600" :
                                    data.review!.decision === "needs_clarification" ? "bg-yellow-500 text-black" :
                                        "bg-emerald-600"
                                    } text-white text-[10px] capitalize rounded-md px-3 font-bold`}>
                                    {data.review!.decision.replace(/_/g, " ")}
                                </Badge>
                            </div>
                            {data.review!.notes && (
                                <p className="text-sm text-muted-foreground font-medium">{data.review!.notes}</p>
                            )}
                            <p className="text-[10px] text-muted-foreground">
                                {new Date(data.review!.reviewedAt).toLocaleString()}
                            </p>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-center py-8 border-2 border-dashed rounded-xl text-sm">
                            No reviews yet
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
