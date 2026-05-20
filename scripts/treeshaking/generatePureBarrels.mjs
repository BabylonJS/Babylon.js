#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * generatePureBarrels.mjs
 *
 * Generates `pure.ts` barrel files alongside every `index.ts` in
 * `packages/dev/core/src/`.  Each `pure.ts` re-exports only from
 * side-effect-free modules:
 *
 *   - `*.pure.ts` files (split from RegisterClass wrappers in Phase 2)
 *   - Files with no module-level side effects (per audit manifest)
 *   - Subdirectory `pure.ts` barrels (recursively generated)
 *
 * Usage:
 *   node scripts/treeshaking/generatePureBarrels.mjs [--dry-run] [--verbose] [--no-format]
 *
 * Options:
 *   --dry-run   Print what would be written without touching disk
 *   --verbose   Print detailed per-file decisions
 *   --no-format Skip formatting generated files after writing them
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from "fs";
import { resolve, dirname, relative, join, basename } from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../..");
const SRC_ROOT = resolve(REPO_ROOT, "packages/dev/core/src");
const MANIFEST_PATH = resolve(__dirname, "side-effects-manifest.json");

const DRY_RUN = process.argv.includes("--dry-run");
const CHECK = process.argv.includes("--check");
const VERBOSE = process.argv.includes("--verbose");
const NO_FORMAT = process.argv.includes("--no-format");
const IS_ADO = !!process.env.TF_BUILD;

function adoError(msg) {
    if (IS_ADO) {
        console.log(`##vso[task.logissue type=error]${msg}`);
    }
}

/**
 * @param {string} filePath
 * @returns {string}
 */
function toPosixPath(filePath) {
    return filePath.split(/[/\\]+/).join("/");
}

const HEADER = `/** Pure barrel — re-exports only side-effect-free modules */\n`;
const writtenFiles = [];
/** @type {Map<string, string>} path → expected content (used in --check mode) */
const expectedContents = new Map();
/** @type {Set<string>} Generated barrel paths expected from this run */
const expectedBarrelPaths = new Set();

// ── Load side-effects manifest ──────────────────────────────────────────────
const manifestData = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));
// manifest is an array of { file, sideEffects }
// file paths are relative to SRC_ROOT (e.g. "Actions/action.ts")
const sideEffectFiles = new Set(manifestData.manifest.map((e) => toPosixPath(e.file)));

// ── Scan for existing .pure.ts files ────────────────────────────────────────
const pureFileSet = new Set();
function scanForPureFiles(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            scanForPureFiles(join(dir, entry.name));
        } else if (entry.name.endsWith(".pure.ts") && entry.name !== "pure.ts") {
            // e.g. "math.color.pure.ts" — store relative to SRC_ROOT without extension
            const rel = toPosixPath(relative(SRC_ROOT, join(dir, entry.name)));
            // Store without ".ts" extension so we can match against specifiers
            pureFileSet.add(rel.replace(/\.ts$/, ""));
        }
    }
}
scanForPureFiles(SRC_ROOT);

function collectPureBarrels(dir) {
    const results = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...collectPureBarrels(fullPath));
        } else if (entry.isFile() && entry.name === "pure.ts") {
            results.push(fullPath);
        }
    }
    return results;
}

function dedupePreservingOrder(lines) {
    const seen = new Set();
    const result = [];
    for (const line of lines) {
        if (seen.has(line)) {
            continue;
        }
        seen.add(line);
        result.push(line);
    }
    return result;
}

if (VERBOSE) {
    console.log(`Found ${pureFileSet.size} .pure.ts files`);
    console.log(`Manifest has ${sideEffectFiles.size} files with side effects`);
}

// ── Stats ───────────────────────────────────────────────────────────────────
let barrelCount = 0;
let skippedExports = 0;
let rewrittenToPure = 0;
let keptAsIs = 0;
let skippedBareImports = 0;
let emptyBarrels = 0;
let subdirRewrites = 0;
let orphanedAdded = 0;

// ── Recursive barrel processor ──────────────────────────────────────────────
const processedDirs = new Map(); // dir → boolean (hasPure)

