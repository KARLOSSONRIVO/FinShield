"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Image from "next/image"
import { Eye, EyeOff } from "lucide-react"
import { usePasswordVisibility } from "@/hooks"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { showPassword, toggle, inputType } = usePasswordVisibility()
  const { login, isLoading } = useAuth()

  // Local state for error handling since the hook throws
  const [isPending, setIsPending] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    try {
      await login({ email, password })
      toast.success("Login successful")
    } catch (error: any) {
      console.error("Login failed", error)
      const message = error.response?.data?.message || error.message || "Invalid credentials"
      // Using alert for fallback if sonner not available, but usually we prefer toast
      // alert("Login failed: " + message)
      toast.error(`Login failed: ${message}`)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center px-8 md:px-16 lg:px-24 xl:px-32 py-12 bg-[#f5f5f0]">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <Link href="/">
              <Image
                src="/assets/image/FinShield.svg"
                alt="FinShield Logo"
                width={160}
                height={160}
                className="h-32 w-auto"
              />
            </Link>
          </div>

          {/* Header */}
          <div className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl text-gray-800 mb-3">
              Hello, <span className="font-bold">Welcome Back!</span>
            </h1>
            <p className="text-gray-500 text-base">
              We&apos;re happy to see you again. Let&apos;s stay ahead of the game.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="!bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 h-14 rounded-xl focus:border-emerald-500 focus:ring-emerald-500 shadow-sm text-base"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={inputType}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="!bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 h-14 rounded-xl focus:border-emerald-500 focus:ring-emerald-500 shadow-sm pr-12 text-base"
                />
                <button
                  type="button"
                  onClick={toggle}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isPending || isLoading}
              className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all duration-200 text-base tracking-wide shadow-lg shadow-emerald-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isPending || isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </div>
      </div>

      {/* Right Side - Feature Showcase */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a0a0a] flex-col justify-center p-10 xl:p-16">
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Headline */}
          <h2 className="text-4xl xl:text-5xl 2xl:text-6xl font-bold text-white leading-tight mb-8">
            <span className="text-emerald-400">Secure</span> your invoices with{" "}
            <span className="text-emerald-400">AI-powered</span>
            <br />
            fraud detection
          </h2>

          {/* Subtitle */}
          <p className="text-gray-400 text-base xl:text-lg leading-relaxed mb-14 max-w-lg">
            FinShield combines{" "}
            <span className="text-emerald-400">advanced AI anomaly detection</span> with{" "}
            <span className="text-emerald-400">blockchain verification</span> to protect your
            organization from <span className="text-emerald-400">invoice fraud</span>.
          </p>

          {/* Feature List */}
          <div className="space-y-8">
            {/* Feature 1 */}
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">AI Fraud Detection</h3>
                <p className="text-gray-500 text-sm">Identify anomalies and duplicate invoices in real-time</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Blockchain Verification</h3>
                <p className="text-gray-500 text-sm">Tamper-proof invoice records with immutable blockchain ledger</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-5">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg mb-2">Real-time Alerts</h3>
                <p className="text-gray-500 text-sm">Instant notifications for suspicious transactions and anomalies</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-6">
          <p className="text-gray-600 text-xs tracking-widest uppercase font-medium">
            Trusted by finance companies around the globe
          </p>
        </div>
      </div>
    </div>
  )
}
