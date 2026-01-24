# Invoice Fetch Endpoints Implementation Plan

> **Status**: Pending - To be implemented later

Add endpoints to fetch invoices based on user roles with proper authorization.

---

## Requirements

| Role | Access Level | Endpoint |
|------|--------------|----------|
| **COMPANY_USER** | Own uploaded invoices only | `GET /invoice/my` |
| **COMPANY_MANAGER** | All invoices from their organization | `GET /invoice/org` |
| **COMPANY_MANAGER** | Specific employee's invoices | `GET /invoice/user/:userId` |
| **AUDITOR** | All invoices from assigned companies | `GET /invoice/assigned` |

---

## Proposed Changes

### Repository Layer

**File**: `src/modules/repositories/invoice.repositories.js`

Add new query functions:
- `findByUploaderId(userId)` — For COMPANY_USER to fetch their own invoices
- `findByMultipleOrgIds(orgIds)` — For AUDITOR to fetch invoices from multiple assigned companies

---

### Service Layer

**File**: `src/modules/services/invoice.service.js`

Add new service functions:
- `getMyInvoices({ actor })` — Returns invoices uploaded by the current user
- `getOrgInvoices({ actor })` — Returns all invoices for the user's organization
- `getUserInvoices({ actor, userId })` — Returns invoices uploaded by a specific employee (validates same org)
- `getAssignedInvoices({ actor })` — Returns invoices from all companies assigned to the auditor

---

### Controller Layer

**File**: `src/modules/controllers/invoice.controller.js`

Add new controller handlers:
- `getMyInvoices` — Handles `GET /invoice/my`
- `getOrgInvoices` — Handles `GET /invoice/org`
- `getUserInvoices` — Handles `GET /invoice/user/:userId`
- `getAssignedInvoices` — Handles `GET /invoice/assigned`

---

### Route Layer

**File**: `src/routes/invoice/invoice.route.js`

Add new routes:
```javascript
// COMPANY_USER & COMPANY_MANAGER: Get own uploaded invoices
invoiceRouter.get("/my", allowRoles("COMPANY_USER", "COMPANY_MANAGER"), InvoiceController.getMyInvoices)

// COMPANY_MANAGER: Get all org invoices
invoiceRouter.get("/org", allowRoles("COMPANY_MANAGER"), InvoiceController.getOrgInvoices)

// COMPANY_MANAGER: Get specific employee's invoices
invoiceRouter.get("/user/:userId", allowRoles("COMPANY_MANAGER"), InvoiceController.getUserInvoices)

// AUDITOR: Get invoices from assigned companies
invoiceRouter.get("/assigned", allowRoles("AUDITOR"), InvoiceController.getAssignedInvoices)
```

---

## API Design

### `GET /invoice/my`
**Roles**: `COMPANY_USER`, `COMPANY_MANAGER`

Returns invoices uploaded by the authenticated user.

**Response**:
```json
{
  "ok": true,
  "data": [
    {
      "id": "...",
      "orgId": "...",
      "uploadedByUserId": "...",
      "originalFileName": "invoice.pdf",
      "ipfsCid": "Qm...",
      "anchorStatus": "anchored"
    }
  ]
}
```

---

### `GET /invoice/org`
**Roles**: `COMPANY_MANAGER`

Returns all invoices from the manager's organization.

---

### `GET /invoice/user/:userId`
**Roles**: `COMPANY_MANAGER`

Returns all invoices uploaded by a specific employee. Validates that the employee belongs to the same organization as the manager.

**Errors**:
- `404 USER_NOT_FOUND` — Employee doesn't exist
- `403 FORBIDDEN_ORG_SCOPE` — Employee is not in manager's organization

---

### `GET /invoice/assigned`
**Roles**: `AUDITOR`

Returns all invoices from companies assigned to the auditor.

---

## Verification Plan

1. **Test `GET /invoice/my`** as COMPANY_USER — verify only own invoices returned
2. **Test `GET /invoice/org`** as COMPANY_MANAGER — verify all org invoices returned
3. **Test `GET /invoice/user/:userId`** as COMPANY_MANAGER — verify specific employee's invoices
4. **Test `GET /invoice/assigned`** as AUDITOR — verify assigned companies' invoices
5. **Test role restrictions** — verify 403 for unauthorized access attempts
