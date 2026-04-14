import { CompanySidebar } from "@/components/company-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { mockInvoices } from "@/lib/mock-data"
import { FileBarChart, Download, TrendingUp, TrendingDown, DollarSign, PieChart } from "lucide-react"

export default function ManagerReportsPage() {
  const companyInvoices = mockInvoices.filter((i) => i.companyOrgId === "org-company-1")
  const totalValue = companyInvoices.reduce((sum, inv) => sum + inv.totals_total, 0)
  const verifiedValue = companyInvoices
    .filter((i) => i.status === "verified")
    .reduce((sum, inv) => sum + inv.totals_total, 0)
  const flaggedValue = companyInvoices
    .filter((i) => i.status === "flagged" || i.ai_verdict === "flagged")
    .reduce((sum, inv) => sum + inv.totals_total, 0)
  const fraudulentValue = companyInvoices
    .filter((i) => i.status === "fraudulent")
    .reduce((sum, inv) => sum + inv.totals_total, 0)

  const statusCounts = {
    verified: companyInvoices.filter((i) => i.status === "verified").length,
    pending: companyInvoices.filter((i) => i.status === "pending").length,
    flagged: companyInvoices.filter((i) => i.status === "flagged").length,
    fraudulent: companyInvoices.filter((i) => i.status === "fraudulent").length,
  }

  return (
    <div className="flex h-screen">
      <CompanySidebar role="COMPANY_MANAGER" />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileBarChart className="h-6 w-6 text-primary" />
                Company Reports
              </h1>
              <p className="text-muted-foreground">Financial overview and analytics</p>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>

          {/* Financial Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Invoice Value</p>
                    <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Verified Value</p>
                    <p className="text-2xl font-bold text-primary">${verifiedValue.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Flagged Value</p>
                    <p className="text-2xl font-bold text-warning">${flaggedValue.toLocaleString()}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-warning" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Fraud Loss</p>
                    <p className="text-2xl font-bold text-destructive">${fraudulentValue.toLocaleString()}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Invoice Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Invoice Status Breakdown
                </CardTitle>
                <CardDescription>Distribution of invoice statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary" />
                      <span>Verified</span>
                    </div>
                    <span className="font-medium">{statusCounts.verified}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${(statusCounts.verified / companyInvoices.length) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                      <span>Pending</span>
                    </div>
                    <span className="font-medium">{statusCounts.pending}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-muted-foreground h-2 rounded-full"
                      style={{ width: `${(statusCounts.pending / companyInvoices.length) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-warning" />
                      <span>Flagged</span>
                    </div>
                    <span className="font-medium">{statusCounts.flagged}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-warning h-2 rounded-full"
                      style={{ width: `${(statusCounts.flagged / companyInvoices.length) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-destructive" />
                      <span>Fraudulent</span>
                    </div>
                    <span className="font-medium">{statusCounts.fraudulent}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-destructive h-2 rounded-full"
                      style={{ width: `${(statusCounts.fraudulent / companyInvoices.length) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>AI Risk Analysis</CardTitle>
                <CardDescription>Average risk scores and fraud detection metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Average Risk Score</span>
                      <span className="font-medium">
                        {(
                          (companyInvoices.reduce((sum, inv) => sum + inv.ai_riskScore, 0) / companyInvoices.length) *
                          100
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-primary to-warning h-3 rounded-full"
                        style={{
                          width: `${
                            (companyInvoices.reduce((sum, inv) => sum + inv.ai_riskScore, 0) / companyInvoices.length) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-secondary/50 rounded-lg text-center">
                      <p className="text-3xl font-bold text-primary">
                        {companyInvoices.filter((i) => i.ai_verdict === "clean").length}
                      </p>
                      <p className="text-sm text-muted-foreground">Clean by AI</p>
                    </div>
                    <div className="p-4 bg-secondary/50 rounded-lg text-center">
                      <p className="text-3xl font-bold text-warning">
                        {companyInvoices.filter((i) => i.ai_verdict === "flagged").length}
                      </p>
                      <p className="text-sm text-muted-foreground">Flagged by AI</p>
                    </div>
                  </div>

                  <div className="p-4 bg-primary/10 rounded-lg">
                    <p className="text-sm font-medium mb-1">Fraud Detection Rate</p>
                    <p className="text-2xl font-bold text-primary">
                      {companyInvoices.length > 0
                        ? ((statusCounts.fraudulent / companyInvoices.length) * 100).toFixed(1)
                        : 0}
                      %
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {statusCounts.fraudulent} fraudulent out of {companyInvoices.length} invoices
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
