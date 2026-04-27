/* eslint-disable no-console */

// Opens a file or URL using the platform's default application.
// Usage: node scripts/open.mjs <path-or-url>

import { execSync } from "child_process";

const target = process.argv[2];
if (!target) {
    console.error("Usage: node scripts/open.mjs <path-or-url>");
    process.exit(1);
}

const command = process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open";
execSync(`${command} ${target}`);
