# Security Audit - Category 4: Secure Design & Data Flow

**Status:** ✅ Data Flow Diagram Documented

## System Data Flow Diagram (DFD)

The following diagram illustrates the flow of sensitive data across Trust Boundaries (User, Backend, Database, External Services).

```mermaid
sequenceDiagram
    autonumber
    actor User as User (Company Mode)
    participant API as Backend API (Express)
    participant DB as MongoDB
    participant IPFS as Pinata IPFS
    participant AI as AI Service (Python)
    participant ETH as Ethereum Blockchain
    actor Auditor as Auditor (Platform Mode)

    Note over User, API: Trust Boundary: Public Internet to DMZ

    User->>API: POST /auth/login (Creds)
    API->>DB: Find User & Verify Hash (bcrypt)
    DB-->>API: User Data
    API-->>User: JWT Access + Refresh Token

    User->>API: POST /invoice/upload (File + JWT)
    
    activate API
    Note right of API: Middleware: Auth, RBAC, RateLimit
    Note right of API: Validation: Zod, FileType (Magic #)
    
    API->>AI: POST /precheck (OCR & Validity)
    AI-->>API: Extraction Result
    
    API->>DB: Check for Duplicates (Hash/Invoice#)
    
    API->>IPFS: Upload File (Immutable Storage)
    IPFS-->>API: Return IPFS CID
    
    API->>DB: Create Invoice (Status: Pending)
    API-->>User: 200 OK (Processing in Background)
    deactivate API

    par Parallel Verification
        API->>AI: POST /fraud/verify (Full Scan)
        AI-->>API: Verdict (Clean/Flagged)
    and Blockchain Anchoring
        API->>ETH: Anchor (Hash + CID)
        ETH-->>API: Tx Hash
    end
    API->>DB: Update Invoice Status (Secured)

    Auditor->>API: GET /invoice/:id (JWT)
    API->>DB: Fetch Metadata & AI Verdict
    API->>IPFS: Resolve File via CID
    API-->>Auditor: Complete Audit Package
```

## Key Security Controls in Flow

1.  **Trust Boundaries**: 
    - All inputs from `User` crossing into `API` are treated as untrusted.
    - Validated via `validate.middleware.js` and `fileType.middleware.js` immediately upon entry.

2.  **Least Privilege**:
    - `User` can only upload to their own Organization (`requireSameOrgParam`).
    - `Auditor` has read-only access to specific compliance data.

3.  **Data Minimization**:
    - Files are offloaded to **IPFS**; only CIDs and Hashes are stored in MongoDB.
    - Passwords are never returned in `User Data` flow (`select: false`).

4.  **Immutability**:
    - The `Ethereum Blockchain` step ensures that once a document footprint (Hash) is anchored, the document's existence and integrity at that point in time cannot be altered.
