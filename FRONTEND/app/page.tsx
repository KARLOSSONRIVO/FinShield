import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FinShieldLogo } from "@/components/common/FinShieldLogo"
import { Shield, Users, FileSearch, Building2, UserCog } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <FinShieldLogo />
          <Link href="/login">
            <Button>Login</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 text-balance">AI Fraud Detection & Blockchain Invoice Verification</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
            Protect your organization with AI-powered anomaly detection and tamper-proof blockchain verification for all
            financial transactions.
          </p>
        </div>

        {/* Role Selection */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-6 text-center">Select Your Portal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Super Admin */}
            <Link href="/admin/super-admin">
              <Card className="h-full hover:border-primary transition-colors cursor-pointer group">
                <CardHeader>
                  <Shield className="h-10 w-10 text-primary mb-2 group-hover:scale-110 transition-transform" />
                  <CardTitle>Super Admin</CardTitle>
                  <CardDescription>Full platform control, user management, and system oversight</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Manage organizations</li>
                    <li>• Create & disable accounts</li>
                    <li>• Assign auditors</li>
                    <li>• View all data</li>
                  </ul>
                </CardContent>
              </Card>
            </Link>

            {/* Auditor */}
            <Link href="/admin/auditor">
              <Card className="h-full hover:border-primary transition-colors cursor-pointer group">
                <CardHeader>
                  <FileSearch className="h-10 w-10 text-primary mb-2 group-hover:scale-110 transition-transform" />
                  <CardTitle>Auditor</CardTitle>
                  <CardDescription>Review invoices for assigned companies</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Review assigned invoices</li>
                    <li>• Submit decisions</li>
                    <li>• View blockchain proofs</li>
                    <li>• Track flagged items</li>
                  </ul>
                </CardContent>
              </Card>
            </Link>

            {/* Regulator */}
            <Link href="/admin/regulator">
              <Card className="h-full hover:border-primary transition-colors cursor-pointer group">
                <CardHeader>
                  <Users className="h-10 w-10 text-primary mb-2 group-hover:scale-110 transition-transform" />
                  <CardTitle>Regulator</CardTitle>
                  <CardDescription>Read-only compliance oversight</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• View all invoices</li>
                    <li>• Access blockchain ledger</li>
                    <li>• Review audit logs</li>
                    <li>• Compliance monitoring</li>
                  </ul>
                </CardContent>
              </Card>
            </Link>

            {/* Company Manager */}
            <Link href="/company/manager">
              <Card className="h-full hover:border-primary transition-colors cursor-pointer group">
                <CardHeader>
                  <Building2 className="h-10 w-10 text-primary mb-2 group-hover:scale-110 transition-transform" />
                  <CardTitle>Company Manager</CardTitle>
                  <CardDescription>Manage company operations and employees</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Upload invoices</li>
                    <li>• Manage employees</li>
                    <li>• View AI analysis</li>
                    <li>• Generate reports</li>
                  </ul>
                </CardContent>
              </Card>
            </Link>

            {/* Company Employee */}
            <Link href="/company/employee">
              <Card className="h-full hover:border-primary transition-colors cursor-pointer group">
                <CardHeader>
                  <UserCog className="h-10 w-10 text-primary mb-2 group-hover:scale-110 transition-transform" />
                  <CardTitle>Company Employee</CardTitle>
                  <CardDescription>Day-to-day invoice operations</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Upload invoices</li>
                    <li>• Track submissions</li>
                    <li>• View AI results</li>
                    <li>• Receive alerts</li>
                  </ul>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>FinShield © 2025 - AI Fraud Detection and Blockchain Invoice Verification System</p>
          <p className="mt-1">Supporting SDG 8 & SDG 16</p>
        </div>
      </footer>
    </div>
  )
}
