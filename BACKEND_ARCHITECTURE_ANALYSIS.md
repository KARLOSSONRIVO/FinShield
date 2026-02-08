# FINSHIELD BACKEND - Architecture & Code Flow Analysis

## 📋 Overview
FinShield Backend is an **Express.js REST API** with a **layered architecture** that handles invoice management, fraud detection, blockchain anchoring, and secure file storage. It integrates with AI services, IPFS, and Ethereum blockchain.

**Tech Stack:**
- Runtime: Node.js (ES6 modules)
- Framework: Express 5.2.1
- Database: MongoDB with Mongoose
- Authentication: JWT (jsonwebtoken)
- Storage: AWS S3 + Pinata IPFS
- Blockchain: Ethereum (Web3.js v4)
- File Upload: Multer
- Validation: Zod
- API Docs: Swagger/OpenAPI
- Logging: Morgan
- Security: Helmet, CORS, Bcrypt

---

## 🏗️ Architecture Overview

### **Layered Architecture Pattern**
```
┌─────────────────┐
│   Routes       │  (Express Router - HTTP endpoints)
├─────────────────┤
│  Controllers   │  (Request handlers, orchestration)
├─────────────────┤
│  Services      │  (Business logic, transaction management)
├─────────────────┤
│ Repositories   │  (Data access layer, queries)
├─────────────────┤
│   Models       │  (Mongoose schemas, data validation)
├─────────────────┤
│ Infrastructure │  (External APIs, blockchain, storage)
└─────────────────┘
```

---

## 📁 Folder Architecture & Responsibilities

### **1. Root Entry Points**
```
server.js          → Bootstrap app, connect database, start HTTP server
app.js             → Express app setup, middleware configuration
```

**Flow:**
- `server.js` → Initializes HTTP server and database connection
- `app.js` → Configures middleware stack (helmet, cors, morgan, body parser)
- Routes mounted at `/`

---

### **2. `/common` - Shared Resources**

#### **`/middlewares`**
| File | Purpose |
|------|---------|
| `auth.middleware.js` | JWT verification, token blacklist check, attach user to req |
| `rbac.middleware.js` | Role-based access control (RBAC) enforcement |
| `validate.middleware.js` | Request body validation |
| `error.middleware.js` | Global error handler, response formatting |
| `notFound.middleware.js` | 404 handler |

**Auth Flow:**
```
Request → auth.middleware
  ↓
Extract Bearer token from Authorization header
  ↓
Verify JWT with JWT_SECRET
  ↓
Check token blacklist (for logout)
  ↓
Attach decoded payload to req.user & req.auth
  ↓
Next middleware
```

**RBAC Example:**
```javascript
allowRoles("COMPANY_MANAGER", "COMPANY_USER")
allowPortals("user", "admin")
requireSameOrgParam("orgId")
```

#### **`/errors`**
- `AppErrors.js` → Custom error class (message, statusCode, code)

#### **`/utils`**
| File | Purpose |
|------|---------|
| `hash.js` | SHA-256 file hashing for duplicate detection |
| `multer.js` | File upload configuration (PDF, DOCX, 10MB limit) |
| `asyncHandler.js` | Wrapper for async route handlers (error catching) |
| `invoiceParser.js` | Extract invoice number from OCR text |
| `fileTypHelpers.js` | MIME type validation |
| `role_helpers.js` | User role classification |

---

### **3. `/config` - Configuration**
| File | Purpose |
|------|---------|
| `env.js` | Environment variables with defaults |
| `swagger.js` | Swagger/OpenAPI documentation setup |

**Key ENV Variables:**
```
- PORT, NODE_ENV
- MONGO_URI
- JWT_SECRET, JWT_EXPIRY
- CORS_ORIGIN
- AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME
- PINATA_JWT, PINATA_API_URL
- CHAIN_RPC_URL, ANCHOR_CONTRACT_ADDRESS, ANCHOR_PRIVATE_KEY
- AI_SERVICE_URL (Python backend)
```

