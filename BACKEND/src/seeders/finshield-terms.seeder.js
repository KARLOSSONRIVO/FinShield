/**
 * finshield-terms.seeder.js
 * ─────────────────────────
 * Seeds all 16 global Terms and Conditions documents (shared across all companies).
 * Already-existing documents (matched by title) are skipped.
 *
 * Prerequisites:
 *   1. BACKEND running: npm run dev
 *
 * Run:
 *   npm run seed:terms
 */

import "dotenv/config";
import axios from "axios";

const BASE_URL = `http://localhost:${process.env.PORT || 5000}`;

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

// ─── Terms and Conditions ─────────────────────────────────────────────────────
const TERMS = [
    {
        title:   "General Terms of Service",
        version: "1.0",
        content: `By accessing or using the FinShield platform, you agree to be bound by these Terms of Service. These terms govern your use of all platform features including invoice submission, AI verification, blockchain anchoring, and audit management.

If you do not agree with any part of these terms, you must not use the platform. Continued use of the platform following any amendments constitutes acceptance of the updated terms.

FinShield reserves the right to modify these terms at any time. Users will be notified of material changes.`,
    },
    {
        title:   "User Account and Access Terms",
        version: "1.0",
        content: `Users are responsible for maintaining the confidentiality of their account credentials. You must not share your login credentials with any other person.

Each user account is personal and non-transferable. You are responsible for all activity that occurs under your account. FinShield must be notified immediately of any unauthorized access or suspected breach of your account.

FinShield reserves the right to suspend or terminate accounts that violate these terms or engage in unauthorized activity.`,
    },
    {
        title:   "Acceptable Use of the Platform",
        version: "1.0",
        content: `Users must use the FinShield platform only for legitimate, authorized financial and audit-related activities.

Prohibited activities include:
- Submitting fraudulent, forged, or fabricated invoices
- Attempting to bypass or manipulate the AI verification system
- Interfering with platform security, availability, or integrity
- Accessing data beyond your authorized role and organization scope
- Using the platform for any unlawful purpose

Violations may result in immediate account suspension and referral to relevant authorities.`,
    },
    {
        title:   "Invoice Submission and Accuracy Terms",
        version: "1.0",
        content: `Users are solely responsible for ensuring that all invoices submitted to the platform are accurate, complete, and authentic.

By submitting an invoice, you confirm that:
- The invoice represents a real, legitimate transaction
- All figures, dates, and vendor details are correct
- The invoice has not been previously submitted or paid
- You are authorized to submit the invoice on behalf of your organization

FinShield's AI verification system assists in fraud detection but does not replace your obligation to submit accurate documents.`,
    },
    {
        title:   "AI-Assisted Verification Disclaimer",
        version: "1.0",
        content: `FinShield uses artificial intelligence to assist in invoice fraud detection and anomaly analysis. AI-generated risk scores and verdicts are advisory in nature and do not constitute a final determination of fraud or compliance.

Final review and approval decisions are the responsibility of authorized human auditors. FinShield does not guarantee the accuracy of AI outputs and is not liable for business decisions made solely on the basis of AI-generated results.

AI models are periodically retrained and may produce different outputs over time for similar inputs.`,
    },
    {
        title:   "Blockchain Anchoring and Immutability Terms",
        version: "1.0",
        content: `Invoices that complete the verification process are anchored to the Polygon blockchain network. Once anchored, the invoice record is permanent and cannot be altered, deleted, or reversed on-chain.

Users acknowledge that blockchain anchoring is irreversible. FinShield is not responsible for errors in submitted invoice data once anchoring is confirmed.

Blockchain transaction records serve as an immutable audit trail and may be used as evidence in regulatory and legal proceedings.`,
    },
    {
        title:   "Data Processing and Privacy Terms",
        version: "1.0",
        content: `FinShield collects and processes invoice data, user activity logs, and organizational information as necessary to provide the platform's services.

User data is processed in accordance with applicable data protection laws. FinShield does not sell user data to third parties.

Data submitted to the platform may be processed by AI systems for fraud detection, stored in cloud infrastructure, and anchored to blockchain networks. By using the platform, you consent to this processing.

Audit log data is retained for a minimum of 90 days before archival. Archived data is stored in encrypted form.`,
    },
    {
        title:   "Intellectual Property and License Terms",
        version: "1.0",
        content: `All software, AI models, algorithms, user interfaces, and platform documentation are the intellectual property of FinShield and are protected by applicable copyright and trade secret laws.

Users are granted a limited, non-exclusive, non-transferable license to use the platform for its intended purpose. This license does not include the right to copy, modify, distribute, reverse-engineer, or create derivative works from any part of the platform.

User-submitted invoice data and organizational documents remain the property of the submitting organization.`,
    },
    {
        title:   "Service Availability and Maintenance Terms",
        version: "1.0",
        content: `FinShield strives to maintain high platform availability but does not guarantee uninterrupted service. Scheduled maintenance windows will be communicated in advance where possible.

FinShield is not liable for losses arising from platform downtime, delayed invoice processing, or disruptions caused by third-party services including blockchain networks, cloud providers, or AI infrastructure.

In the event of extended service unavailability, FinShield will make reasonable efforts to restore access and notify affected users.`,
    },
    {
        title:   "Limitation of Liability",
        version: "1.0",
        content: `To the maximum extent permitted by law, FinShield's total liability to any user or organization for any claim arising from the use of the platform shall not exceed the amount paid by that organization for platform services in the preceding three months.

FinShield is not liable for:
- Indirect, incidental, or consequential damages
- Loss of business, revenue, or expected profits
- Errors or omissions in AI-generated analysis
- Actions taken or not taken based on platform outputs
- Unauthorized access due to user credential mismanagement`,
    },
    {
        title:   "Indemnification Terms",
        version: "1.0",
        content: `You agree to indemnify and hold harmless FinShield, its directors, employees, and service providers against any claims, damages, costs, or legal fees arising from:

- Your violation of these Terms and Conditions
- Submission of fraudulent or inaccurate invoice data
- Misuse of the platform or unauthorized access attempts
- Infringement of any third-party rights through your use of the platform

This indemnification obligation survives the termination of your account.`,
    },
    {
        title:   "Governing Law and Jurisdiction",
        version: "1.0",
        content: `These Terms and Conditions are governed by and construed in accordance with applicable law. Any disputes arising from the use of the FinShield platform shall be subject to the exclusive jurisdiction of the competent courts in the jurisdiction in which FinShield is incorporated.

Users located in different jurisdictions are responsible for ensuring that their use of the platform complies with local laws and regulations, including financial regulations and data protection requirements.`,
    },
    {
        title:   "Dispute Resolution Policy",
        version: "1.0",
        content: `In the event of a dispute between a user and FinShield, both parties agree to first attempt resolution through good-faith negotiation.

If a dispute cannot be resolved within 30 days of written notice, either party may escalate to formal mediation before pursuing litigation. FinShield's decision on matters of platform operation, feature availability, and account management is final.

Disputes related to audit decisions made by authorized auditors on the platform must be raised through the designated review process within the system.`,
    },
    {
        title:   "Account Suspension and Termination Terms",
        version: "1.0",
        content: `FinShield reserves the right to suspend or terminate any user account or organizational access without prior notice if:

- There is evidence of fraudulent activity or policy violations
- Platform security is at risk from the account's activity
- A valid legal or regulatory order requires such action
- Payment obligations (if applicable) have not been met

Upon termination, access to the platform is immediately revoked. Data associated with the account may be retained for audit and legal compliance purposes for the required retention period.`,
    },
    {
        title:   "Third-Party Integrations Disclaimer",
        version: "1.0",
        content: `FinShield integrates with third-party services including IPFS storage providers, blockchain networks, and cloud infrastructure. These third-party services are governed by their own terms and privacy policies.

FinShield is not responsible for the availability, accuracy, or security practices of third-party services. Outages or changes in third-party services may affect platform functionality.

Users acknowledge that invoice files stored via IPFS are content-addressed and publicly retrievable by anyone with knowledge of the content identifier (CID).`,
    },
    {
        title:   "Audit Trail and Record Retention Terms",
        version: "1.0",
        content: `All significant platform actions — including logins, invoice submissions, AI verifications, audit reviews, and administrative changes — are recorded in an immutable audit log.

Audit logs are retained for a minimum of 90 days in the active database. After 90 days, logs are archived to encrypted cloud storage and hard-deleted from the primary database.

Archived audit logs are preserved for regulatory compliance and may be produced in response to valid legal, regulatory, or investigatory requests. Users should not expect audit log entries to be modified or deleted upon request.`,
    },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log("\n📋  Global Terms & Conditions Seeder");
    console.log(`    Target   : ${BASE_URL}`);
    console.log(`    Documents: ${TERMS.length}\n`);

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
        const res = await api(token).get("/terms");
        const items = res.data?.data ?? [];
        items.forEach((t) => existing.add(t.title));
    } catch {
        // If fetch fails just attempt all — duplicates will surface as failures
    }

    // Step 2 — Seed terms
    console.log("\n" + "─".repeat(60));
    console.log("  Step 2: Seeding Terms and Conditions");
    console.log("─".repeat(60));

    let created = 0;
    let skipped = 0;
    let failed  = 0;

    for (const term of TERMS) {
        if (existing.has(term.title)) {
            console.log(`    ⏭️   Skipped (exists): "${term.title}"`);
            skipped++;
            continue;
        }
        try {
            await api(token).post("/terms", {
                title:   term.title,
                content: term.content,
                version: term.version,
            });
            ok(`Created: "${term.title}"`);
            created++;
        } catch (err) {
            const msg = err.response?.data?.message ?? err.message;
            fail(`Failed: "${term.title}" — ${msg}`);
            failed++;
        }
    }

    // Summary
    console.log("\n" + "─".repeat(60));
    console.log(`  ✅  Created : ${created}`);
    if (skipped > 0) console.log(`  ⏭️   Skipped : ${skipped}`);
    if (failed  > 0) console.log(`  ❌  Failed  : ${failed}`);
    console.log("─".repeat(60));
    console.log("\n✅  Terms & Conditions seeder complete.\n");
}

main().catch((err) => {
    console.error("\n💥 Unexpected error:", err.message);
    process.exit(1);
});
