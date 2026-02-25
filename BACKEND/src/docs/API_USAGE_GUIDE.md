# FinShield API Usage Guide

> **Base URL (Development):** `http://localhost:5000/api`
> **Swagger UI:** `http://localhost:5000/api/api-docs`

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Health Check](#2-health-check)
3. [Organizations](#3-organizations)
4. [Users](#4-users)
5. [Assignments](#5-assignments)
6. [Invoices](#6-invoices)
7. [Blockchain Ledger](#7-blockchain-ledger)
8. [Sessions](#8-sessions)
9. [WebSocket (Real-Time Events)](#9-websocket-real-time-events)
10. [Pagination](#10-pagination)
11. [Error Handling](#11-error-handling)
12. [Role Permissions Matrix](#12-role-permissions-matrix)

---

## 1. Authentication

All protected endpoints require a **Bearer token** in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

### 1.1 Login

Authenticate and receive JWT tokens.

```
POST /auth/login
```

**Request Body:**

```json
{
  "email": "admin@finshield.com",
  "password": "Password123#!"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "698db6e438263f5e8f5a8bc3",
      "email": "admin@finshield.com",
      "role": "SUPER_ADMIN",
      "username": "admin",
      "status": "active",
      "mfaEnabled": false
    }
  }
}
```

### 1.2 Refresh Token

Exchange a refresh token for a new token pair.

```
POST /auth/refresh
```

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 1.3 Logout

Invalidate the current session. Requires authentication.

```
POST /auth/logout
```

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):** Session invalidated.

### 1.4 Get Current User

Retrieve the authenticated user's profile.

```
GET /auth/me
```

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "698db6e438263f5e8f5a8bc3",
    "email": "admin@finshield.com",
    "role": "SUPER_ADMIN",
    "username": "admin",
    "status": "active",
    "mfaEnabled": false,
    "lastLoginAt": "2026-02-22T10:30:00.000Z",
    "createdAt": "2026-02-12T11:17:56.057Z",
    "updatedAt": "2026-02-22T10:30:00.000Z"
  }
}
```

### 1.5 Change Password

Change the authenticated user's password.

```
POST /auth/change-password
```

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**

```json
{
  "currentPassword": "OldPassword123#!",
  "newPassword": "NewPassword456#!"
}
```

**Response (200):** Password changed successfully.

### 1.6 MFA Login

Login using a temporary token and a TOTP code when MFA is enabled.

```
POST /auth/login/mfa
```

**Request Body:**

```json
{
  "tempToken": "eyJhbGciOi...",
  "code": "123456"
}
```

**Response (200):** Returns access and refresh tokens.

### 1.7 MFA Setup

Initialize TOTP MFA. Returns a secrete and QR code.

```
POST /auth/mfa/setup
```

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,iVBORw0KGgo..."
  }
}
```

### 1.8 MFA Enable

Verify the TOTP code to formally enable MFA.

```
POST /auth/mfa/enable
```

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**

```json
{
  "code": "123456"
}
```

**Response (200):** MFA enabled successfully.

### 1.9 MFA Disable

Disable MFA.

```
POST /auth/mfa/disable
```

**Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**

```json
{
  "code": "123456"
}
```

**Response (200):** MFA disabled successfully.

---

## 2. Health Check

Verify the API is running.

```
GET /health
```

**Response (200):**

```json
{
  "success": true,
  "message": "OK"
}
```

> No authentication required.

---

## 3. Organizations

### 3.1 Create Organization

Create a new organization with an optional invoice template.

```
POST /organization/createOrganization
```

**Roles:** `SUPER_ADMIN`

**Content-Type:** `multipart/form-data`

| Field             | Type   | Required | Description                                    |
|-------------------|--------|----------|------------------------------------------------|
| `name`            | string | Yes      | Organization name                              |
| `type`            | string | Yes      | `platform` or `company`                        |
| `status`          | string | No       | `active` (default) or `inactive`               |
| `invoiceTemplate` | file   | No       | PDF or DOCX template file (max 10MB)           |

**cURL Example:**

```bash
curl -X POST http://localhost:5000/api/organization/createOrganization \
  -H "Authorization: Bearer <accessToken>" \
  -F "name=Acme Corporation" \
  -F "type=company" \
  -F "invoiceTemplate=@/path/to/template.pdf"
```

**Response (201):**

```json
{
  "ok": true,
  "message": "Organization created successfully",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Acme Corporation",
    "type": "company",
    "status": "active",
    "invoiceTemplate": {
      "s3Key": "templates/507f1f77bcf86cd799439011/1706543210-template.pdf",
      "fileName": "template.pdf",
      "uploadedAt": "2026-02-22T12:00:00.000Z"
    },
    "createdAt": "2026-02-22T12:00:00.000Z",
    "updatedAt": "2026-02-22T12:00:00.000Z"
  }
}
```

### 3.2 List Organizations (Paginated)

Retrieve a paginated list of all organizations.

```
GET /organization/listOrganizations
```

**Roles:** `SUPER_ADMIN`

**Query Parameters:**

| Param    | Type    | Default     | Description                        |
|----------|---------|-------------|------------------------------------|
| `page`   | integer | `1`         | Page number (1-based)              |
| `limit`  | integer | `20`        | Items per page (1–100)             |
| `search` | string  | —           | Filter by organization name        |
| `sortBy` | string  | `createdAt` | Sort field: `createdAt`, `name`, `type` |
| `order`  | string  | `desc`      | Sort order: `asc` or `desc`        |

**Example:**

```
GET /organization/listOrganizations?page=1&limit=10&search=acme&sortBy=name&order=asc
```

**Response (200):**

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "507f1f77bcf86cd799439011",
        "name": "Acme Corporation",
        "type": "company",
        "status": "active",
        "createdAt": "2026-02-12T11:17:56.057Z",
        "updatedAt": "2026-02-16T03:16:24.606Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

### 3.3 Get Organization by ID

Retrieve a specific organization. SUPER_ADMIN can access any org; other roles can only access their own.

```
GET /organization/getOrganization/:id
```

**Example:**

```
GET /organization/getOrganization/507f1f77bcf86cd799439011
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Acme Corporation",
    "type": "company",
    "status": "active",
    "invoiceTemplate": null,
    "createdAt": "2026-02-12T11:17:56.057Z",
    "updatedAt": "2026-02-16T03:16:24.606Z"
  }
}
```

---

## 4. Users

### 4.1 List Users (Paginated)

Retrieve a paginated list of users. The current user is always excluded.

```
GET /user/listUsers
```

**Roles:** `SUPER_ADMIN`, `COMPANY_MANAGER`

| Param    | Type    | Default     | Description                                          |
|----------|---------|-------------|------------------------------------------------------|
| `page`   | integer | `1`         | Page number                                          |
| `limit`  | integer | `20`        | Items per page (1–100)                               |
| `search` | string  | —           | Search by username or email                          |
| `sortBy` | string  | `createdAt` | `createdAt`, `username`, `email`, `role`, `lastLoginAt` |
| `order`  | string  | `desc`      | `asc` or `desc`                                      |
| `orgId`  | string  | —           | Filter by organization ID (**SUPER_ADMIN only**)     |

**Example:**

```
GET /user/listUsers?page=1&limit=5&search=john&sortBy=username&order=asc
```

**Response (200):**

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "698db6e438263f5e8f5a8bc3",
        "orgId": "698db6ce38263f5e8f5a8bbc",
        "role": "COMPANY_USER",
        "email": "john@company.com",
        "username": "johndoe",
        "status": "active",
        "mustChangePassword": false,
        "mfaEnabled": false,
        "lastLoginAt": "2026-02-20T10:30:00.000Z",
        "createdAt": "2026-02-12T11:17:56.057Z",
        "updatedAt": "2026-02-20T10:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 5,
      "totalPages": 1
    }
  }
}
```

### 4.2 List Employees (Paginated)

List all `COMPANY_USER` employees in the manager's organization.

```
GET /user/listEmployees
```

**Roles:** `COMPANY_MANAGER`

| Param    | Type    | Default     | Description                            |
|----------|---------|-------------|----------------------------------------|
| `page`   | integer | `1`         | Page number                            |
| `limit`  | integer | `20`        | Items per page (1–100)                 |
| `search` | string  | —           | Search by username or email            |
| `sortBy` | string  | `createdAt` | `createdAt`, `username`, `email`       |
| `order`  | string  | `desc`      | `asc` or `desc`                        |

**Response (200):** Same paginated structure as List Users (items contain `User` objects with `role: "COMPANY_USER"`).

### 4.3 Create User

Create a new user account.

```
POST /user/createUser
```

**Roles:** `SUPER_ADMIN` (any role), `COMPANY_MANAGER` (only `COMPANY_USER`)

**Request Body:**

```json
{
  "email": "newuser@example.com",
  "password": "Password123!",
  "username": "Jon Doe",
  "role": "COMPANY_USER",
  "orgId": "507f1f77bcf86cd799439011"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "698db78938263f5e8f5a8bd5",
    "email": "newuser@example.com",
    "username": "Jon Doe",
    "role": "COMPANY_USER",
    "orgId": "507f1f77bcf86cd799439011",
    "status": "active",
    "mustChangePassword": true,
    "mfaEnabled": false,
    "createdAt": "2026-02-22T12:00:00.000Z",
    "updatedAt": "2026-02-22T12:00:00.000Z"
  }
}
```

### 4.4 Get User by ID

```
GET /user/:id
```

**Response (200):** Returns the full `User` object.

### 4.5 Update User (Enable/Disable)

Toggle a user's status between `active` and `disabled`.

```
PUT /user/updateUser/:id
```

**Roles:** `SUPER_ADMIN` (any user), `COMPANY_MANAGER` (own org's `COMPANY_USER` only)

**Disable a user:**

```json
{
  "status": "disabled",
  "reason": "Employee left the company"
}
```

**Re-enable a user:**

```json
{
  "status": "active"
}
```

**Response (200):**

```json
{
  "ok": true,
  "data": {
    "id": "698db123...",
    "status": "disabled",
    "disabledByUserId": "698db6e4...",
    "disabledAt": "2026-02-22T10:30:00.000Z",
    "disableReason": "Employee left the company"
  }
}
```

**Error Codes:**

| Code                  | Description                                |
|-----------------------|--------------------------------------------|
| `CANNOT_DISABLE_SELF` | You cannot disable your own account        |
| `FORBIDDEN_ROLE`      | Company managers can only update employees  |
| `FORBIDDEN_ORG`       | Cannot update users outside your org       |

---

## 5. Assignments

Manage auditor-to-company organization assignments.

### 5.1 Create Assignment

```
POST /assignment/createAssignment
```

**Roles:** `SUPER_ADMIN`

**Request Body:**

```json
{
  "auditorUserId": "507f1f77bcf86cd799439011",
  "companyOrgId": "507f1f77bcf86cd799439012"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439099",
    "auditorOrgId": "507f1f77bcf86cd799439011",
    "companyOrgId": "507f1f77bcf86cd799439012",
    "status": "ACTIVE"
  }
}
```

### 5.2 List Assignments (Paginated)

```
GET /assignment/listAssignments
```

**Roles:** `SUPER_ADMIN`

| Param    | Type    | Default     | Description                                |
|----------|---------|-------------|--------------------------------------------|
| `page`   | integer | `1`         | Page number                                |
| `limit`  | integer | `20`        | Items per page (1–100)                     |
| `search` | string  | —           | Search term                                |
| `sortBy` | string  | `createdAt` | `createdAt`, `assignedAt`, `status`        |
| `order`  | string  | `desc`      | `asc` or `desc`                            |

**Response (200):**

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "507f1f77bcf86cd799439099",
        "auditorOrgId": "507f1f77bcf86cd799439011",
        "companyOrgId": "507f1f77bcf86cd799439012",
        "status": "ACTIVE"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

### 5.3 Get Assignment by ID

```
GET /assignment/:id
```

**Roles:** `SUPER_ADMIN`

### 5.4 Update Assignment

```
PUT /assignment/updateAssignment/:id
```

**Roles:** `SUPER_ADMIN`

**Request Body:**

```json
{
  "status": "INACTIVE"
}
```

### 5.5 Delete Assignment

```
DELETE /assignment/deleteAssignment/:id
```

**Roles:** `SUPER_ADMIN`

---

## 6. Invoices

### 6.1 List Invoices (Paginated)

Retrieve a paginated list of invoices with role-based scoping.

```
GET /invoice/list
```

**Roles:** `SUPER_ADMIN`, `REGULATOR`, `AUDITOR`, `COMPANY_MANAGER`

| Param    | Type    | Default     | Description                                                    |
|----------|---------|-------------|----------------------------------------------------------------|
| `page`   | integer | `1`         | Page number                                                    |
| `limit`  | integer | `20`        | Items per page (1–100)                                         |
| `search` | string  | —           | Search by invoice number or issued-to name                     |
| `sortBy` | string  | `createdAt` | `createdAt`, `invoiceNumber`, `invoiceDate`, `totalAmount`, `reviewDecision` |
| `order`  | string  | `desc`      | `asc` or `desc`                                                |
| `orgId`  | string  | —           | Filter by organization ID (SUPER_ADMIN/REGULATOR only)         |

**Scoping rules:**

| Role              | Sees                                    |
|-------------------|-----------------------------------------|
| `SUPER_ADMIN`     | All invoices (optional `orgId` filter)  |
| `REGULATOR`       | All invoices (optional `orgId` filter)  |
| `AUDITOR`         | Invoices from assigned companies only   |
| `COMPANY_MANAGER` | All invoices in their organization      |

**Example:**

```
GET /invoice/list?page=1&limit=10&search=INV&sortBy=invoiceDate&order=desc
```

**Response (200):**

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "507f1f77bcf86cd799439011",
        "invoiceNumber": "INV-2024-001",
        "date": "2024-12-01T00:00:00.000Z",
        "amount": 15000,
        "aiVerdict": {
          "verdict": "clean",
          "riskScore": 12
        },
        "status": "approved",
        "blockchain": "0xabc123def456..."
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

### 6.2 My Invoices (Employee, Paginated)

Retrieve a paginated list of invoices uploaded by the authenticated employee.

```
GET /invoice/my-invoices
```

**Roles:** `COMPANY_USER`

| Param    | Type    | Default     | Description                                                    |
|----------|---------|-------------|----------------------------------------------------------------|
| `page`   | integer | `1`         | Page number                                                    |
| `limit`  | integer | `20`        | Items per page (1–100)                                         |
| `search` | string  | —           | Search by invoice number or issued-to name                     |
| `sortBy` | string  | `createdAt` | `createdAt`, `invoiceNumber`, `invoiceDate`, `totalAmount`, `reviewDecision` |
| `order`  | string  | `desc`      | `asc` or `desc`                                                |

**Response (200):**

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "507f1f77bcf86cd799439011",
        "invoiceNumber": "INV-2024-001",
        "date": "2024-12-01T00:00:00.000Z",
        "amount": 15000,
        "fileName": "invoice-2024-001.pdf",
        "status": "pending",
        "anchorStatus": "anchored",
        "uploadedAt": "2024-12-01T08:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

### 6.3 Get Invoice Detail

Retrieve the full detail of a single invoice. Access is role-scoped — unauthorized users receive `404`.

```
GET /invoice/:id
```

**Roles:** `SUPER_ADMIN`, `REGULATOR`, `AUDITOR`, `COMPANY_MANAGER`, `COMPANY_USER`

**Scoping rules:**

| Role              | Access                                       |
|-------------------|----------------------------------------------|
| `SUPER_ADMIN`     | Any invoice                                  |
| `REGULATOR`       | Any invoice                                  |
| `AUDITOR`         | Invoices from assigned companies only        |
| `COMPANY_MANAGER` | Invoices in their organization only          |
| `COMPANY_USER`    | Only invoices they uploaded                  |

**Example:**

```
GET /invoice/507f1f77bcf86cd799439011
```

**Response (200):**

```json
{
  "ok": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "invoiceNumber": "INV-2024-001",
    "company": "Acme Corporation",
    "invoiceDate": "2024-12-01T00:00:00.000Z",
    "totalAmount": 15000,
    "status": "approved",
    "aiAnalysis": {
      "verdict": "clean",
      "riskScore": 12,
      "summary": "No anomalies detected in billing structure."
    },
    "blockchain": {
      "txHash": "0x1234567890abcdef1234567890abcdef12345678",
      "anchoredAt": "2024-12-01T10:30:00.000Z",
      "ipfsCid": "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
      "fileUrl": "https://gateway.pinata.cloud/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi"
    },
    "review": {
      "reviewer": "Auditor 1",
      "decision": "approved",
      "notes": "All documentation verified. Invoice matches purchase order.",
      "reviewedAt": "2024-12-02T08:00:00.000Z"
    }
  }
}
```

**Blockchain fields:**

| Field     | Description                                                                                      |
|-----------|--------------------------------------------------------------------------------------------------|
| `ipfsCid` | IPFS CID decoded from the Ethereum anchor transaction logs. `null` if not yet anchored or on error. |
| `fileUrl`  | Viewable URL — direct Pinata gateway for PDF; Google Docs Viewer wrapper for DOCX so documents render inline instead of downloading. `null` if CID unavailable. |

**Error Responses:**

| Status | Description                              |
|--------|------------------------------------------|
| `400`  | Invalid invoice ID format                |
| `404`  | Invoice not found or not authorized      |

### 6.4 Upload Invoice

Upload an invoice file for blockchain anchoring. The file is stored on IPFS and its hash is anchored on Ethereum.

```
POST /invoice/upload
```

**Roles:** `COMPANY_MANAGER`, `COMPANY_USER`

**Content-Type:** `multipart/form-data`

| Field  | Type | Required | Description                              |
|--------|------|----------|------------------------------------------|
| `file` | file | Yes      | Invoice file (PDF, image, or document, max 10MB) |

**cURL Example:**

```bash
curl -X POST http://localhost:5000/api/invoice/upload \
  -H "Authorization: Bearer <accessToken>" \
  -F "file=@/path/to/invoice.pdf"
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "originalFilename": "invoice-2024-001.pdf",
    "fileHash": "0x1234567890abcdef...",
    "ipfsCid": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    "txHash": "0xabc123...",
    "anchoredAt": "2026-02-22T12:00:00.000Z",
    "organizationId": "507f1f77bcf86cd799439011",
    "uploadedBy": "507f1f77bcf86cd799439011"
  }
}
```

---

## 7. Blockchain Ledger

### 7.1 Get Ledger (Paginated)

Retrieve all blockchain-anchored invoices. Only invoices with a confirmed anchor transaction are included.

```
GET /blockchain/ledger
```

**Roles:** `SUPER_ADMIN`, `REGULATOR`

| Param    | Type    | Default      | Description                                |
|----------|---------|--------------|--------------------------------------------|
| `page`   | integer | `1`          | Page number                                |
| `limit`  | integer | `20`         | Items per page (1–100)                     |
| `search` | string  | —            | Search by invoice number or transaction hash |
| `sortBy` | string  | `anchoredAt` | `anchoredAt`, `invoiceNumber`              |
| `order`  | string  | `desc`       | `asc` or `desc`                            |

**Example:**

```
GET /blockchain/ledger?page=1&limit=10&search=INV&sortBy=anchoredAt&order=desc
```

**Response (200):**

```json
{
  "ok": true,
  "data": {
    "items": [
      {
        "id": "507f1f77bcf86cd799439011",
        "invoiceNumber": "INV-2024-001",
        "company": "Acme Corporation",
        "transactionHash": "0xabc123def456...",
        "anchoredAt": "2026-02-15T10:30:00.000Z",
        "status": "anchored"
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
}
```

---

## 8. Sessions

Manage active login sessions for the authenticated user.

### 8.1 List Active Sessions

```
GET /session
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "507f1f77bcf86cd799439011",
      "userId": "698db6e438263f5e8f5a8bc3",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
      "createdAt": "2026-02-22T10:00:00.000Z",
      "expiresAt": "2026-02-23T10:00:00.000Z"
    }
  ]
}
```

### 8.2 Get Session Count

```
GET /session/count
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "count": 3
  }
}
```

### 8.3 Revoke All Sessions

Logout from all devices.

```
DELETE /session/all
```

**Response (200):**

```json
{
  "success": true,
  "message": "All sessions revoked"
}
```

### 8.4 Revoke a Specific Session

```
DELETE /session/:sessionId
```

**Response (200):**

```json
{
  "success": true,
  "message": "Session revoked"
}
```

---

## 9. WebSocket (Real-Time Events)

The API provides real-time push notifications via **Socket.IO** (WebSocket). Connected clients receive instant updates when invoices are uploaded, processed, flagged, or when assignments change — without polling.

### 9.1 Connecting

**URL:** `ws://localhost:5000` (same port as the REST API)

