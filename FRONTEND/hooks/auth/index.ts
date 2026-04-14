/**
 * Authentication Hooks
 * Used in: Login, Forgot Password, Reset Password, User Creation pages
 * - Password visibility toggle
 * - Form state management with validation
 */

export { usePasswordVisibility, useMultiPasswordVisibility } from "./use-password-visibility"
export { useFormState, validators } from "./use-form-state"
