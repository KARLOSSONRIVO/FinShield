"use client"

import { useState, useEffect, useContext, useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { InvoiceService } from "@/services/invoice.service"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { ArrowLeft, FileText, Brain, Link2, ClipboardCheck, ImageIcon, X, Loader2, CheckCircle2, AlertTriangle, ShieldAlert, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { SocketContext } from "@/providers/socket-provider"
import { useSocketEvent } from "@/hooks/global/use-socket-event"
import { SocketEvents } from "@/lib/socket-events"
import { useSubmitReview } from "@/hooks/auditor/use-submit-review"
import { ReviewDecision } from "@/lib/types"

interface InvoiceDetailViewProps {
    id: string
    backUrl: string
    backLabel?: string
    /** Pass "auditor" to show the Submit Review card instead of Review History */
    role?: "auditor" | "super-admin" | "regulator" | "manager"
}

interface AiCompletePayload {
    invoiceId: string
    aiVerdict: string
    aiRiskScore: number
    riskLevel: string
}

export function InvoiceDetailView({ id, backUrl, backLabel = "Back to Invoices", role }: InvoiceDetailViewProps) {
    const [imageOpen, setImageOpen] = useState(false)
    const [iframeLoaded, setIframeLoaded] = useState(false)
    const [reviewDecision, setReviewDecision] = useState<ReviewDecision>("approved")
    const [reviewNotes, setReviewNotes] = useState("")
    const [reviewEnabled, setReviewEnabled] = useState(false)

    const queryClient = useQueryClient()
    const socketCtx = useContext(SocketContext)
    const { mutate: submitReview, isPending: isSubmitting } = useSubmitReview(id)

    const isAuditor = role === "auditor"

    // Socket: refresh invoice on AI/blockchain events
    const handleInvoiceUpdate = useCallback((data: { invoiceId: string }) => {
        if (data.invoiceId === id) {
            queryClient.invalidateQueries({ queryKey: ["invoice-detail", id] })
        }
    }, [id, queryClient])

    // Socket: refresh invoice on AI complete
    const handleAiComplete = useCallback((data: AiCompletePayload) => {
        if (data.invoiceId === id) {
            queryClient.invalidateQueries({ queryKey: ["invoice-detail", id] })
        }
    }, [id, queryClient])

    useSocketEvent(socketCtx!, SocketEvents.INVOICE_PROCESSING, handleInvoiceUpdate)
    useSocketEvent(socketCtx!, SocketEvents.INVOICE_AI_COMPLETE, handleAiComplete)
    useSocketEvent(socketCtx!, SocketEvents.INVOICE_ANCHOR_SUCCESS, handleInvoiceUpdate)
    useSocketEvent(socketCtx!, SocketEvents.INVOICE_FLAGGED, handleInvoiceUpdate)

    // Lock scroll on lightbox
    useEffect(() => {
        let timeout: NodeJS.Timeout
        if (imageOpen) {
            document.body.style.overflow = "hidden"
            timeout = setTimeout(() => setIframeLoaded(true), 10000)
        } else {
            document.body.style.overflow = ""
            setIframeLoaded(false)
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
        enabled: !!id,
        // Poll every 5s while the invoice is still pending AI analysis
        refetchInterval: (query) => {
            const d = query.state.data as any
            const isPending = !d?.aiAnalysis?.verdict
            return isPending ? 5000 : false
        }
    })

    // Pre-fill review form when data loads
    useEffect(() => {
        if (data?.review?.decision) {
            setReviewDecision(data.review.decision as ReviewDecision)
            setReviewNotes(data.review.notes || "")
            setReviewEnabled(true)
        } else if (data?.aiAnalysis) {
            setReviewEnabled(true)
        }
    }, [data])

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <div>
                            <Skeleton className="h-8 w-40 mb-2" />
                            <Skeleton className="h-5 w-32" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Skeleton Card 1 */}
                    <Card className="border border-border shadow-sm rounded-xl">
                        <CardHeader className="pb-2">
                            <Skeleton className="h-6 w-32" />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-y-4">
                                <div><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-4 w-32" /></div>
                                <div><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-4 w-32" /></div>
                                <div><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-6 w-32" /></div>
                                <div><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-4 w-32" /></div>
                                <div><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-5 w-24" /></div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Skeleton Card 2 */}
                    <Card className="border border-border shadow-sm rounded-xl">
                        <CardHeader className="pb-2">
                            <Skeleton className="h-6 w-40 mb-2" />
                            <Skeleton className="h-4 w-48" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-12 w-full rounded-lg" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-full rounded-full" />
                            </div>
                            <Skeleton className="h-20 w-full rounded-lg" />
                        </CardContent>
                    </Card>

                    {/* Skeleton Card 3 */}
                    <Card className="border border-border shadow-sm rounded-xl">
                        <CardHeader className="pb-2">
                            <Skeleton className="h-6 w-48 mb-2" />
                            <Skeleton className="h-4 w-40" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-8 w-full rounded-md" /></div>
                            <div><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-5 w-40" /></div>
                        </CardContent>
                    </Card>

                    {/* Skeleton Card 4 */}
                    <Card className="border border-border shadow-sm rounded-xl">
                        <CardHeader className="pb-2">
                            <Skeleton className="h-6 w-40 mb-2" />
                            <Skeleton className="h-4 w-64" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-24 w-full rounded-md" />
                            <Skeleton className="h-10 w-full rounded-md" />
                        </CardContent>
                    </Card>
                </div>
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
    const verdict = data.aiAnalysis?.verdict ?? null
    // aiPending: true when no verdict yet (aiAnalysis may exist but have null verdict)
    const aiPending = !verdict
    const barColor = riskScore < 30 ? "bg-emerald-500" : riskScore < 70 ? "bg-yellow-500" : "bg-red-600"

    // Change "flagged" to "For Audit Verification" in display
    const displayVerdict = verdict === "flagged" ? "For Audit Verification" :
        verdict === "clean" ? "Verified" :
            verdict || "Pending"

    // Use yellow for flagged, emerald for clean, red for anything else
    const verdictColor = verdict === "clean" ? "bg-emerald-600 text-white" :
        verdict === "flagged" ? "bg-yellow-500 text-white" :
            "bg-red-600 text-white"

    const imageUrl = data.blockchain?.fileUrl || null
    const isImage = imageUrl ? /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(imageUrl) || imageUrl.startsWith('data:image/') : false
    const hasReview = !!data.review?.decision && data.review.decision.toLowerCase() !== "pending"
    const isUpdate = hasReview

    const handleSubmitReview = () => {
        if (!reviewNotes.trim()) return
        submitReview({ reviewDecision, reviewNotes })
    }

    return (
        <div className="space-y-6">

            {/* ── Hidden PDF/Image preload ──────────────────────────────────── */}
            {imageUrl && !isImage && (
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
            {imageUrl && isImage && (
                <img
                    src={imageUrl}
                    alt="preload"
                    style={{ width: 0, height: 0, position: 'absolute', opacity: 0 }}
                    onLoad={() => setIframeLoaded(true)}
                    onError={() => setIframeLoaded(true)}
                />
            )}

            {/* ── Lightbox ─────────────────────────────────────────────────── */}
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
                                    <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-white hover:text-white/80 text-sm font-bold flex items-center gap-1">
                                        <Link2 className="h-4 w-4" /> Open in New Tab
                                    </a>
                                </div>
                                <div className="relative w-full flex-1 min-h-0 bg-[#0f1115] rounded-lg overflow-hidden flex items-center justify-center">
                                    {!iframeLoaded && (
                                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40">
                                            <Loader2 className="h-10 w-10 text-white animate-spin" />
                                        </div>
                                    )}
                                    {isImage ? (
                                        <img
                                            src={imageUrl}
                                            alt="Invoice"
                                            className="max-w-full max-h-full object-contain rounded-lg"
                                            onLoad={() => setIframeLoaded(true)}
                                            onError={() => setIframeLoaded(true)}
                                        />
                                    ) : (
                                        <object data={imageUrl} type="application/pdf" title="Invoice" className="w-full h-full rounded-lg border-0 bg-white" onLoad={() => setIframeLoaded(true)}>
                                            <div className="flex items-center justify-center h-full bg-card rounded-lg flex-col gap-4">
                                                <p className="text-muted-foreground text-sm">Your browser doesn't support embedded PDFs.</p>
                                                <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">Open PDF directly</a>
                                            </div>
                                        </object>
                                    )}
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

            {/* ── Header ─────────────────────────────────────────────────────── */}
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

            {/* ── 2-Column Grid ──────────────────────────────────────────────── */}
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
                                <div className="mt-1">
                                    {data.invoiceDate ? (
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {new Date(data.invoiceDate).toLocaleDateString()}
                                        </p>
                                    ) : (
                                        <Skeleton className="h-4 w-24" />
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-foreground uppercase">Total Amount</p>
                                <div className="mt-1">
                                    {data.totalAmount != null ? (
                                        <p className="text-xl font-extrabold">{`₱${data.totalAmount.toLocaleString()}`}</p>
                                    ) : (
                                        <Skeleton className="h-6 w-24" />
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-foreground uppercase">Company</p>
                                <div className="mt-1">
                                    {data.company ? (
                                        <p className="text-sm font-medium text-muted-foreground">{data.company}</p>
                                    ) : (
                                        <Skeleton className="h-4 w-32" />
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-foreground uppercase mb-1">Status</p>
                                <Badge className={`${data.status?.toLowerCase() === "accepted" || data.status?.toLowerCase() === "clean"
                                    ? "bg-emerald-600 text-white"
                                    : data.status?.toLowerCase() === "rejected"
                                        ? "bg-red-600 text-white"
                                        : data.status?.toLowerCase() === "flagged"
                                            ? "bg-yellow-600 text-white"
                                            : "bg-muted text-muted-foreground border border-border"
                                    } rounded-md px-3 py-0.5 capitalize text-xs font-bold`}>
                                    {data.status === "clean" ? "Verified" :
                                        data.status === "flagged" ? "For Audit Verification" :
                                            data.status}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Card 2: AI Fraud Analysis — skeleton when pending */}
                <Card className="border border-border shadow-sm rounded-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg font-bold">
                            <Brain className="h-5 w-5" />
                            AI Fraud Analysis
                        </CardTitle>
                        <CardDescription>Automated anomaly detection results</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {aiPending ? (
                            /* State 1: AI still running — skeleton */
                            <div className="space-y-4 animate-pulse">
                                <div className="flex justify-between items-center bg-muted/40 p-3 rounded-lg border border-border">
                                    <span className="font-bold text-sm">AI Verdict</span>
                                    <Badge className="bg-muted text-muted-foreground border border-border flex items-center gap-1 text-xs font-bold px-4">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Processing…
                                    </Badge>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-sm">Risk Score</span>
                                        <div className="h-4 w-10 bg-muted rounded" />
                                    </div>
                                    <div className="h-3 w-full bg-muted rounded-full border border-border" />
                                </div>
                                <div className="bg-muted/40 p-3 rounded-lg border border-border space-y-2">
                                    <div className="h-3 w-24 bg-muted rounded" />
                                    <div className="h-3 w-full bg-muted rounded" />
                                    <div className="h-3 w-3/4 bg-muted rounded" />
                                </div>
                            </div>
                        ) : (
                            /* State 3: AI complete */
                            <>
                                <div className="flex justify-between items-center bg-muted/40 p-3 rounded-lg border border-border">
                                    <span className="font-bold text-sm">AI Verdict</span>
                                    <Badge className={`${verdictColor} rounded-md px-4 capitalize text-xs font-bold`}>
                                        {displayVerdict}
                                    </Badge>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-sm">Risk Score</span>
                                        <span className="font-bold text-sm">{riskScore.toFixed(2)}%</span>
                                    </div>
                                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden border border-border">
                                        <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${Math.min(riskScore, 100)}%` }} />
                                    </div>
                                </div>
                                {data.aiAnalysis?.summary && (
                                    <div className="bg-muted/40 p-3 rounded-lg border border-border">
                                        <p className="text-xs font-bold text-foreground uppercase mb-1">AI Summary</p>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            {data.aiAnalysis.summary.includes('•') ? (
                                                <ul className="list-none space-y-1">
                                                    {data.aiAnalysis.summary.split('•').map((part, i) => (
                                                        <li key={i} className={i > 0 ? "pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-primary/60 font-medium" : "mb-2 font-medium"}>
                                                            {part.trim()}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p>{data.aiAnalysis.summary}</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
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
                                    <div className="bg-muted p-2 rounded border border-border text-xs text-muted-foreground break-all">
                                        {data.blockchain.txHash}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-muted-foreground mb-1 uppercase">Anchored At</p>
                                    <p className="font-bold text-sm">{new Date(data.blockchain.anchoredAt).toLocaleString()}</p>
                                </div>
                                <Badge className="bg-emerald-600 text-white px-3 rounded-md text-xs font-bold flex items-center gap-1 w-fit">
                                    <ShieldCheck className="h-3 w-3" /> Verified on Blockchain
                                </Badge>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <ShieldAlert className="h-4 w-4 text-yellow-500" />
                                Pending blockchain verification.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Card 4: Submit Review (Auditor only) OR Invoice Image (others) */}
                {isAuditor ? (
                    <Card className="border border-border shadow-sm rounded-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                <ClipboardCheck className="h-5 w-5" />
                                {isUpdate ? "Update Review" : "Submit Review"}
                            </CardTitle>
                            <CardDescription>
                                {aiPending
                                    ? "AI analysis must complete before you can review"
                                    : isUpdate
                                        ? "You have already reviewed this invoice. You can update your decision below."
                                        : "Finalize your decision and make notes"
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <Label className="text-sm font-bold">Decision</Label>
                                <RadioGroup
                                    value={reviewDecision}
                                    onValueChange={(v) => setReviewDecision(v as ReviewDecision)}
                                    disabled={aiPending || !reviewEnabled}
                                    className="review-radio space-y-2"
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="approved" id="r-approved" className="border-foreground text-foreground" />
                                        <Label htmlFor="r-approved" className="text-sm font-semibold text-emerald-600 cursor-pointer">
                                            Approved — Invoice is legitimate and verified
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="rejected" id="r-rejected" className="border-foreground text-foreground" />
                                        <Label htmlFor="r-rejected" className="text-sm font-semibold text-red-600 cursor-pointer">
                                            Rejected — Invoice is fraudulent or invalid
                                        </Label>
                                    </div>
                                </RadioGroup>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-bold">Notes</Label>
                                <Textarea
                                    placeholder="Add your review notes... (required, 1–1000 characters)"
                                    className="min-h-[80px] resize-none"
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    disabled={aiPending || !reviewEnabled}
                                    maxLength={1000}
                                />
                                <p className="text-xs text-muted-foreground text-right">{reviewNotes.length}/1000</p>
                            </div>

                            {aiPending ? (
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 border border-border">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground font-medium">Waiting for AI analysis to complete…</span>
                                </div>
                            ) : (
                                <Button
                                    onClick={handleSubmitReview}
                                    disabled={isSubmitting || !reviewNotes.trim()}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</>
                                    ) : isUpdate ? "Update Review" : "Submit Review"}
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : (
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
                            <Button
                                onClick={() => setImageOpen(true)}
                                disabled={!imageUrl}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6"
                            >
                                View Image
                            </Button>
                            {!imageUrl && <p className="text-xs text-muted-foreground">Not anchored yet — no file available</p>}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* ── Row 3: Invoice Image (Auditor full-width) OR Review History (others) ── */}
            {isAuditor ? (
                /* Auditor: Invoice Image — same button/lightbox as other roles */
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
                        <Button
                            onClick={() => setImageOpen(true)}
                            disabled={!imageUrl}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6"
                        >
                            View Image
                        </Button>
                        {!imageUrl && <p className="text-xs text-muted-foreground">Not anchored yet — no file available</p>}
                    </CardContent>
                </Card>
            ) : (
                /* Non-auditor: Review History */
                <Card className="border border-border shadow-sm rounded-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg font-bold">
                            <ClipboardCheck className="h-5 w-5" />
                            Review Decision
                        </CardTitle>
                        <CardDescription>Auditor decisions and notes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {hasReview ? (
                            <div className="p-4 border border-border rounded-xl space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm">{data.review!.reviewer || "Auditor"}</span>
                                    <Badge className={`${data.review!.decision === "rejected" ? "bg-red-600" : "bg-emerald-600"} text-white text-[10px] capitalize rounded-md px-3 font-bold`}>
                                        {data.review!.decision === "approved" ? "Approved" : "Rejected"}
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
            )}
        </div>
    )
}