**Library:** [`socket.io-client`](https://www.npmjs.com/package/socket.io-client)

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: { token: "<accessToken>" },  // Same JWT used for REST API
  transports: ["websocket"],          // Skip HTTP long-polling
});

socket.on("connect", () => console.log("Connected:", socket.id));
socket.on("connect_error", (err) => console.error("Auth failed:", err.message));
```

**Authentication:** The server validates the JWT on handshake using the same `JWT_SECRET` and token blacklist as REST endpoints. Invalid, expired, or revoked tokens are rejected with a `connect_error`.

### 9.2 Room Assignment (Automatic)

Rooms are assigned **automatically** on connection based on the JWT payload — clients do not need to join rooms manually.

| Room Pattern | Who Joins | Purpose |
|---|---|---|
| `user:{userId}` | Every connected user | Targeted personal notifications |
| `org:{orgId}` | Users with an `orgId` in their JWT | Organization-wide broadcasts |
| `role:SUPER_ADMIN` | Super admins | Platform-wide admin alerts |
| `role:AUDITOR` | Auditors | Flagged invoice alerts |
| `role:REGULATOR` | Regulators | Flagged invoice alerts |

### 9.3 Events Reference

#### Invoice Pipeline Events

| Event | Target Rooms | Payload | When |
|---|---|---|---|
| `invoice:created` | `org:{orgId}` | `{ invoiceId, uploadedBy }` | After a new invoice is uploaded |
| `invoice:anchor:success` | `user:{uploader}`, `org:{orgId}` | `{ invoiceId }` | Blockchain anchoring completed successfully |
| `invoice:anchor:failed` | `user:{uploader}`, `role:SUPER_ADMIN` | `{ invoiceId, error }` | Blockchain anchoring failed (all retries exhausted) |
| `invoice:processing` | `org:{orgId}` | `{ invoiceId }` | AI/OCR processing has started |
| `invoice:ai:complete` | `user:{uploader}`, `org:{orgId}` | `{ invoiceId, aiVerdict, aiRiskScore, riskLevel }` | AI pipeline finished processing |
| `invoice:flagged` | `role:AUDITOR`, `role:SUPER_ADMIN`, `role:REGULATOR` | `{ invoiceId, aiRiskScore, riskLevel }` | AI flagged an invoice as suspicious |
| `invoice:list:invalidate` | `org:{orgId}` | `{ orgId }` | Invoice list data changed — refetch recommended |

#### Assignment Events

| Event | Target Rooms | Payload | When |
|---|---|---|---|
| `assignment:created` | `user:{auditorId}`, `role:SUPER_ADMIN` | `{ assignmentId, companyOrgId }` | New auditor assignment created or reactivated |
| `assignment:updated` | `user:{auditorId}`, `role:SUPER_ADMIN` | `{ assignmentId, status }` | Assignment status or notes changed |
| `assignment:deactivated` | `user:{auditorId}`, `role:SUPER_ADMIN` | `{ assignmentId, companyOrgId }` | Assignment deactivated (soft delete) |

#### Admin List Invalidation Events

| Event | Target Rooms | Payload | When |
|---|---|---|---|
| `user:list:invalidate` | `role:SUPER_ADMIN` | — | A user was created or updated |
| `org:list:invalidate` | `role:SUPER_ADMIN` | — | An organization was created |

### 9.4 Listening for Events

```js
// Invoice finished AI processing
socket.on("invoice:ai:complete", (data) => {
  // data = { invoiceId, aiVerdict, aiRiskScore, riskLevel }
  // → Refetch invoice detail or update UI state
});

