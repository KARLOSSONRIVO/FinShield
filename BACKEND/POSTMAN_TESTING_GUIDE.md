# Postman Testing Guide - FinShield API

## Base URL
```
http://localhost:<PORT>
```
**Note:** Replace `<PORT>` with your server port (check your `.env` file or server logs)

## Authentication
All endpoints require authentication. Make sure to include your auth token in the headers:
```
Authorization: Bearer <your_token>
```

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

1. **Create Organization:**
   ```
   POST /organization/createOrganization
   {
     "type": "platform",
     "name": "Test Platform"
   }
   ```
   *Save the organization ID from the response*

2. **Create User:**
   ```
   POST /user/createUser
   {
     "orgId": "<organization_id_from_step_1>",
     "portal": "admin",
     "role": "SUPER_ADMIN",
     "email": "test@example.com",
     "username": "testuser",
     "password": "Test123456"
   }
   ```
   *Save the user ID from the response*

3. **List All Users:**
   ```
   GET /user/listUsers
   ```

4. **Get Specific User:**
   ```
   GET /user/<user_id>
   ```

5. **Disable User:**
   ```
   PUT /user/updateUser/<user_id>
   {
     "status": "disabled",
     "reason": "Testing disable functionality"
   }
   ```

6. **Enable User:**
   ```
   PUT /user/updateUser/<user_id>
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
- `VALIDATION_ERROR` - Request body validation failed
- `USER_NOT_FOUND` - User ID not found
- `ORGANIZATION_NOT_FOUND` - Organization ID not found
- `CANNOT_DISABLE_SELF` - Cannot disable your own account
- `USER_ALREADY_EXISTS` - Email already registered

