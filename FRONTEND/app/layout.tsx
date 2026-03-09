// app/layout.tsx
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "@/components/providers/ThemeProvider"
import { QueryProvider } from "@/components/providers/QueryProvider"
import { AuthProvider } from "@/components/providers/auth-provider"
import { Toaster } from "@/components/ui/sonner"
import { SocketProvider } from "@/providers/socket-provider"
import { GlobalSocketListeners } from "@/components/global/GlobalSocketListeners"
import { GlobalPasswordChange } from "@/components/global/GlobalPasswordChange"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "FinShield - AI Fraud Detection & Blockchain Invoice Verification",
  description:
    "AI-powered fraud detection and blockchain invoice verification system for enterprises, auditors, and regulators",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider>
              <SocketProvider>
                <GlobalSocketListeners />
                <GlobalPasswordChange />
                {children}
              </SocketProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
        <Analytics />
        <Toaster
          position="bottom-right"
          duration={30000}
          closeButton
          visibleToasts={1}
        />
      </body>
    </html>
  )
}