# Postman Sample Requests - Quick Reference

## Quick Copy-Paste Ready Requests

### Health Check
```
GET http://localhost:5000/health
```

---

### Auth Endpoints

#### 1. Login
```
POST http://localhost:5000/auth/login
Content-Type: application/json

{
  "email": "admin@finshield.com",
  "password": "Admin123!@#"
}
```

**Response Example:**
```json
{
  "ok": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "a1b2c3d4e5f6...",
    "expiresIn": 3600,
    "user": {
      "id": "USER_ID",
      "email": "admin@finshield.com",
      "username": "super_admin",
      "role": "SUPER_ADMIN",
      "status": "active",
      "mustChangePassword": true
    },
    "mustChangePassword": true
  }
}
```

#### 2. Refresh Token
```
POST http://localhost:5000/auth/refresh
Content-Type: application/json

{
  "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
}
```

**Response Example:**
```json
{
  "ok": true,
  "data": {
    "accessToken": "NEW_ACCESS_TOKEN",
    "refreshToken": "NEW_REFRESH_TOKEN",
    "expiresIn": 3600,
    "user": { ... }
  }
}
```

#### 3. Logout
```
POST http://localhost:5000/auth/logout
Authorization: Bearer YOUR_ACCESS_TOKEN_HERE
Content-Type: application/json

{
  "refreshToken": "YOUR_REFRESH_TOKEN_HERE",
  "logoutAll": false
}
```

**Response Example:**
```json
{
  "ok": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

**Note:** Set `logoutAll: true` to logout from all devices.

#### 4. Get Current User (Me)
```
GET http://localhost:5000/auth/me
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response Example:**
```json
{
  "ok": true,
  "data": {
    "id": "USER_ID",
    "email": "user@example.com",
    "username": "username",
    "role": "COMPANY_USER",
    "status": "active",
    "orgId": "ORG_ID"
  }
}
```

#### 5. Change Password
```
POST http://localhost:5000/auth/change-password
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "currentPassword": "Admin123!@#",
  "newPassword": "NewSecurePassword123!"
}
```

**Response Example:**
```json
{
  "ok": true,
  "data": {
    "accessToken": "NEW_ACCESS_TOKEN",
    "refreshToken": "NEW_REFRESH_TOKEN",
    "expiresIn": 3600,
    "user": { ... },
    "mustChangePassword": false
  }
}
```

**Note:** Returns new tokens after password change. All other sessions are revoked.

#### 6. Get Active Sessions
```
GET http://localhost:5000/auth/sessions
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response Example:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "SESSION_ID",
      "createdAt": "2026-01-19T10:00:00.000Z",
      "userAgent": "Mozilla/5.0...",
      "createdByIp": "192.168.1.1",
      "expiresAt": "2026-01-26T10:00:00.000Z"
    }
  ]
}
```

