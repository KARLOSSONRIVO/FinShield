
import { useAuthContext } from "@/components/providers/auth-provider"

export const useAuth = () => {
    const context = useAuthContext()

    return {
        ...context,
        isSuperAdmin: context.user?.role === "SUPER_ADMIN",
        isAuditor: context.user?.role === "AUDITOR",
        isRegulator: context.user?.role === "REGULATOR",
        isCompanyManager: context.user?.role === "COMPANY_MANAGER",
        isCompanyUser: context.user?.role === "COMPANY_USER",
        isAdmin: ["SUPER_ADMIN", "AUDITOR", "REGULATOR"].includes(context.user?.role || "")
    }
}