// New invoice uploaded in your org
socket.on("invoice:created", (data) => {
  // data = { invoiceId, uploadedBy }
  // → Show toast notification, refetch invoice list
});

// Invoice flagged by AI
socket.on("invoice:flagged", (data) => {
  // data = { invoiceId, aiRiskScore, riskLevel }
  // → Show alert badge, refetch flagged invoices
});

// Invoice list changed — time to refetch
socket.on("invoice:list:invalidate", () => {
  // → Refetch invoice list
});

// Auditor received a new assignment
socket.on("assignment:created", (data) => {
  // data = { assignmentId, companyOrgId }
  // → Show toast, refetch assignments
});

// Admin: user list changed
socket.on("user:list:invalidate", () => {
  // → Refetch user list
});
```

### 9.5 Disconnecting

```js
socket.disconnect();
```

The server automatically cleans up rooms when a client disconnects.

### 9.6 Event Flow Diagram

```
┌──────────────┐     upload      ┌──────────────┐  invoice:created  ┌──────────┐
│   Frontend   │ ──── REST ────► │   Backend    │ ── Socket.IO ──► │ Org Room │
└──────────────┘                 └──────┬───────┘                   └──────────┘
                                        │ BullMQ job
                                        ▼
                                 ┌──────────────┐  invoice:anchor:success
                                 │  Blockchain  │ ── Socket.IO ──► user + org
                                 │  Worker      │
                                 └──────┬───────┘
                                        │ HTTP trigger
                                        ▼
                                 ┌──────────────┐  Redis Pub/Sub   ┌──────────┐
                                 │  AI Service  │ ──────────────► │ Backend  │
                                 │  (Python)    │                  │ Socket   │
                                 └──────────────┘                  │ Layer    │
                                                                   └────┬─────┘
                                                    invoice:ai:complete │
                                                    invoice:flagged     │
                                                                        ▼
                                                                   Connected
                                                                   Clients
