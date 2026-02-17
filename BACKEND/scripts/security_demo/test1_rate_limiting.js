
import axios from 'axios';
import { config, printResult, printHeader } from './config.js';

const runTest = async () => {
    printHeader("Test 1: Rate Limiting (Brute Force Protection)");
    console.log("Sending rapid login requests to trigger rate limit...");

    const url = `${config.API_URL}/auth/login`;
    const payload = { email: "attacker@example.com", password: "randompassword" };

    let attempts = 0;
    let limitReached = false;
    const MAX_ATTEMPTS = 20;

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        try {
            await axios.post(url, payload);
            attempts++;
            process.stdout.write("."); // Progress indicator
        } catch (error) {
            if (error.response && error.response.status === 429) {
                console.log("\n");
                printResult("Rate Limiting", true, `Blocked after ${attempts} attempts with HTTP 429.`);
                limitReached = true;
                break;
            } else if (error.code === 'ECONNREFUSED') {
                console.log("\n");
                printResult("Rate Limiting", false, `Connection refused. Is the server running at ${config.API_URL}?`);
                return;
            } else {
                // Ignore other errors (like 401 invalid credentials) as we expect them until rate limit hits
                attempts++;
                process.stdout.write(".");
            }
        }
    }

    if (!limitReached) {
        console.log("\n");
        printResult("Rate Limiting", false, `Failed to trigger rate limit after ${MAX_ATTEMPTS} attempts.`);
    }
};

runTest();
