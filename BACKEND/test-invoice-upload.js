/**
 * Test script for Invoice Upload Endpoint
 * 
 * Usage:
 * 1. Make sure the server is running: npm run dev
 * 2. Update the variables below (BASE_URL, TOKEN, TEST_FILE_PATH)
 * 3. Run: node test-invoice-upload.js
 */

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TOKEN = process.env.TEST_TOKEN || ''; // JWT token from login
const TEST_FILE_PATH = process.env.TEST_FILE_PATH || './test-invoice.pdf';

async function testInvoiceUpload() {
    console.log('🧪 Testing Invoice Upload Endpoint\n');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Endpoint: POST ${BASE_URL}/invoice/upload\n`);

    // Check if token is provided
    if (!TOKEN) {
        console.error('❌ ERROR: TEST_TOKEN environment variable is required');
        console.log('\nTo get a token:');
        console.log('1. Login via POST /auth/login');
        console.log('2. Copy the token from the response');
        console.log('3. Set TEST_TOKEN=your_token_here');
        process.exit(1);
    }

    // Check if test file exists
    if (!fs.existsSync(TEST_FILE_PATH)) {
        console.error(`❌ ERROR: Test file not found: ${TEST_FILE_PATH}`);
        console.log('\nCreating a dummy test file...');
        fs.writeFileSync(TEST_FILE_PATH, 'This is a test invoice file for upload testing.');
        console.log(`✅ Created dummy file: ${TEST_FILE_PATH}\n`);
    }

    try {
        // Read the file
        const fileBuffer = fs.readFileSync(TEST_FILE_PATH);
        console.log(`📄 File: ${TEST_FILE_PATH} (${fileBuffer.length} bytes)\n`);

        // Create form data
        const formData = new FormData();
        formData.append('file', fileBuffer, {
            filename: 'test-invoice.pdf',
            contentType: 'application/pdf'
        });

        // Make the request
        console.log('📤 Sending upload request...\n');
        const response = await fetch(`${BASE_URL}/invoice/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                ...formData.getHeaders()
            },
            body: formData
        });

        const responseText = await response.text();
        let responseData;
        
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            responseData = { raw: responseText };
        }

        // Display results
        console.log('📥 Response Status:', response.status, response.statusText);
        console.log('📥 Response Headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
        console.log('\n📥 Response Body:');
        console.log(JSON.stringify(responseData, null, 2));

        if (response.ok) {
            console.log('\n✅ SUCCESS: Invoice uploaded successfully!');
            if (responseData.data) {
                console.log('\n📋 Invoice Details:');
                console.log(`   ID: ${responseData.data.id}`);
                console.log(`   IPFS CID: ${responseData.data.ipfsCid}`);
                console.log(`   File Hash: ${responseData.data.fileHashSha256}`);
                console.log(`   Anchor Status: ${responseData.data.anchorStatus}`);
                if (responseData.data.anchorTxHash) {
                    console.log(`   Transaction Hash: ${responseData.data.anchorTxHash}`);
                }
                if (responseData.data.anchoredAt) {
                    console.log(`   Anchored At: ${new Date(responseData.data.anchoredAt).toISOString()}`);
                }
            }
        } else {
            console.log('\n❌ FAILED: Upload request failed');
            if (responseData.message) {
                console.log(`   Error: ${responseData.message}`);
            }
            if (responseData.code) {
                console.log(`   Code: ${responseData.code}`);
            }
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        if (error.stack) {
            console.error('\nStack trace:');
            console.error(error.stack);
        }
        process.exit(1);
    }
}

// Run the test
testInvoiceUpload();