```

### 9.7 Notes

- **No polling needed**: Events push instantly when data changes. Use `*:list:invalidate` events as signals to refetch list data.
- **Graceful degradation**: If the WebSocket connection drops, the REST API still works normally. Reconnect and the server re-assigns rooms from the JWT.
- **AI Service bridge**: The AI Service (Python) does not use Socket.IO directly. It publishes events to Redis Pub/Sub (`channel:invoice`), and the Backend's Socket.IO layer subscribes and fans them to clients.
- **Token expiry**: If the JWT expires while connected, the socket remains connected until the next reconnect attempt, which will fail authentication. Handle `connect_error` to redirect to login.

### 9.8 Frontend Implementation Guide (Next.js)

Step-by-step guide for integrating WebSocket into the FinShield Next.js frontend.

#### Step 1: Install dependency

```bash
pnpm add socket.io-client
```

#### Step 2: Add environment variable

Add to `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

#### Step 3: Create socket constants

Create `lib/socket-events.ts` — shared event name constants matching the backend's `SocketEvents`:

```ts
export const SocketEvents = {
  // Invoice pipeline
  INVOICE_CREATED:         "invoice:created",
  INVOICE_ANCHOR_SUCCESS:  "invoice:anchor:success",
  INVOICE_ANCHOR_FAILED:   "invoice:anchor:failed",
  INVOICE_PROCESSING:      "invoice:processing",
  INVOICE_AI_COMPLETE:     "invoice:ai:complete",
  INVOICE_FLAGGED:         "invoice:flagged",
  INVOICE_LIST_INVALIDATE: "invoice:list:invalidate",

  // Assignments
  ASSIGNMENT_CREATED:      "assignment:created",
  ASSIGNMENT_UPDATED:      "assignment:updated",
  ASSIGNMENT_DEACTIVATED:  "assignment:deactivated",

  // Admin list invalidation
  USER_LIST_INVALIDATE:    "user:list:invalidate",
  ORG_LIST_INVALIDATE:     "org:list:invalidate",
} as const;

export type SocketEvent = (typeof SocketEvents)[keyof typeof SocketEvents];
```

