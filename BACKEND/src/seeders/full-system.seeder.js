/**
 * full-system.seeder.js
 * ─────────────────────
 * End-to-end FinShield demo seeder.
 *
 * Exercises the entire pipeline via live API calls:
 *   Login → Create Org (upload template to S3 + AI layout signature)
 *   → Create Auditor → Assign Auditor → Create Manager
 *   → Manager creates Employees → Employees upload invoices
 *   → Invoices: IPFS upload → Blockchain anchor → AI OCR scan
 *
 * Prerequisites:
 *   1. BACKEND running:    npm run dev
 *   2. AI_SERVICE running: python dev.py
 *   3. Invoice DOCX files: python scripts/generate_invoices.py
 *
 * Run:
 *   npm run seed:full-system
 *   (or: node src/seeders/full-system.seeder.js)
 */

import "dotenv/config";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ─── Config ──────────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;

const SUPER_ADMIN = {
    email: "admin@finshield.com",
    password: "Password123!",
};

const COMPANY_NAME = "Hamish & Partners";
const TEMPLATE_PATH = path.resolve(__dirname, "../../../HAMISH.docx");

const INVOICES_DIR = path.resolve(__dirname, "../../../scripts/invoices");

// Seeded user credentials (mustChangePassword: false so they can log in directly)
const AUDITOR = {
    email: "auditor.hamish@finshield.com",
    username: "auditor_hamish",
    password: "Auditor@123456",
    role: "AUDITOR",
};

const MANAGER = {
    email: "manager.hamish@finshield.com",
    username: "manager_hamish",
    password: "Manager@123456",
    role: "COMPANY_MANAGER",
};

const EMPLOYEES = [
    { email: "emp1.hamish@finshield.com", username: "emp1_hamish", password: "Employee@123456", role: "COMPANY_USER" },
    { email: "emp2.hamish@finshield.com", username: "emp2_hamish", password: "Employee@123456", role: "COMPANY_USER" },
    { email: "emp3.hamish@finshield.com", username: "emp3_hamish", password: "Employee@123456", role: "COMPANY_USER" },
];

// Dynamically map all generated docx files evenly to the 3 employees
const EMPLOYEE_INVOICE_MAP = [[], [], []];
if (fs.existsSync(INVOICES_DIR)) {
    const files = fs.readdirSync(INVOICES_DIR)
        .filter(f => f.startsWith("invoice_") && f.endsWith(".docx"))
        .sort((a, b) => parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, '')));

    files.forEach((file, index) => {
        EMPLOYEE_INVOICE_MAP[index % EMPLOYEES.length].push(file);
    });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
/**
 * Extract a MongoDB ObjectId string from various API response shapes:
 *   { ok, data: { _id } }   ← controller pattern
 *   { ok, data: { user: { _id } } }
 *   { _id }                 ← direct object
 */
function extractId(resData) {
    return (
        resData?.data?.id ??
        resData?.data?._id ??
        resData?.data?.user?.id ??
        resData?.data?.user?._id ??
        resData?.data?.organization?.id ??
        resData?.data?.organization?._id ??
        resData?.id ??
        resData?._id ??
        null
    );
}
function api(token = null) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return axios.create({ baseURL: BASE_URL, headers, timeout: 120_000 });
}

async function login(email, password) {
    const res = await api().post("/auth/login", { email, password });
    const { accessToken, refreshToken } = res.data.data ?? res.data;
    return { accessToken, refreshToken };
}

