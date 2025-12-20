import { AdminSidebar } from "@/components/admin-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { mockInvoices, mockAssignments } from "@/lib/mock-data"
import { Link2, CheckCircle } from "lucide-react"

export default function AuditorBlockchainPage() {
  const assignedCompanyIds = mockAssignments
    .filter((a) => a.auditorUserId === "user-auditor-1" && a.status === "active")
    .map((a) => a.companyOrgId)

  const verifiedInvoices = mockInvoices.filter(
    (i) => assignedCompanyIds.includes(i.companyOrgId) && i.blockchain_txHash,
  )

  return (
    <div className="flex h-screen">
      <AdminSidebar role="AUDITOR" />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Link2 className="h-6 w-6 text-primary" />
              Blockchain Ledger
            </h1>
            <p className="text-muted-foreground">Verified records from assigned companies</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Blockchain Verified Invoices</CardTitle>
              <CardDescription>{verifiedInvoices.length} invoices anchored on blockchain</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Transaction Hash</TableHead>
                    <TableHead>Anchored At</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {verifiedInvoices.map((invoice) => (
                    <TableRow key={invoice._id}>
                      <TableCell className="font-medium">{invoice.invoiceNo}</TableCell>
                      <TableCell>{invoice.companyName}</TableCell>
                      <TableCell className="font-mono text-xs max-w-xs truncate">{invoice.blockchain_txHash}</TableCell>
                      <TableCell>
                        {invoice.blockchain_anchoredAt ? new Date(invoice.blockchain_anchoredAt).toLocaleString() : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-primary text-primary-foreground">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
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
