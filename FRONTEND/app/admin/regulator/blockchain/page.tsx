"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { RegulatorBlockchainTable } from "@/features/regulator/blockchain/components/RegulatorBlockchainTable"
import { useRegulatorBlockchain } from "@/features/regulator/blockchain/hooks/useRegulatorBlockchain"
import { Pagination } from "@/components/ui/pagination-custom"

export default function RegulatorBlockchainPage() {
  const {
    search,
    setSearch,
    invoices,
    currentPage,
    totalPages,
    setCurrentPage
  } = useRegulatorBlockchain()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-normal tracking-tight">Ledger Oversight</h2>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Blockchains..."
            className="pl-9 bg-background border-2 border-black/10 focus-visible:ring-0 focus-visible:border-black/20 text-base w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <RegulatorBlockchainTable invoices={invoices} />

      <div className="mt-4 flex justify-center">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  )
}
