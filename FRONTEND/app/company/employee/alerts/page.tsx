import { AlertTriangle, Clock, Info, XCircle } from "lucide-react"
import { mockInvoices } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/layout/card'
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AIVerdictBadge } from "@/components/common/StatusBadge"
import { cn } from "@/lib/utils"

export default function EmployeeFlaggedQueuePage() {
    const myInvoices = mockInvoices.filter((i) => i.uploadedByUserId === "user-employee-1")

    
    const fraudulentInvoices = myInvoices.filter((i) => i.status === "fraudulent")
    const flaggedInvoices = myInvoices.filter((i) => i.status === "flagged" || i.ai_verdict === "flagged")

    
    const reviewHistory = [
        {
            id: 1,
            auditor: "Auditor 1",
            note: "We are investigating your account in concerns with invoice number: INV-2024-001. Please do not resist.",
            date: "12/2/2024, 8:00:00 AM"
        },
        {
            id: 2,
            auditor: "Auditor 2",
            note: "Invoice #004 verified after manual review. Moving to cleared status.",
            date: "12/3/2024, 9:30:00 AM"
        },
    ]

    return (
        <div className="p-6 space-y-8">
            {}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Flagged Invoices</h1>
            </div>

            {}
            <div className="space-y-4">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {}
                    <div className="rounded-xl border shadow-sm bg-white overflow-hidden flex flex-col">
                        <div className="bg-red-600 p-4 border-b border-red-700">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-white">
                                <XCircle className="h-5 w-5 text-white" />
                                AI Fraudulent Invoices
                            </h3>
                            <p className="text-red-100 text-sm mt-1">Invoices considered fraud by AI</p>
                        </div>
                        <div className="p-4 space-y-3 flex-1 bg-white">
                            {fraudulentInvoices.length > 0 ? (
                                fraudulentInvoices.map((invoice) => (
                                    <div key={invoice._id} className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm flex items-center justify-between group hover:border-gray-200 transition-colors">
                                        <div className="space-y-1">
                                            <span className="text-xs font-bold text-red-600 uppercase tracking-wide">Fraudulent</span>
                                            <h4 className="font-bold text-sm text-gray-900">{invoice.invoiceNo}</h4>
                                        </div>
                                        <div>
                                            <Link href={`/company/employee/invoices/${invoice._id}`}>
                                                <Button size="sm" variant="outline" className="h-8 border-gray-200 text-gray-700 hover:bg-gray-50">
                                                    View
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground text-sm">No confirmed fraud cases.</div>
                            )}
                        </div>
                    </div>

                    {}
                    <div className="rounded-xl border shadow-sm bg-white overflow-hidden flex flex-col">
                        <div className="bg-amber-500 p-4 border-b border-amber-600">
                            <h3 className="font-bold text-lg flex items-center gap-2 text-white">
                                <AlertTriangle className="h-5 w-5 text-white" />
                                AI Flagged Invoices
                            </h3>
                            <p className="text-amber-50 text-sm mt-1">Invoices flagged by AI for review</p>
                        </div>
                        <div className="p-4 space-y-3 flex-1 bg-white">
                            {flaggedInvoices.length > 0 ? (
                                flaggedInvoices.map((invoice) => (
                                    <div key={invoice._id} className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm flex items-center justify-between group hover:border-gray-200 transition-colors">
                                        <div className="space-y-1">
                                            <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">Flagged</span>
                                            <h4 className="font-bold text-sm text-gray-900">{invoice.invoiceNo}</h4>
                                        </div>
                                        <Link href={`/company/employee/invoices/${invoice._id}`}>
                                            <Button size="sm" className="h-8 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs">
                                                View
                                            </Button>
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-muted-foreground text-sm">No active flags.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-lg font-bold">Review History</h2>
                </div>
                <p className="text-sm text-muted-foreground -mt-3 mb-2">Auditor decisions and notes</p>

                <Card className="bg-white border shadow-sm">
                    <CardContent className="p-0">
                        {reviewHistory.map((item, index) => (
                            <div key={item.id} className={cn("p-6", index !== reviewHistory.length - 1 && "border-b")}>
                                <div className="flex flex-col gap-2">
                                    <h3 className="font-bold text-sm text-black">{item.auditor}</h3>
                                    <p className="text-sm font-medium leading-relaxed text-black/90">
                                        {item.note}
                                    </p>
                                    <p className="text-xs text-muted-foreground font-medium pt-1">
                                        {item.date}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

