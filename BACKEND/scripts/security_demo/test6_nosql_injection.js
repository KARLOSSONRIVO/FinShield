
import axios from 'axios';
import { config, printResult, printHeader } from './config.js';

const runTest = async () => {
    printHeader("Test 6: NoSQL Injection (Operator Injection)");

    // mongoSanitize middleware strips keys starting with $ from req.body, req.query, req.params.
    // We'll try to send a query parameter with a $ operator.
    // We can use the health check or any route that parses query params.
    // Let's try /user or even /auth/login with a query (though login ignores query usually).

    // Best bet: Try to bypass auth or filtering on an endpoint.
    // Since we might not have a valid token, we'll test the middleware's stripping behavior if possible,
    // or relies on the fact that sending { email: { $ne: null } } to login via JSON body *should* fail 
    // because `email` must be a string (Zod) OR `mongoSanitize` removes the $.

    const url = `${config.API_URL}/auth/login`;

    // The payload is an object where email is an object with a MongoDB operator
    // This attempts to find any user where email is not null (i.e., the first user, likely admin).
    const payload = {
        email: { "$gt": "" },
        password: "password"
    };

    console.log(`Sending NoSQL Injection Payload: ${JSON.stringify(payload)}`);

    try {
        await axios.post(url, payload);
        printResult("NoSQL Injection", false, "Request with Operator succeeded (HTTP 200). Vulnerability likely!");
    } catch (error) {
        // We expect 400 (Validation Error due to Zod expecting string, got object) 
        // OR the middleware strips it and it becomes empty/invalid.

        // Specifically, express-mongo-sanitize replaces keys with $ with nothing 
        // OR Zod validation kicks in first ensuring 'email' is a string. Both are wins.

        if (error.response) {
            console.log(`Status: ${error.response.status} | Data: ${JSON.stringify(error.response.data)}`);
            if (error.response.status === 400 || error.response.status === 422) {
                printResult("NoSQL Injection", true, "Blocked! Likely due to Schema Validation (Zod) enforcing string type or Sanitization.");
            } else {
                printResult("NoSQL Injection", true, `Request rejected with status ${error.response.status}.`);
            }
        } else {
            printResult("NoSQL Injection", false, `Request Connection Failed: ${error.message}`);
        }
    }
};

runTest();
