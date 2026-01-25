"use client"

import { Input } from "@/components/ui/input"
import { Search, Filter, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BlockchainTable } from "@/features/super-admin/blockchain/components/BlockchainTable"
import { useBlockchain } from "@/features/super-admin/blockchain/hooks/useBlockchain"
import { Pagination } from "@/components/ui/pagination-custom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function BlockchainLedgerPage() {
  const {
    search,
    setSearch,
    invoices,
    currentPage,
    totalPages,
    setCurrentPage
  } = useBlockchain()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-normal tracking-tight">Blockchain Ledger</h2>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-normal tracking-tight">Blockchain Transactions</h3>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold">
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Blockchains..."
              className="pl-9 bg-background border-2 border-black/10 focus-visible:ring-0 focus-visible:border-black/20 text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 border-2 border-black/10 text-base px-6">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>All Transactions</DropdownMenuItem>
              <DropdownMenuItem>Verified Only</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="mt-4">
        <BlockchainTable invoices={invoices} />
      </div>

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
