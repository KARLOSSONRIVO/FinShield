export const VERDICT_STYLES: Record<string, string> = {
    clean: "bg-emerald-600 text-white",
    flagged: "bg-yellow-500 text-black",
    fraudulent: "bg-red-600 text-white",
    
    default: "bg-gray-500 text-white"
}

export const STATUS_STYLES: Record<string, string> = {
    verified: "bg-emerald-600 text-white",
    pending: "bg-slate-500 text-white",
    fraudulent: "bg-red-600 text-white",
    flagged: "bg-yellow-500 text-black",
    
    default: "bg-gray-500 text-white"
}

export function getVerdictClassName(verdict: string = ""): string {
    const v = verdict.toLowerCase()
    return VERDICT_STYLES[v] || VERDICT_STYLES.default
}

export function getStatusClassName(status: string = ""): string {
    const s = status.toLowerCase()
    
    if (s === "fraud") return STATUS_STYLES.fraudulent
    return STATUS_STYLES[s] || STATUS_STYLES.default
}