#### 7. Revoke Session
```
DELETE http://localhost:5000/auth/sessions/SESSION_ID_HERE
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response Example:**
```json
{
  "ok": true,
  "data": {
    "message": "Session revoked successfully"
  }
}
```

---

### Organization Endpoints

#### 1. Create Organization (SUPER_ADMIN only)
```
POST http://localhost:5000/organization/createOrganization
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "type": "company",
  "name": "Acme Corporation",
  "status": "active"
}
```

**Response Example:**
```json
{
  "ok": true,
  "data": {
    "id": "ORG_ID",
    "type": "company",
    "name": "Acme Corporation",
    "status": "active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### 2. List Organizations (SUPER_ADMIN only)
```
GET http://localhost:5000/organization/listOrganizations
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response Example:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "ORG_ID",
      "type": "company",
      "name": "Acme Corporation",
      "status": "active"
    }
  ]
}
```

#### 3. Get Organization by ID
```
GET http://localhost:5000/organization/getOrganization/ORGANIZATION_ID_HERE
Authorization: Bearer YOUR_TOKEN_HERE
```

**Note:** 
- SUPER_ADMIN can access any organization
- Other users can only access their own organization (enforced by service)

---

### User Endpoints

#### 1. Create User (SUPER_ADMIN or COMPANY_MANAGER)
```
POST http://localhost:5000/user/createUser
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "orgId": "ORGANIZATION_ID_HERE",
  "role": "COMPANY_MANAGER",
  "email": "manager@acme.com",
  "username": "manager_user",
  "password": "SecurePassword123",
  "mustChangePassword": true
}
```

**Note:** 
- `portal` field is automatically derived from `role` (no longer required in request)
- `orgId` is optional for SUPER_ADMIN, AUDITOR, and REGULATOR roles
- `orgId` is required for COMPANY_MANAGER and COMPANY_USER roles
- COMPANY_MANAGER can only create COMPANY_USER accounts
- SUPER_ADMIN can create any role

**Response Example:**
```json
{
  "ok": true,
  "data": {
    "id": "USER_ID",
    "email": "manager@acme.com",
    "username": "manager_user",
    "role": "COMPANY_MANAGER",
    "status": "active",
    "orgId": "ORG_ID"
  }
}
```

#### 2. List Users (SUPER_ADMIN only)
```
GET http://localhost:5000/user/listUsers
Authorization: Bearer YOUR_TOKEN_HERE
```

**With Organization Filter:**
```
GET http://localhost:5000/user/listUsers?Id=ORGANIZATION_ID_HERE
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response Example:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "USER_ID",
      "email": "user@example.com",
      "username": "username",
      "role": "COMPANY_USER",
      "status": "active",
      "orgId": "ORG_ID"
    }
  ]
}
```

#### 3. Get User by ID
```
GET http://localhost:5000/user/USER_ID_HERE
Authorization: Bearer YOUR_TOKEN_HERE
```

**Note:**
- SUPER_ADMIN can access any user
- COMPANY_MANAGER can only access users in their organization
- Other roles have restricted access (enforced by service)

#### 4. Update User Status (SUPER_ADMIN only)

**Disable User:**
```
PUT http://localhost:5000/user/updateUser/USER_ID_HERE
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "status": "disabled",
  "reason": "Violation of company policy"
}
```

**Enable User:**
```
PUT http://localhost:5000/user/updateUser/USER_ID_HERE
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "status": "active"
}
```

**Note:** `reason` is required when disabling a user, optional when enabling.

---

### Assignment Endpoints

#### 1. Create Assignment (SUPER_ADMIN only)
```
POST http://localhost:5000/assignment/createAssignment
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "companyOrgId": "COMPANY_ORG_ID_HERE",
  "auditorUserId": "AUDITOR_USER_ID_HERE",
  "status": "active",
  "notes": "Initial assignment"
}
```

**Note:**
- One auditor can be assigned to multiple companies
- One auditor can only be assigned once to the same company (duplicate prevention)
- If an inactive assignment exists, it will be reactivated instead of creating a new one

**Response Example:**
```json
{
  "ok": true,
  "data": {
    "id": "ASSIGNMENT_ID",
    "companyOrgId": "COMPANY_ORG_ID",
    "auditorUserId": "AUDITOR_USER_ID",
    "status": "active",
    "assignedByUserId": "SUPER_ADMIN_USER_ID",
    "assignedAt": "2024-01-01T00:00:00.000Z",
    "notes": "Initial assignment",
    "company": {
      "id": "COMPANY_ORG_ID",
      "name": "Acme Corporation",
      "type": "company"
    },
    "auditor": {
      "id": "AUDITOR_USER_ID",
      "email": "auditor@example.com",
      "username": "auditor_john",
      "role": "AUDITOR"
    }
  }
}
```

#### 2. List All Assignments (SUPER_ADMIN only)
```
GET http://localhost:5000/assignment/listAssignments
Authorization: Bearer YOUR_TOKEN_HERE
```

**Response Example:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "ASSIGNMENT_ID",
      "companyOrgId": "COMPANY_ORG_ID",
      "auditorUserId": "AUDITOR_USER_ID",
      "status": "active",
      "company": { ... },
      "auditor": { ... }
    }
  ]
}
```

#### 3. Get Assignment by ID (SUPER_ADMIN only)
```
GET http://localhost:5000/assignment/ASSIGNMENT_ID_HERE
Authorization: Bearer YOUR_TOKEN_HERE
```

#### 4. Update Assignment (SUPER_ADMIN only)
```
PUT http://localhost:5000/assignment/updateAssignment/ASSIGNMENT_ID_HERE
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "status": "inactive",
  "notes": "Updated notes"
}
```

**Note:** Both `status` and `notes` are optional. Only provided fields will be updated.

#### 5. Delete Assignment (SUPER_ADMIN only - Soft Delete)
```
DELETE http://localhost:5000/assignment/deleteAssignment/ASSIGNMENT_ID_HERE
Authorization: Bearer YOUR_TOKEN_HERE
```

**Note:** This performs a soft delete by setting status to "inactive". The assignment record remains in the database.

---

### Invoice Endpoints

#### 1. Upload Invoice (COMPANY_MANAGER or COMPANY_USER only)
```
POST http://localhost:5000/invoice/upload
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: multipart/form-data

