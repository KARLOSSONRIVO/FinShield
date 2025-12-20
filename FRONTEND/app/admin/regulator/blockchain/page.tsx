import { AdminSidebar } from "@/components/admin-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { mockInvoices } from "@/lib/mock-data"
import { Link2, CheckCircle } from "lucide-react"

export default function RegulatorBlockchainPage() {
  const verifiedInvoices = mockInvoices.filter((i) => i.blockchain_txHash)

  return (
    <div className="flex h-screen">
      <AdminSidebar role="REGULATOR" />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Link2 className="h-6 w-6 text-primary" />
              Blockchain Ledger
            </h1>
            <p className="text-muted-foreground">Tamper-proof verification records</p>
            <Badge variant="outline" className="mt-2">
              Read-Only Access
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Verified Transactions</CardTitle>
              <CardDescription>
                {verifiedInvoices.length} invoices anchored on blockchain across all companies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Amount</TableHead>
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
                      <TableCell>${invoice.totals_total.toLocaleString()}</TableCell>
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
