/**
 * Password Validator Utility
 * Enforces strong password policy:
 * - Minimum 12 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 digit
 * - At least 1 special character
 */

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {{ valid: boolean, errors: string[] }} - Validation result
 */
export function validatePassword(password) {
  const errors = [];

  if (!password || typeof password !== "string") {
    return { valid: false, errors: ["Password is required"] };
  }

  // Minimum length check
  if (password.length < 12) {
    errors.push("Password must be at least 12 characters long");
  }

  // Uppercase letter check
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  // Lowercase letter check
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  // Digit check
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one digit");
  }

  // Special character check
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push(
      "Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)",
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Gets a user-friendly error message for password validation
 * @param {string} password - Password to validate
 * @returns {string|null} - Error message or null if valid
 */
export function getPasswordErrorMessage(password) {
  const result = validatePassword(password);
  if (result.valid) {
    return null;
  }
  return result.errors.join("; ");
}

/**
 * Password strength requirements message
 */
export const PASSWORD_REQUIREMENTS =
  "Password must be at least 12 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character";