---

### **4. `/infrastructure` - External Service Integration**

#### **`/db/database.js`**
```javascript
connectDB()        → Mongoose connection with strictQuery
disconnectDB()     → Graceful shutdown
```

#### **`/ai/`** (Client for Python AI Service)
| File | Purpose |
|------|---------|
| `ocr_client.js` | POST /ocr/{invoiceId} - Trigger OCR processing |
| `precheck_client.js` | POST /precheck - Validate invoice is processable |
| `template_client.js` | Template comparison & layout detection |

```javascript
// Example: Precheck validates invoice before upload
const precheck = await runInvoicePrecheck(file)
// Returns: { processable, reason, extractedText }
```

#### **`/storage/`** (File Storage)

**`ipfs.service.js`** - Pinata IPFS API
```javascript
addAndPinBuffer({ buffer, fileName })
// Returns: { cid, size }
// Used for: Immutable invoice file storage
```

**`s3.service.js`** - AWS S3 API
```javascript
uploadTemplate({ buffer, fileName, orgId })
// Returns: { s3Key, bucket }
// Used for: Invoice templates storage
```

#### **`/blockchain/ethereum.service.js`** - Web3 Integration
```javascript
anchorInvoice({ invoiceMongoId, ipfsCid, sha256Hex })
// Calls smart contract: anchor(invoiceId32, cidHash32, fileHash32)
// Emits: InvoiceAnchored event on blockchain
```

**Features:**
- EIP-1559 gas handling
- Nonce queue for sequential transaction ordering
- Private key management
- Gas estimation

---

### **5. `/modules` - Core Business Logic**

#### **`/models` - Database Schemas**

**`user.model.js`**
```javascript
{
  orgId,                   // Org reference (required for company roles)
  role,                    // SUPER_ADMIN | AUDITOR | REGULATOR | COMPANY_MANAGER | COMPANY_USER
  email, username,         // Unique constraints
  passwordHash,            // Bcrypt hashed
  status,                  // active | disabled
  mustChangePassword,      // Force password change on first login
  createdByUserId,         // Audit trail
  disabledByUserId,
  lastLoginAt,
  timestamps
}
```

**`organization.model.js`**
```javascript
{
  name, type,                 // platform | company
  status,                     // active | inactive
  invoiceTemplate: {
    s3Key, fileName,
    layoutSignature: {
      fields, positions,
      detectedFields,
      structural_features    // For template comparison
    }
  },
  timestamps
}
```

**`invoice.model.js`** - Core invoice document
```javascript
{
  orgId, uploadedByUserId,
  invoiceNumber, invoiceDate, totalAmount, lineItems,
  
  // File storage
  ipfsCid,                    // IPFS reference
  fileHashSha256,             // For deduplication
  
  // AI Processing
  ocrText,                    // Extracted text from OCR
  aiRiskScore, aiVerdict,     // CLEAN | FLAGGED
  riskLevel,                  // low | medium | high
  aiSummary,                  // AI analysis results
  
  // Blockchain
  anchorTxHash,               // Ethereum transaction hash
  anchorBlockNumber,          // Block where anchored
  anchoredAt,                 // Timestamp
  anchorStatus,               // pending | anchored | failed
  anchorError,
  
  // Review
  status,                     // pending | verified | flagged | fraudulent
  reviewedByUserId,           // Auditor reference
  reviewDecision,             // approved | rejected (for training)
  
  timestamps
}
```

**`assignment.model.js`** - Auditor assignments
```javascript
{
  companyOrgId,               // Company being audited
  auditorUserId,              // Assigned auditor
  status,                     // active | inactive
  assignedByUserId,           // Who made the assignment
  assignedAt,
  notes,
  timestamps
}
```

#### **`/repositories` - Data Access Layer**
Database query abstractions for models:
- `user.repositories.js`
- `invoice.repositories.js`
- `organization.repositories.js`
- `assignment.repositories.js`
- `refreshToken.repositories.js`
- `tokenBlacklist.repositories.js`

