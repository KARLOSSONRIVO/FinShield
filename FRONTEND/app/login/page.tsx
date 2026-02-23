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
import { sanitizeInput } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useEffect } from "react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const { showPassword, toggle, inputType } = usePasswordVisibility()
  const [mfaRequired, setMfaRequired] = useState(false)
  const [tempToken, setTempToken] = useState("")
  const [otp, setOtp] = useState("")
  const { login, verifyMfaLogin, isLoading, user } = useAuth()
  const { setTheme } = useTheme()

  // Force light mode on login page
  useEffect(() => {
    setTheme('light')
  }, [setTheme])

  // If already authenticated (e.g. valid session token), redirect to dashboard
  useEffect(() => {
    if (!isLoading && user) {
      const roleRoutes: Record<string, string> = {
        SUPER_ADMIN: "/admin/super-admin",
        AUDITOR: "/admin/auditor",
        REGULATOR: "/admin/regulator",
        COMPANY_MANAGER: "/company/manager",
        COMPANY_USER: "/company/employee",
      }
      router.replace(roleRoutes[user.role ?? ""] || "/")
    }
  }, [isLoading, user, router])

  const [isPending, setIsPending] = useState(false)
  const [loginError, setLoginError] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    setLoginError(false)
    try {
      const response = await login({ email: sanitizeInput(email), password })
      if (response?.mfaRequired) {
        setMfaRequired(true)
        setTempToken(response.tempToken)
        toast.info("Please enter the code from your authenticator app")
      } else {
        toast.success("Login successful")
      }
    } catch (error: any) {
      console.error("Login failed", error)
      const message = error.response?.data?.message || error.message || "Invalid credentials"
      toast.error(`Login failed: ${message}`)
      setLoginError(true)
    } finally {
      setIsPending(false)
    }
  }

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPending(true)
    try {
      await verifyMfaLogin(tempToken, otp)
      toast.success("Login successful")
    } catch (error: any) {
      console.error("MFA verification failed", error)
      const message = error.response?.data?.message || error.message || "Invalid code"
      toast.error(`Verification failed: ${message}`)
    } finally {
      setIsPending(false)
    }
  }

  if (mfaRequired) {
    return (
      <div className="h-screen w-full flex overflow-hidden">
        <div className="w-full lg:w-1/2 h-full overflow-y-auto flex flex-col justify-center items-center px-8 md:px-16 lg:px-24 xl:px-32 py-8 bg-[#f5f5f0]">
          <div className="w-full max-w-md my-auto">
            <div className="mb-8 flex justify-center">
              <Link href="/">
                <Image
                  src="/assets/image/FinShield.svg"
                  alt="FinShield Logo"
                  width={160}
                  height={160}
                  className="h-28 w-auto md:h-32"
                />
              </Link>
            </div>

            <div className="mb-8 text-center">
              <h1 className="text-3xl md:text-4xl text-gray-800 mb-3">
                Two-Factor <span className="font-bold">Authentication</span>
              </h1>
              <p className="text-gray-500 text-base">
                Please enter the 6-digit code from your authenticator app.
              </p>
            </div>

            <form onSubmit={handleVerifyMfa} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-gray-700 text-sm font-medium">
                  Authentication Code
                </Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="!bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 h-14 rounded-xl focus:border-emerald-500 focus:ring-emerald-500 shadow-sm text-center text-2xl tracking-widest"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                disabled={isPending || isLoading || otp.length !== 6}
                isLoading={isPending || isLoading}
                loadingText="Verifying..."
                className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all duration-200 text-base tracking-wide shadow-lg shadow-emerald-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Verify
              </Button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setMfaRequired(false)
                    setOtp("")
                    setTempToken("")
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </form>
          </div>
        </div>
        <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a0a0a] flex-col justify-center p-10 xl:p-16 h-full overflow-hidden">
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 shrink-0">
              <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Secure Access</h2>
            <p className="text-gray-400 max-w-md">Your account is protected with two-factor authentication. This extra layer of security ensures only you can access your data.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full flex overflow-hidden">
      {/* Left Side - Login Form */}
      <div className="w-full lg:w-1/2 h-full overflow-y-auto flex flex-col justify-center items-center px-8 md:px-16 lg:px-24 xl:px-32 py-8 bg-[#f5f5f0]">
        <div className="w-full max-w-md my-auto flex flex-col justify-center min-h-max">
          {/* Logo */}
          <div className="mb-8 flex justify-center shrink-0">
            <Link href="/">
              <Image
                src="/assets/image/FinShield.svg"
                alt="FinShield Logo"
                width={160}
                height={160}
                className="h-28 w-auto md:h-32"
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
            {/* Error Display */}
            {/* The toast handles main errors, but we can also show a localized alert if needed */}

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
                onChange={(e) => { setEmail(e.target.value); setLoginError(false) }}
                required
                maxLength={100}
                title="Please enter a valid email address"
                className={`!bg-white text-gray-900 placeholder:text-gray-400 h-14 rounded-xl shadow-sm text-base transition-all focus:ring-emerald-500 ${loginError
                  ? "border-2 border-red-500 focus:border-red-500 animate-shake"
                  : "border-gray-300 focus:border-emerald-500"
                  }`}
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
                  onChange={(e) => { setPassword(e.target.value); setLoginError(false) }}
                  required
                  minLength={8}
                  maxLength={64}
                  className={`!bg-white text-gray-900 placeholder:text-gray-400 h-14 rounded-xl shadow-sm pr-12 text-base transition-all focus:ring-emerald-500 ${loginError
                    ? "border-2 border-red-500 focus:border-red-500 animate-shake"
                    : "border-gray-300 focus:border-emerald-500"
                    }`}
                />
                <button
                  type="button"
                  onClick={toggle}
                  suppressHydrationWarning
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
              isLoading={isPending || isLoading}
              loadingText="Logging in..."
              className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-all duration-200 text-base tracking-wide shadow-lg shadow-emerald-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Login
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
