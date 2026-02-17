
import axios from 'axios';
import { config, printResult, printHeader } from './config.js';

const runTest = async () => {
    printHeader("Test 2: SQL/NoSQL Injection in Login");

    const url = `${config.API_URL}/auth/login`;
    // Classic SQL injection payload adapted for what might theoretically pass a weak filter, 
    // but detecting NoSQL injection usually involves passing objects like { $gt: "" } which Express body parser might handle if not sanitized.
    // Here we test a string payload that attempts to trick logic.
    const payload = {
        email: "admin@example.com' OR '1'='1",
        password: "password"
    };

    console.log(`Sending payload: ${JSON.stringify(payload)}`);

    try {
        await axios.post(url, payload);
        // If it succeeds with 200, it means injection worked (or we guessed credentials, unlikely)
        printResult("Injection Prevention", false, "Request succeeded (HTTP 200). Vulnerability might exist!");
    } catch (error) {
        if (error.response) {
            // 400 Bad Request (Validation Error) or 401 Unauthorized is Good.
            // 500 Internal Server Error is Bad (implies unhandled exception/query error).
            if (error.response.status === 400 || error.response.status === 401 || error.response.status === 403) {
                printResult("Injection Prevention", true, `Request rejected with HTTP ${error.response.status}.`);
            } else if (error.response.status === 500) {
                printResult("Injection Prevention", false, "Server error (HTTP 500). Potential crash or query error.");
            } else {
                printResult("Injection Prevention", true, `Request blocked with HTTP ${error.response.status}.`);
            }
        } else {
            printResult("Injection Prevention", false, `Request failed: ${error.message}`);
        }
    }
};

runTest();
