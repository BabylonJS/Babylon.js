#!/usr/bin/env node
/* eslint-disable babylonjs/syntax */
/* eslint-disable no-console */
/**
 * Automated .pure.ts Split Script for @babylonjs/core
 *
 * Takes files that have ONLY RegisterClass side effects and splits them:
 *   - FILE.pure.ts  — all code EXCEPT RegisterClass import + calls
 *   - FILE.ts       — thin re-export wrapper + RegisterClass calls
 *
 * Usage:
 *   node scripts/treeshaking/splitRegisterClass.mjs [--dry-run] [--file <rel-path>] [--verbose]
 *
 * Flags:
 *   --dry-run   Show what would be done without writing files
 *   --file <p>  Only process a single file (relative path from core/src)
 *   --verbose   Show detailed output for each file
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, resolve, dirname, basename, relative } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../..");
const CORE_SRC = join(REPO_ROOT, "packages/dev/core/src");
const MANIFEST_PATH = join(REPO_ROOT, "scripts/treeshaking/side-effects-manifest.json");

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const VERBOSE = args.includes("--verbose");
const fileIdx = args.indexOf("--file");
const SINGLE_FILE = fileIdx !== -1 ? args[fileIdx + 1] : null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PURE_HEADER = "/** This file must only contain pure code and pure imports */\n\n";

/**
 * Parse a file and extract:
 *   - RegisterClass import line details
 *   - All top-level RegisterClass call lines
 *   - The class/variable names used in RegisterClass calls
 */
function analyzeForSplit(source, relPath) {
    const lines = source.split("\n");
    const result = {
        importLineIdx: -1,
        importLineText: "",
        importPath: "",
        hasOtherImports: false, // true if the import line also imports GetClass etc.
        otherImports: [], // other names imported alongside RegisterClass
        registerCalls: [], // { lineIdx, text, className, registrationString }
        totalLines: lines.length,
    };

    // Find the RegisterClass import line
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Match: import { RegisterClass } from "...Misc/typeStore"
        // Also: import { GetClass, RegisterClass } from "...Misc/typeStore"
        const importMatch = line.match(/^import\s*\{([^}]+)\}\s*from\s*["']([^"']*(?:Misc\/typeStore|typeStore)[^"']*)["']/);
        if (importMatch) {
            const importedNames = importMatch[1].split(",").map((s) => s.trim());
            if (importedNames.includes("RegisterClass")) {
                result.importLineIdx = i;
                result.importLineText = line;
                result.importPath = importMatch[2];
                result.otherImports = importedNames.filter((n) => n !== "RegisterClass");
                result.hasOtherImports = result.otherImports.length > 0;
                break;
            }
        }
    }

    if (result.importLineIdx === -1) {
        return null; // No RegisterClass import found
    }

    // Find all top-level RegisterClass calls
    // We do simplified brace-depth tracking
    let braceDepth = 0;
    let inBlockComment = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Handle block comments
        if (inBlockComment) {
            const endIdx = line.indexOf("*/");
            if (endIdx === -1) continue;
            line = line.substring(endIdx + 2);
            inBlockComment = false;
        }
        line = line.replace(/\/\*.*?\*\//g, "");
        const blockStart = line.indexOf("/*");
        if (blockStart !== -1) {
            line = line.substring(0, blockStart);
            inBlockComment = true;
        }
        line = line.replace(/\/\/.*$/, "");
        const trimmed = line.trim();

        const prevDepth = braceDepth;
        for (const ch of line) {
            if (ch === "{") braceDepth++;
            if (ch === "}") braceDepth = Math.max(0, braceDepth - 1);
        }

        // Only top-level
        if (prevDepth !== 0) continue;

        // Match RegisterClass("BABYLON.Xxx", Xxx) or RegisterClass(FlowGraphBlockNames.Xxx, XxxBlock)
        const callMatch = trimmed.match(/^RegisterClass\s*\(\s*(?:"([^"]+)"|([A-Za-z_$]\w*(?:\.[A-Za-z_$]\w*)*))\s*,\s*([A-Za-z_$]\w*)\s*\)/);
        if (callMatch) {
            const isStringLiteral = callMatch[1] !== undefined;
            result.registerCalls.push({
                lineIdx: i,
                text: lines[i],
                registrationString: callMatch[1] || callMatch[2],
                isStringLiteral,
                className: callMatch[3],
            });
        }
    }

    return result;
}

