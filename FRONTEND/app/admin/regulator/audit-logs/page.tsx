"use client"

import { RegulatorSidebar } from "@/features/regulator/navigation-bar/RegulatorSidebar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollText, Search } from "lucide-react"

import { RegulatorAuditLogTable } from "@/features/regulator/audit-logs/components/RegulatorAuditLogTable"
import { useRegulatorAuditLogs } from "@/features/regulator/audit-logs/hooks/useRegulatorAuditLogs"

export default function RegulatorAuditLogsPage() {
  const {
    search,
    setSearch,
    entityFilter,
    setEntityFilter,
    filteredLogs
  } = useRegulatorAuditLogs()

  return (
    <div className="flex h-screen">
      <RegulatorSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ScrollText className="h-6 w-6 text-primary" />
              Audit Logs
            </h1>
            <p className="text-muted-foreground">Complete system activity history</p>
            <Badge variant="outline" className="mt-2">
              Read-Only Access
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by entity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entities</SelectItem>
                    <SelectItem value="organization">Organization</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <RegulatorAuditLogTable logs={filteredLogs} />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
