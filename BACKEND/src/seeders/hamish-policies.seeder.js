/**
 * policies.seeder.js
 * ─────────────────
 * Seeds all 21 global policies (shared across all companies).
 * Already-existing policies (matched by title) are skipped.
 *
 * Prerequisites:
 *   1. BACKEND running: npm run dev
 *
 * Run:
 *   npm run seed:hamish-policies
 */

import "dotenv/config";
import axios from "axios";

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;

const REGULATOR = {
    email:    "regulator.hamish@finshield.com",
    password: "Password123!",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function api(token) {
    return axios.create({
        baseURL: BASE_URL,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        timeout: 30_000,
    });
}

function ok(msg)   { console.log(`  ✅  ${msg}`); }
function fail(msg) { console.log(`  ❌  ${msg}`); }

// ─── Policies ─────────────────────────────────────────────────────────────────
const POLICIES = [
    {
        title:   "Confidentiality Agreement (NDA)",
        version: "1.0",
        content: `Employees must maintain strict confidentiality regarding all company and client information. This includes financial records, audit working papers, client communications, and internal business processes.

Employees are prohibited from sharing, copying, or disclosing confidential information to unauthorized individuals during or after their employment. Any violation of this policy may result in disciplinary action, termination, and possible legal consequences.`,
    },
    {
        title:   "Client Data Privacy Policy",
        version: "1.0",
        content: `Employees must protect the personal and financial data of clients. Access to client information should only occur when required for official work duties.

Employees must not disclose, store, or transmit client data through unauthorized channels. All data handling must comply with applicable data protection laws and company privacy standards.`,
    },
    {
        title:   "Information Security Policy",
        version: "1.0",
        content: `Employees are responsible for protecting company systems, networks, and digital assets. Users must maintain strong passwords, avoid sharing login credentials, and report any suspicious system activity.

Unauthorized access, data tampering, malware installation, or security breaches are strictly prohibited.`,
    },
    {
        title:   "Data Retention and Records Management Policy",
        version: "1.0",
        content: `All audit documents, financial records, and related files must be stored securely within the company system according to the required retention period.

Employees must not delete, modify, or remove records without proper authorization. Records must be preserved to support regulatory compliance and audit verification.`,
    },
    {
        title:   "Code of Professional Ethics",
        version: "1.0",
        content: `Employees must conduct their duties with integrity, objectivity, and professionalism.

Employees must:
- Perform work honestly and accurately
- Avoid misleading reports or documentation
- Maintain independence and professional judgment

Failure to follow ethical standards may lead to disciplinary actions.`,
    },
    {
        title:   "Workplace Conduct Policy",
        version: "1.0",
        content: `Employees must maintain professional behavior while interacting with colleagues, clients, and stakeholders.

Harassment, discrimination, abusive behavior, or unethical conduct is strictly prohibited. Employees must promote a respectful and professional working environment.`,
    },
    {
        title:   "Legal and Regulatory Compliance Policy",
        version: "1.0",
        content: `Employees must comply with all applicable laws, accounting standards, auditing standards, and company regulations.

Employees must not engage in activities that violate financial regulations, tax laws, or professional standards.`,
    },
    {
        title:   "Independence and Conflict of Interest Policy",
        version: "1.0",
        content: `Employees must avoid situations that may compromise their objectivity or independence.

Employees must disclose any financial, personal, or professional relationships with clients that may influence audit decisions. Failure to disclose conflicts of interest may result in disciplinary action.`,
    },
    {
        title:   "Acceptable Use of Systems Policy",
        version: "1.0",
        content: `Company systems, software, and digital resources must be used only for authorized work purposes.

Employees are prohibited from:
- Installing unauthorized software
- Sharing login credentials
- Accessing restricted information without permission
- Using company systems for illegal or harmful activities`,
    },
    {
        title:   "Remote Work and Device Security Policy",
        version: "1.0",
        content: `Employees accessing company systems remotely must use secure connections and approved devices.

Sensitive information must not be accessed using unsecured networks. Devices used for work must be protected from unauthorized access.`,
    },
    {
        title:   "Internal Control Policy",
        version: "1.0",
        content: `Employees must ensure that all financial transactions, documents, and records are accurate, complete, and properly verified.

All submitted invoices, reports, or financial entries must be supported by valid documentation and must follow company verification procedures.`,
    },
    {
        title:   "Approval and Authorization Policy",
        version: "1.0",
        content: `Certain transactions require proper authorization before they are processed.

Employees must ensure that approvals are obtained from authorized personnel before processing financial transactions, invoices, or audit documentation.`,
    },
    {
        title:   "Segregation of Duties (SoD) Policy",
        version: "1.0",
        content: `No employee should have full control over a financial transaction from initiation to completion.

Tasks such as document submission, verification, approval, and payment processing must be handled by separate authorized individuals to prevent fraud and errors.`,
    },
    {
        title:   "Invoice Verification / Accounts Payable Policy",
        version: "1.0",
        content: `All invoices submitted to the system must be reviewed and verified for accuracy and legitimacy.

Invoices must match the relevant purchase orders, service agreements, or approved transactions. Suspicious or incomplete invoices will be flagged for review.`,
    },
    {
        title:   "Fraud Prevention and Detection Policy",
        version: "1.0",
        content: `Employees must report any suspicious financial activity, fraudulent behavior, or irregular transactions immediately.

The system may monitor transactions to detect unusual activity. Employees involved in fraudulent activity may face termination and legal consequences.`,
    },
    {
        title:   "Whistleblower Policy",
        version: "1.0",
        content: `Employees are encouraged to report unethical behavior, fraud, or violations of company policies.

Reports can be submitted confidentially without fear of retaliation. The company will investigate all reports thoroughly and fairly.`,
    },
    {
        title:   "Risk Management Policy",
        version: "1.0",
        content: `Employees must follow procedures designed to minimize financial, operational, and security risks.

All risks related to system access, financial transactions, and audit procedures must be properly managed and reported.`,
    },
    {
        title:   "Intellectual Property Policy",
        version: "1.0",
        content: `All documents, systems, software, and methodologies developed during employment are the property of the company.

Employees may not copy, distribute, or use company intellectual property outside authorized work activities.`,
    },
    {
        title:   "Non-Compete Policy",
        version: "1.0",
        content: `Employees may not engage in business activities that directly compete with the company during their employment.

Certain restrictions may also apply for a defined period after employment ends.`,
    },
    {
        title:   "Non-Solicitation Policy",
        version: "1.0",
        content: `Employees must not solicit or recruit company employees or clients for competing businesses during or immediately after employment.

This policy protects the company's professional relationships and workforce stability.`,
    },
    {
        title:   "Employee Termination and Exit Policy",
        version: "1.0",
        content: `Upon termination or resignation, employees must return all company devices, records, and confidential information.

Access to company systems will be revoked immediately upon employment termination. Confidentiality obligations remain in effect after employment ends.`,
    },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log("\n📋  Global Policies Seeder");
    console.log(`    Target   : ${BASE_URL}`);
    console.log(`    Policies : ${POLICIES.length}\n`);

    // Step 1 — Login as Regulator
    console.log("─".repeat(60));
    console.log("  Step 1: Login as Regulator");
    console.log("─".repeat(60));

    let token;
    try {
        const res = await axios.post(`${BASE_URL}/auth/login`, {
            email:    REGULATOR.email,
            password: REGULATOR.password,
        });
        token = res.data?.data?.accessToken ?? res.data?.accessToken;
        ok(`Logged in as ${REGULATOR.email}`);
    } catch (err) {
        fail(`Login failed: ${err.response?.data?.message ?? err.message}`);
        process.exit(1);
    }

    // Fetch existing titles to skip duplicates
    let existing = new Set();
    try {
        const res = await api(token).get("/policy");
        const items = res.data?.data ?? [];
        items.forEach((p) => existing.add(p.title));
    } catch {
        // If fetch fails just attempt all — duplicates will surface as failures
    }

    // Step 2 — Seed policies
    console.log("\n" + "─".repeat(60));
    console.log("  Step 2: Seeding policies");
    console.log("─".repeat(60));

    let created = 0;
    let skipped = 0;
    let failed  = 0;

    for (const policy of POLICIES) {
        if (existing.has(policy.title)) {
            console.log(`    ⏭️   Skipped (exists): "${policy.title}"`);
            skipped++;
            continue;
        }
        try {
            await api(token).post("/policy", {
                title:   policy.title,
                content: policy.content,
                version: policy.version,
            });
            ok(`Created: "${policy.title}"`);
            created++;
        } catch (err) {
            const msg = err.response?.data?.message ?? err.message;
            fail(`Failed: "${policy.title}" — ${msg}`);
            failed++;
        }
    }

    // Summary
    console.log("\n" + "─".repeat(60));
    console.log(`  ✅  Created : ${created}`);
    if (skipped > 0) console.log(`  ⏭️   Skipped : ${skipped}`);
    if (failed  > 0) console.log(`  ❌  Failed  : ${failed}`);
    console.log("─".repeat(60));
    console.log("\n✅  Policy seeder complete.\n");
}

main().catch((err) => {
    console.error("\n💥 Unexpected error:", err.message);
    process.exit(1);
});