file: [SELECT FILE]
```

**Requirements:**
- User must be `COMPANY_MANAGER` or `COMPANY_USER`
- User must have an `orgId` (belong to a company)
- File must be uploaded as `multipart/form-data` with field name `"file"`
- Maximum file size: **10MB**
- Allowed file types: PDF, JPEG, JPG, PNG, XLSX, XLS
- File is automatically uploaded to IPFS and anchored on blockchain

**Validation:**
- File must exist and not be empty
- File buffer must be valid
- File size must not exceed 10MB
- File type must be in allowed MIME types (if provided)

**Response Example (Success):**
```json
{
  "ok": true,
  "data": {
    "id": "69673aa318aa5324ff1b8219",
    "ipfsCid": "bafkreieca6ta7hlsnicpnh6diogmoibgoylos6iu2dgjkqm26cvrnt5vae",
    "fileHashSha256": "8207a60f9d726a04f69fc3438cc720267616e97914d0cc95419af0ab16cfb501",
    "anchorTxHash": "0x4f87603419252c10870c0bfe60c04252eaa82fb2ebab199b736c23726d690732",
    "anchorBlockNumber": 10040190,
    "anchoredAt": "2026-01-14T06:41:59.901Z",
    "anchorStatus": "anchored",
    "anchorError": null,
    "createdAt": "2026-01-14T06:41:39.163Z",
    "updatedAt": "2026-01-14T06:41:59.901Z"
  }
}
```

**Response Example (Failed Anchor):**
```json
{
  "ok": true,
  "data": {
    "id": "INVOICE_ID",
    "ipfsCid": "QmXxxx...",
    "fileHashSha256": "abc123...",
    "anchorTxHash": null,
    "anchorBlockNumber": null,
    "anchoredAt": null,
    "anchorStatus": "failed",
    "anchorError": "Error message here",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 MISSING_FILE` - No file provided
- `400 MISSING_FILE_BUFFER` - File buffer is invalid
- `400 FILE_TOO_LARGE` - File exceeds 10MB limit
- `400 EMPTY_FILE` - File is empty
- `400 INVALID_FILE_TYPE` - File type not allowed
- `401 UNAUTHORIZED` - Not authenticated
- `403 FORBIDDEN` - User role not allowed (must be COMPANY_MANAGER or COMPANY_USER)
- `400 MISSING_COMPANY_ORG_ID` - User doesn't belong to a company

**Using cURL:**
```bash
curl -X POST http://localhost:5000/invoice/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@/path/to/invoice.pdf"
```

**Using PowerShell:**
```powershell
$token = "YOUR_TOKEN_HERE"
$filePath = "C:\path\to\invoice.pdf"
$uri = "http://localhost:5000/invoice/upload"

$form = @{
    file = Get-Item -Path $filePath
}

Invoke-RestMethod -Uri $uri -Method Post -Headers @{Authorization="Bearer $token"} -Form $form
```

**What Happens:**
1. File is validated (size, type, content)
2. File is uploaded to IPFS (decentralized storage)
3. File hash (SHA256) is calculated
4. Invoice record is created in MongoDB with `anchorStatus: "pending"`
5. Invoice metadata is anchored on blockchain (Ethereum)
6. Invoice record is updated with blockchain transaction details
7. If blockchain anchoring fails, `anchorStatus` is set to `"failed"` with error message

---

## Sample Data Examples

### Platform Organization Example
```json
{
  "type": "platform",
  "name": "FinShield Platform",
  "status": "active"
}
```

### Company Organization Example
```json
{
  "type": "company",
  "name": "Acme Corporation",
  "status": "active"
}
```

### Platform User Examples

**SUPER_ADMIN:**
```json
{
  "orgId": "PLATFORM_ORG_ID",
  "portal": "admin",
  "role": "SUPER_ADMIN",
  "email": "admin@platform.com",
  "username": "superadmin",
  "password": "Admin123!@#"
}
```

**AUDITOR:**
```json
{
  "orgId": "PLATFORM_ORG_ID",
  "portal": "admin",
  "role": "AUDITOR",
  "email": "auditor@platform.com",
  "username": "auditor_john",
  "password": "AuditPass123"
}
```

**REGULATOR:**
```json
{
  "orgId": "PLATFORM_ORG_ID",
  "portal": "admin",
  "role": "REGULATOR",
  "email": "regulator@platform.com",
  "username": "regulator_jane",
  "password": "Regulator123"
}
```

### Company User Examples

**COMPANY_MANAGER:**
```json
{
  "orgId": "COMPANY_ORG_ID",
  "portal": "user",
  "role": "COMPANY_MANAGER",
  "email": "manager@acme.com",
  "username": "manager_user",
  "password": "Manager123"
}
```

**COMPANY_USER:**
```json
{
  "orgId": "COMPANY_ORG_ID",
  "portal": "user",
  "role": "COMPANY_USER",
  "email": "employee@acme.com",
  "username": "employee_john",
  "password": "Employee123"
}
```

### Assignment Examples

**Create Assignment:**
```json
{
  "companyOrgId": "COMPANY_ORG_ID_HERE",
  "auditorUserId": "AUDITOR_USER_ID_HERE",
  "status": "active",
  "notes": "Assigned for quarterly audit review"
}
```

**Update Assignment:**
```json
{
  "status": "inactive",
  "notes": "Assignment completed - audit review finished"
}
```

---

## Testing Checklist

1. ✅ Health Check - Verify server is running
2. ✅ Login - Get authentication token
3. ✅ Change Password (if required) - Update password and get new token
4. ✅ Get Current User - Verify authentication works
5. ✅ Create Organization (SUPER_ADMIN) - Create test organization
6. ✅ List Organizations (SUPER_ADMIN) - Verify organization was created
7. ✅ Get Organization - Get organization details
8. ✅ Create User - Create test user (including AUDITOR)
9. ✅ List Users (SUPER_ADMIN) - Verify user was created
10. ✅ Get User - Get user details
11. ✅ Disable User (SUPER_ADMIN) - Test disable functionality
12. ✅ Enable User (SUPER_ADMIN) - Test enable functionality
13. ✅ Create Assignment (SUPER_ADMIN) - Assign auditor to company
14. ✅ List Assignments (SUPER_ADMIN) - Verify assignment was created
15. ✅ Get Assignment (SUPER_ADMIN) - Get assignment details
16. ✅ Update Assignment (SUPER_ADMIN) - Test update functionality
17. ✅ Delete Assignment (SUPER_ADMIN) - Test delete functionality
18. ✅ Upload Invoice (COMPANY_MANAGER or COMPANY_USER) - Upload invoice file to IPFS and anchor on blockchain

---

## Environment Variables Setup

In Postman, create environment variables:

- `base_url` = `http://localhost:5000` (or your port - default is 5000)
- `token` = (will be set after login)
- `org_id` = (will be set after creating organization)
- `user_id` = (will be set after creating user)
- `auditor_id` = (will be set after creating auditor user)
- `assignment_id` = (will be set after creating assignment)
- `invoice_id` = (will be set after uploading invoice)

Then use in requests like:
```
GET {{base_url}}/auth/me
Authorization: Bearer {{token}}
```

## Port Configuration

**Default Port:** The backend runs on port `5000` by default (configured via `PORT` environment variable).

**Health Check:** Always verify the server is running:
```
GET http://localhost:5000/health
```

## File Storage Information

**Invoice files are stored on IPFS (InterPlanetary File System), not on the local filesystem.**

- Files are uploaded to your IPFS node (configured via `IPFS_API_URL`)
- The IPFS CID (Content Identifier) is stored in MongoDB
- Files are automatically pinned to prevent garbage collection
- File metadata (hash, CID) is anchored on blockchain for tamper-proof verification
- To view files in IPFS Desktop, ensure `IPFS_API_URL` points to your IPFS Desktop node: `http://127.0.0.1:5001`