#### Step 4: Create the socket hook

Create `hooks/global/use-socket.ts`:

```ts
"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { SocketEvent } from "@/lib/socket-events";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

/**
 * Manages a single Socket.IO connection for the authenticated user.
 * Automatically connects when a token is provided and disconnects on cleanup.
 *
 * @param token - JWT access token (pass null/undefined when logged out)
 * @returns socket ref + on/off helpers
 */
export function useSocket(token: string | null | undefined) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => {
      console.log("[WS] Connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("[WS] Connection error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("[WS] Disconnected:", reason);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  /** Subscribe to a Socket.IO event. Returns an unsubscribe function. */
  const on = useCallback(
    <T = unknown>(event: SocketEvent | string, handler: (data: T) => void) => {
      socketRef.current?.on(event, handler as any);
      return () => {
        socketRef.current?.off(event, handler as any);
      };
    },
    []
  );

  /** Unsubscribe from a Socket.IO event. */
  const off = useCallback(
    (event: SocketEvent | string, handler?: (...args: any[]) => void) => {
      socketRef.current?.off(event, handler);
    },
    []
  );

  return { socket: socketRef, on, off };
}
```

#### Step 5: Export from hooks barrel

Update `hooks/global/index.ts`:

```ts
export { useToast, toast } from "./use-toast";
export { useIsMobile } from "./use-mobile";
export { useSocket } from "./use-socket";
```

