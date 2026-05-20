#!/usr/bin/env node
/* eslint-disable babylonjs/syntax */
/* eslint-disable no-console */
/**
 * Side-Effect Audit Script for @babylonjs/core
 *
 * Scans all .ts source files in packages/dev/core/src/ and detects
 * module-level (top-level) side effects:
 *
 *   1. RegisterClass(...)
 *   2. *.prototype.* = ...
 *   3. ShaderStore.*Store[...] = ... (shader registrations)
 *   4. Node.AddNodeConstructor(...)
 *   5. Bare top-level function calls (e.g. initSideEffects())
 *   6. Top-level assignments to static class properties (Class.staticProp = ...)
 *   7. Class static blocks on top-level classes
 *   8. declare module augmentations
 *
 * Usage:
 *   node scripts/treeshaking/auditSideEffects.mjs [--json] [--summary] [--out <path>]
 *
 * Options:
 *   --json     Output the full manifest as JSON to stdout
 *   --summary  Print a human-readable summary (default if no flags)
 *   --out <p>  Write the JSON manifest to <path>
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, relative, resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../..");
const CORE_SRC = join(REPO_ROOT, "packages/dev/core/src");

/**
 * @param {string} filePath
 * @returns {string}
 */
function toPosixPath(filePath) {
    return filePath.split(/[/\\]+/).join("/");
}

// ---------------------------------------------------------------------------
// File collection
// ---------------------------------------------------------------------------

/**
 * Recursively collect all .ts files in a directory, excluding test files and
 * declaration files.
 * @param {string} dir
 * @returns {string[]} Array of file paths
 */
function collectTsFiles(dir) {
    const results = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...collectTsFiles(fullPath));
        } else if (entry.isFile() && entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts") && !entry.name.endsWith(".test.ts") && !entry.name.endsWith(".spec.ts")) {
            if (isStaleGeneratedShader(fullPath)) {
                continue;
            }
            results.push(fullPath);
        }
    }
    return results;
}

/**
 * Generated shader .ts files are ignored by git and can survive locally after their .fx source is deleted.
 * Exclude those stale artifacts so local generated output cannot drift the committed manifest.
 * @param {string} filePath
 * @returns {boolean}
 */
function isStaleGeneratedShader(filePath) {
    const relPath = toPosixPath(relative(CORE_SRC, filePath));
    if (!relPath.startsWith("Shaders/") && !relPath.startsWith("ShadersWGSL/")) {
        return false;
    }

    const sourcePath = filePath.replace(/\.ts$/, "");
    return !statSyncNoThrow(`${sourcePath}.fx`)?.isFile() && !statSyncNoThrow(`${sourcePath}.wgsl`)?.isFile();
}

/**
 * @param {string} filePath
 * @returns {import("fs").Stats | undefined}
 */
function statSyncNoThrow(filePath) {
    try {
        return statSync(filePath);
    } catch {
        return undefined;
    }
}

// ---------------------------------------------------------------------------
// Side-effect detection (regex-based, no dependency on TS compiler API)
//
// We operate line-by-line with some multi-line awareness. This is intentionally
// simple and conservative — it may produce false positives which is fine for an
// audit. The goal is to never miss a real side effect.
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} SideEffect
 * @property {string} type - Category of side effect
 * @property {number} line - 1-based line number
 * @property {string} text - Trimmed source line
 */

/**
 * @typedef {Object} FileReport
 * @property {string} file - Relative path from core/src
 * @property {SideEffect[]} sideEffects
 */

// Patterns that indicate we are inside a class/function/method body (heuristic)
// We track brace depth to determine top-level scope.

function isEscaped(text, index) {
    let slashCount = 0;
    for (let i = index - 1; i >= 0 && text[i] === "\\"; i--) {
        slashCount++;
    }
    return slashCount % 2 === 1;
}

/**
 * Analyze a single file for top-level side effects.
 * @param {string} filePath
 * @returns {FileReport | null}
 */
