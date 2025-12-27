# Postman Testing Guide - FinShield API

## Base URL
```
http://localhost:<PORT>
```
**Note:** Replace `<PORT>` with your server port (check your `.env` file or server logs)

## Authentication
Most endpoints require authentication. Make sure to include your auth token in the headers:
```
Authorization: Bearer <your_token>
```

---

## Health Check Endpoint

### Check Server Status
**Method:** `GET`  
**URL:** `/health`  
**Headers:** None (Public endpoint)

**Response:**
```json
{
  "ok": true,
  "status": "healthy"
}
```

---

## Auth Endpoints

### 1. Login
**Method:** `POST`  
**URL:** `/auth/login`  
**Headers:**
```json
{
  "Content-Type": "application/json"
}
```
**Request Body:**
```json
{
  "email": "admin@finshield.com",
  "password": "Admin123!@#"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "...",
      "email": "admin@finshield.com",
      "username": "super_admin",
      "role": "SUPER_ADMIN",
      ...
    },
    "mustChangePassword": true
  }
}
```

**Note:** Save the `token` from the response to use in other requests. If `mustChangePassword` is `true`, you must change the password before accessing other endpoints.

---

### 2. Get Current User (Me)
**Method:** `GET`  
**URL:** `/auth/me`  
**Headers:**
```json
{
  "Authorization": "Bearer <your_token>"
}
```
**Request Body:** None

**Response:**
```json
{
  "ok": true,
  "data": {
    "_id": "...",
    "email": "admin@finshield.com",
    "username": "super_admin",
    "role": "SUPER_ADMIN",
    "orgId": "...",
    ...
  }
}
```

---

### 3. Change Password
**Method:** `POST`  
**URL:** `/auth/change-password`  
**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <your_token>"
}
```
**Request Body:**
```json
{
  "currentPassword": "Admin123!@#",
  "newPassword": "NewSecurePassword123!"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "...",
      "email": "admin@finshield.com",
      ...
    },
    "mustChangePassword": false
  }
}
```

**Note:** After changing password, you'll receive a new token. Use this new token for subsequent requests.

---

## Organization Endpoints

### 1. Create Organization
**Method:** `POST`  
**URL:** `/organization/createOrganization`  
**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <your_token>"
}
```
**Request Body:**
```json
{
  "type": "platform",
  "name": "FinTech Platform Inc",
  "status": "active"
}
```

**Alternative (status is optional):**
```json
{
  "type": "company",
  "name": "Acme Corporation"
}
```

**Valid Values:**
- `type`: `"platform"` or `"company"`
- `status`: `"active"` or `"inactive"` (optional, defaults to "active")

---

### 2. List Organizations
**Method:** `GET`  
**URL:** `/organization/listOrganizations`  
**Headers:**
```json
{
  "Authorization": "Bearer <your_token>"
}
```
**Request Body:** None

---

### 3. Get Organization by ID
**Method:** `GET`  
**URL:** `/organization/getOrganization/:id`  
**Example:** `/organization/getOrganization/507f1f77bcf86cd799439011`  
**Headers:**
```json
{
  "Authorization": "Bearer <your_token>"
}
```
**Request Body:** None

---

## User Endpoints

### 1. Create User
**Method:** `POST`  
**URL:** `/user/createUser`  
**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <your_token>"
}
```
**Request Body:**
```json
{
  "orgId": "507f1f77bcf86cd799439011",
  "portal": "admin",
  "role": "SUPER_ADMIN",
  "email": "admin@example.com",
  "username": "admin_user",
  "password": "SecurePassword123",
  "mustChangePassword": true
}
```

**Alternative (mustChangePassword is optional):**
```json
{
  "orgId": "507f1f77bcf86cd799439011",
  "portal": "user",
  "role": "COMPANY_MANAGER",
  "email": "manager@acme.com",
  "username": "manager_user",
  "password": "SecurePassword123"
}
```

**Valid Values:**
- `portal`: `"admin"` or `"user"`
- `role`: `"SUPER_ADMIN"`, `"AUDITOR"`, `"REGULATOR"`, `"COMPANY_MANAGER"`, or `"COMPANY_USER"`
- `email`: Valid email address
- `username`: Minimum 3 characters
- `password`: Minimum 6 characters
- `mustChangePassword`: `true` or `false` (optional)

**More Examples:**

**Platform User (Auditor):**
```json
{
  "orgId": "507f1f77bcf86cd799439011",
  "portal": "admin",
  "role": "AUDITOR",
  "email": "auditor@example.com",
  "username": "auditor_john",
  "password": "AuditPass123"
}
```

**Company Employee:**
```json
{
  "orgId": "507f191e810c19729de860ea",
  "portal": "user",
  "role": "COMPANY_USER",
  "email": "employee@acme.com",
  "username": "john_doe",
  "password": "Employee123"
}
```

---

### 2. List Users
**Method:** `GET`  
**URL:** `/user/listUsers` or `/user/listUsers?Id=<orgId>`  
**Example with filter:** `/user/listUsers?Id=507f1f77bcf86cd799439011`  
**Headers:**
```json
{
  "Authorization": "Bearer <your_token>"
}
```
**Request Body:** None

**Query Parameters:**
- `Id` (optional): Filter users by organization ID

---

### 3. Get User by ID
**Method:** `GET`  
**URL:** `/user/:id`  
**Example:** `/user/507f1f77bcf86cd799439012`  
**Headers:**
```json
{
  "Authorization": "Bearer <your_token>"
}
```
**Request Body:** None

---

### 4. Update User Status
**Method:** `PUT`  
**URL:** `/user/updateUser/:id`  
**Example:** `/user/updateUser/507f1f77bcf86cd799439012`  
**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <your_token>"
}
```

