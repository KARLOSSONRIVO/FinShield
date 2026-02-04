
export const PLATFORM_ROLES = ["SUPER_ADMIN", "AUDITOR", "REGULATOR"];
export const COMPANY_ROLES = ["COMPANY_MANAGER", "COMPANY_USER"];
export const USER_ROLES = [...PLATFORM_ROLES, ...COMPANY_ROLES];

export function isPlatformRole(role) {
    return PLATFORM_ROLES.includes(role)
}
export function isCompanyRole(role) {
    return COMPANY_ROLES.includes(role)
}
export function expectedOrgTypeForRole(role) {
    return isPlatformRole(role) ? "platform" : "company"
}
