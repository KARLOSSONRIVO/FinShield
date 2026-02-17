
# Security Presentation Demo Scripts

This folder contains scripts to demonstrate the security features of the FinShield Backend.

## Prerequisites

1.  **Backend Running**: Ensure the backend is running locally.
    ```bash
    npm run dev
    # OR
    docker-compose up
    ```
2.  **Dependencies**:
    Running `npm install` in the root `BACKEND` folder should be sufficient as the scripts use the project's dependencies (`axios`, `form-data`, `dotenv`).

## Running the Tests

You can run each test individually using `node`.

### 1. Rate Limiting protection
Demonstrates that the server blocks excessive login attempts.
```bash
node scripts/security_demo/test1_rate_limiting.js
```

### 2. SQL/NoSQL Injection Prevention
Demonstrates that malicious login payloads are rejected.
```bash
node scripts/security_demo/test2_login_injection.js
```

### 3. User Enumeration Prevention
Demonstrates that error messages are generic ("Invalid email or password") regardless of whether the user exists.
```bash
node scripts/security_demo/test3_generic_errors.js
```

### 4. File Upload Validation
Demonstrates that files are checked for their *actual* content type (Magic Numbers), not just extensions.
```bash
node scripts/security_demo/test4_file_magic_numbers.js
```

### 5. XSS Sanitization
Demonstrates that scripts injected into input fields are sanitized or rejected.
```bash
node scripts/security_demo/test5_xss_sanitization.js
```

### 6. NoSQL Injection (Operator)
Demonstrates that MongoDB operators (like `$gt`) are stripped or validated out.
```bash
node scripts/security_demo/test6_nosql_injection.js
```

## Configuration

You can adjust the API URL or colors in `scripts/security_demo/config.js`.
