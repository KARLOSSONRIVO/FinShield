/**
 * FinShield Custom Hooks
 * Organized by page/feature usage
 * 
 * Usage: import { useFileUpload, useSearchFilter } from "@/hooks"
 * 
 * Folder Structure:
 * - global/   → Toast notifications, mobile detection (used everywhere)
 * - auth/     → Password visibility, form state (login, forgot-password)
 * - upload/   → File upload handling (invoice upload pages)
 * - filters/  → Search & filter (list/table pages)
 */

// ============================================
// GLOBAL HOOKS - Used across all pages
// ============================================
export { useToast, toast } from "./global"
export { useIsMobile } from "./global"

// ============================================
// AUTH HOOKS - Login, Forgot Password, User Creation
// ============================================
export { usePasswordVisibility, useMultiPasswordVisibility } from "./auth"
export { useFormState, validators } from "./auth"

// ============================================
// UPLOAD HOOKS - Invoice Upload Pages
// ============================================
export { useFileUpload } from "./upload"

// ============================================
// FILTER HOOKS - List/Table Pages
// ============================================
export { useSearchFilter, useInvoiceFilter, useUserFilter } from "./filters"

