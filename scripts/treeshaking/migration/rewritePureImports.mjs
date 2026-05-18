#!/usr/bin/env node
/* eslint-disable babylonjs/syntax */
/* eslint-disable no-console */
/**
 * Phase 7.2 — Rewrite Pure Import Specifiers
 *
 * Scans every .pure.ts file and rewrites value-import specifiers
 * from `"./foo"` to `"./foo.pure"` whenever a `.pure.ts` companion exists.
 *
 * This keeps the pure import chain fully side-effect-free, so that bundlers
 * never pull in side-effectful wrappers when traversing the pure entry point.
 *
 * Usage:
 *   node scripts/treeshaking/migration/rewritePureImports.mjs [--dry-run] [--verbose] [--file <rel-path>]
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join, resolve, dirname, relative } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../../..");
const CORE_SRC = join(REPO_ROOT, "packages/dev/core/src");

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const VERBOSE = args.includes("--verbose");
const fileIdx = args.indexOf("--file");
const SINGLE_FILE = fileIdx !== -1 ? args[fileIdx + 1] : null;

// ---------------------------------------------------------------------------
// Step 1: Find all .pure.ts files (not pure.ts barrels)
// ---------------------------------------------------------------------------

function findPureFiles(dir) {
    const results = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...findPureFiles(fullPath));
        } else if (entry.name.endsWith(".pure.ts") && entry.name !== "pure.ts") {
            results.push(fullPath);
        }
    }
    return results;
}

// ---------------------------------------------------------------------------
// Step 2: Rewrite imports in a single .pure.ts file
// ---------------------------------------------------------------------------

/**
 * Matches a value import line (not `import type`).
 * We need to rewrite only value imports because type imports are erased at
 * compile time and have no runtime effect.
 *
 * Captures the full specifier in group 2.
 * Handles:
 *   import { Foo } from "./bar";
 *   import Foo from "./bar";
 *   import Foo, { Bar } from "./bar";
 *   import * as Foo from "./bar";
 */
const IMPORT_LINE_RE = /^(\s*import\s+(?!type\s)(?:(?:\{[^}]*\}|[^{}"']+(?:,\s*\{[^}]*\})?|\*\s+as\s+\w+)\s+from\s+))(['"])([^"']+)\2(\s*;?\s*)$/;

function rewriteFile(filePath) {
    const relPath = relative(CORE_SRC, filePath);
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const fileDir = dirname(filePath);

    let rewrites = 0;
    const newLines = lines.map((line) => {
        const m = line.match(IMPORT_LINE_RE);
        if (!m) {
            return line;
        }

        const prefix = m[1]; // everything before the quote
        const quote = m[2]; // ' or "
        const specifier = m[3]; // the module specifier
        const suffix = m[4]; // trailing semicolon / whitespace

        // Only rewrite relative specifiers that don't already point to .pure
        if (!specifier.startsWith(".")) {
            return line;
        }
        if (specifier.includes(".pure")) {
            return line;
        }

        // Resolve the specifier to an absolute path
        const resolved = resolve(fileDir, specifier);
        const pureCandidatePath = resolved + ".pure.ts";

        if (!existsSync(pureCandidatePath)) {
            return line;
        }

        // Safety: only rewrite if the regular .ts file is a thin wrapper
        // (starts with `export * from "./<name>.pure"`) created by our splitter.
        // Original .pure.ts files may export only a subset of their regular
        // companion, so blindly rewriting would break compilation.
        const regularPath = resolved + ".ts";
        if (existsSync(regularPath)) {
            // Strip leading comments and whitespace to find the first real statement
            const regularContent = readFileSync(regularPath, "utf-8")
                .replace(/^\s*(\/\*[\s\S]*?\*\/\s*|\/\/[^\n]*\n\s*)*/m, "")
                .trimStart();
            if (!regularContent.startsWith("export * from")) {
                return line;
            }
            if (!regularContent.includes(".pure")) {
                return line;
            }
        }

        // Build the new specifier by appending .pure
        const newSpecifier = specifier + ".pure";
        rewrites++;

        if (VERBOSE) {
            console.log(`  ${relPath}: ${specifier} → ${newSpecifier}`);
        }

        return `${prefix}${quote}${newSpecifier}${quote}${suffix}`;
    });

    if (rewrites === 0) {
        return 0;
    }

    if (!DRY_RUN) {
        writeFileSync(filePath, newLines.join("\n"), "utf-8");
    }

    return rewrites;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
    console.log(`Phase 7.2 — Rewrite Pure Import Specifiers`);
    console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}\n`);

    let pureFiles;
    if (SINGLE_FILE) {
        const abs = resolve(CORE_SRC, SINGLE_FILE);
        if (!existsSync(abs)) {
            console.error(`File not found: ${abs}`);
            process.exit(1);
        }
        pureFiles = [abs];
    } else {
        pureFiles = findPureFiles(CORE_SRC);
    }

    console.log(`Pure files to scan: ${pureFiles.length}\n`);

    let totalRewrites = 0;
    let filesModified = 0;

    for (const f of pureFiles) {
        const rewrites = rewriteFile(f);
        if (rewrites > 0) {
            totalRewrites += rewrites;
            filesModified++;
            if (!VERBOSE) {
                const rel = relative(CORE_SRC, f);
                console.log(`  ${rel}: ${rewrites} import(s) rewritten`);
            }
        }
    }

    console.log(`\nSummary:`);
    console.log(`  Pure files scanned: ${pureFiles.length}`);
    console.log(`  Files modified: ${filesModified}`);
    console.log(`  Total imports rewritten: ${totalRewrites}`);

    if (DRY_RUN) {
        console.log(`\n(Dry run — no files were modified)`);
    }
}

main();