**Example operations:**
```javascript
findByInvoiceNumberAndOrg(invoiceNumber, orgId)
findInvoiceByCid(cid)
hasActiveAuditor(orgId)
isBlacklisted(token)
```

#### **`/controllers` - Request Handlers**
Thin layer that:
1. Extract data from request
2. Call service methods
3. Format response
4. Pass errors to error handler

**`invoice.controller.js`**
```javascript
uploadAndAnchorInvoice(req, res)
  → Calls InvoiceService.uploadToIpfsAndAnchor()
  → Returns invoice data with IPFS CID
```

#### **`/services` - Business Logic Layer**

**`/services/invoice/upload.js`** - Main upload workflow
```
REQUEST: File + User (actor) + Org context
         ↓
STEP 1: PRECHECK
  - Call AI service precheck endpoint
  - Validate document is processable
  - Get OCR extracted text
         ↓
STEP 2: DUPLICATE CHECK (by invoice number)
  - Extract invoice number from OCR text
  - Query DB for existing invoice with same number
  - Reject if exists in same org
         ↓
STEP 3: FILE TYPE VALIDATION
  - Check MIME type (PDF | DOCX only)
  - Verify file is document
         ↓
STEP 4: HASH & IPFS UPLOAD
  - Compute SHA-256 hash of file buffer
  - Check for byte-for-byte duplicate (by hash)
  - Upload to Pinata IPFS
  - Get IPFS CID
         ↓
STEP 5: DATABASE SAVE
  - Create Invoice document
  - Store: orgId, uploadedBy, IPFS CID, file hash, OCR text
  - Set status = "pending"
         ↓
STEP 6: BACKGROUND ANCHORING
  - Start background job to:
    • Trigger AI fraud detection
    • Anchor file to Ethereum blockchain
  - Return invoice to user immediately
         ↓
RESPONSE: { ok: true, data: invoice }
```

**`/services/invoice/anchor_background.js`**
```javascript
anchorInvoiceInBackground(invoiceId)
  ↓
1. Wait for AI fraud detection to complete
2. Update invoice with AI verdict (CLEAN | FLAGGED)
3. If verdict OK, prepare blockchain anchor
4. Call ethereum.service.anchorInvoice()
5. Update invoice: anchorStatus, txHash, blockNumber
6. Handle anchor failures with error logging
```

**Other services:**
- `auth.service.js` → Login, refresh, logout, password change
- `user.service.js` → User CRUD, role management
- `organization.service.js` → Org CRUD, template management
- `assignment.service.js` → Auditor assignments
- `session.service.js` → Session tracking

#### **`/validators` - Request Validation**
Zod schemas for input validation:
```javascript
loginSchema        // email, password
invoiceUpload      // file MIME type, size
authValidator      // passwords, tokens
```

#### **`/mappers` - Response Transformation**
Convert internal models to API response DTOs:
```javascript
toInvoicePublic()  // Filter sensitive fields
toUserPublic()     // Exclude passwordHash
toOrgPublic()      // Format org response
```

---

### **6. `/routes` - HTTP Endpoints**

**Route Structure:**
```
/
├── /api-docs              (Swagger UI - public)
├── /health                (Health check - public)
├── /auth                  (Login, refresh, logout)
│   ├── POST /login        (Public)
│   ├── POST /refresh      (Public)
│   └── [Protected routes]
│       ├── GET /me
│       ├── POST /change-password
│       └── POST /logout
│
└── [Protected routes - requireAuth middleware]
    ├── /organization      (Org management)
    ├── /user              (User management)
    ├── /assignment        (Auditor assignments)
    ├── /invoice           (Invoice operations)
    │   ├── POST /upload   (File upload + IPFS + anchor)
    │   ├── GET /          (List invoices)
    │   ├── GET /:id       (Get invoice)
    │   ├── PUT /:id       (Review/approve invoice)
    │   └── ...
    └── /session           (Session routes)
```

