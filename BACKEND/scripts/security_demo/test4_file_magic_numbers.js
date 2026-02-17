
import axios from 'axios';
import FormData from 'form-data';
import { config, printResult, printHeader } from './config.js';

const runTest = async () => {
    printHeader("Test 4: File Upload Magic Number Validation");

    const url = `${config.API_URL}/invoice/upload`;

    // Create a fake file that claims to be a PDF but has text content (no PDF magic number like %PDF)
    const form = new FormData();
    const fakeFileContent = Buffer.from("This is a text file masked as a PDF.");
    form.append('file', fakeFileContent, {
        filename: 'malicious.pdf',
        contentType: 'application/pdf', // Lie about the content type
    });

    // Note: This endpoint likely requires authentication. 
    // If the test fails with 401 Unauthorized, we need to log in first.
    // For this demo script, we assume we might get a 401 if not logged in, 
    // or if we want to test purely the file validation, we'd need a valid token.
    // Let's assume we need a token. We'll try to login as a test user first.

    // Login to get token
    let token;
    try {
        const loginRes = await axios.post(`${config.API_URL}/auth/login`, {
            email: "admin@finshield.com", // Replace with valid test creds if known
            password: "Password123!"
        });
        token = loginRes.data.token;
    } catch (e) {
        console.log("Login failed (using dummy token, might get 401):", e.message);
        token = "dummy_token";
    }

    try {
        await axios.post(url, form, {
            headers: {
                ...form.getHeaders(),
                'Authorization': `Bearer ${token}`
            }
        });
        printResult("Magic Number Check", false, "Upload succeeded (HTTP 200). Magic number validation failed!");
    } catch (error) {
        if (error.response) {
            if (error.response.status === 400 && error.response.data?.message?.includes("Invalid file type")) {
                printResult("Magic Number Check", true, `Blocked with HTTP 400: ${error.response.data.message}`);
            } else if (error.response.status === 401) {
                printResult("Magic Number Check", false, "Blocked by Auth (HTTP 401), not File Type. Need valid credentials.");
            } else {
                printResult("Magic Number Check", true, `Blocked with status ${error.response.status}: ${JSON.stringify(error.response.data)}`);
            }
        } else {
            printResult("Magic Number Check", false, `Request failed: ${error.message}`);
        }
    }
};

runTest();
