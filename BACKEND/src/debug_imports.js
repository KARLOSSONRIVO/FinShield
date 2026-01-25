import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const importsToCheck = [
    "./app.js",
    "./config/env.js",
    "./infrastructure/db/database.js",
    "./routes/index.js",
    "./routes/User/user.route.js"
];

console.log("Checking modules from:", __dirname);

importsToCheck.forEach(imp => {
    const p = path.resolve(__dirname, imp);
    console.log(`Checking ${imp} -> ${p}`);
    if (fs.existsSync(p)) {
        console.log(`  [OK] Found`);
    } else {
        console.error(`  [FAIL] NOT FOUND: ${p}`);
    }
});