**Key Endpoint: Invoice Upload**
```javascript
POST /invoice/upload
Headers: Authorization: Bearer <jwt_token>
Body: multipart/form-data { file }

Middleware chain:
  1. uploadSingle("file")          → Multer file capture
  2. validateInvoiceUpload          → Zod schema validation
  3. allowRoles(...)                → RBAC check
  4. InvoiceController.upload...    → Route handler
```

---

### **7. `/docs` - API Documentation**
YAML Swagger definitions for endpoints:
- `assignments.yaml`, `auth.yaml`, `invoices.yaml`, `organizations.yaml`, `users.yaml`

---

## 🔄 Complete Code Flow Example: Invoice Upload

```
User submits invoice file
           ↓
[ROUTE] POST /invoice/upload
           ↓
[MIDDLEWARE] uploadSingle("file")
  → Multer extracts file buffer
           ↓
[MIDDLEWARE] validateInvoiceUpload
  → Zod validates: MIME type, size (≤10MB)
           ↓
[MIDDLEWARE] allowRoles("COMPANY_MANAGER", "COMPANY_USER")
  → RBAC check: user.role must match
           ↓
[MIDDLEWARE] requireAuth
  → JWT verified, user attached to req
           ↓
[CONTROLLER] invoiceController.uploadAndAnchorInvoice()
  → Extract: req.auth (user), req.file, req.body
  → Call: InvoiceService.uploadToIpfsAndAnchor()
           ↓
[SERVICE] uploadToIpfsAndAnchor()
  
  1. Validate user role & org membership
     → Check if org has assigned auditor
  
  2. PRECHECK (call AI service)
     → POST to AI_SERVICE_URL/precheck
     → Get: processable flag, OCR text
     → Reject if not processable
  
  3. Duplicate check (by invoice number)
     → Extract number from OCR text
     → Query: InvoiceRepository.findByInvoiceNumberAndOrg()
     → Reject if found
  
  4. File type check
     → Only PDF & DOCX allowed
  
  5. Hash & IPFS upload
     → Compute SHA-256 of file buffer
     → Query: InvoiceRepository.findInvoiceByCid() (dedup by hash)
     → Upload to Pinata: ipfsService.addAndPinBuffer()
     → Get IPFS CID
  
  6. Save to MongoDB
     → Create Invoice document:
        {
          orgId, uploadedByUserId,
          ipfsCid, fileHashSha256,
          ocrText,
          anchorStatus: "pending",
          status: "pending"
        }
     → Return invoice to user
  
  7. Background anchoring (fire-and-forget)
     → anchorInvoiceInBackground(invoiceId)
        a. Wait for AI fraud detection
           → Call AI_SERVICE_URL/fraud/{invoiceId}
           → Get: aiVerdict, aiRiskScore, riskLevel
           → Update invoice: status, aiVerdict, riskLevel
        
        b. If fraud verdict is "clean":
           → Prepare blockchain anchor data
           → Call ethereumService.anchorInvoice()
             • Compute bytes32 hashes for:
               - invoiceId (MongoDB ID)
               - IPFS CID
               - File SHA-256
             • Call smart contract: anchor(id32, cid32, hash32)
             • Get tx hash & block number
           → Update invoice:
              {
                anchorTxHash, anchorBlockNumber,
                anchorStatus: "anchored",
                anchoredAt: now
              }
        
        c. On error:
           → Update invoice:
              { anchorStatus: "failed", anchorError: msg }
           → Log error
           ↓
[RESPONSE] Return to user immediately
{
  ok: true,
  data: {
    _id, orgId, uploadedByUserId,
    invoiceNumber, invoiceDate, totalAmount,
    ipfsCid,
    status: "pending",
    anchorStatus: "pending",
    createdAt
  }
}
```

---

