const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const API_DOCS_URL = 'http://localhost:5000/api-docs/json';
const OUTPUT_FILE = path.resolve(__dirname, '../lib/api-types.ts');

async function generateTypes() {
  console.log('Fetching OpenAPI spec from:', API_DOCS_URL);
  
  try {
    
    console.log('Generating types...');
    execSync(`npx openapi-typescript ${API_DOCS_URL} -o ${OUTPUT_FILE}`, { stdio: 'inherit' });
    console.log('Successfully generated types at:', OUTPUT_FILE);
  } catch (error) {
    console.error('Failed to generate types:', error.message);
    console.log('Make sure the backend server is running on port 5000!');
    process.exit(1);
  }
}

generateTypes();
