#!/usr/bin/env node
/* eslint-disable babylonjs/syntax */
/* eslint-disable no-console */
/**
 * Phase 7.1 — Split Bare-Import Files
 *
 * Finds files exported from pure.ts barrels that contain bare side-effect imports
 * (e.g. `import "./Extensions/engine.alpha"`), and splits them into:
 *   - FILE.pure.ts — all code MINUS the bare imports
 *   - FILE.ts      — wrapper: `export * from "./FILE.pure"; import "./bare1"; ...`
 *
 * This ensures the pure barrel chain only references side-effect-free modules.
 *
 * Usage:
 *   node scripts/treeshaking/migration/splitBareImports.mjs [--dry-run] [--verbose] [--file <rel-path>]
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join, resolve, dirname, basename, relative } from "path";
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
// Step 1: Find all files exported from pure.ts barrels (non-pure specifiers)
// ---------------------------------------------------------------------------

function findPureBarrels(dir) {
    const results = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...findPureBarrels(fullPath));
        } else if (entry.name === "pure.ts") {
            results.push(fullPath);
        }
    }
    return results;
}

/**
 * Parse a pure.ts barrel and return the set of absolute file paths for
 * non-pure exports (i.e. `export * from "./something"` where something
 * does not contain ".pure" or "/pure").
 * @param {string} barrelPath - absolute path to the pure.ts barrel file
 * @returns {string[]} array of absolute file paths for non-pure exports
 */
function getExportedNonPureFiles(barrelPath) {
    const content = readFileSync(barrelPath, "utf-8");
    const dir = dirname(barrelPath);
    const files = [];
    for (const line of content.split("\n")) {
        const m = line.match(/^export \* from ["']([^"']+)["']/);
        if (!m) {
            continue;
        }
        const mod = m[1];
        if (mod.includes(".pure") || mod.endsWith("/pure")) {
            continue;
        }
        const resolved = resolve(dir, mod + ".ts");
        if (existsSync(resolved)) {
            files.push(resolved);
        }
    }
    return files;
}

// ---------------------------------------------------------------------------
// Step 2: Detect bare imports in a file
// ---------------------------------------------------------------------------

const BARE_IMPORT_RE = /^import\s+["']([^"']+)["']\s*;?\s*$/;

function getBareImports(filePath) {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const bare = [];
    for (let i = 0; i < lines.length; i++) {
        const m = lines[i].trim().match(BARE_IMPORT_RE);
        if (m) {
            bare.push({ line: i, text: lines[i], module: m[1] });
        }
    }
    return bare;
}

// ---------------------------------------------------------------------------
// Step 3: Split a file into .pure.ts + wrapper .ts
// ---------------------------------------------------------------------------

function splitFile(filePath) {
    const relPath = relative(CORE_SRC, filePath);
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    const bareImports = getBareImports(filePath);
    if (bareImports.length === 0) {
        return null;
    }

    // Check if .pure.ts already exists
    const purePath = filePath.replace(/\.ts$/, ".pure.ts");
    if (existsSync(purePath)) {
        // A .pure.ts already exists — the wrapper already re-exports from it.
        // We just need to ensure the bare imports are in the wrapper, not the .pure.
        // Check if the .pure.ts has bare imports (that's the real bug case, like dds.pure.ts).
        const pureBare = getBareImports(purePath);
        if (pureBare.length > 0) {
            console.log(`  WARN: ${relPath.replace(/\.ts$/, ".pure.ts")} has ${pureBare.length} bare imports — needs manual fix`);
        }
        return null;
    }

    // Build .pure.ts content: everything except bare import lines
    const bareLineIndices = new Set(bareImports.map((b) => b.line));
    const pureLines = [];
    for (let i = 0; i < lines.length; i++) {
        if (!bareLineIndices.has(i)) {
            pureLines.push(lines[i]);
        }
    }

    // Trim trailing blank lines that were adjacent to removed bare imports
    while (pureLines.length > 0 && pureLines[pureLines.length - 1].trim() === "") {
        pureLines.pop();
    }
    pureLines.push(""); // ensure single trailing newline

    const pureContent = pureLines.join("\n");

    // Build wrapper .ts content
    const stem = basename(filePath, ".ts");
    const wrapperLines = [];

    // Re-export from pure
    wrapperLines.push(`export * from "./${stem}.pure";`);
    wrapperLines.push("");

    // Bare imports
    for (const bi of bareImports) {
        wrapperLines.push(bi.text.trimEnd());
    }
    wrapperLines.push("");

    const wrapperContent = wrapperLines.join("\n");

    return {
        relPath,
        purePath,
        pureContent,
        wrapperContent,
        filePath,
        bareCount: bareImports.length,
    };
}

