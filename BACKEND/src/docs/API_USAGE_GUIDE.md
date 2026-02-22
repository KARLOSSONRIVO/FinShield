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
9. [Pagination](#9-pagination)
10. [Error Handling](#10-error-handling)
11. [Role Permissions Matrix](#11-role-permissions-matrix)

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

### 6.1 Upload Invoice

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

## 9. Pagination

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
| `GET /blockchain/ledger`              | `anchoredAt`, `invoiceNumber`                        |

### Pagination Tips

- Omit all query parameters to get the first 20 items sorted by `createdAt` descending.
- Use `search` for server-side filtering — it searches relevant text fields per endpoint.
- Invalid `sortBy` values are rejected with a `400` validation error.
- Page numbers beyond `totalPages` return an empty `items` array.

---

## 10. Error Handling

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

## 11. Role Permissions Matrix

| Endpoint                              | SUPER_ADMIN | AUDITOR | REGULATOR | COMPANY_MANAGER | COMPANY_USER |
|---------------------------------------|:-----------:|:-------:|:---------:|:---------------:|:------------:|
| `POST /auth/login`                    | ✅          | ✅      | ✅        | ✅              | ✅           |
| `POST /auth/refresh`                  | ✅          | ✅      | ✅        | ✅              | ✅           |
| `POST /auth/logout`                   | ✅          | ✅      | ✅        | ✅              | ✅           |
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
| `GET  /blockchain/ledger`             | ✅          | —       | ✅        | —               | —            |
| `GET  /session`                       | ✅          | ✅      | ✅        | ✅              | ✅           |
| `GET  /session/count`                 | ✅          | ✅      | ✅        | ✅              | ✅           |
| `DELETE /session/all`                 | ✅          | ✅      | ✅        | ✅              | ✅           |
| `DELETE /session/:sessionId`          | ✅          | ✅      | ✅        | ✅              | ✅           |

> 🔓 = Public (no auth required)
> ¹ Own organization only
> ² COMPANY_USER accounts in own org only
> ³ Own organization's users only
