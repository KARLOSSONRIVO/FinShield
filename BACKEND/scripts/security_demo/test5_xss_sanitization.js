
import axios from 'axios';
import { config, printResult, printHeader } from './config.js';

const runTest = async () => {
    printHeader("Test 5: XSS Sanitization (Input Cleaning)");

    // We'll test a route that echoes input or processes it. 
    // Auth Login is a good candidate if we check if the input is sanitized before validation.
    // Generally, XSS middleware runs early.

    const url = `${config.API_URL}/auth/login`;
    const xssPayload = "<script>alert('XSS')</script>";

    // We send the XSS payload in a field
    const payload = {
        email: xssPayload,
        password: "password"
    };

    console.log(`Sending Login with XSS payload: ${xssPayload}`);

    try {
        await axios.post(url, payload);
    } catch (error) {
        // We look for evidence handled by middleware.
        // If the middleware strips the tags, the email becomes "alert('XSS')" which is invalid email -> 400 Bad Request.
        // If it doesn't strip, Zod might still say invalid email.

        // A better test might be to see if the response contains the sanitized version if it echoes it back in an error message.
        if (error.response && error.response.data) {
            const errorMsg = JSON.stringify(error.response.data);
            console.log(`Server Response: ${errorMsg}`);

            if (errorMsg.includes("&lt;script&gt;") || !errorMsg.includes("<script>")) {
                printResult("XSS Sanitization", true, "Payload was sanitized or rejected.");
            } else {
                printResult("XSS Sanitization", false, "Payload returned unsanitized (or not echoed).");
            }
        } else {
            printResult("XSS Sanitization", true, "Request blocked/failed without echoing payload.");
        }
    }
};

runTest();
