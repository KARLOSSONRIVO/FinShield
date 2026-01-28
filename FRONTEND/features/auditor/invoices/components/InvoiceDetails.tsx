"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { FileText, Blocks, History, ShieldAlert, CheckCircle2, MoreHorizontal, ShieldCheck } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// AIVerdictBadge is no longer used, InvoiceStatusBadge is replaced by simple Badge
// import { InvoiceStatusBadge, AIVerdictBadge } from "@/components/status-badge"

export function InvoiceDetails({ invoice }: { invoice: any }) {
    // Normalize mock data
    const verdict = invoice.ai_verdict.toLowerCase();

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Card 1: Invoice Details */}
            <Card className="border-2 border-border shadow-sm rounded-xl h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                        <FileText className="h-5 w-5" />
                        Invoice Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                    <div className="grid grid-cols-2 gap-y-6">
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase">Invoice Number</p>
                            <p className="text-sm font-bold mt-1 text-foreground">{invoice.invoiceNo}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase">Invoice Date</p>
                            <p className="text-sm font-bold mt-1 text-foreground">{invoice.date}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase">Total Amount</p>
                            <p className="text-xl font-extrabold text-foreground mt-1">${invoice.totals_total.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase">Uploaded By</p>
                            <p className="text-sm font-bold mt-1 text-foreground">John Doe</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase">Created At</p>
                            <p className="text-sm font-medium mt-1 text-foreground">21/1/2024, 8:00:00 AM</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase">Last Updated</p>
                            <p className="text-sm font-medium mt-1 text-foreground">12/2/2024, 8:00:00 AM</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Card 2: AI Fraud Analysis */}
            <Card className="border-2 border-border shadow-sm rounded-xl h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                        <ShieldAlert className="h-5 w-5" />
                        AI Fraud Analysis
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-medium">Automated anomalous detection results</p>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                    <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg border border-border">
                        <span className="font-bold text-sm">AI Verdict</span>
                        <VerdictBadge verdict={verdict} />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold text-sm">Risk Score</span>
                            <span className="font-bold text-sm">{invoice.ai_riskScore}%</span>
                        </div>
                        <div className="h-4 w-full bg-secondary rounded-full overflow-hidden border border-border relative">
                            <div
                                className={`h-full ${getRiskColor(invoice.ai_riskScore)} transition-all duration-500`}
                                style={{ width: `${invoice.ai_riskScore}%` }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Card 3: Blockchain Verification */}
            <Card className="border-2 border-border shadow-sm rounded-xl h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                        <Blocks className="h-5 w-5" />
                        Blockchain Verification
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-medium">Tamper-proof ledger record</p>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <div>
                        <p className="text-xs font-bold text-muted-foreground mb-1">Transaction Hash</p>
                        <div className="bg-muted p-2 rounded border border-border text-xs font-mono text-muted-foreground truncate">
                            {(verdict === 'flagged' || verdict === 'fraudulent' || verdict === 'fraud')
                                ? "None"
                                : "0x1234567890abcdef1234567890abcdef12345678"
                            }
                        </div>
                    </div>
                    <div className="pt-2">
                        <p className="text-xs font-bold text-muted-foreground mb-1">Anchored At</p>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="font-bold text-sm">
                                {(verdict === 'flagged' || verdict === 'fraudulent' || verdict === 'fraud')
                                    ? "-/-/-, --:--:00 AM"
                                    : "12/2/2024, 10:30:00 AM"
                                }
                            </span>
                        </div>

                        {(verdict === 'flagged' || verdict === 'fraudulent' || verdict === 'fraud') ? (
                            <Badge className="bg-red-600 hover:bg-red-700 border-none text-white px-3 flex items-center gap-1 w-fit">
                                <ShieldAlert className="h-3 w-3" />
                                Unverified on Blockchain
                            </Badge>
                        ) : (
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 border-none text-white px-3 flex items-center gap-1 w-fit">
                                <ShieldCheck className="h-3 w-3" />
                                Verified on Blockchain
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Card 4: Submit Review (FORM) */}
            <Card className="border-2 border-border shadow-sm rounded-xl h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold">
                        <CheckCircle2 className="h-5 w-5" />
                        Submit Review
                    </CardTitle>
                    <p className="text-xs text-muted-foreground font-medium">Finalise your decision and make notes</p>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                    <div className="space-y-3">
                        <Label className="text-sm font-bold">Decision</Label>
                        <RadioGroup defaultValue="verified">
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="verified" id="r1" className="text-emerald-600 border-emerald-600" />
                                <Label htmlFor="r1" className="text-xs font-medium text-emerald-700">Verified - Invoice is legitimate and risk-free</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="fraudulent" id="r2" className="text-red-600 border-red-600" />
                                <Label htmlFor="r2" className="text-xs font-medium text-red-700">Fraudulent - Invoice is fraudulent and misleading</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="clarification" id="r3" className="text-black border-black" />
                                <Label htmlFor="r3" className="text-xs font-medium">Needs more information, contact company and request meeting</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-bold">Notes</Label>
                        <Textarea placeholder="Add your review notes..." className="min-h-[80px]" />
                    </div>

                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                        Submit Review
                    </Button>
                </CardContent>
            </Card>

            {/* Card 5: Previous Reviews (Full Width) */}
            <div className="col-span-1 md:col-span-2">
                <Card className="border-2 border-border shadow-sm rounded-xl">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg font-bold">
                            <History className="h-5 w-5" />
                            Previous Reviews
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4">
                        <div className="border border-border rounded-lg p-4 bg-card">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-sm">Auditor 1</span>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-muted">
                                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>Edit</DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600 focus:text-red-600">Remove</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <p className="text-xs font-medium text-black mb-3">
                                Confirmed to be normal.
                            </p>
                            <div className="flex items-center gap-3">
                                <Badge className="bg-emerald-600 hover:bg-emerald-700 border-none text-white px-3">Verified</Badge>
                                <span className="text-[10px] text-muted-foreground">10/12/2024 10:00 AM</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function VerdictBadge({ verdict }: { verdict: string }) {
    const v = verdict.toLowerCase()
    if (v === "clean") {
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 border-none text-white px-3">Clean</Badge>
    }
    if (v === "flagged") {
        return <Badge className="bg-amber-400 hover:bg-amber-500 border-none text-black px-3">Flagged</Badge>
    }
    if (v === "fraudulent") {
        return <Badge variant="destructive" className="px-3">Fraudulent</Badge>
    }
    return <Badge variant="outline">{verdict}</Badge>
}

function getRiskColor(score: number): string {
    if (score < 30) return 'bg-emerald-500'
    if (score < 80) return 'bg-amber-400'
    return 'bg-red-600'
}
