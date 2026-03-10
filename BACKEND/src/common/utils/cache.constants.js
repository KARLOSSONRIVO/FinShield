// ─── Key Prefixes ───────────────────────────────────────────
export const CachePrefix = {
    BLACKLIST:      "bl:",          // bl:{tokenHash}
    TX_CID:         "txcid:",       // txcid:{txHash}       → permanent
    USER:           "user:",        // user:{userId}
    ORG:            "org:",         // org:{orgId}
    AUDITOR_ORGS:   "aud:orgs:",    // aud:orgs:{userId}    → orgId[]
    AUDITOR_ACTIVE: "aud:act:",     // aud:act:{orgId}      → "1" / null
    INV_LIST:       "inv:list:",    // inv:list:{hash}
    INV_MY:         "inv:my:",      // inv:my:{hash}
    INV_DETAIL:     "inv:det:",     // inv:det:{invoiceId}
    LEDGER:         "ledger:",      // ledger:{hash}
    USERS_LIST:     "users:list:",  // users:list:{hash}
    USERS_EMP:      "users:emp:",   // users:emp:{hash}
    ORGS_LIST:      "orgs:list:",   // orgs:list:{hash}
    ASSIGN_LIST:    "asgn:list:",   // asgn:list:{hash}
    ASSIGN_DETAIL:  "asgn:det:",    // asgn:det:{id}
    POLICY:         "policy:",      // policy:{orgId}
    TERMS:          "terms:",       // terms:global / terms:search:{term}
};

// ─── Default TTLs (seconds) ────────────────────────────────
export const CacheTTL = {
    BLACKLIST:      0,        // Set dynamically per token's remaining life
    TX_CID:         0,        // Permanent (never expires)
    USER:           300,      // 5 min
    ORG:            1800,     // 30 min
    AUDITOR_ORGS:   600,      // 10 min
    AUDITOR_ACTIVE: 600,      // 10 min
    INV_LIST:       30,       // 30 sec
    INV_MY:         30,       // 30 sec
    INV_DETAIL:     120,      // 2 min
    LEDGER:         60,       // 60 sec
    USERS_LIST:     60,       // 60 sec
    USERS_EMP:      60,       // 60 sec
    ORGS_LIST:      300,      // 5 min
    ASSIGN_LIST:    60,       // 60 sec
    ASSIGN_DETAIL:  300,      // 5 min
    POLICY:         1800,     // 30 min
    TERMS:          1800,     // 30 min
};
