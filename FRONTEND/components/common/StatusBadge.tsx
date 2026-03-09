import { Badge } from "@/components/ui/badge"
import type { InvoiceStatus, AIVerdict, UserStatus, ReviewDecision } from "@/lib/types"

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const variants: Record<
    InvoiceStatus,
    { variant: "default" | "secondary" | "destructive" | "outline"; label: string; className?: string }
  > = {
    pending: { variant: "secondary", label: "Pending", className: "bg-gray-600 text-white hover:bg-gray-700 border-transparent" },
    clean: { variant: "default", label: "Clean", className: "bg-emerald-600 text-white hover:bg-emerald-700 border-transparent" },
    flagged: { variant: "destructive", label: "Flagged", className: "bg-red-600 text-white hover:bg-red-700 border-transparent" },
    anchored: { variant: "outline", label: "Anchored", className: "bg-blue-600 text-white hover:bg-blue-700 border-transparent" },
  }

  // Fallback for undefined or unknown status
  const config = variants[status] || { variant: "outline", label: status ?? "Unknown", className: "bg-gray-400 text-white border-transparent" }

  return (
    <Badge
      variant={config.variant as any}
      className={config.className}
    >
      {config.label}
    </Badge>
  )
}

export function AIVerdictBadge({ verdict, score, hideScore = false }: { verdict: AIVerdict; score?: number; hideScore?: boolean }) {
  return (
    <div className="flex items-center gap-2 justify-center">
      <Badge
        variant={verdict === "clean" ? "default" : "outline"}
        className={
          verdict === "flagged"
            ? "bg-yellow-500 text-white border-transparent hover:bg-yellow-600"
            : "bg-emerald-600 text-white hover:bg-emerald-700 border-transparent"
        }
      >
        {verdict === "clean" ? "Clean" : "Flagged"}
      </Badge>
      {!hideScore && score !== undefined && (
        <span className={`text-xs font-mono ${score > 0.5 ? "text-destructive" : "text-muted-foreground"}`}>
          Risk: {(score * 100).toFixed(0)}%
        </span>
      )}
    </div>
  )
}

export function UserStatusBadge({ status }: { status: UserStatus }) {
  // UserStatus values are uppercase: "ACTIVE" | "INACTIVE"
  const isActive = status === "ACTIVE"
  return (
    <Badge
      variant={isActive ? "default" : "destructive"}
      className={isActive ? "bg-primary text-primary-foreground" : ""}
    >
      {isActive ? "Active" : "Inactive"}
    </Badge>
  )
}

export function DecisionBadge({ decision }: { decision: ReviewDecision }) {
  // ReviewDecision = "approved" | "rejected"
  const config: Record<ReviewDecision, { variant: "default" | "destructive" | "outline"; label: string }> = {
    approved: { variant: "default", label: "Approved" },
    rejected: { variant: "destructive", label: "Rejected" },
  }

  const cfg = config[decision] ?? { variant: "outline" as const, label: decision }

  return (
    <Badge
      variant={cfg.variant}
      className={decision === "approved" ? "bg-primary text-primary-foreground" : ""}
    >
      {cfg.label}
    </Badge>
  )
}
