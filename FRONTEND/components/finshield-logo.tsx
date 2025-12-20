import { Shield } from "lucide-react"

export function FinShieldLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Shield className="h-8 w-8 text-primary" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-primary-foreground">AI</span>
        </div>
      </div>
      <span className="text-xl font-bold text-foreground">FinShield</span>
    </div>
  )
}