// ---------------------------------------------------------------------------
// Step 4: Update pure.ts barrel references
// ---------------------------------------------------------------------------

function updatePureBarrelReferences(barrelPath, splitFiles) {
    let content = readFileSync(barrelPath, "utf-8");
    let changed = false;

    for (const sf of splitFiles) {
        const stem = basename(sf.filePath, ".ts");
        const dir = dirname(sf.filePath);
        const barrelDir = dirname(barrelPath);

        // Only update barrels in the same directory or parent
        const relToBarrel = relative(barrelDir, dir);
        const prefix = relToBarrel === "" ? "./" : "./" + relToBarrel + "/";

        // Match: export * from "./stem" or export * from "./subdir/stem"
        const fromPattern = `"${prefix}${stem}"`;
        const toPattern = `"${prefix}${stem}.pure"`;

        if (content.includes(fromPattern)) {
            content = content.replace(fromPattern, toPattern);
            changed = true;
        }
    }

    if (changed) {
        return { barrelPath, content };
    }
    return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
    console.log("Phase 7.1 — Split Bare-Import Files\n");

    // Find all files exported from pure barrels
    const barrels = findPureBarrels(CORE_SRC);
    console.log(`Found ${barrels.length} pure.ts barrel files`);

    let targetFiles;
    if (SINGLE_FILE) {
        const abs = resolve(CORE_SRC, SINGLE_FILE);
        targetFiles = [abs];
    } else {
        // Collect all non-pure files exported from pure barrels
        const fileSet = new Set();
        for (const barrel of barrels) {
            for (const f of getExportedNonPureFiles(barrel)) {
                fileSet.add(f);
            }
        }
        targetFiles = [...fileSet].sort();
    }

    console.log(`Checking ${targetFiles.length} non-pure files exported from pure barrels...\n`);

    // Split files
    const splits = [];
    for (const f of targetFiles) {
        const result = splitFile(f);
        if (result) {
            splits.push(result);
            if (VERBOSE) {
                console.log(`  SPLIT: ${result.relPath} (${result.bareCount} bare imports)`);
            }
        }
    }

    console.log(`\nFiles to split: ${splits.length}`);
    const totalBare = splits.reduce((sum, s) => sum + s.bareCount, 0);
    console.log(`Total bare imports to relocate: ${totalBare}`);

    if (splits.length === 0) {
        console.log("Nothing to do.");
        return;
    }

    if (DRY_RUN) {
        console.log("\n--- DRY RUN — not writing files ---\n");
        for (const s of splits) {
            console.log(`\n=== ${s.relPath} → ${s.relPath.replace(/\.ts$/, ".pure.ts")} ===`);
            console.log(`Bare imports: ${s.bareCount}`);
            if (VERBOSE) {
                console.log("\n--- .pure.ts (first 20 lines) ---");
                console.log(s.pureContent.split("\n").slice(0, 20).join("\n"));
                console.log("\n--- wrapper .ts ---");
                console.log(s.wrapperContent);
            }
        }
    } else {
        // Write files
        for (const s of splits) {
            writeFileSync(s.purePath, s.pureContent);
            writeFileSync(s.filePath, s.wrapperContent);
            console.log(`  ✓ ${s.relPath} → split (${s.bareCount} bare imports)`);
        }

        // Update pure barrel references
        console.log("\nUpdating pure.ts barrel references...");
        let barrelUpdates = 0;
        for (const barrel of barrels) {
            const update = updatePureBarrelReferences(barrel, splits);
            if (update) {
                writeFileSync(update.barrelPath, update.content);
                const relBarrel = relative(CORE_SRC, update.barrelPath);
                console.log(`  ✓ ${relBarrel}`);
                barrelUpdates++;
            }
        }
        console.log(`Updated ${barrelUpdates} barrel files`);
    }

    console.log("\nDone.");
}

main();