**To Disable User (reason is REQUIRED):**
```json
{
  "status": "disabled",
  "reason": "Violation of company policy"
}
```

**To Enable User (reason not needed):**
```json
{
  "status": "active"
}
```

**Valid Values:**
- `status`: `"active"` or `"disabled"`
- `reason`: Required when `status` is `"disabled"` (minimum 2 characters)

---

## Complete Testing Workflow Example

### Initial Setup (Using Seeder)

**Run the seeder to create a super admin:**
```bash
npm run seed:super-admin
```

This will create:
- A platform organization
- A super admin user with default credentials:
  - Email: `admin@finshield.com` (or from `SUPER_ADMIN_EMAIL` env var)
  - Username: `super_admin` (or from `SUPER_ADMIN_USERNAME` env var)
  - Password: `Admin123!@#` (or from `SUPER_ADMIN_PASSWORD` env var)

---

### Testing Workflow

1. **Login:**
   ```
   POST /auth/login
   {
     "email": "admin@finshield.com",
     "password": "Admin123!@#"
   }
   ```
   *Save the token from the response*

2. **Change Password (if mustChangePassword is true):**
   ```
   POST /auth/change-password
   Authorization: Bearer <token_from_step_1>
   {
     "currentPassword": "Admin123!@#",
     "newPassword": "YourNewSecurePassword123!"
   }
   ```
   *Save the new token from the response*

3. **Get Current User:**
   ```
   GET /auth/me
   Authorization: Bearer <token>
   ```

4. **Create Organization (SUPER_ADMIN only):**
   ```
   POST /organization/createOrganization
   Authorization: Bearer <token>
   {
     "type": "company",
     "name": "Acme Corporation"
   }
   ```
   *Save the organization ID from the response*

5. **Create User:**
   ```
   POST /user/createUser
   Authorization: Bearer <token>
   {
     "orgId": "<organization_id_from_step_4>",
     "portal": "user",
     "role": "COMPANY_MANAGER",
     "email": "manager@acme.com",
     "username": "manager_user",
     "password": "SecurePassword123"
   }
   ```
   *Save the user ID from the response*

6. **List All Users (SUPER_ADMIN only):**
   ```
   GET /user/listUsers
   Authorization: Bearer <token>
   ```

7. **Get Specific User:**
   ```
   GET /user/<user_id>
   Authorization: Bearer <token>
   ```

8. **Disable User (SUPER_ADMIN only):**
   ```
   PUT /user/updateUser/<user_id>
   Authorization: Bearer <token>
   {
     "status": "disabled",
     "reason": "Testing disable functionality"
   }
   ```

9. **Enable User (SUPER_ADMIN only):**
   ```
   PUT /user/updateUser/<user_id>
   Authorization: Bearer <token>
   {
     "status": "active"
   }
   ```

---

## Error Responses

All endpoints may return errors in this format:
```json
{
  "ok": false,
  "message": "Error message here",
  "code": "ERROR_CODE"
}
```

**Common Error Codes:**
- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Insufficient permissions
- `FORBIDDEN_ROLE` - User role not allowed for this endpoint
- `FORBIDDEN_PORTAL` - User portal not allowed for this endpoint
- `FORBIDDEN_ORG_SCOPE` - User trying to access organization outside their scope
- `VALIDATION_ERROR` - Request body validation failed
- `INVALID_CREDENTIALS` - Invalid email or password
- `USER_NOT_FOUND` - User ID not found
- `USER_NOT_ACTIVE` - User account is not active
- `ORGANIZATION_NOT_FOUND` - Organization ID not found
- `CANNOT_DISABLE_SELF` - Cannot disable your own account
- `USER_ALREADY_EXISTS` - Email already registered
- `MUST_CHANGE_PASSWORD` - User must change password before accessing this endpoint
- `WRONG_PASSWORD` - Current password is incorrect
- `ACCOUNT_DISABLED` - Account is disabled

