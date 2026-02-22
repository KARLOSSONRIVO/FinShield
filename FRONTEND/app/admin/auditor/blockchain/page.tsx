"use client"

import { BlockchainTable } from "@/components/blockchain/BlockchainTable"
import { useBlockchain as useAuditorBlockchain } from "@/hooks/blockchain/use-blockchain"
import { DataPagination } from "@/components/common/DataPagination"
import { SearchInput } from "@/components/common/SearchInput"

export default function AuditorBlockchainPage() {
  const {
    search,
    setSearch,
    invoices,
    pagination,
    setPage,
  } = useAuditorBlockchain()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-normal tracking-tight">Blockchain Ledger</h2>
      </div>

      <div className="flex gap-4">
        <SearchInput
          value={search || ""}
          onChange={setSearch}
          placeholder="Search Blockchains..."
        />
      </div>

      <BlockchainTable invoices={invoices} />

      <div className="mt-4 flex justify-center">
        <DataPagination
          pagination={pagination}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
