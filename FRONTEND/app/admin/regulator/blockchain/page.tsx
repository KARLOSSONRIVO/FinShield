"use client"

import { RegulatorSidebar } from "@/features/regulator/navigation-bar/RegulatorSidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Link2 } from "lucide-react"

import { RegulatorBlockchainTable } from "@/features/regulator/blockchain/components/RegulatorBlockchainTable"
import { useRegulatorBlockchain } from "@/features/regulator/blockchain/hooks/useRegulatorBlockchain"

export default function RegulatorBlockchainPage() {
  const { verifiedInvoices } = useRegulatorBlockchain()

  return (
    <div className="flex h-screen">
      <RegulatorSidebar />
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
              <RegulatorBlockchainTable invoices={verifiedInvoices} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
