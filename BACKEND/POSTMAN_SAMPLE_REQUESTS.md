# Postman Sample Requests - Quick Reference

## Quick Copy-Paste Ready Requests

### Health Check
```
GET http://localhost:3000/health
```

---

### Auth Endpoints

#### 1. Login
```
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "email": "admin@finshield.com",
  "password": "Admin123!@#"
}
```

#### 2. Get Current User (Me)
```
GET http://localhost:3000/auth/me
Authorization: Bearer YOUR_TOKEN_HERE
```

#### 3. Change Password
```
POST http://localhost:3000/auth/change-password
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "currentPassword": "Admin123!@#",
  "newPassword": "NewSecurePassword123!"
}
```

---

### Organization Endpoints

#### 1. Create Organization (SUPER_ADMIN only)
```
POST http://localhost:3000/organization/createOrganization
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "type": "company",
  "name": "Acme Corporation",
  "status": "active"
}
```

#### 2. List Organizations (SUPER_ADMIN only)
```
GET http://localhost:3000/organization/listOrganizations
Authorization: Bearer YOUR_TOKEN_HERE
```

#### 3. Get Organization by ID
```
GET http://localhost:3000/organization/getOrganization/ORGANIZATION_ID_HERE
Authorization: Bearer YOUR_TOKEN_HERE
```

---

### User Endpoints

#### 1. Create User (SUPER_ADMIN or COMPANY_MANAGER)
```
POST http://localhost:3000/user/createUser
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "orgId": "ORGANIZATION_ID_HERE",
  "portal": "user",
  "role": "COMPANY_MANAGER",
  "email": "manager@acme.com",
  "username": "manager_user",
  "password": "SecurePassword123",
  "mustChangePassword": true
}
```

#### 2. List Users (SUPER_ADMIN only)
```
GET http://localhost:3000/user/listUsers
Authorization: Bearer YOUR_TOKEN_HERE
```

**With Organization Filter:**
```
GET http://localhost:3000/user/listUsers?Id=ORGANIZATION_ID_HERE
Authorization: Bearer YOUR_TOKEN_HERE
```

#### 3. Get User by ID
```
GET http://localhost:3000/user/USER_ID_HERE
Authorization: Bearer YOUR_TOKEN_HERE
```

#### 4. Update User Status (SUPER_ADMIN only)

**Disable User:**
```
PUT http://localhost:3000/user/updateUser/USER_ID_HERE
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "status": "disabled",
  "reason": "Violation of company policy"
}
```

**Enable User:**
```
PUT http://localhost:3000/user/updateUser/USER_ID_HERE
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "status": "active"
}
```

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

---

## Testing Checklist

1. ✅ Health Check - Verify server is running
2. ✅ Login - Get authentication token
3. ✅ Change Password (if required) - Update password and get new token
4. ✅ Get Current User - Verify authentication works
5. ✅ Create Organization (SUPER_ADMIN) - Create test organization
6. ✅ List Organizations (SUPER_ADMIN) - Verify organization was created
7. ✅ Get Organization - Get organization details
8. ✅ Create User - Create test user
9. ✅ List Users (SUPER_ADMIN) - Verify user was created
10. ✅ Get User - Get user details
11. ✅ Disable User (SUPER_ADMIN) - Test disable functionality
12. ✅ Enable User (SUPER_ADMIN) - Test enable functionality

---

## Environment Variables Setup

In Postman, create environment variables:

- `base_url` = `http://localhost:3000` (or your port)
- `token` = (will be set after login)
- `org_id` = (will be set after creating organization)
- `user_id` = (will be set after creating user)

Then use in requests like:
```
GET {{base_url}}/auth/me
Authorization: Bearer {{token}}
```

