
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load backend .env from two levels up
dotenv.config({ path: path.join(__dirname, '../../.env') });

const PORT = process.env.PORT || 8000; // Default to 8000 if not set, typical for backend
const API_URL = `http://localhost:${PORT}`;

export const config = {
    API_URL,
    colors: {
        reset: "\x1b[0m",
        red: "\x1b[31m",
        green: "\x1b[32m",
        yellow: "\x1b[33m",
        blue: "\x1b[34m",
        cyan: "\x1b[36m",
        magenta: "\x1b[35m"
    }
};

export const printResult = (testName, passed, details) => {
    const color = passed ? config.colors.green : config.colors.red;
    const status = passed ? "PASSED" : "FAILED";
    console.log(`${config.colors.cyan}[${testName}]${config.colors.reset} ${color}${status}${config.colors.reset}: ${details}`);
};

export const printHeader = (title) => {
    console.log(`\n${config.colors.magenta}=== ${title} ===${config.colors.reset}\n`);
};
