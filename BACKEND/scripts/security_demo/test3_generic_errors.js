
import axios from 'axios';
import { config, printResult, printHeader } from './config.js';

const runTest = async () => {
    printHeader("Test 3: Generic Error Messages (User Enumeration Prevention)");

    const url = `${config.API_URL}/auth/login`;

    // Case 1: Non-existent user
    const nonExistentDetails = { email: "definitelynotreal@example.com", password: "password" };
    let msg1 = "";

    // Case 2: Existing user (assuming admin or similar exists, or just a believable email format)
    // Even if we don't know a real user, the response should be generic. 
    // Ideally we'd compare against a known real user to see if the timing or message differs.
    // For this demo, we'll verify the message format is standard.
    const validFormatDetails = { email: "admin@finshield.com", password: "wrongpassword" };
    let msg2 = "";

    try {
        console.log("Attempt 1: Non-existent user...");
        await axios.post(url, nonExistentDetails);
    } catch (error) {
        if (error.response && error.response.data) {
            msg1 = error.response.data.message || error.response.data.error;
            console.log(`Response 1: "${msg1}"`);
        }
    }

    try {
        console.log("Attempt 2: Potentially valid email / Wrong password...");
        await axios.post(url, validFormatDetails);
    } catch (error) {
        if (error.response && error.response.data) {
            msg2 = error.response.data.message || error.response.data.error;
            console.log(`Response 2: "${msg2}"`);
        }
    }

    if (msg1 === "Invalid email or password" && msg2 === "Invalid email or password") {
        printResult("Generic Errors", true, "Both responses returned generic 'Invalid email or password'.");
    } else {
        printResult("Generic Errors", false, `Messages differed or were too specific.\n1: ${msg1}\n2: ${msg2}`);
    }
};

runTest();
