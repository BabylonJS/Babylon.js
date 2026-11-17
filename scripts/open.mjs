/* eslint-disable no-console */

// Opens a file or URL using the platform's default application.
// Usage: node scripts/open.mjs <path-or-url>

import open from "open";

const target = process.argv[2];
if (!target) {
    console.error("Usage: node scripts/open.mjs <path-or-url>");
    process.exit(1);
}

await open(target);