Update `hooks/index.ts`:

```ts
export { useToast, toast } from "./global";
export { useIsMobile } from "./global";
export { useSocket } from "./global";
// ...rest of exports
```

#### Step 6: Create an event listener hook

Create `hooks/global/use-socket-event.ts` — a convenience hook for subscribing to a single event inside any component:

```ts
"use client";

import { useEffect } from "react";
import type { SocketEvent } from "@/lib/socket-events";

type SocketRef = { socket: React.RefObject<import("socket.io-client").Socket | null> };

/**
 * Subscribe to a single Socket.IO event. Handles cleanup automatically.
 *
 * @param socketCtx - The return value of useSocket()
 * @param event     - The event name to listen for
 * @param handler   - Callback when the event fires
 */
export function useSocketEvent<T = unknown>(
  socketCtx: SocketRef & { on: (event: string, handler: (data: T) => void) => () => void },
  event: SocketEvent | string,
  handler: (data: T) => void
) {
  useEffect(() => {
    if (!socketCtx.socket.current) return;
    const unsub = socketCtx.on(event, handler);
    return unsub;
  }, [socketCtx, event, handler]);
}
```

#### Step 7: Usage examples

**A) Initialize socket at app level** (e.g., in a layout or auth provider):

```tsx
"use client";

import { useSocket } from "@/hooks";

export function AppProviders({ children }: { children: React.ReactNode }) {
  // Get token from your auth state (context, store, cookies, etc.)
  const token = useAuthToken();
  const socketCtx = useSocket(token);

  return (
    <SocketContext.Provider value={socketCtx}>
      {children}
    </SocketContext.Provider>
  );
}
```

