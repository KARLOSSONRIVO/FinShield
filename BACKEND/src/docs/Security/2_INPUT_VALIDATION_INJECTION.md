# Security Audit - Category 2: Input Validation & Prevention

**Status:** ✅ All Items Implemented

## 1. Server-Side Input Validation
- **Implementation:** Zod Schema Validation.
- **Location:** `BACKEND/src/common/middlewares/validate.middleware.js`.
- **Details:** All incoming requests (Body, Query, Params) are validated against strict Zod schemas. Unknown fields are stripped out (Sanitization).

## 2. File Upload Validation
- **Implementation:** Layered Validation (Multer + Magic Numbers).
- **Locations:**
    - `BACKEND/src/common/utils/multer.js`: Enforces **10MB** size limit.
    - `BACKEND/src/common/middlewares/fileType.middleware.js`: Uses `file-type` to check **Magic Numbers** (verifies actual file content, not just extension) to permit only PDF and DOCX.
    - `BACKEND/src/modules/validators/invoice.validator.js`: Zod schema double-checks MIME types.

## 3. API Schema Validation
- **Implementation:** Zod Schemas for specific routes.
- **Locations:** `BACKEND/src/modules/validators/*.validator.js`.
- **Details:** Ensures data conforms to expected types (strings, emails, uuids) before reaching controllers.

## 4. NoSQL Injection Prevention
- **Implementation:** Triple Defense Strategy.
- **Details:**
    1.  **`mongoSanitize()` Middleware**: Defined in `app.js`. Strips keys starting with `$` to prevent operator injection.
    2.  **Zod Whitelisting**: `validate.middleware.js` replaces `req.body` with the parsed output, effectively removing any unvalidated fields.
    3.  **Explicit Queries**: Repositories use explicit key-value pairs (e.g., `{ email: email }`) rather than passing the entire `req.body` to MongoDB.
