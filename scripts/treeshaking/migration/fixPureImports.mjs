#!/usr/bin/env node
/* eslint-disable babylonjs/syntax */
/* eslint-disable no-console */
/**
 * Fix Pure Import Specifiers
 *
 * Scans all .pure.ts files in packages/dev/core/src/ and rewrites value imports
 * that point to a module where a .pure.ts sibling exists but the import doesn't
 * use the .pure specifier.
 *
 * This prevents circular dependencies and ensures pure files only pull in other
 * pure files, keeping the side-effect-free import chain intact.
 *
 * Handles both relative imports (../foo/bar) and TypeScript path-alias imports
 * (core/foo/bar).
 *
 * Usage:
 *   node scripts/treeshaking/migration/fixPureImports.mjs [--dry-run] [--verbose]
 *
 * Options:
 *   --dry-run   Report violations without modifying files
 *   --verbose   Print every rewrite
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../../..");
const CORE_SRC = join(REPO_ROOT, "packages/dev/core/src");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const VERBOSE = args.includes("--verbose");

// ---------------------------------------------------------------------------
// File collection
// ---------------------------------------------------------------------------

function collectPureFiles(dir) {
    const results = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...collectPureFiles(full));
        } else if (entry.name.endsWith(".pure.ts") && !entry.name.endsWith(".d.ts")) {
            results.push(full);
        }
    }
    return results;
}

// ---------------------------------------------------------------------------
// Import line detection
// ---------------------------------------------------------------------------

// Matches: import { X } from "specifier" or import { X, Y } from "specifier"
// Does NOT match: import type { X } from "specifier"
const IMPORT_RE = /^(\s*import\s+(?!type\b).+from\s+)(["'])([^"']+)\2/;

function resolveSpecToFile(spec, importingFile) {
    if (spec.startsWith(".")) {
        // Relative import
        const dir = dirname(importingFile);
        return resolve(dir, spec);
    }
    if (spec.startsWith("core/")) {
        // Path-alias import (core/ → CORE_SRC/)
        return join(CORE_SRC, spec.slice("core/".length));
    }
    return null;
}

function hasPureSibling(absPath) {
    return existsSync(absPath + ".pure.ts");
}

function rewriteSpec(spec) {
    // Append .pure to the specifier
    return spec + ".pure";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const pureFiles = collectPureFiles(CORE_SRC);
let totalViolations = 0;
let totalFilesFixed = 0;

for (const filePath of pureFiles) {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    let modified = false;
    const relPath = filePath.replace(CORE_SRC + "/", "");

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Skip type-only imports
        if (/^\s*import\s+type\b/.test(line)) continue;

        const match = line.match(IMPORT_RE);
        if (!match) continue;

        const prefix = match[1]; // "import { X } from "
        const quote = match[2]; //  ' or "
        const spec = match[3]; //   the specifier

        // Skip if already .pure
        if (spec.endsWith(".pure")) continue;
        // Skip if .functions (these are already side-effect-free)
        if (spec.endsWith(".functions")) continue;

        const absResolved = resolveSpecToFile(spec, filePath);
        if (!absResolved) continue;

        if (hasPureSibling(absResolved)) {
            const newSpec = rewriteSpec(spec);
            totalViolations++;

            if (VERBOSE || DRY_RUN) {
                console.log(`  ${relPath}:${i + 1}: '${spec}' → '${newSpec}'`);
            }

            if (!DRY_RUN) {
                lines[i] = line.replace(`${quote}${spec}${quote}`, `${quote}${newSpec}${quote}`);
                modified = true;
            }
        }
    }

    if (modified) {
        writeFileSync(filePath, lines.join("\n"), "utf-8");
        totalFilesFixed++;
    }
}

console.log(`\nScanned ${pureFiles.length} .pure.ts files`);
console.log(`Found ${totalViolations} imports that should use .pure specifier`);
if (!DRY_RUN) {
    console.log(`Fixed ${totalFilesFixed} files`);
} else {
    console.log(`(dry-run — no files modified)`);
}
