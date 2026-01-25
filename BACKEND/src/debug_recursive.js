import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.dirname(__filename); // src/

const visited = new Set();

function scanFile(filePath) {
    if (visited.has(filePath)) return;
    visited.add(filePath);

    if (!fs.existsSync(filePath)) {
        console.error(`[MISSING] ${filePath}`);
        return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    // Match import ... from "..." or export ... from "..."
    const regex = /(?:import|export)\s+(?:[\s\S]*?from\s+)?['"](\.{1,2}\/[^'"]+)['"]/g;

    let match;
    while ((match = regex.exec(content)) !== null) {
        const importPath = match[1];
        const dir = path.dirname(filePath);
        const resolvedPath = path.resolve(dir, importPath);

        if (!fs.existsSync(resolvedPath)) {
            console.error(`[ERROR] In ${filePath}:`);
            console.error(`        Cannot find module '${importPath}'`);
            console.error(`        Resolved to: ${resolvedPath}`);
        } else {
            // console.log(`[OK] ${importPath}`);
            if (fs.statSync(resolvedPath).isFile()) {
                scanFile(resolvedPath);
            }
        }
    }
}

const entryPoint = path.join(rootDir, 'server.js');
console.log("Starting scan from:", entryPoint);
scanFile(entryPoint);
console.log("Scan complete.");