**B) Show toast when an invoice is flagged:**

```tsx
"use client";

import { useContext, useCallback } from "react";
import { SocketContext } from "@/providers/socket-provider";
import { useSocketEvent } from "@/hooks/global/use-socket-event";
import { SocketEvents } from "@/lib/socket-events";
import { toast } from "@/hooks";

interface FlaggedPayload {
  invoiceId: string;
  aiRiskScore: number;
  riskLevel: string;
}

export function FlaggedInvoiceListener() {
  const socketCtx = useContext(SocketContext);

  const handleFlagged = useCallback((data: FlaggedPayload) => {
    toast({
      title: "Invoice Flagged",
      description: `Invoice flagged with risk score ${data.aiRiskScore} (${data.riskLevel})`,
      variant: "destructive",
    });
  }, []);

  useSocketEvent(socketCtx, SocketEvents.INVOICE_FLAGGED, handleFlagged);

  return null; // Render nothing — listener only
}
```

**C) Auto-refetch invoice list when data changes:**

```tsx
"use client";

import { useContext, useCallback } from "react";
import { SocketContext } from "@/providers/socket-provider";
import { useSocketEvent } from "@/hooks/global/use-socket-event";
import { SocketEvents } from "@/lib/socket-events";

export function useInvoiceListSocket(refetchFn: () => void) {
  const socketCtx = useContext(SocketContext);

  const handleInvalidate = useCallback(() => {
    refetchFn();
  }, [refetchFn]);

  // Refetch when any of these events occur
  useSocketEvent(socketCtx, SocketEvents.INVOICE_CREATED, handleInvalidate);
  useSocketEvent(socketCtx, SocketEvents.INVOICE_LIST_INVALIDATE, handleInvalidate);
  useSocketEvent(socketCtx, SocketEvents.INVOICE_AI_COMPLETE, handleInvalidate);
}
```

**D) Show real-time processing status on invoice detail:**

```tsx
"use client";

import { useContext, useCallback, useState } from "react";
import { SocketContext } from "@/providers/socket-provider";
import { useSocketEvent } from "@/hooks/global/use-socket-event";
import { SocketEvents } from "@/lib/socket-events";

interface AiCompletePayload {
  invoiceId: string;
  aiVerdict: "clean" | "flagged";
  aiRiskScore: number;
  riskLevel: string;
}

export function useInvoiceStatus(invoiceId: string) {
  const socketCtx = useContext(SocketContext);
  const [status, setStatus] = useState<string>("idle");
  const [aiResult, setAiResult] = useState<AiCompletePayload | null>(null);

  useSocketEvent(socketCtx, SocketEvents.INVOICE_ANCHOR_SUCCESS, 
    useCallback((data: { invoiceId: string }) => {
      if (data.invoiceId === invoiceId) setStatus("anchored");
    }, [invoiceId])
  );

  useSocketEvent(socketCtx, SocketEvents.INVOICE_PROCESSING,
    useCallback((data: { invoiceId: string }) => {
      if (data.invoiceId === invoiceId) setStatus("processing");
    }, [invoiceId])
  );

  useSocketEvent(socketCtx, SocketEvents.INVOICE_AI_COMPLETE,
    useCallback((data: AiCompletePayload) => {
      if (data.invoiceId === invoiceId) {
        setStatus("complete");
        setAiResult(data);
      }
    }, [invoiceId])
  );

  return { status, aiResult };
}
```

#### Step 8: Recommended file structure

After implementation, the frontend socket files should look like:

```
FRONTEND/
  lib/
    socket-events.ts          ← Event name constants
  hooks/
    global/
      use-socket.ts           ← Core socket connection hook
      use-socket-event.ts     ← Single-event listener hook
      index.ts                ← Updated exports
    index.ts                  ← Updated exports
  providers/
    socket-provider.tsx       ← React context for socket (optional)
```

---

## 10. Pagination

All list endpoints support a consistent pagination interface.

### Query Parameters

| Parameter | Type    | Default     | Range   | Description               |
|-----------|---------|-------------|---------|---------------------------|
| `page`    | integer | `1`         | ≥ 1     | Current page number       |
| `limit`   | integer | `20`        | 1–100   | Items per page            |
| `search`  | string  | —           | ≤ 100   | Free-text search filter   |
| `sortBy`  | string  | `createdAt` | varies  | Sort field (endpoint-specific) |
| `order`   | string  | `desc`      | —       | `asc` or `desc`           |

### Response Shape

All paginated endpoints return:

```json
{
  "ok": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "total": 42,
      "page": 1,
      "limit": 20,
      "totalPages": 3
    }
  }
}
```

### `sortBy` Options per Endpoint

| Endpoint                              | Allowed `sortBy` Values                              |
|---------------------------------------|------------------------------------------------------|
| `GET /organization/listOrganizations` | `createdAt`, `name`, `type`                          |
| `GET /user/listUsers`                 | `createdAt`, `username`, `email`, `role`, `lastLoginAt` |
| `GET /user/listEmployees`             | `createdAt`, `username`, `email`                     |
| `GET /assignment/listAssignments`     | `createdAt`, `assignedAt`, `status`                  |
| `GET /invoice/list`                   | `createdAt`, `invoiceNumber`, `invoiceDate`, `totalAmount`, `reviewDecision` |
| `GET /invoice/my-invoices`            | `createdAt`, `invoiceNumber`, `invoiceDate`, `totalAmount`, `reviewDecision` |
| `GET /blockchain/ledger`              | `anchoredAt`, `invoiceNumber`                        |

