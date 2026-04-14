import { Badge } from "@/components/ui/badge"
import type { InvoiceStatus, AIVerdict, UserStatus, ReviewDecision } from "@/lib/types"

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const variants: Record<
    InvoiceStatus,
    { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
  > = {
    pending: { variant: "secondary", label: "Pending" },
    verified: { variant: "default", label: "Verified" },
    flagged: { variant: "outline", label: "Flagged" },
    fraudulent: { variant: "destructive", label: "Fraudulent" },
  }

  const config = variants[status]
  return (
    <Badge
      variant={config.variant}
      className={
        status === "flagged"
          ? "border-warning text-warning bg-warning/10"
          : status === "verified"
            ? "bg-primary text-primary-foreground"
            : ""
      }
    >
      {config.label}
    </Badge>
  )
}

export function AIVerdictBadge({ verdict, score }: { verdict: AIVerdict; score: number }) {
  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={verdict === "clean" ? "default" : "outline"}
        className={
          verdict === "flagged" ? "border-warning text-warning bg-warning/10" : "bg-primary text-primary-foreground"
        }
      >
        {verdict === "clean" ? "Clean" : "Flagged"}
      </Badge>
      <span className={`text-xs font-mono ${score > 0.5 ? "text-destructive" : "text-muted-foreground"}`}>
        Risk: {(score * 100).toFixed(0)}%
      </span>
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