/**
 * Process a directory: generates pure.ts alongside index.ts.
 * Returns true if a non-empty pure.ts was written/would-be-written.
 * @param {string} dir Absolute path to directory to process
 * @returns {boolean} Whether pure.ts was generated with exports
 */
function processDirectory(dir) {
    if (processedDirs.has(dir)) {
        return processedDirs.get(dir);
    }
    const indexPath = join(dir, "index.ts");
    if (!existsSync(indexPath)) {
        processedDirs.set(dir, false);
        return false;
    }

    const content = readFileSync(indexPath, "utf-8");
    const lines = content.split("\n");
    const outputLines = [];
    let hasExports = false;

    for (const line of lines) {
        const trimmed = line.trim();

        // Skip empty / whitespace-only lines
        if (!trimmed) {
            continue;
        }

        // Keep eslint-disable comments
        if (trimmed.startsWith("/* eslint-disable") || trimmed.startsWith("// eslint-disable")) {
            outputLines.push(trimmed);
            continue;
        }

        // Bare side-effect imports: import "./file"
        // If a .pure.ts companion exists, emit an export for the pure types
        if (/^import\s+["']/.test(trimmed)) {
            const bareMatch = trimmed.match(/^import\s+["'](.+?)["']\s*;?\s*$/);
            if (bareMatch) {
                const bareSpec = bareMatch[1];
                const bareRelPath = toPosixPath(relative(SRC_ROOT, resolve(dir, bareSpec)));
                const barePureRelPath = bareRelPath + ".pure";
                if (pureFileSet.has(barePureRelPath)) {
                    rewrittenToPure++;
                    outputLines.push(`export * from "${bareSpec}.pure";`);
                    hasExports = true;
                    if (VERBOSE) {
                        const relDir = relative(SRC_ROOT, dir);
                        console.log(`  BARE→PURE in ${relDir}/index.ts: ${bareSpec} → ${bareSpec}.pure`);
                    }
                } else {
                    skippedBareImports++;
                    if (VERBOSE) {
                        const relDir = relative(SRC_ROOT, dir);
                        console.log(`  SKIP bare import in ${relDir}/index.ts: ${trimmed}`);
                    }
                }
            }
            continue;
        }

        // Handle: export * from "./path"
        const starExport = trimmed.match(/^export\s+\*\s+from\s+["'](.+?)["']\s*;?\s*$/);
        if (starExport) {
            const result = resolveExport(dir, starExport[1], line);
            if (result) {
                outputLines.push(result);
                hasExports = true;
            }
            continue;
        }

        // Handle: export { Foo, Bar } from "./path"
        const namedExport = trimmed.match(/^export\s+\{([^}]+)\}\s+from\s+["'](.+?)["']\s*;?\s*$/);
        if (namedExport) {
            const result = resolveNamedExport(dir, namedExport[2], namedExport[1], line);
            if (result) {
                outputLines.push(result);
                hasExports = true;
            }
            continue;
        }

        // Generic comments — keep
        if (trimmed.startsWith("//") || trimmed.startsWith("/*")) {
            outputLines.push(trimmed);
            continue;
        }

        // Anything else we don't understand — warn and skip
        if (VERBOSE) {
            console.log(`  SKIP unknown line in ${relative(SRC_ROOT, dir)}/index.ts: ${trimmed}`);
        }
    }

    // Scan for orphaned .pure.ts files in this directory not yet covered
    const coveredPure = new Set();
    for (const ol of outputLines) {
        const m = ol.match(/from\s+["']\.\/(.+?)["']/);
        if (m) {
            const spec = m[1];
            if (spec.endsWith(".pure")) {
                coveredPure.add(spec); // e.g. "math.color.pure"
            }
        }
    }
    const relDir = toPosixPath(relative(SRC_ROOT, dir)) || ".";
    for (const pf of pureFileSet) {
        // pf is e.g. "Maths/math.color.pure" (relative to SRC_ROOT, without .ts)
        const pfDir = dirname(pf);
        if (pfDir !== relDir) continue;
        const localSpec = basename(pf);
        if (!coveredPure.has(localSpec)) {
            outputLines.push(`export * from "./${localSpec}";`);
            hasExports = true;
            orphanedAdded++;
            if (VERBOSE) {
                console.log(`  ORPHAN added in ${relDir}/pure.ts: ./${localSpec}`);
            }
        }
    }

    if (!hasExports) {
        emptyBarrels++;
        if (VERBOSE) {
            console.log(`  EMPTY barrel: ${relative(SRC_ROOT, dir)}/pure.ts — no pure exports`);
        }
        processedDirs.set(dir, false);
        return false;
    }

    // Build the file
    const purePath = join(dir, "pure.ts");
    expectedBarrelPaths.add(purePath);
    const uniqueOutputLines = dedupePreservingOrder(outputLines);
    const eslintLine = uniqueOutputLines.find((l) => l.includes("eslint-disable"));
    const exportLines = uniqueOutputLines.filter((l) => !l.includes("eslint-disable") && !l.startsWith("//") && !l.startsWith("/*"));
    const commentLines = uniqueOutputLines.filter((l) => l.startsWith("//") || (l.startsWith("/*") && !l.includes("eslint-disable")));

    let fileContent = HEADER;
    if (eslintLine) {
        fileContent += eslintLine + "\n";
    }
    for (const exp of exportLines) {
        fileContent += exp + "\n";
    }

    const relPure = relative(SRC_ROOT, purePath);
    if (DRY_RUN) {
        console.log(`\n[DRY-RUN] Would write ${relPure}:`);
        console.log(fileContent);
    } else if (CHECK) {
        expectedContents.set(purePath, fileContent);
    } else {
        writeFileSync(purePath, fileContent, "utf-8");
        writtenFiles.push(purePath);
        if (VERBOSE) {
            console.log(`  WROTE ${relPure} (${exportLines.length} exports)`);
        }
    }
    barrelCount++;
    processedDirs.set(dir, true);
    return true;
}

/**
 * Check if a file is a "barrel" (only `export * from` statements) that
 * transitively re-exports from side-effectful modules.
 * @param {string} filePath Absolute path to the .ts file
 * @param {string} contextDir Directory containing the barrel (for resolving relative paths)
 * @returns {boolean} True if the file is a barrel with side-effectful re-exports
 */
function isBarrelWithSideEffects(filePath, contextDir) {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const specifiers = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("/*") || trimmed.startsWith("*")) continue;
        const m = trimmed.match(/^export\s+\*\s+from\s+["'](.+?)["']\s*;?\s*$/);
        if (!m) {
            // Not a pure barrel — has non-re-export content (classes, functions, etc.)
            return false;
        }
        specifiers.push(m[1]);
    }
    if (specifiers.length === 0) return false;
    // Check if any target is in the side-effects manifest
    const barrelDir = dirname(filePath);
    for (const spec of specifiers) {
        const targetRel = toPosixPath(relative(SRC_ROOT, resolve(barrelDir, spec))) + ".ts";
        if (sideEffectFiles.has(targetRel)) {
            return true;
        }
    }
    return false;
}

/**
 * Resolve an `export * from "./specifier"` line.
 * Returns the rewritten line for pure.ts, or null to skip.
 * @param {string} dir Absolute path of the directory containing the export line
 * @param {string} specifier The module specifier string (e.g. "./math.color")
 * @param {string} originalLine The original export line (for logging/keeping as-is)
 * @returns {string|null} The resolved export line for pure.ts, or null to skip
 */
function resolveExport(dir, specifier, originalLine) {
    // Case 1: Subdirectory barrel reference (ends with /index)
    if (specifier.endsWith("/index")) {
        const subDir = resolve(dir, specifier.replace(/\/index$/, ""));
        // Recursively generate pure.ts for subdirectory
        const hasPure = processDirectory(subDir);
        if (hasPure) {
            subdirRewrites++;
            return `export * from "${specifier.replace(/\/index$/, "/pure")}";`;
        }
        // Subdirectory has no pure exports — skip
        skippedExports++;
        if (VERBOSE) {
            console.log(`  SKIP subdir (no pure exports): ${specifier}`);
        }
        return null;
    }

    // Case 2: File reference — check for .pure.ts or pure file
    const resolvedFile = resolve(dir, specifier + ".ts");
    const relPath = toPosixPath(relative(SRC_ROOT, resolve(dir, specifier)));
    const pureSpecifier = specifier + ".pure";
    const pureRelPath = relPath + ".pure"; // e.g. "Maths/math.color.pure"

    // If the .ts file actually exists as a file, handle as file reference
    if (existsSync(resolvedFile) && statSync(resolvedFile).isFile()) {
        if (pureFileSet.has(pureRelPath)) {
            rewrittenToPure++;
            return `export * from "${pureSpecifier}";`;
        }
        const filePath = relPath + ".ts";
        if (sideEffectFiles.has(filePath)) {
            skippedExports++;
            if (VERBOSE) {
                console.log(`  SKIP (side effects, no .pure): ${filePath}`);
            }
            return null;
        }
        // Check if the file is a re-exporting barrel that transitively includes
        // side-effectful modules. A barrel is a file whose non-empty, non-comment
        // lines are all `export * from "..."` statements.
        if (isBarrelWithSideEffects(resolvedFile, dir)) {
            skippedExports++;
            if (VERBOSE) {
                console.log(`  SKIP (barrel re-exports side-effectful modules): ${filePath}`);
            }
            return null;
        }
        keptAsIs++;
        return originalLine.trim();
    }

    // Case 3: Could be a directory without explicit /index
    const possibleDir = resolve(dir, specifier);
    if (existsSync(possibleDir) && statSync(possibleDir).isDirectory()) {
        const subIndexPath = join(possibleDir, "index.ts");
        if (existsSync(subIndexPath)) {
            const hasPure = processDirectory(possibleDir);
            if (hasPure) {
                subdirRewrites++;
                return `export * from "${specifier}/pure";`;
            }
            skippedExports++;
            return null;
        }
    }

    // Case 4: File reference (no .ts file found) — check manifest
    if (pureFileSet.has(pureRelPath)) {
        rewrittenToPure++;
        return `export * from "${pureSpecifier}";`;
    }

    const filePath = relPath + ".ts";
    if (!sideEffectFiles.has(filePath)) {
        keptAsIs++;
        return originalLine.trim();
    }

    // Case 5: File has side effects and no .pure.ts — skip
    skippedExports++;
    if (VERBOSE) {
        console.log(`  SKIP (side effects, no .pure): ${filePath}`);
    }
    return null;
}

/**
 * Resolve an `export { ... } from "./specifier"` line.
 * Same logic as resolveExport but preserves the named exports.
 * @param {string} dir Absolute path of the directory containing the export line
 * @param {string} specifier The module specifier string (e.g. "./math.color")
 * @param {string} names The named exports inside the braces (e.g. "Foo, Bar")
 * @param {string} originalLine The original export line (for logging/keeping as-is)
 * @returns {string|null} The resolved export line for pure.ts, or null to skip
 */
function resolveNamedExport(dir, specifier, names, originalLine) {
    const relPath = toPosixPath(relative(SRC_ROOT, resolve(dir, specifier)));
    const pureSpecifier = specifier + ".pure";
    const pureRelPath = relPath + ".pure";

    if (pureFileSet.has(pureRelPath)) {
        rewrittenToPure++;
        return `export {${names}} from "${pureSpecifier}";`;
    }

    const filePath = relPath + ".ts";
    if (!sideEffectFiles.has(filePath)) {
        keptAsIs++;
        return originalLine.trim();
    }

    skippedExports++;
    if (VERBOSE) {
        console.log(`  SKIP named export (side effects, no .pure): ${filePath}`);
    }
    return null;
}

// ── Main ────────────────────────────────────────────────────────────────────
console.log("Generating pure.ts barrel files…\n");

// Process from root — recursion handles subdirectories
processDirectory(SRC_ROOT);

// Also scan for any index.ts not reachable from root
function findUnprocessed(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            const subDir = join(dir, entry.name);
            const indexPath = join(subDir, "index.ts");
            if (existsSync(indexPath) && !processedDirs.has(subDir)) {
                if (VERBOSE) {
                    console.log(`  Processing unreachable: ${relative(SRC_ROOT, subDir)}`);
                }
                processDirectory(subDir);
            }
            findUnprocessed(subDir);
        }
    }
}
findUnprocessed(SRC_ROOT);

// ── Post-pass: generate barrels for dirs without index.ts ───────────────────
// Some directories have .pure.ts files but no index.ts (e.g. internal modules).
// Generate pure.ts barrels for these and link them from parent barrels.
let postPassBarrels = 0;
let postPassLinks = 0;

function postPassOrphans(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const subDir = join(dir, entry.name);
        postPassOrphans(subDir);
    }

    // Skip if already processed (has index.ts) or is the SRC_ROOT itself
    if (processedDirs.has(dir)) return;

    const relDir = toPosixPath(relative(SRC_ROOT, dir)) || ".";

    // Collect .pure.ts files in this directory
    const localPureFiles = [];
    for (const pf of pureFileSet) {
        if (dirname(pf) === relDir) {
            localPureFiles.push(basename(pf)); // e.g. "webgpuTextureHelper.pure"
        }
    }
    if (localPureFiles.length === 0) return;

    // Also check for subdirectories with pure.ts barrels
    const subBarrels = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            const subPure = join(dir, entry.name, "pure.ts");
            if (existsSync(subPure)) {
                subBarrels.push(entry.name);
            }
        }
    }

    // Generate pure.ts for this directory
    const purePath = join(dir, "pure.ts");
    expectedBarrelPaths.add(purePath);
    let fileContent = HEADER;
    for (const pf of localPureFiles.sort()) {
        fileContent += `export * from "./${pf}";\n`;
    }
    for (const sb of subBarrels.sort()) {
        fileContent += `export * from "./${sb}/pure";\n`;
    }

    if (DRY_RUN) {
        console.log(`\n[DRY-RUN] Would write (post-pass) ${relDir}/pure.ts:`);
        console.log(fileContent);
    } else if (CHECK) {
        expectedContents.set(purePath, fileContent);
    } else {
        writeFileSync(purePath, fileContent, "utf-8");
        writtenFiles.push(purePath);
        if (VERBOSE) {
            console.log(`  POST-PASS wrote ${relDir}/pure.ts (${localPureFiles.length} pure files, ${subBarrels.length} sub-barrels)`);
        }
    }
    postPassBarrels++;
    processedDirs.set(dir, true);
}
postPassOrphans(SRC_ROOT);

// ── Post-pass: link orphaned subdirectory barrels to parent ─────────────────
// For each pure.ts barrel, check if parent references it; if not, append.
function linkSubdirBarrels(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const subDir = join(dir, entry.name);
        linkSubdirBarrels(subDir);

        const subPure = join(subDir, "pure.ts");
        if (!existsSync(subPure)) continue;

        const parentPure = join(dir, "pure.ts");
        if (!existsSync(parentPure) && !expectedContents.has(parentPure)) continue;

        const parentContent = CHECK ? (expectedContents.get(parentPure) ?? readFileSync(parentPure, "utf-8")) : readFileSync(parentPure, "utf-8");
        const subRef = `./${entry.name}/pure`;
        if (parentContent.includes(subRef)) continue;

        // Append reference to subdirectory barrel
        const newLine = `export * from "${subRef}";\n`;
        if (DRY_RUN) {
            console.log(`[DRY-RUN] Would append to ${relative(SRC_ROOT, parentPure)}: ${newLine.trim()}`);
        } else if (CHECK) {
            // In check mode, accumulate expected content for this parent barrel
            const existing = expectedContents.get(parentPure) ?? parentContent;
            expectedContents.set(parentPure, existing + newLine);
        } else {
            writeFileSync(parentPure, parentContent + newLine, "utf-8");
            writtenFiles.push(parentPure);
            if (VERBOSE) {
                console.log(`  LINK ${relative(SRC_ROOT, parentPure)} → ${subRef}`);
            }
        }
        postPassLinks++;
    }
}
linkSubdirBarrels(SRC_ROOT);

// ── Summary ─────────────────────────────────────────────────────────────────
console.log("\n═══ Summary ═══");
console.log(`  Barrel files generated:      ${barrelCount}`);
console.log(`  Exports rewritten to .pure:  ${rewrittenToPure}`);
console.log(`  Exports kept as-is (pure):   ${keptAsIs}`);
console.log(`  Subdir rewrites to /pure:    ${subdirRewrites}`);
console.log(`  Bare imports skipped:        ${skippedBareImports}`);
console.log(`  Exports skipped (impure):    ${skippedExports}`);
console.log(`  Orphaned .pure.ts added:     ${orphanedAdded}`);
console.log(`  Post-pass barrels created:   ${postPassBarrels}`);
console.log(`  Post-pass parent links:      ${postPassLinks}`);
console.log(`  Empty barrels (not written): ${emptyBarrels}`);

// ── Format generated files with Prettier ────────────────────────────────────
if (!DRY_RUN && !CHECK && writtenFiles.length > 0) {
    // Deduplicate (a file may be appended to multiple times)
    const uniqueFiles = [...new Set(writtenFiles)];
    if (NO_FORMAT) {
        console.log(`\nSkipping Prettier formatting for ${uniqueFiles.length} files (--no-format).`);
    } else {
        console.log(`\nFormatting ${uniqueFiles.length} files with Prettier...`);
        try {
            const prettierBin = resolve(REPO_ROOT, "node_modules/prettier/bin/prettier.cjs");
            const BATCH = 100;
            for (let i = 0; i < uniqueFiles.length; i += BATCH) {
                const batch = uniqueFiles.slice(i, i + BATCH);
                execFileSync(process.execPath, [prettierBin, "--write", ...batch], {
                    cwd: REPO_ROOT,
                    stdio: "ignore",
                });
            }
            console.log(`Formatted ${uniqueFiles.length} files.`);
        } catch (err) {
            console.error(`Warning: Prettier formatting failed: ${err.message}`);
        }
    }
}

// ── Check mode: compare expected vs on-disk ─────────────────────────────────
if (CHECK) {
    let driftCount = 0;
    /** Normalize content for comparison: non-empty trimmed lines sorted */
    const normalize = (s) =>
        s
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean)
            .sort()
            .join("\n");

    for (const [filePath, expected] of expectedContents) {
        let actual = "";
        try {
            actual = readFileSync(filePath, "utf-8");
        } catch {
            // File doesn't exist on disk
        }
        if (normalize(actual) !== normalize(expected)) {
            driftCount++;
            if (driftCount <= 10) {
                console.error(`  DRIFT: ${relative(REPO_ROOT, filePath)}`);
            }
        }
    }

    for (const filePath of collectPureBarrels(SRC_ROOT)) {
        if (expectedBarrelPaths.has(filePath)) {
            continue;
        }
        let actual = "";
        try {
            actual = readFileSync(filePath, "utf-8");
        } catch {
            // Ignore unreadable files; the normal expected comparison handles missing files.
        }
        if (actual.startsWith(HEADER)) {
            driftCount++;
            if (driftCount <= 10) {
                console.error(`  STALE: ${relative(REPO_ROOT, filePath)}`);
            }
        }
    }

    if (driftCount > 0) {
        if (driftCount > 10) {
            console.error(`  ... and ${driftCount - 10} more`);
        }
        console.error(`\n❌ ${driftCount} pure barrel(s) are out of date.`);
        console.error(`To fix: npm run generate:pure-barrels\n`);
        adoError(`${driftCount} pure barrel(s) are out of date. Run: npm run generate:pure-barrels`);
        process.exit(1);
    } else {
        console.log(`\n✅ All pure barrels are up-to-date.\n`);
    }
}
