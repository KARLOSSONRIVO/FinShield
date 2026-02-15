# FinShield Security Architecture

This document outlines the security controls, protocols, and mechanisms implemented in the FinShield backend to protect user data, ensure system integrity, and prevent common web vulnerabilities.

## 1. Authentication & Access Control

FinShield employs a robust, stateless authentication mechanism designed to prevent unauthorized access while maintaining a seamless user experience.

### 1.1. Password Security
*   **Hashing Algorithm**: All user passwords are hashed using **bcrypt** before storage.
*   **Verification**: Plain-text passwords are never stored. Verification is performed by comparing the input against the stored hash using `bcrypt.compare()`.
*   **Policy Enforcement**: A strict password policy is enforced by the `passwordValidator` utility:
    *   Minimum 12 characters.
    *   Must contain uppercase, lowercase, numeric, and special characters.

### 1.2. Session Management
*   **JWT (JSON Web Tokens)**: The system uses a dual-token strategy:
    *   **Access Token**: Short-lived (e.g., 15 minutes) for API authorization.
    *   **Refresh Token**: Longer-lived, used to obtain new access tokens.
*   **Rotation**: Refresh tokens are rotated upon use to detect token reuse attacks.
*   **Revocation**: Mechanisms exist to blacklist tokens upon logout or security events.

### 1.3. Multi-Factor Authentication (MFA)
*   **TOTP Standard**: Supports Time-based One-Time Passwords (compatible with Google Authenticator, Authy).
*   **Enforcement**: Use of `mfa.service.js` ensures that users with MFA enabled must provide a valid token during login (Step-up authentication).

### 1.4. Brute-Force Protection
*   **Rate Limiting**: `express-rate-limit` is applied to sensitive endpoints:
    *   `/auth/login`: Strict limits to prevent credential stuffing.
    *   `/auth/refresh`: Limits to prevent token mining.
*   **Generic Errors**: Login responses return generic "Invalid email or password" messages to prevent user enumeration.

## 2. Input Validation & Injection Prevention

All data entering the system is treated as untrusted until validated.

### 2.1. Strict Schema Validation
*   **Zod Library**: Every API endpoint uses **Zod schemas** to validate `body`, `query`, and `params`.
*   **Sanitization**: Unrecognized fields are stripped locally by the validator before reaching the controller, preventing "Mass Assignment" vulnerabilities.

### 2.2. NoSQL Injection Defense
*   **Sanitization Middleware**: `express-mongo-sanitize` is used globally to strip MongoDB operators (keys starting with `$`) from input.
*   **Explicit Queries**: Database repositories use explicit key-value assignments (e.g., `{ email: req.body.email }`) rather than passing raw objects, ensuring attackers cannot inject query operators.

### 2.3. Secure File Handling
*   **Magic Number Verification**: File uploads are validated by inspecting binary signatures (Magic Numbers) using `file-type`, not just file extensions.
*   **Size Limits**: Enforced via Molter (e.g., 10MB limit) to prevent Denial of Service (DoS) via disk filling.
*   **Processing**: Validation occurs *before* any processing by the AI service.

## 3. Data Protection & Privacy

### 3.1. Infrastructure Encryption
*   **Data at Rest**: Storage volumes (managed MongoDB Atlas) are encrypted at the physical layer by the cloud provider.
*   **Data in Transit**: All database connections use **TLS/SSL** (enforced by connection string parameters).

### 3.2. Secret Management
*   **Field-Level Protection**: Sensitive database fields (like `passwordHash` and `mfaSecret`) are defined with `select: false` in Mongoose models. This ensures they are never returned in queries unless explicitly requested by internal authentication logic.
*   **Environment Variables**: Secrets (JWT keys, DB URIs) are loaded from environment variables and never hardcoded.

### 3.3. Role-Based Access Control (RBAC)
*   **Middleware Enforcement**: Routes are protected by `rbac.middleware.js`:
    *   `allowRoles(...)`: Restricts access to specific user roles (e.g., ADMIN, MANAGER).
    *   `allowPortals(...)`: Segregates "Admin Portal" vs. "Company Portal" access.
    *   `requireSameOrgParam(...)`: strictly enforces tenancy, ensuring users can only access data belonging to their own organization.
