import { Badge } from '@/components/ui/data-display/badge'
import type { InvoiceStatus, AIVerdict, UserStatus, ReviewDecision } from '@/types'

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const variants: Record<
    InvoiceStatus,
    { variant: "default" | "secondary" | "destructive" | "outline"; label: string; className?: string }
  > = {
    pending: { variant: "secondary", label: "Pending", className: "bg-gray-600 text-white hover:bg-gray-700 border-transparent" },
    verified: { variant: "default", label: "Verified", className: "bg-emerald-600 text-white hover:bg-emerald-700 border-transparent" },
    flagged: { variant: "outline", label: "Flagged", className: "bg-yellow-500 text-white border-transparent hover:bg-yellow-600" },
    fraudulent: { variant: "destructive", label: "Fraudulent", className: "bg-red-600 text-white hover:bg-red-700 border-transparent" },
  }

  const config = variants[status]
  return (
    <Badge
      variant={config.variant}
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
  return (
    <Badge
      variant={status === "active" ? "default" : "destructive"}
      className={status === "active" ? "bg-primary text-primary-foreground" : ""}
    >
      {status === "active" ? "Active" : "Disabled"}
    </Badge>
  )
}

export function DecisionBadge({ decision }: { decision: ReviewDecision }) {
  const config: Record<ReviewDecision, { variant: "default" | "destructive" | "outline"; label: string }> = {
    verified: { variant: "default", label: "Verified" },
    fraudulent: { variant: "destructive", label: "Fraudulent" },
    needs_clarification: { variant: "outline", label: "Needs Clarification" },
  }

  return (
    <Badge
      variant={config[decision].variant}
      className={decision === "verified" ? "bg-primary text-primary-foreground" : ""}
    >
      {config[decision].label}
    </Badge>
  )
}
