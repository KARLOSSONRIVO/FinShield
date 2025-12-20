import Link from "next/link"
import { CompanySidebar } from "@/components/company-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { mockInvoices } from "@/lib/mock-data"
import { FileText, Search, Eye, Upload } from "lucide-react"
import { InvoiceStatusBadge, AIVerdictBadge } from "@/components/status-badge"

export default function EmployeeInvoicesPage() {
  // Filter invoices for this specific employee
  const myInvoices = mockInvoices.filter((i) => i.uploadedByUserId === "user-employee-1")

  return (
    <div className="flex h-screen">
      <CompanySidebar role="COMPANY_USER" />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                My Invoices
              </h1>
              <p className="text-muted-foreground">View and track your submitted invoices</p>
            </div>
            <Link href="/company/employee/upload">
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload New
              </Button>
            </Link>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Invoice List</CardTitle>
              <CardDescription>All invoices you have submitted</CardDescription>
              <div className="flex items-center gap-2 mt-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search invoices..." className="pl-9" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>AI Verdict</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Blockchain</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myInvoices.map((invoice) => (
                    <TableRow key={invoice._id}>
                      <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                      <TableCell>{new Date(invoice.invoiceDate).toLocaleDateString()}</TableCell>
                      <TableCell>${invoice.totals_total.toLocaleString()}</TableCell>
                      <TableCell>
                        <AIVerdictBadge verdict={invoice.ai_verdict} score={invoice.ai_riskScore} />
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell>
                        {invoice.blockchain_txHash ? (
                          <span className="text-xs font-mono text-primary">
                            {invoice.blockchain_txHash.slice(0, 10)}...
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Pending</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/company/employee/invoices/${invoice._id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