### Pagination Tips

- Omit all query parameters to get the first 20 items sorted by `createdAt` descending.
- Use `search` for server-side filtering — it searches relevant text fields per endpoint.
- Invalid `sortBy` values are rejected with a `400` validation error.
- Page numbers beyond `totalPages` return an empty `items` array.

---

## 11. Error Handling

### Standard Error Response

```json
{
  "ok": false,
  "error": {
    "message": "Human-readable error description",
    "code": "ERROR_CODE"
  }
}
```

### Common HTTP Status Codes

| Status | Meaning                                                   |
|--------|-----------------------------------------------------------|
| `200`  | Success                                                   |
| `201`  | Resource created                                          |
| `400`  | Bad request — validation error or invalid input           |
| `401`  | Unauthorized — missing/invalid/expired JWT                |
| `403`  | Forbidden — insufficient role or portal permissions       |
| `404`  | Resource not found                                        |
| `413`  | Payload too large (file uploads > 10MB)                   |
| `500`  | Internal server error                                     |

### Validation Errors (Zod)

When request validation fails, the response includes field-level details:

```json
{
  "ok": false,
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "path": ["body", "email"],
        "message": "Invalid email"
      }
    ]
  }
}
```

---

## 12. Role Permissions Matrix

| Endpoint                              | SUPER_ADMIN | AUDITOR | REGULATOR | COMPANY_MANAGER | COMPANY_USER |
|---------------------------------------|:-----------:|:-------:|:---------:|:---------------:|:------------:|
| `POST /auth/login`                    | ✅          | ✅      | ✅        | ✅              | ✅           |
| `POST /auth/login/mfa`                | ✅          | ✅      | ✅        | ✅              | ✅           |
| `POST /auth/refresh`                  | ✅          | ✅      | ✅        | ✅              | ✅           |
| `POST /auth/logout`                   | ✅          | ✅      | ✅        | ✅              | ✅           |
| `POST /auth/mfa/setup`                | ✅          | ✅      | ✅        | ✅              | ✅           |
| `POST /auth/mfa/enable`               | ✅          | ✅      | ✅        | ✅              | ✅           |
| `POST /auth/mfa/disable`              | ✅          | ✅      | ✅        | ✅              | ✅           |
| `GET  /auth/me`                       | ✅          | ✅      | ✅        | ✅              | ✅           |
| `POST /auth/change-password`          | ✅          | ✅      | ✅        | ✅              | ✅           |
| `GET  /health`                        | 🔓          | 🔓      | 🔓        | 🔓              | 🔓           |
| `POST /organization/createOrganization` | ✅        | —       | —         | —               | —            |
| `GET  /organization/listOrganizations` | ✅         | —       | —         | —               | —            |
| `GET  /organization/getOrganization/:id` | ✅       | —       | —         | ✅¹             | —            |
| `POST /user/createUser`               | ✅          | —       | —         | ✅²             | —            |
| `GET  /user/listUsers`                | ✅          | —       | —         | ✅³             | —            |
| `GET  /user/listEmployees`            | —           | —       | —         | ✅              | —            |
| `GET  /user/:id`                      | ✅          | —       | —         | ✅³             | —            |
| `PUT  /user/updateUser/:id`           | ✅          | —       | —         | ✅²             | —            |
| `POST /assignment/createAssignment`   | ✅          | —       | —         | —               | —            |
| `GET  /assignment/listAssignments`    | ✅          | —       | —         | —               | —            |
| `GET  /assignment/:id`                | ✅          | —       | —         | —               | —            |
| `PUT  /assignment/updateAssignment/:id` | ✅        | —       | —         | —               | —            |
| `DELETE /assignment/deleteAssignment/:id` | ✅      | —       | —         | —               | —            |
| `POST /invoice/upload`                | —           | —       | —         | ✅              | ✅           |
| `GET  /invoice/list`                  | ✅          | ✅⁴     | ✅        | ✅⁵             | —            |
| `GET  /invoice/my-invoices`           | —           | —       | —         | —               | ✅           |
| `GET  /invoice/:id`                   | ✅          | ✅⁴     | ✅        | ✅⁵             | ✅⁶          |
| `GET  /blockchain/ledger`             | ✅          | —       | ✅        | —               | —            |
| `GET  /session`                       | ✅          | ✅      | ✅        | ✅              | ✅           |
| `GET  /session/count`                 | ✅          | ✅      | ✅        | ✅              | ✅           |
| `DELETE /session/all`                 | ✅          | ✅      | ✅        | ✅              | ✅           |
| `DELETE /session/:sessionId`          | ✅          | ✅      | ✅        | ✅              | ✅           |

> 🔓 = Public (no auth required)
> ¹ Own organization only
> ² COMPANY_USER accounts in own org only
> ³ Own organization's users only
> ⁴ Assigned companies only
> ⁵ Own organization's invoices only
> ⁶ Own uploaded invoices only
