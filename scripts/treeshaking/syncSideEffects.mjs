#!/usr/bin/env node
/* eslint-disable babylonjs/syntax */
/* eslint-disable no-console */
/**
 * Sync Side-Effects Manifest → package.json sideEffects field
 *
 * Reads the manifest produced by auditSideEffects.mjs and writes the
 * "sideEffects" array into @babylonjs/core package.json (the public package).
 *
 * NOTE: @dev/core is private and never consumed by external bundlers,
 * so its sideEffects field is left as-is (all files marked as side-effectful).
 *
 * Approach:
 *   1. For top-level directories where ALL .ts files have side effects
 *      (e.g. Shaders/, ShadersWGSL/), emit a single recursive glob:
 *      "Shaders/**".
 *
 *   2. For individual files outside those directories, emit explicit paths:
 *      "Actions/action.js".
 *
 * Usage:
 *   node scripts/treeshaking/syncSideEffects.mjs [--dry-run] [--verbose]
 *
 * Options:
 *   --dry-run   Print the generated array but don't write to package.json
 *   --verbose   Print detailed information about glob/individual decisions
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, relative, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../..");
const CORE_SRC = join(REPO_ROOT, "packages/dev/core/src");
const PUBLIC_PKG_JSON = join(REPO_ROOT, "packages/public/@babylonjs/core/package.json");
const MANIFEST_PATH = join(__dirname, "side-effects-manifest.json");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Recursively count all .ts files (excluding .d.ts, .test.ts, .spec.ts) per
 * top-level directory.
 * @returns {Record<string, number>}
 */
function countTsFilesByTopDir() {
    const counts = {};
    function walk(dir) {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const fullPath = join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts") && !entry.name.endsWith(".test.ts") && !entry.name.endsWith(".spec.ts")) {
                const rel = relative(CORE_SRC, fullPath);
                const topDir = rel.includes("/") ? rel.split("/")[0] : rel;
                counts[topDir] = (counts[topDir] || 0) + 1;
            }
        }
    }
    walk(CORE_SRC);
    return counts;
}

/**
 * Update the "sideEffects" field in a package.json file.
 * @param {string} pkgPath
 * @param {string[]} sideEffects
 */
function updatePackageJson(pkgPath, sideEffects) {
    const raw = readFileSync(pkgPath, "utf-8");
    const pkg = JSON.parse(raw);
    pkg.sideEffects = sideEffects;
    // Preserve the 4-space indent used by Babylon.js
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + "\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes("--dry-run");
    const check = args.includes("--check");
    const verbose = args.includes("--verbose");

    // Read manifest
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));
    const seFiles = manifest.manifest.map((r) => r.file);

    // Count side-effectful files per top-level directory
    const seByTopDir = {};
    for (const file of seFiles) {
        const topDir = file.includes("/") ? file.split("/")[0] : file;
        seByTopDir[topDir] = (seByTopDir[topDir] || 0) + 1;
    }

    // Count ALL .ts files per top-level directory
    const allByTopDir = countTsFilesByTopDir();

    // Determine which top-level directories can be covered by a glob
    // (ALL files in the directory have side effects AND directory has >1 file)
    const globDirs = new Set();
    for (const [dir, seCount] of Object.entries(seByTopDir)) {
        const totalCount = allByTopDir[dir] || 0;
        if (seCount === totalCount && totalCount > 1) {
            globDirs.add(dir);
            if (verbose) {
                console.log(`GLOB: ${dir}/** (${totalCount} files, all side-effectful)`);
            }
        }
    }

    // Build the sideEffects list for the public package
    const entries = [];

    // 0. All barrel index files are side-effectful (they re-export wrappers
    //    that call Register* functions, so bundlers must traverse them)
    entries.push("**/index.js");

    // 1. Glob patterns for fully side-effectful directories
    for (const dir of [...globDirs].sort()) {
        entries.push(`${dir}/**`);
    }

    // 2. Individual file entries for everything else
    for (const file of seFiles.sort()) {
        const topDir = file.includes("/") ? file.split("/")[0] : file;
        if (globDirs.has(topDir)) {
            continue; // Already covered by glob
        }
        // Public package uses .js extension (compiled output)
        entries.push(file.replace(/\.ts$/, ".js"));
    }

    if (verbose || dryRun) {
        console.log(`\nGlob patterns: ${globDirs.size}`);
        console.log(`Individual files: ${entries.length - globDirs.size}`);
        console.log(`Total sideEffects entries: ${entries.length}`);
    }

    if (dryRun) {
        console.log("\n=== @babylonjs/core sideEffects ===");
        console.log(JSON.stringify(entries, null, 2));
        return;
    }

    if (check) {
        // Compare expected entries to what's currently in package.json
        const raw = readFileSync(PUBLIC_PKG_JSON, "utf-8");
        const pkg = JSON.parse(raw);
        const current = JSON.stringify(pkg.sideEffects ?? [], null, 2);
        const expected = JSON.stringify(entries, null, 2);
        if (current === expected) {
            console.log("✅ @babylonjs/core package.json sideEffects is up-to-date.\n");
            process.exit(0);
        } else {
            console.error("❌ @babylonjs/core package.json sideEffects is out of date!");
            console.error("To fix: node scripts/treeshaking/syncSideEffects.mjs\n");
            process.exit(1);
        }
    }

    // Write to @babylonjs/core package.json only
    // (@dev/core is private and never consumed by external bundlers)
    updatePackageJson(PUBLIC_PKG_JSON, entries);
    console.log(`Updated ${PUBLIC_PKG_JSON} — ${entries.length} sideEffects entries`);
}

main();