function analyzeFile(filePath) {
    const source = readFileSync(filePath, "utf-8");
    const lines = source.split("\n");
    const relPath = toPosixPath(relative(CORE_SRC, filePath));
    const sideEffects = [];

    // Track brace depth to distinguish top-level from nested scope.
    // Depth 0 = top-level module scope.
    // We track template literals and strings to avoid counting braces inside them.
    let braceDepth = 0;
    // Also track bracket depth so expressions inside array literals
    // (e.g. `const x = [Math.sqrt(...)]`) are not flagged as top-level calls.
    let bracketDepth = 0;
    let inBlockComment = false;
    let inDeclareModule = false;
    let inTemplateLiteral = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        const lineNum = i + 1;

        // Handle block comments
        if (inBlockComment) {
            const endIdx = line.indexOf("*/");
            if (endIdx === -1) {
                continue;
            }
            line = line.substring(endIdx + 2);
            inBlockComment = false;
        }

        // If inside a template literal, look for closing backtick
        if (inTemplateLiteral) {
            const btIdx = line.indexOf("`");
            if (btIdx === -1) {
                // Entire line is inside template literal — skip brace counting
                continue;
            }
            // Template literal ends on this line; process remainder
            line = line.substring(btIdx + 1);
            inTemplateLiteral = false;
        }

        // Strip block comments that start and end on the same line
        line = line.replace(/\/\*.*?\*\//g, "");
        // Check for block comment start
        const blockStart = line.indexOf("/*");
        if (blockStart !== -1) {
            line = line.substring(0, blockStart);
            inBlockComment = true;
        }
        // Strip line comments
        line = line.replace(/\/\/.*$/, "");

        const trimmed = line.trim();
        if (!trimmed) {
            continue;
        }

        // Count braces for depth tracking, skipping braces inside strings and template literals.
        // This is a simplified scanner that handles the most common cases.
        const prevDepth = braceDepth;
        const prevBracketDepth = bracketDepth;
        let inSingleQuote = false;
        let inDoubleQuote = false;
        for (let c = 0; c < line.length; c++) {
            const ch = line[c];

            // Skip escaped characters
            if (isEscaped(line, c)) {
                continue;
            }

            // Track string literals (single/double quotes)
            if (ch === "'" && !inDoubleQuote && !inTemplateLiteral) {
                inSingleQuote = !inSingleQuote;
                continue;
            }
            if (ch === '"' && !inSingleQuote && !inTemplateLiteral) {
                inDoubleQuote = !inDoubleQuote;
                continue;
            }

            // Track template literals
            if (ch === "`" && !inSingleQuote && !inDoubleQuote) {
                inTemplateLiteral = !inTemplateLiteral;
                continue;
            }

            // Only count braces outside of strings and template literals
            if (!inSingleQuote && !inDoubleQuote && !inTemplateLiteral) {
                if (ch === "{") {
                    braceDepth++;
                }
                if (ch === "}") {
                    braceDepth = Math.max(0, braceDepth - 1);
                }
                if (ch === "[") {
                    bracketDepth++;
                }
                if (ch === "]") {
                    bracketDepth = Math.max(0, bracketDepth - 1);
                }
            }
        }
        // Track declare module blocks
        if (prevDepth === 0 && /^\s*declare\s+module\s+/.test(lines[i])) {
            inDeclareModule = true;
            sideEffects.push({
                type: "declare-module",
                line: lineNum,
                text: lines[i].trim().substring(0, 120),
            });
            continue;
        }
        if (inDeclareModule && braceDepth === 0) {
            inDeclareModule = false;
            continue;
        }
        if (inDeclareModule) {
            continue;
        }

        // Class static blocks execute when the containing class is evaluated.
        // For top-level classes, that happens at module import time, so they are side effects.
        if (prevDepth === 1 && prevBracketDepth === 0 && /^static\s*\{/.test(trimmed)) {
            sideEffects.push({
                type: "class-static-block",
                line: lineNum,
                text: trimmed.substring(0, 120),
            });
        }

        // The TC39 decorator metadata shim mutates the global Symbol constructor.
        // It is intentionally allowed, but it must still be tracked as a module-level side effect.
        if (prevDepth === 0 && prevBracketDepth === 0 && /^if\s*\(.*\bSymbol\.metadata\b/.test(trimmed)) {
            sideEffects.push({
                type: "symbol-metadata-polyfill",
                line: lineNum,
                text: trimmed.substring(0, 120),
            });
        }

        // Only detect side effects at top-level (braceDepth and bracketDepth were 0 before this line)
        if (prevDepth !== 0 || prevBracketDepth !== 0) {
            continue;
        }

        // --- Detection rules ---

        // 0. Bare (side-effect) imports: import "./something" or import "../something"
        //    These execute the imported module purely for its side effects.
        if (/^import\s+["']/.test(trimmed)) {
            sideEffects.push({
                type: "bare-import",
                line: lineNum,
                text: trimmed.substring(0, 120),
            });
        }

        // 1. RegisterClass(...) — skip function definitions
        if (/\bRegisterClass\s*\(/.test(trimmed) && !/^\s*(export\s+)?function\s+RegisterClass\b/.test(trimmed)) {
            sideEffects.push({
                type: "RegisterClass",
                line: lineNum,
                text: trimmed.substring(0, 120),
            });
        }

        // 2. Prototype augmentation: SomeClass.prototype.method = ...
        //    Skip `typeof X.prototype.y` (type references, not assignments).
        if (/\w+\.prototype\.\w+\s*=/.test(trimmed) && !/\btypeof\s+\w+\.prototype\./.test(trimmed)) {
            sideEffects.push({
                type: "prototype-assignment",
                line: lineNum,
                text: trimmed.substring(0, 120),
            });
        }

        // 3. ShaderStore writes: ShaderStore.ShadersStore[...] = ...
        //    or ShaderStore.IncludesShadersStore[...] = ...
        //    or ShaderStore.ShadersStoreWGSL[...] = ...
        //    or direct assignment patterns in shader files
        if (/ShaderStore\.\w*Store\w*\s*\[/.test(trimmed)) {
            sideEffects.push({
                type: "shader-store-write",
                line: lineNum,
                text: trimmed.substring(0, 120),
            });
        }

        // 4. Node.AddNodeConstructor(...)
        if (/\bNode\.AddNodeConstructor\s*\(/.test(trimmed) || /\bAddNodeConstructor\s*\(/.test(trimmed)) {
            sideEffects.push({
                type: "AddNodeConstructor",
                line: lineNum,
                text: trimmed.substring(0, 120),
            });
        }

        // 5. Top-level function calls that aren't imports/exports/declarations
        //    e.g. initSideEffects();  Object.method(...);  WebXRFeaturesManager.AddWebXRFeature(...)
        //    Heuristic: line is a call expression statement (identifier or dotted access followed by ()
        //    Supports multi-line calls (opening paren without closing on same line)
        //    Exclude: import, export, const, let, var, class, function, type, interface, enum, abstract, declare, if, for, while, switch, return
        //    Also exclude calls already caught by more specific patterns above.
        if (/^[A-Za-z_$]\w*(?:\.\w+)*\s*\(/.test(trimmed)) {
            const keyword = trimmed.split(/[\s(.]/)[0];
            const reserved = new Set([
                "import",
                "export",
                "const",
                "let",
                "var",
                "class",
                "function",
                "type",
                "interface",
                "enum",
                "abstract",
                "declare",
                "if",
                "for",
                "while",
                "switch",
                "return",
                "throw",
                "try",
                "catch",
                "finally",
                "do",
                "new",
                "delete",
                "typeof",
                "void",
                "yield",
                "await",
            ]);
            // Skip calls already matched by more specific patterns
            const alreadyCaught = /\bRegisterClass\s*\(/.test(trimmed) || /\bNode\.AddNodeConstructor\s*\(/.test(trimmed) || /\bAddNodeConstructor\s*\(/.test(trimmed);
            // Skip false positives from GLSL/WGSL shader string content
            const isShaderContent = relPath.startsWith("Shaders/") || relPath.startsWith("ShadersWGSL/");
            if (!reserved.has(keyword) && !alreadyCaught && !isShaderContent) {
                sideEffects.push({
                    type: "top-level-call",
                    line: lineNum,
                    text: trimmed.substring(0, 120),
                });
            }
        }

        // 6. Static property assignment: ClassName.staticProp = ...
        //    (but not prototype, and not inside type annotations)
        //    Heuristic: Identifier.Identifier = <something> at top-level
        if (/^[A-Z]\w*\.[a-zA-Z_$]\w*\s*=\s*/.test(trimmed) && !/\.prototype\./.test(trimmed) && !trimmed.startsWith("export ") && !trimmed.startsWith("import ")) {
            // Exclude type-only patterns and common false positives
            if (!/^[A-Z]\w*\.[A-Z]\w*\s*=\s*[A-Z]\w*;?\s*$/.test(trimmed) || /\b(Tools|Animation|Effect)\.\w+\s*=\s*/.test(trimmed)) {
                sideEffects.push({
                    type: "static-property-assignment",
                    line: lineNum,
                    text: trimmed.substring(0, 120),
                });
            }
        }

        // 7. Top-level new expressions used as statements (not assigned)
        //    e.g. new SomeClass();
        if (/^new\s+\w/.test(trimmed) && /;\s*$/.test(trimmed)) {
            sideEffects.push({
                type: "top-level-new",
                line: lineNum,
                text: trimmed.substring(0, 120),
            });
        }
    }

    if (sideEffects.length === 0) {
        return null;
    }
    return { file: relPath, sideEffects };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
    const args = process.argv.slice(2);
    const wantJson = args.includes("--json");
    const wantSummary = args.includes("--summary") || !wantJson;
    const outIdx = args.indexOf("--out");
    const outPath = outIdx !== -1 ? args[outIdx + 1] : null;

    const files = collectTsFiles(CORE_SRC);
    const manifest = [];

    for (const f of files) {
        const report = analyzeFile(f);
        if (report) {
            manifest.push(report);
        }
    }

    // Sort by file path using code-point order so the manifest is stable across OS locales.
    manifest.sort((a, b) => (a.file < b.file ? -1 : a.file > b.file ? 1 : 0));

    // Compute summary stats
    const stats = {
        totalFiles: files.length,
        filesWithSideEffects: manifest.length,
        filesWithoutSideEffects: files.length - manifest.length,
        byType: {},
    };

    for (const report of manifest) {
        for (const se of report.sideEffects) {
            stats.byType[se.type] = (stats.byType[se.type] || 0) + 1;
        }
    }

    // Count unique files per type
    const filesByType = {};
    for (const report of manifest) {
        const types = new Set(report.sideEffects.map((se) => se.type));
        for (const t of types) {
            filesByType[t] = (filesByType[t] || 0) + 1;
        }
    }
    stats.filesByType = filesByType;

    const output = { stats, manifest };

    if (outPath) {
        writeFileSync(resolve(process.cwd(), outPath), JSON.stringify(output, null, 2));
        console.error(`Manifest written to ${outPath}`);
    }

    if (wantJson && !outPath) {
        process.stdout.write(JSON.stringify(output, null, 2));
    }

    if (wantSummary) {
        console.log("\n=== Babylon.js Core — Side-Effect Audit ===\n");
        console.log(`Total .ts files scanned:    ${stats.totalFiles}`);
        console.log(`Files WITH side effects:    ${stats.filesWithSideEffects}`);
        console.log(`Files WITHOUT side effects: ${stats.filesWithoutSideEffects}`);
        console.log(`\nSide effects by type (total occurrences / unique files):`);
        console.log(`${"Type".padEnd(35)} ${"Occurrences".padEnd(15)} Files`);
        console.log("-".repeat(65));
        for (const [type, count] of Object.entries(stats.byType).sort((a, b) => b[1] - a[1])) {
            console.log(`${type.padEnd(35)} ${String(count).padEnd(15)} ${filesByType[type] || 0}`);
        }
        console.log(`\n--- Top 20 files by number of side effects ---\n`);
        const sorted = [...manifest].sort((a, b) => b.sideEffects.length - a.sideEffects.length);
        for (const report of sorted.slice(0, 20)) {
            const types = {};
            for (const se of report.sideEffects) {
                types[se.type] = (types[se.type] || 0) + 1;
            }
            const typeStr = Object.entries(types)
                .map(([t, c]) => `${t}:${c}`)
                .join(", ");
            console.log(`  ${report.file} (${report.sideEffects.length}) — ${typeStr}`);
        }

        // List pure candidates (files with ONLY RegisterClass as their side effect)
        const pureishFiles = manifest.filter((r) => {
            const types = new Set(r.sideEffects.map((s) => s.type));
            return types.size === 1 && types.has("RegisterClass");
        });
        console.log(`\n--- Files with ONLY RegisterClass (easiest to make pure): ${pureishFiles.length} ---\n`);
        for (const r of pureishFiles.slice(0, 15)) {
            console.log(`  ${r.file}`);
        }
        if (pureishFiles.length > 15) {
            console.log(`  ... and ${pureishFiles.length - 15} more`);
        }

        // List files that are already pure
        console.log(`\n--- Already pure files (no side effects): ${stats.filesWithoutSideEffects} ---`);
        console.log(`  (Use --json or --out to see the full list)\n`);
    }
}

main();