async function uploadMultipart(token, endpoint, filePath, extraFields = {}) {
    const form = new FormData();
    form.append("file", fs.createReadStream(filePath), {
        filename: path.basename(filePath),
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    for (const [k, v] of Object.entries(extraFields)) {
        form.append(k, v);
    }
    const res = await axios.post(`${BASE_URL}${endpoint}`, form, {
        headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${token}`,
        },
        timeout: 180_000,
    });
    return res.data;
}

async function uploadTemplateMultipart(token, orgName, orgType, orgStatus, filePath) {
    const form = new FormData();
    form.append("name", orgName);
    form.append("type", orgType);
    form.append("status", orgStatus);
    form.append("invoiceTemplate", fs.createReadStream(filePath), {
        filename: path.basename(filePath),
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const res = await axios.post(`${BASE_URL}/organization/createOrganization`, form, {
        headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${token}`,
        },
        timeout: 180_000,
    });
    return res.data;
}

// ─── Step helpers ─────────────────────────────────────────────────────────────
function step(n, label) {
    console.log(`\n${"─".repeat(60)}`);
    console.log(`  Step ${n}: ${label}`);
    console.log("─".repeat(60));
}

function ok(msg) { console.log(`  ✅  ${msg}`); }
function warn(msg) { console.log(`  ⚠️   ${msg}`); }
function fail(msg) { console.log(`  ❌  ${msg}`); }

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log("\n🚀  FinShield Full-System Seeder");
    console.log(`    Target: ${BASE_URL}`);
    console.log(`    Time  : ${new Date().toISOString()}\n`);

    const summary = {
        organization: null,
        auditorId: null,
        assignmentId: null,
        managerId: null,
        employeeIds: [],
        invoiceIds: [],
    };

    // ── 1. Login as Super Admin ──────────────────────────────────────────────
    step(1, "Login as Super Admin");
    let adminToken;
    try {
        const { accessToken } = await login(SUPER_ADMIN.email, SUPER_ADMIN.password);
        adminToken = accessToken;
        ok(`Logged in as ${SUPER_ADMIN.email}`);
    } catch (e) {
        fail(`Login failed: ${e.response?.data?.message || e.message}`);
        process.exit(1);
    }

    // ── 2. Create Company Organisation (with template) ───────────────────────
    step(2, `Create Company Organisation: "${COMPANY_NAME}"`);
    let orgId;
    try {
        // ── Always check if org exists first (idempotent) ────────────────────
        const listRes = await api(adminToken).get("/organization/listOrganizations?limit=50");
        const orgs = listRes.data.data?.items ?? listRes.data.data?.organizations ?? listRes.data.data ?? [];
        const existing = Array.isArray(orgs) ? orgs.find(o => o.name === COMPANY_NAME) : null;

        if (existing) {
            orgId = existing.id ?? existing._id;
            summary.organization = { id: orgId, name: COMPANY_NAME };
            warn(`Organisation already exists  │  ID: ${orgId}  (skipping creation)`);
        } else {
            if (!fs.existsSync(TEMPLATE_PATH)) {
                throw new Error(`HAMISH.docx not found at: ${TEMPLATE_PATH}`);
            }
            const data = await uploadTemplateMultipart(
                adminToken,
                COMPANY_NAME,
                "company",
                "active",
                TEMPLATE_PATH
            );
            orgId = extractId(data);
            summary.organization = { id: orgId, name: COMPANY_NAME };
            ok(`Organisation created  │  ID: ${orgId}`);
            ok(`Template uploaded to S3 + AI layout signature generated`);
        }
    } catch (e) {
        fail(`Org step failed: ${e.response?.data?.message || e.message}`);
        process.exit(1);
    }

    // ── 3. Create Auditor ────────────────────────────────────────────────────
    step(3, `Create Auditor: ${AUDITOR.email}`);
    let auditorId;
    try {
        const res = await api(adminToken).post("/user/createUser", {
            role: AUDITOR.role,
            email: AUDITOR.email,
            username: AUDITOR.username,
            password: AUDITOR.password,
            mustChangePassword: false,
        });
        auditorId = extractId(res.data);
        summary.auditorId = auditorId;
        ok(`Auditor created  │  ID: ${auditorId}`);
    } catch (e) {
        const msg = e.response?.data?.message || e.message;
        const isDuplicate = msg?.toLowerCase().includes("already") ||
            msg?.toLowerCase().includes("duplicate") || e.response?.status === 409;
        if (isDuplicate) {
            warn(`Auditor already exists — searching...`);
            try {
                const res = await api(adminToken).get("/user/listUsers?limit=100");
                const users = res.data.data?.items ?? res.data.data?.users ?? res.data.data ?? [];
                const found = Array.isArray(users) ? users.find(u => u.email === AUDITOR.email) : null;
                if (found) {
                    auditorId = found.id ?? found._id;
                    summary.auditorId = auditorId;
                    ok(`Found existing auditor  │  ID: ${auditorId}`);
                } else {
                    fail("Auditor not found after conflict");
                    process.exit(1);
                }
            } catch (e2) {
                fail(`Failed to list users: ${e2.message}`);
                process.exit(1);
            }
        } else {
            fail(`Auditor creation failed: ${msg}`);
            process.exit(1);
        }
    }

    // ── 4. Assign Auditor to Company ─────────────────────────────────────────
    step(4, `Assign Auditor to "${COMPANY_NAME}"`);
    try {
        const res = await api(adminToken).post("/assignment/createAssignment", {
            companyOrgId: orgId,
            auditorUserId: auditorId,
            status: "active",
            notes: "Seeded by full-system.seeder.js",
        });
        const assignmentId = res.data.data?._id ?? res.data.assignment?._id ?? res.data._id;
        summary.assignmentId = assignmentId;
        ok(`Assignment created  │  ID: ${assignmentId}`);
    } catch (e) {
        const msg = e.response?.data?.message || e.message;
        if (msg?.toLowerCase().includes("already") || e.response?.status === 409) {
            warn("Assignment may already exist — continuing...");
        } else {
            fail(`Assignment creation failed: ${msg}`);
            // Non-fatal: continue
        }
    }

    // ── 5. Create Company Manager ────────────────────────────────────────────
    step(5, `Create Company Manager: ${MANAGER.email}`);
    let managerId;
    try {
        const res = await api(adminToken).post("/user/createUser", {
            role: MANAGER.role,
            email: MANAGER.email,
            username: MANAGER.username,
            password: MANAGER.password,
            orgId: orgId,
            mustChangePassword: false,
        });
        managerId = extractId(res.data);
        summary.managerId = managerId;
        ok(`Manager created  │  ID: ${managerId}`);
    } catch (e) {
        const msg = e.response?.data?.message || e.message;
        const isDuplicate = msg?.toLowerCase().includes("already") ||
            msg?.toLowerCase().includes("duplicate") || e.response?.status === 409;
        if (isDuplicate) {
            warn("Manager already exists — searching...");
            try {
                const res = await api(adminToken).get("/user/listUsers?limit=100");
                const users = res.data.data?.items ?? res.data.data?.users ?? res.data.data ?? [];
                const found = Array.isArray(users) ? users.find(u => u.email === MANAGER.email) : null;
                if (found) {
                    managerId = found.id ?? found._id;
                    summary.managerId = managerId;
                    ok(`Found existing manager  │  ID: ${managerId}`);
                } else {
                    fail("Manager not found after conflict");
                    process.exit(1);
                }
            } catch (e2) {
                fail(`Failed to list users: ${e2.message}`);
                process.exit(1);
            }
        } else {
            fail(`Manager creation failed: ${msg}`);
            process.exit(1);
        }
    }

    // ── 6. Login as Company Manager ──────────────────────────────────────────
    step(6, `Login as Company Manager`);
    let managerToken;
    try {
        const { accessToken } = await login(MANAGER.email, MANAGER.password);
        managerToken = accessToken;
        ok(`Logged in as ${MANAGER.email}`);
    } catch (e) {
        fail(`Manager login failed: ${e.response?.data?.message || e.message}`);
        process.exit(1);
    }

    // ── 7. Create Employees ───────────────────────────────────────────────────
    step(7, `Create ${EMPLOYEES.length} Company Employees`);
    const employeeTokens = [];
    for (const emp of EMPLOYEES) {
        try {
            const res = await api(managerToken).post("/user/createUser", {
                role: emp.role,
                email: emp.email,
                username: emp.username,
                password: emp.password,
                mustChangePassword: false,
                // orgId is auto-filled by service from the manager's JWT
            });
            const empId = extractId(res.data);
            summary.employeeIds.push(empId);
            ok(`Employee created  │  ${emp.email}  │  ID: ${empId}`);
        } catch (e) {
            const msg = e.response?.data?.message || e.message;
            const isDuplicate = msg?.toLowerCase().includes("already") ||
                msg?.toLowerCase().includes("duplicate") || e.response?.status === 409;
            if (isDuplicate) {
                warn(`Employee ${emp.email} already exists — continuing`);
            } else {
                warn(`Employee creation failed (${emp.email}): ${msg}`);
            }
        }

        // Login each employee to get a token for invoice upload
        try {
            const { accessToken } = await login(emp.email, emp.password);
            employeeTokens.push({ email: emp.email, token: accessToken });
            ok(`Logged in as ${emp.email}`);
        } catch (e) {
            warn(`Could not login as ${emp.email}: ${e.response?.data?.message || e.message}`);
            employeeTokens.push({ email: emp.email, token: null });
        }
    }

    // ── 8 & 9. Upload Invoices ────────────────────────────────────────────────
    step("8–9", `Upload Invoices (employees → /invoice/upload)`);

    if (!fs.existsSync(INVOICES_DIR)) {
        warn(`Invoice directory not found: ${INVOICES_DIR}`);
        warn("Run: python scripts/generate_invoices.py  — then re-run this seeder.");
    } else {
        for (let i = 0; i < employeeTokens.length; i++) {
            const { email, token } = employeeTokens[i];
            if (!token) {
                warn(`Skipping invoice upload for ${email} (no token)`);
                continue;
            }
            const fileNames = EMPLOYEE_INVOICE_MAP[i] ?? [];
            for (const fileName of fileNames) {
                const filePath = path.join(INVOICES_DIR, fileName);
                if (!fs.existsSync(filePath)) {
                    warn(`Invoice file not found: ${filePath} — skipping`);
                    continue;
                }
                try {
                    const data = await uploadMultipart(token, "/invoice/upload", filePath);
                    const invoiceId = extractId(data);
                    summary.invoiceIds.push(invoiceId);
                    ok(`Invoice uploaded  │  ${fileName}  │  by ${email}  │  ID: ${invoiceId}`);
                    ok(`  → Anchor job dispatched to BullMQ (blockchain + AI OCR runs async)`);
                } catch (e) {
                    fail(`Invoice upload failed (${fileName}): ${e.response?.data?.message || e.message}`);
                }
            }
        }
    }

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log(`\n${"═".repeat(60)}`);
    console.log("  🎉  Seeder Complete — Summary");
    console.log("═".repeat(60));
    console.log(`  Organisation : ${summary.organization?.name} (${summary.organization?.id})`);
    console.log(`  Auditor      : ${AUDITOR.email} (${summary.auditorId})`);
    console.log(`  Assignment   : ${summary.assignmentId}`);
    console.log(`  Manager      : ${MANAGER.email} (${summary.managerId})`);
    console.log(`  Employees    : ${summary.employeeIds.length} created`);
    EMPLOYEES.forEach((e, i) => {
        console.log(`                 ${i + 1}. ${e.email}`);
    });
    console.log(`  Invoices     : ${summary.invoiceIds.length} uploaded`);
    summary.invoiceIds.forEach((id, i) => {
        console.log(`                 ${i + 1}. ${id}`);
    });
    console.log(`\n  ⏳  Blockchain anchoring and AI OCR run asynchronously.`);
    console.log(`      Check invoice documents in MongoDB — aiVerdict will`);
    console.log(`      populate within ~30–60 seconds per invoice.\n`);

    // ── Account reference card ────────────────────────────────────────────────
    console.log("─".repeat(60));
    console.log("  🔑  Account Reference");
    console.log("─".repeat(60));
    console.log(`  Super Admin  : ${SUPER_ADMIN.email}  /  ${SUPER_ADMIN.password}`);
    console.log(`  Auditor      : ${AUDITOR.email}  /  ${AUDITOR.password}`);
    console.log(`  Manager      : ${MANAGER.email}  /  ${MANAGER.password}`);
    EMPLOYEES.forEach(e => {
        console.log(`  Employee     : ${e.email}  /  ${e.password}`);
    });
    console.log("─".repeat(60));
    console.log("");
}

main().catch(err => {
    console.error("\n💥  Unhandled seeder error:", err.message);
    process.exit(1);
});