## 🔐 Authentication & Authorization Flow

### **Login**
```
POST /auth/login { email, password }
           ↓
[SERVICE] authService.login()
  → Find user by email
  → Verify password (bcrypt.compare)
  → Generate JWT: { userId, orgId, role, portal, email }
  → Return: accessToken, refreshToken
           ↓
Client stores tokens (localStorage, cookie, etc.)
```

### **Protected Route Access**
```
GET /invoice
Authorization: Bearer <accessToken>
           ↓
[MIDDLEWARE] requireAuth
  → Extract token from header
  → Verify JWT signature
  → Check if token is blacklisted
  → Attach user payload to req.auth
           ↓
[MIDDLEWARE] enforceMustChangePassword
  → If req.auth.mustChangePassword = true
  → Allow only: /auth/change-password paths
  → Reject all others with 403
           ↓
[MIDDLEWARE] allowRoles(...) OR allowPortals(...)
  → Check req.auth.role matches allowed roles
  → OR check req.auth.portal matches allowed portals
           ↓
[ROUTE HANDLER] Process request
```

### **Logout**
```
POST /auth/logout { refreshToken }
           ↓
[SERVICE] authService.logout()
  → Add accessToken to blacklist
  → Invalidate refreshToken
  → Tokens added to DB with expiry
           ↓
Future requests with token → Rejected (TOKEN_REVOKED)
```

---

## 📊 User Roles & Permissions

### **Role Hierarchy**
```javascript
// Platform roles (no orgId required)
SUPER_ADMIN      → Full system access
AUDITOR          → Review invoices across orgs
REGULATOR        → Compliance oversight

// Company roles (orgId required)
COMPANY_MANAGER  → Manage company, upload invoices
COMPANY_USER     → Upload invoices only
```

### **Portal Classification**
```javascript
"admin"  ← Platform roles (SUPER_ADMIN, AUDITOR, REGULATOR)
"user"   ← Company roles (COMPANY_MANAGER, COMPANY_USER)
```

### **Key Permissions**
```
SUPER_ADMIN      Can: Manage orgs, users, auditors, view all invoices
AUDITOR          Can: Review invoices, make approval/rejection decisions
REGULATOR        Can: View compliance data, audit logs
COMPANY_MANAGER  Can: Manage org users, upload invoices, assign roles
COMPANY_USER     Can: Upload invoices only
```

---

## 🔄 Data Flow Diagram: Complex User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│ COMPANY_USER signs up for FinShield                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
        POST /auth/login → JWT generated
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ COMPANY_MANAGER creates organization & assigns auditor           │
│   1. POST /organization → Create org                             │
│   2. POST /user → Create auditor user                            │
│   3. POST /assignment → Link auditor to org                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ COMPANY_USER uploads invoice                                     │
│   POST /invoice/upload { file }                                  │
│                                                                   │
│   Flow:                                                           │
│   ① File processed by Multer                                    │
│   ② AI precheck validates format                                │
│   ③ Duplicate check (invoice number + hash)                     │
│   ④ IPFS upload for immutable storage                           │
│   ⑤ Invoice saved to MongoDB (pending status)                   │
│   ⑥ Background: AI fraud detection                              │
│   ⑦ Background: Blockchain anchoring (Ethereum)                 │
│                                                                   │
│   Response: { _id, ipfsCid, status: "pending" }                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
        Invoice in background processing...
                    (AI + Blockchain)
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ AUDITOR reviews invoice                                          │
│   GET /invoice/:id → Fetch invoice details                       │
│                                                                   │
│   Data returned:                                                 │
│   - Original document from IPFS (via CID)                        │
│   - Extracted OCR text                                           │
│   - AI verdict: CLEAN or FLAGGED                                │
│   - Risk level, risk score                                       │
│   - Blockchain anchor proof (tx hash, block number)              │
│                                                                   │
│   PUT /invoice/:id { decision: "approved" | "rejected" }        │
│   → Update: status, reviewedBy, reviewDecision                  │
│   → Decision used as training label for ML model                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ Regulatory compliance                                            │
│   REGULATOR can:                                                 │
│   - View all invoices across all orgs                            │
│   - Access audit logs (who reviewed, when, decision)             │
│   - Generate compliance reports                                  │
│   - Access blockchain proof (immutable record)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Security Features

