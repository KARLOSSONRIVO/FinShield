import { AdminSidebar } from "@/components/admin-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { mockInvoices, mockAssignments } from "@/lib/mock-data"
import { InvoiceStatusBadge, AIVerdictBadge } from "@/components/status-badge"
import { AlertTriangle, Eye } from "lucide-react"
import Link from "next/link"

export default function AuditorFlaggedPage() {
  const assignedCompanyIds = mockAssignments
    .filter((a) => a.auditorUserId === "user-auditor-1" && a.status === "active")
    .map((a) => a.companyOrgId)

  const flaggedInvoices = mockInvoices.filter(
    (i) => assignedCompanyIds.includes(i.companyOrgId) && (i.status === "flagged" || i.ai_verdict === "flagged"),
  )

  return (
    <div className="flex h-screen">
      <AdminSidebar role="AUDITOR" />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-warning" />
              Flagged Queue
            </h1>
            <p className="text-muted-foreground">High-risk invoices from your assigned companies</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Flagged Invoices</CardTitle>
              <CardDescription>{flaggedInvoices.length} invoices require your attention</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>AI Analysis</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flaggedInvoices.map((invoice) => (
                    <TableRow key={invoice._id}>
                      <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                      <TableCell>{invoice.companyName}</TableCell>
                      <TableCell>${invoice.totals_total.toLocaleString()}</TableCell>
                      <TableCell>
                        <AIVerdictBadge verdict={invoice.ai_verdict} score={invoice.ai_riskScore} />
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusBadge status={invoice.status} />
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/auditor/invoices/${invoice._id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Review
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
