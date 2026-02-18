

export const SUPER_ADMIN_DASHBOARD_DATA = {
    companiesCount: 154,
    totalUsers: 2450,
    totalInvoices: 1890,
    totalValue: 5600000,
    flaggedCount: 12, 

    
    recentLogs: [
        { id: 1, action: "User Created", message: "New auditor account created", time: "2m ago" },
        { id: 2, action: "Company Verified", message: "TechCorp verified", time: "15m ago" },
        { id: 3, action: "Invoice Flagged", message: "INV-2024-004 marked as high risk", time: "1h ago" },
    ]
}


export const AUDITOR_DASHBOARD_DATA = {
    assignedCompanies: 676,
    assignedIncrease: 67, 
    verifiedReviews: 420,
    verifiedPercentage: 21,
    pendingReviews: 28008,
    pendingStatus: "Awaiting review",
    flaggedItems: 69,
    flaggedStatus: "Needs attention",
}




export const MOCK_AUDITOR_INVOICES = [
    {
        _id: "inv-2024-001",
        invoiceNo: "INV-2024-001",
        companyName: "Acme Corporation",
        date: "12/1/2024",
        totals_total: 1250,
        ai_verdict: "Clean",
        ai_riskScore: 5,
        status: "Verified",
    },
    {
        _id: "inv-2024-002",
        invoiceNo: "INV-2024-002",
        companyName: "Acme Corporation",
        date: "12/5/2024",
        totals_total: 45000,
        ai_verdict: "Flagged",
        ai_riskScore: 65,
        status: "Flagged",
    },
    {
        _id: "inv-2024-003",
        invoiceNo: "INV-2024-003",
        companyName: "Acme Corporation",
        date: "12/10/2024",
        totals_total: 320.5,
        ai_verdict: "Clean",
        ai_riskScore: 5,
        status: "Pending",
    },
    {
        _id: "inv-2024-004",
        invoiceNo: "INV-2024-004",
        companyName: "Acme Corporation",
        date: "12/15/2024",
        totals_total: 98000,
        ai_verdict: "Flagged",
        ai_riskScore: 85,
        status: "Fraudulent",
    },
    {
        _id: "ts-inv-001",
        invoiceNo: "TS-INV-001",
        companyName: "TechStart Inc.",
        date: "12/8/2024",
        totals_total: 5600,
        ai_verdict: "Clean",
        ai_riskScore: 12,
        status: "Verified",
    },
    
    {
        _id: "inv-006",
        invoiceNo: "INV-006",
        companyName: "Example Corporation",
        date: "12/4/2024",
        totals_total: 15000,
        ai_verdict: "Flagged",
        ai_riskScore: 85,
        status: "Fraudulent",
    },
    {
        _id: "inv-007",
        invoiceNo: "INV-007",
        companyName: "Tech Solutions Inc",
        date: "12/5/2024",
        totals_total: 8500,
        ai_verdict: "Clean",
        ai_riskScore: 12,
        status: "Pending",
    },
    {
        _id: "inv-008",
        invoiceNo: "INV-008",
        companyName: "Global Trade Ltd",
        date: "12/6/2024",
        totals_total: 22000,
        ai_verdict: "Flagged",
        ai_riskScore: 55,
        status: "Flagged",
    },
    {
        _id: "inv-009",
        invoiceNo: "INV-009",
        companyName: "Acme Logistics",
        date: "12/7/2024",
        totals_total: 4500,
        ai_verdict: "Clean",
        ai_riskScore: 2,
        status: "Pending",
    },
    {
        _id: "inv-010",
        invoiceNo: "INV-010",
        companyName: "Quantum Corp",
        date: "12/7/2024",
        totals_total: 12300,
        ai_verdict: "Clean",
        ai_riskScore: 8,
        status: "Pending",
    },
]