### **Authentication**
- JWT tokens (configurable expiry)
- Refresh token mechanism
- Token blacklisting on logout
- Password change enforcement on first login
- Bcrypt password hashing

### **Authorization**
- Role-Based Access Control (RBAC)
- Organization scoping (`requireSameOrgParam`)
- Portal-based access (admin vs. user)

### **Data Protection**
- HTTPS/TLS ready (Helmet)
- CORS configured by origin
- File upload size limits (10MB)
- MIME type validation
- SHA-256 hashing for file deduplication

### **Audit Trail**
- User creation tracked (`createdByUserId`)
- Invoice uploads logged (`uploadedByUserId`)
- Review decisions tracked (`reviewedByUserId`)
- Timestamps on all operations

### **Immutability**
- IPFS for file storage (content-addressed, unchangeable)
- Ethereum blockchain for transaction anchoring
- SHA-256 file hashes for integrity verification

---

## 🚀 Request/Response Cycle

### **Typical Success Response**
```json
{
  "ok": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "orgId": "507f1f77bcf86cd799439012",
    "uploadedByUserId": "507f1f77bcf86cd799439013",
    "invoiceNumber": "INV-2025-001",
    "totalAmount": 5000,
    "status": "pending",
    "ipfsCid": "QmXxxx...",
    "createdAt": "2025-02-08T10:30:00Z"
  }
}
```

### **Error Response (via error.middleware.js)**
```json
{
  "ok": false,
  "error": {
    "message": "Duplicate invoice detected",
    "code": "DUPLICATE_INVOICE_NUMBER",
    "statusCode": 400
  }
}
```

---

## 📦 Key Dependencies

| Package | Purpose |
|---------|---------|
| `express` | Web framework |
| `mongoose` | MongoDB ODM |
| `jsonwebtoken` | JWT auth |
| `bcrypt` | Password hashing |
| `axios` | HTTP client (AI service calls) |
| `@aws-sdk/client-s3` | S3 file upload |
| `ipfs-http-client` | IPFS/Pinata client |
| `web3` | Ethereum blockchain interaction |
| `zod` | Input validation |
| `multer` | File upload handling |
| `helmet` | Security headers |
| `cors` | CORS handling |
| `morgan` | HTTP logging |
| `swagger-jsdoc` | API documentation |

---

## 🔌 Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│                    FinShield Backend                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │ MongoDB      │    │ AI Service   │    │ Ethereum     │  │
│  │ (Data Store) │    │ (Python)     │    │ (Blockchain) │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         ↑                    ↑                   ↑            │
│         │                    │                   │            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Pinata     │    │ AWS S3       │    │   Web3.js    │  │
│  │   (IPFS)     │    │ (Templates)  │    │  (RPC Client)│  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Summary

**FinShield Backend** is a **secure, scalable invoice management platform** with:

1. **Layered Architecture**: Routes → Controllers → Services → Repositories → Models
2. **AI Integration**: Precheck & fraud detection via Python service
3. **Immutable Storage**: IPFS for files, Ethereum for anchoring
4. **Role-Based Security**: SUPER_ADMIN, AUDITOR, REGULATOR, COMPANY_MANAGER, COMPANY_USER
5. **Audit Trail**: Complete tracking of who did what and when
6. **Duplicate Detection**: By invoice number and file hash
7. **Background Processing**: Async blockchain anchoring & AI detection
8. **Clean Error Handling**: Centralized error middleware with consistent response format

The architecture supports **high throughput, secure operations**, and **regulatory compliance** for enterprise invoice processing workflows.