/**
 * Generate the pure file content and the wrapper file content.
 */
function generateSplit(source, analysis, relPath) {
    const lines = source.split("\n");
    const registerLineIdxSet = new Set(analysis.registerCalls.map((c) => c.lineIdx));
    const importLineIdx = analysis.importLineIdx;

    // Build pure file: all lines except RegisterClass import + calls
    const pureLines = [];
    for (let i = 0; i < lines.length; i++) {
        if (i === importLineIdx) {
            if (analysis.hasOtherImports) {
                // Keep the import but remove RegisterClass from it
                const newImportNames = analysis.otherImports.join(", ");
                const newLine = `import { ${newImportNames} } from "${analysis.importPath}";`;
                pureLines.push(newLine);
            }
            // If only RegisterClass was imported, skip the line entirely
            continue;
        }
        if (registerLineIdxSet.has(i)) {
            continue;
        }
        pureLines.push(lines[i]);
    }

    // Trim trailing empty lines but keep one newline at end
    while (pureLines.length > 0 && pureLines[pureLines.length - 1].trim() === "") {
        pureLines.pop();
    }

    const pureContent = PURE_HEADER + pureLines.join("\n") + "\n";

    // Build wrapper file
    const pureModulePath = "./" + basename(relPath).replace(/\.ts$/, ".pure");
    const classNames = [...new Set(analysis.registerCalls.map((c) => c.className))];

    // For variable-reference registration strings, find the import lines needed
    const varRefRootNames = new Set();
    for (const call of analysis.registerCalls) {
        if (!call.isStringLiteral) {
            // Extract root variable (e.g., "FlowGraphBlockNames" from "FlowGraphBlockNames.Conditional")
            const root = call.registrationString.split(".")[0];
            varRefRootNames.add(root);
        }
    }

    // Find import statements for variable references in the original source
    const varRefImportLines = [];
    if (varRefRootNames.size > 0) {
        for (const line of lines) {
            const trimmedLine = line.trim();
            // Match import { Xxx } from "..." or import { Xxx, Yyy } from "..."
            const match = trimmedLine.match(/^import\s*(?:type\s+)?\{([^}]+)\}\s*from\s*["']([^"']+)["']/);
            if (match) {
                const imported = match[1].split(",").map((s) => s.trim());
                for (const name of imported) {
                    if (varRefRootNames.has(name)) {
                        varRefImportLines.push(`import { ${name} } from "${match[2]}";`);
                        varRefRootNames.delete(name);
                    }
                }
            }
        }
    }

    const wrapperLines = [
        `/**`,
        ` * Re-exports all pure types and registers them with the serialization system.`,
        ` * Import this file (or the barrel) when you need serialization support (RegisterClass).`,
        ` * Import ${basename(relPath).replace(/\.ts$/, ".pure")} for tree-shakeable, side-effect-free usage.`,
        ` */`,
        `export * from "${pureModulePath}";`,
        ``,
        `import { RegisterClass } from "${analysis.importPath}";`,
    ];

    // Only import classes that are actually registered
    if (classNames.length > 0) {
        wrapperLines.push(`import { ${classNames.join(", ")} } from "${pureModulePath}";`);
    }

    // Add imports for variable references used in RegisterClass calls
    for (const importLine of varRefImportLines) {
        wrapperLines.push(importLine);
    }

    wrapperLines.push("");

    for (const call of analysis.registerCalls) {
        // Reconstruct the call — use quotes for string literals, bare for variable refs
        const regStr = call.isStringLiteral ? `"${call.registrationString}"` : call.registrationString;
        wrapperLines.push(`RegisterClass(${regStr}, ${call.className});`);
    }

    wrapperLines.push("");

    const wrapperContent = wrapperLines.join("\n");

    return { pureContent, wrapperContent };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
    // Load manifest
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf-8"));
    const entries = manifest.manifest;

    // Filter to RegisterClass-only files
    let candidates = entries.filter((entry) => {
        if (entry.sideEffects.length === 0) return false;
        return entry.sideEffects.every((se) => se.type === "RegisterClass");
    });

    // Exclude already-split files
    candidates = candidates.filter((entry) => {
        const purePath = join(CORE_SRC, entry.file.replace(/\.ts$/, ".pure.ts"));
        return !existsSync(purePath);
    });

    if (SINGLE_FILE) {
        candidates = candidates.filter((entry) => entry.file === SINGLE_FILE);
        if (candidates.length === 0) {
            console.error(`File "${SINGLE_FILE}" not found in RegisterClass-only candidates.`);
            process.exit(1);
        }
    }

    console.log(`\n=== RegisterClass .pure.ts Split ${DRY_RUN ? "(DRY RUN)" : ""} ===\n`);
    console.log(`Found ${candidates.length} RegisterClass-only files to process.\n`);

    let processed = 0;
    let skipped = 0;
    const errors = [];
    const writtenFiles = [];

    for (const entry of candidates) {
        const filePath = join(CORE_SRC, entry.file);
        const source = readFileSync(filePath, "utf-8");

        const analysis = analyzeForSplit(source, entry.file);
        if (!analysis) {
            if (VERBOSE) console.log(`  SKIP  ${entry.file} — no RegisterClass import found`);
            skipped++;
            continue;
        }

        if (analysis.registerCalls.length === 0) {
            if (VERBOSE) console.log(`  SKIP  ${entry.file} — no top-level RegisterClass calls found`);
            skipped++;
            continue;
        }

        const { pureContent, wrapperContent } = generateSplit(source, analysis, entry.file);

        const pureFilePath = filePath.replace(/\.ts$/, ".pure.ts");

        if (DRY_RUN) {
            console.log(`  WOULD SPLIT  ${entry.file}`);
            console.log(`    → ${relative(CORE_SRC, pureFilePath)}`);
            console.log(`    → ${entry.file} (wrapper with ${analysis.registerCalls.length} RegisterClass calls)`);
            if (VERBOSE) {
                console.log(`    Classes: ${analysis.registerCalls.map((c) => c.className).join(", ")}`);
                console.log(
                    `    Wrapper:\n${wrapperContent
                        .split("\n")
                        .map((l) => "      " + l)
                        .join("\n")}`
                );
            }
        } else {
            try {
                writeFileSync(pureFilePath, pureContent);
                writeFileSync(filePath, wrapperContent);
                writtenFiles.push(pureFilePath, filePath);
                if (VERBOSE) console.log(`  SPLIT  ${entry.file} (${analysis.registerCalls.length} RegisterClass calls)`);
            } catch (err) {
                errors.push({ file: entry.file, error: err.message });
                console.error(`  ERROR  ${entry.file}: ${err.message}`);
                continue;
            }
        }

        processed++;
    }

    console.log(`\n--- Summary ---`);
    console.log(`Processed: ${processed}`);
    console.log(`Skipped:   ${skipped}`);
    console.log(`Errors:    ${errors.length}`);
    if (errors.length > 0) {
        console.log(`\nErrors:`);
        errors.forEach((e) => console.log(`  ${e.file}: ${e.error}`));
    }

    // Format all generated/modified files with Prettier
    if (!DRY_RUN && writtenFiles.length > 0) {
        console.log(`\nFormatting ${writtenFiles.length} files with Prettier...`);
        try {
            const BATCH = 100;
            for (let i = 0; i < writtenFiles.length; i += BATCH) {
                const batch = writtenFiles.slice(i, i + BATCH);
                execSync(`npx prettier --write ${batch.map((f) => `"${f}"`).join(" ")}`, {
                    cwd: REPO_ROOT,
                    stdio: "ignore",
                });
            }
            console.log(`Formatted ${writtenFiles.length} files.`);
        } catch (err) {
            console.error(`Warning: Prettier formatting failed: ${err.message}`);
        }
    }
}

main();
