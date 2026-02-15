# Security Audit - Category 3: Data Protection & Credentials

**Status:** ✅ All Items Implemented

## 1. Secure Credential Storage
- **Implementation:** Hashing + Field Selection.
- **Details:**
    - **Hashing**: `bcrypt` (Salted SHA-256 equivalent) used for passwords.
    - **Field Protection**: Mongoose models (`user.model.js`) set `select: false` on `passwordHash` and `mfaSecret` to prevent accidental data leakage in API responses.

## 2. Role-Based Access Control (RBAC)
- **Implementation:** Custom Middleware.
- **Location:** `BACKEND/src/common/middlewares/rbac.middleware.js`.
- **Details:**
    - `allowRoles(...)`: Restricts endpoints to specific user roles (e.g., SUPER_ADMIN, COMPANY_MANAGER).
    - `allowPortals(...)`: Segregates Admin Portal users from Company Portal users.
    - `requireSameOrgParam(...)`: Enforces Tenancy/Organization scoping to prevent cross-organization data access.

## 3. Database Encryption (Data at Rest)
- **Implementation:** Infrastructure Level (Managed Service).
- **Details:** Relying on **MongoDB Atlas** (or Cloud Provider) encryption. Modern cloud databases encrypt volume data at rest by default. No client-side field level encryption is currently required/implemented.

## 4. TLS Database Connection
- **Implementation:** Connection String Configuration.
- **Location:** `BACKEND/src/infrastructure/db/database.js`.
- **Details:** Connectivity relies on `MONGO_URI`. Standard production URIs (`mongodb+srv://...`) enforce TLS/SSL by default.
