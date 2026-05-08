#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * wrapRemainingEffects.mjs  (v2 — Phase 9b)
 *
 * Wraps ALL remaining side effects in thin .ts wrappers into register functions
 * in their .pure.ts counterparts.
 *
 * Handles:
 *   - RegisterClass / AddNodeConstructor / AddParser calls
 *   - Static property assignments  (Mesh.CreateBox = ..., etc.)
 *   - WebXR feature/controller registrations
 *   - Factory assignments
 *   - Any other top-level side-effect statement
 *
 * For files that already have a register function (from Phase 9a declare-module
 * pass), the new code is inserted into the existing function.
 * For files without one, a new register function is created.
 *
 * Bare imports (shader imports, other side-effect module imports) stay in .ts.
 *
 * Key improvements over v1:
 *   - Normalizes import paths (strips .pure) to avoid duplicate-identifier errors
 *   - Upgrades import-type → value-import when the name is used as a runtime value
 *   - Skips files that still contain exported declarations (export function / class)
 *   - Two-pass name generation to prevent registerXxx name collisions in index re-exports
 *   - Prevents duplicate const/let declarations
 *
 * Usage:
 *   node scripts/treeshaking/wrapRemainingEffects.mjs [--dry-run] [--verbose]
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from "fs";
import { join, relative, dirname, basename } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "../..");
const SRC_ROOT = join(REPO_ROOT, "packages/dev/core/src");

const DRY_RUN = process.argv.includes("--dry-run");
const VERBOSE = process.argv.includes("--verbose");

// ── Stats ───────────────────────────────────────────────────────────────────
let processed = 0;
let skipped = 0;
let alreadyClean = 0;
let extendedExisting = 0;
let createdNew = 0;
const manualFiles = [];
const errorFiles = [];

// ── File collection ─────────────────────────────────────────────────────────
function walk(dir, results = []) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) {
            if (["test", "Shaders", "ShadersWGSL"].includes(e.name)) continue;
            walk(p, results);
        } else if (
            e.name.endsWith(".ts") &&
            !e.name.endsWith(".pure.ts") &&
            !e.name.endsWith(".types.ts") &&
            !e.name.endsWith(".d.ts") &&
            e.name !== "index.ts" &&
            e.name !== "pure.ts"
        ) {
            results.push(p);
        }
    }
    return results;
}

// ── Naming ──────────────────────────────────────────────────────────────────
/**
 * Generate register function name from filename + optional directory qualifier.
 *   shadowGeneratorSceneComponent -> RegisterShadowGeneratorSceneComponent
 *   engine.multiRender           -> registerEngineMultiRender
 */
function generateRegisterName(filename, dirQualifier) {
    const base = filename.replace(/\.ts$/, "");
    const parts = base.split(/[.\-]/);
    const pascal = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
    if (dirQualifier) {
        const qParts = dirQualifier.split(/[/\\.\-]/).filter(Boolean);
        const qPascal = qParts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
        return "register" + qPascal + pascal;
    }
    return "register" + pascal;
}

// ── Path normalization ──────────────────────────────────────────────────────
/**
 * Strip the .pure suffix from an import path so that
 *   "../Maths/math.vector.pure"  and  "../Maths/math.vector"
 * compare as equal.
 */
function normalizePath(p) {
    return p.replace(/\.pure$/, "");
}

// ── Import parsing ──────────────────────────────────────────────────────────
function parseImport(line) {
    const t = line.trim();

    // Bare import: import "./foo"
    const bareMatch = t.match(/^import\s+["'](.+?)["']\s*;?\s*$/);
    if (bareMatch) return { kind: "bare", fromPath: bareMatch[1], line: t };

    // Namespace: import * as X from "path"
    const nsMatch = t.match(/^import\s+\*\s+as\s+(\w+)\s+from\s+["'](.+?)["']\s*;?\s*$/);
    if (nsMatch) return { kind: "namespace", nsName: nsMatch[1], fromPath: nsMatch[2], line: t };

    // Type import: import type { A, B } from "path"
    const typeMatch = t.match(/^import\s+type\s+\{([^}]+)\}\s+from\s+["'](.+?)["']\s*;?\s*$/);
    if (typeMatch) {
        const names = typeMatch[1]
            .split(",")
            .map((n) => n.trim())
            .filter(Boolean);
        return { kind: "type", names, fromPath: typeMatch[2], line: t };
    }

    // Value import: import { A, B } from "path"
    const valMatch = t.match(/^import\s+\{([^}]+)\}\s+from\s+["'](.+?)["']\s*;?\s*$/);
    if (valMatch) {
        const names = valMatch[1]
            .split(",")
            .map((n) => n.trim())
            .filter(Boolean);
        return { kind: "value", names, fromPath: valMatch[2], line: t };
    }

    return null;
}

// ── Pure-file helpers ───────────────────────────────────────────────────────
/**
 * Find register function in .pure.ts content.
 * Returns { name, startLine, endLine } or null.
 */
function findRegisterFunction(lines) {
    for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(/^export function (register\w+)\s*\(/);
        if (match) {
            let depth = 0;
            for (let j = i; j < lines.length; j++) {
                for (const ch of lines[j]) {
                    if (ch === "{") depth++;
                    if (ch === "}") depth--;
                }
                if (depth === 0) {
                    return { name: match[1], startLine: i, endLine: j };
                }
            }
        }
    }
    return null;
}

/**
 * Build a map of existing imports in a file.
 * Returns Map< normalizedPath → { typeNames: Set, valueNames: Set, nsName?, originalPath } >
 */
function buildImportMap(content) {
    const map = new Map();
    for (const rawLine of content.split("\n")) {
        const parsed = parseImport(rawLine.trim());
        if (!parsed || parsed.kind === "bare") continue;
        const normPath = normalizePath(parsed.fromPath);
        let entry = map.get(normPath);
        if (!entry) {
            entry = { typeNames: new Set(), valueNames: new Set(), nsName: null, originalPath: parsed.fromPath };
            map.set(normPath, entry);
        }
        if (parsed.kind === "type" && parsed.names) parsed.names.forEach((n) => entry.typeNames.add(n));
        if (parsed.kind === "value" && parsed.names) parsed.names.forEach((n) => entry.valueNames.add(n));
        if (parsed.kind === "namespace") entry.nsName = parsed.nsName;
        // Prefer the .pure path if one is encountered
        if (parsed.fromPath.endsWith(".pure")) entry.originalPath = parsed.fromPath;
    }
    return map;
}

/**
 * Given the existing import map and a list of imports to add, compute:
 *   - newImportLines: fully new import lines to insert
 *   - typeUpgrades: list of { normPath, names[], usePath } describing type→value upgrades
 */
function computeImportDelta(existingMap, importsToAdd, pureBase) {
    const newImportLines = [];
    const typeUpgrades = [];

    for (const imp of importsToAdd) {
        const parsed = parseImport(imp.trim());
        if (!parsed) {
            newImportLines.push(imp.trim());
            continue;
        }

        // Skip self-imports from the .pure file (already in scope)
        if (parsed.fromPath && parsed.fromPath.includes(pureBase)) continue;

        // Namespace imports
        if (parsed.kind === "namespace") {
            const normPath = normalizePath(parsed.fromPath);
            const existing = existingMap.get(normPath);
            if (existing && existing.nsName === parsed.nsName) continue; // covered
            newImportLines.push(imp.trim());
            continue;
        }

        if (!parsed.names) {
            newImportLines.push(imp.trim());
            continue;
        }

        const normPath = normalizePath(parsed.fromPath);
        const existing = existingMap.get(normPath);

        if (!existing) {
            // Brand new path — add entire import
            newImportLines.push(imp.trim());
            continue;
        }

        const uncoveredNames = [];
        const upgradeNames = [];

        for (const name of parsed.names) {
            if (existing.valueNames.has(name)) continue; // fully covered as value
            if (existing.typeNames.has(name)) {
                if (parsed.kind === "value") {
                    // Need to upgrade from type to value
                    upgradeNames.push(name);
                }
                // If parsed.kind === "type", it's already imported as type → skip
                continue;
            }
            uncoveredNames.push(name);
        }

        if (upgradeNames.length > 0) {
            typeUpgrades.push({ normPath, names: upgradeNames, usePath: existing.originalPath });
        }

        if (uncoveredNames.length > 0) {
            const prefix = parsed.kind === "type" ? "import type" : "import";
            const usePath = existing.originalPath; // use the path already in .pure.ts
            newImportLines.push(`${prefix} { ${uncoveredNames.join(", ")} } from "${usePath}";`);
        }
    }

    return { newImportLines, typeUpgrades };
}

/**
 * Apply type→value upgrades to the .pure.ts lines array (mutates).
 * Returns additional import lines to add.
 */
function applyTypeUpgrades(pureLines, typeUpgrades) {
    const additionalImports = [];

    for (const upgrade of typeUpgrades) {
        for (let i = 0; i < pureLines.length; i++) {
            const parsed = parseImport(pureLines[i].trim());
            if (!parsed || parsed.kind !== "type" || !parsed.names) continue;
            if (normalizePath(parsed.fromPath) !== upgrade.normPath) continue;

            const namesToUpgrade = upgrade.names.filter((n) => parsed.names.includes(n));
            if (namesToUpgrade.length === 0) continue;

            // Remove upgraded names from the type import
            const remaining = parsed.names.filter((n) => !namesToUpgrade.includes(n));
            if (remaining.length === 0) {
                pureLines[i] = ""; // line will be removed
            } else {
                pureLines[i] = `import type { ${remaining.join(", ")} } from "${parsed.fromPath}";`;
            }

            // Add value import (using the path already in .pure.ts)
            additionalImports.push(`import { ${namesToUpgrade.join(", ")} } from "${upgrade.usePath}";`);
        }
    }

    return additionalImports;
}

// ── Multi-line joining ──────────────────────────────────────────────────────
/**
 * Pre-process lines: join multi-line import/export statements into single lines.
 */
function joinMultiLineStatements(lines) {
    const result = [];
    let accumulator = null;

    for (const line of lines) {
        const t = line.trim();

        if (accumulator !== null) {
            accumulator += " " + t;
            if (/\}\s*from\s+["'].*["']\s*;?\s*$/.test(accumulator) || /["']\s*;?\s*$/.test(accumulator)) {
                result.push(accumulator);
                accumulator = null;
            }
            continue;
        }

        if (/^import\s/.test(t) && t.includes("{") && !t.includes("}")) {
            accumulator = t;
            continue;
        }
        if (/^export\s/.test(t) && t.includes("{") && !t.includes("}")) {
            accumulator = t;
            continue;
        }

        result.push(line);
    }

    if (accumulator !== null) result.push(accumulator);
    return result;
}

// ── Line categorization ────────────────────────────────────────────────────
/**
 * Categorize each line of the thin .ts wrapper.
 */
function categorizeLines(rawLines, pureBase) {
    const lines = joinMultiLineStatements(rawLines);

    const result = {
        headerComments: [],
        exportPureLine: null,
        registerImportLine: null,
        registerCallLine: null,
        bareImports: [],
        selfImports: [],
        valueImports: [],
        typeImports: [],
        declares: [],
        code: [],
        hasExportDeclarations: false,
    };

    let seenCode = false;
    let inHeaderComment = false;

    for (const line of lines) {
        const t = line.trim();

        if (!t) {
            if (seenCode) result.code.push(line);
            continue;
        }

        // Header JSDoc/comment block (before any code)
        if (!seenCode) {
            if (t.startsWith("/**") || t.startsWith("/*") || t.startsWith("*") || t.startsWith("//")) {
                if (t.startsWith("/**") || t.startsWith("/*")) inHeaderComment = true;
                result.headerComments.push(line);
                if (t.endsWith("*/")) inHeaderComment = false;
                continue;
            }
            if (inHeaderComment) {
                result.headerComments.push(line);
                if (t.endsWith("*/")) inHeaderComment = false;
                continue;
            }
        }

        // export * from "./<base>.pure"
        if (/^export \* from\s+["'].*\.pure["']/.test(t)) {
            result.exportPureLine = line;
            continue;
        }

        // Detect exported declarations (export function/class/const etc.)
        // These are NOT side effects — they are part of the module API.
        if (/^export\s+(function|async\s+function|class|abstract\s+class)\s/.test(t)) {
            result.hasExportDeclarations = true;
            result.code.push(line);
            seenCode = true;
            continue;
        }

        // import { registerXxx } from "./<base>.pure"
        if (/^import\s+\{.*register\w+.*\}\s+from\s+["'].*\.pure["']/.test(t)) {
            result.registerImportLine = line;
            seenCode = true;
            continue;
        }

        // registerXxx();
        if (/^register\w+\(\)\s*;?\s*$/.test(t)) {
            result.registerCallLine = line;
            seenCode = true;
            continue;
        }

        seenCode = true;

        // Bare imports: import "./path" or import "path"
        if (/^import\s+["']/.test(t)) {
            result.bareImports.push(line);
            continue;
        }

        // Self-imports from .pure file
        const parsed = parseImport(t);
        if (parsed && parsed.fromPath && parsed.fromPath.includes(pureBase)) {
            result.selfImports.push(line);
            continue;
        }

        // Type imports
        if (parsed && parsed.kind === "type") {
            result.typeImports.push(line);
            continue;
        }

        // Value imports
        if (parsed && (parsed.kind === "value" || parsed.kind === "namespace")) {
            result.valueImports.push(line);
            continue;
        }

        // declare module → flag for manual
        if (/^declare module\s/.test(t)) {
            result.declares.push({ kind: "module", line });
            continue;
        }

        // declare let/var/const/function
        if (/^declare\s+(let|var|const|function)\s/.test(t)) {
            result.declares.push({ kind: "other", line });
            continue;
        }

        // Everything else is code (including inline comments)
        result.code.push(line);
    }

    return result;
}

// ── Main processing ─────────────────────────────────────────────────────────
function processFile(filePath, registerNameOverride) {
    const relPath = relative(SRC_ROOT, filePath);
    const dir = dirname(filePath);
    const fileName = basename(filePath);
    const baseName = fileName.replace(/\.ts$/, "");
    const purePath = join(dir, baseName + ".pure.ts");
    const pureBase = "./" + baseName + ".pure";

    // Read .ts file
    const content = readFileSync(filePath, "utf-8");

    // Must be a thin wrapper with .pure re-export
    if (!/export \* from.*\.pure/.test(content)) {
        return;
    }

    // Check .pure.ts exists
    if (!existsSync(purePath)) {
        if (VERBOSE) console.log(`  SKIP (no .pure.ts): ${relPath}`);
        skipped++;
        return;
    }

    const lines = content.split("\n");
    const cat = categorizeLines(lines, pureBase);

    // Check for declare module blocks → flag for manual handling
    const hasDeclareModule = cat.declares.some((d) => d.kind === "module");
    if (hasDeclareModule) {
        manualFiles.push({ file: relPath, reason: "has declare module block" });
        if (VERBOSE) console.log(`  MANUAL (declare module): ${relPath}`);
        return;
    }

    // Check for exported declarations (export function/class) → flag for manual
    if (cat.hasExportDeclarations) {
        manualFiles.push({ file: relPath, reason: "has export function/class declarations" });
        if (VERBOSE) console.log(`  MANUAL (export declarations): ${relPath}`);
        return;
    }

    // Check if there's any code to move
    const codeLines = cat.code.filter((l) => l.trim().length > 0);
    if (codeLines.length === 0 && cat.valueImports.length === 0 && cat.typeImports.length === 0 && cat.declares.length === 0) {
        alreadyClean++;
        if (VERBOSE) console.log(`  CLEAN: ${relPath}`);
        return;
    }

    // ── Read .pure.ts ────────────────────────────────────────────────────
    const pureContent = readFileSync(purePath, "utf-8");
    const pureLines = pureContent.split("\n");
    const existingImportMap = buildImportMap(pureContent);
    const existingRegFn = findRegisterFunction(pureLines);
    const hasRegisteredFlag = pureContent.includes("let _registered = false");

    // ── Determine register function name ─────────────────────────────────
    let registerName;
    if (existingRegFn) {
        registerName = existingRegFn.name;
    } else if (cat.registerCallLine) {
        const m = cat.registerCallLine.trim().match(/^(register\w+)\(\)/);
        registerName = m ? m[1] : registerNameOverride || generateRegisterName(fileName);
    } else {
        registerName = registerNameOverride || generateRegisterName(fileName);
    }

    // ── Compute import delta ─────────────────────────────────────────────
    const allImportsToAdd = [...cat.valueImports, ...cat.typeImports];
    const { newImportLines, typeUpgrades } = computeImportDelta(existingImportMap, allImportsToAdd, pureBase);

    // Apply type→value upgrades to pureLines (mutates array)
    const upgradeImports = applyTypeUpgrades(pureLines, typeUpgrades);
    newImportLines.push(...upgradeImports);

    // ── Build the code block to insert ───────────────────────────────────
    let codeBlock = cat.code.slice();
    while (codeBlock.length > 0 && codeBlock[0].trim() === "") codeBlock.shift();
    while (codeBlock.length > 0 && codeBlock[codeBlock.length - 1].trim() === "") codeBlock.pop();

    if (codeBlock.length === 0 && newImportLines.length === 0 && cat.declares.length === 0) {
        alreadyClean++;
        if (VERBOSE) console.log(`  CLEAN (after parse): ${relPath}`);
        return;
    }

    // Indent code for inside the register function (add 4 spaces)
    const indentedCode = codeBlock.map((l) => (l.trim() === "" ? "" : "    " + l));

    // ── Build new .pure.ts content ───────────────────────────────────────
    let newPureLines = [...pureLines]; // start with (possibly modified) existing lines

    if (existingRegFn) {
        // Insert code before the closing brace of the existing function
        if (indentedCode.length > 0) {
            const insertAt = existingRegFn.endLine;
            newPureLines.splice(insertAt, 0, "", ...indentedCode);
        }
        extendedExisting++;
    } else {
        // Create a new register function and append
        const fnLines = [];
        if (!hasRegisteredFlag) {
            fnLines.push("");
            fnLines.push("let _registered = false;");
        }
        fnLines.push(`export function ${registerName}(): void {`);
        fnLines.push("    if (_registered) {");
        fnLines.push("        return;");
        fnLines.push("    }");
        fnLines.push("    _registered = true;");
        if (indentedCode.length > 0) {
            fnLines.push("");
            fnLines.push(...indentedCode);
        }
        fnLines.push("}");
        fnLines.push("");

        newPureLines.push(...fnLines);
        createdNew++;
    }

    // Add new imports to .pure.ts (after the last existing import)
    if (newImportLines.length > 0) {
        let lastImportIdx = -1;
        for (let i = 0; i < newPureLines.length; i++) {
            if (/^\s*import\s/.test(newPureLines[i])) {
                lastImportIdx = i;
            }
        }
        const insertIdx = lastImportIdx + 1;
        newPureLines.splice(insertIdx, 0, ...newImportLines);
    }

    // Add top-level declares (like `declare let earcut: any;`) — but check for duplicates
    const otherDeclares = cat.declares.filter((d) => d.kind === "other");
    if (otherDeclares.length > 0) {
        const pureJoined = newPureLines.join("\n");
        const deduped = otherDeclares.filter((d) => {
            // Extract the variable name from `declare let/var/const NAME`
            const m = d.line.trim().match(/^declare\s+(?:let|var|const)\s+(\w+)/);
            if (m) {
                // Check if the name already exists in .pure.ts
                const nameRegex = new RegExp(`\\b${m[1]}\\b`);
                return !nameRegex.test(pureJoined.replace(d.line.trim(), ""));
            }
            return true;
        });
        if (deduped.length > 0) {
            let lastImportIdx2 = -1;
            for (let i = 0; i < newPureLines.length; i++) {
                if (/^\s*import\s/.test(newPureLines[i])) lastImportIdx2 = i;
            }
            newPureLines.splice(lastImportIdx2 + 1, 0, "", ...deduped.map((d) => d.line.trim()));
        }
    }

    // Clean up blank lines from type-upgrade removals
    const newPureContent = newPureLines
        .filter((l, i, arr) => {
            // Remove consecutive blank lines (keep at most 2)
            if (l === "" && i > 0 && arr[i - 1] === "" && i > 1 && arr[i - 2] === "") return false;
            return true;
        })
        .join("\n");

    // ── Build new .ts content ────────────────────────────────────────────
    const newTsLines = [];

    newTsLines.push("/**");
    newTsLines.push(" * Re-exports pure implementation and applies runtime side effects.");
    newTsLines.push(` * Import ${baseName}.pure for tree-shakeable, side-effect-free usage.`);
    newTsLines.push(" */");

    if (cat.exportPureLine) {
        newTsLines.push(cat.exportPureLine.trim());
    } else {
        newTsLines.push(`export * from "${pureBase}";`);
    }

    if (cat.bareImports.length > 0) {
        newTsLines.push("");
        for (const bi of cat.bareImports) {
            newTsLines.push(bi.trim());
        }
    }

    newTsLines.push("");
    newTsLines.push(`import { ${registerName} } from "${pureBase}";`);
    newTsLines.push(`${registerName}();`);
    newTsLines.push("");

    const newTsContent = newTsLines.join("\n");

    // ── Write files ──────────────────────────────────────────────────────
    if (DRY_RUN) {
        console.log(`\n[DRY-RUN] ${relPath}:`);
        console.log(`  Register: ${registerName} (${existingRegFn ? "extend" : "create"})`);
        console.log(`  Code lines: ${codeBlock.length}`);
        console.log(`  New imports: ${newImportLines.length}`);
        console.log(`  Type upgrades: ${typeUpgrades.length}`);
        if (VERBOSE) {
            console.log(`  --- .ts ---`);
            console.log(newTsContent);
        }
    } else {
        writeFileSync(purePath, newPureContent, "utf-8");
        writeFileSync(filePath, newTsContent, "utf-8");
    }

    processed++;
    if (VERBOSE) {
        console.log(`  PROCESSED: ${relPath} → ${registerName} (${existingRegFn ? "extended" : "created"})`);
    }
}

// ── Main ────────────────────────────────────────────────────────────────────
console.log("Wrapping remaining side effects into register functions…\n");

const allFiles = walk(SRC_ROOT);

// ── Pass 1: Analyze files and collect register names ─────────────────────
const fileAnalysis = []; // { filePath, registerName }

for (const f of allFiles) {
    const content = readFileSync(f, "utf-8");
    if (!/export \* from.*\.pure/.test(content)) continue;

    const purePath = join(dirname(f), basename(f).replace(/\.ts$/, ".pure.ts"));
    if (!existsSync(purePath)) continue;

    const lines = content.split("\n");
    const pureBase = "./" + basename(f).replace(/\.ts$/, "") + ".pure";
    const cat = categorizeLines(lines, pureBase);

    // Skip files that would be flagged for manual or are already clean
    if (cat.declares.some((d) => d.kind === "module")) continue;
    if (cat.hasExportDeclarations) continue;
    const codeLines = cat.code.filter((l) => l.trim().length > 0);
    if (codeLines.length === 0 && cat.valueImports.length === 0 && cat.typeImports.length === 0 && cat.declares.length === 0) continue;

    // Check if existing register function already has a name
    const pureContent = readFileSync(purePath, "utf-8");
    const existingRegFn = findRegisterFunction(pureContent.split("\n"));
    let registerName;
    if (existingRegFn) {
        registerName = existingRegFn.name;
    } else if (cat.registerCallLine) {
        const m = cat.registerCallLine.trim().match(/^(register\w+)\(\)/);
        registerName = m ? m[1] : generateRegisterName(basename(f));
    } else {
        registerName = generateRegisterName(basename(f));
    }

    fileAnalysis.push({ filePath: f, registerName });
}

// ── Pass 2: Detect name collisions and add directory qualifiers ──────────
const nameCount = new Map();
for (const { registerName } of fileAnalysis) {
    nameCount.set(registerName, (nameCount.get(registerName) || 0) + 1);
}

const nameOverrides = new Map(); // filePath → qualifiedName
for (const { filePath, registerName } of fileAnalysis) {
    if (nameCount.get(registerName) > 1) {
        // Add directory qualifier — use the topmost two directory levels from relPath
        const relPath = relative(SRC_ROOT, filePath);
        const parts = relPath.split("/");
        // Use the last 2 directories before the filename
        const dirParts = parts.slice(0, -1);
        const qualifier = dirParts.join("/");
        const qualifiedName = generateRegisterName(basename(filePath), qualifier);
        nameOverrides.set(filePath, qualifiedName);
        if (VERBOSE) console.log(`  NAME COLLISION: ${registerName} → ${qualifiedName} (${relPath})`);
    }
}

// ── Pass 3: Process files ────────────────────────────────────────────────
for (const f of allFiles) {
    try {
        const override = nameOverrides.get(f) || undefined;
        processFile(f, override);
    } catch (err) {
        errorFiles.push({ file: relative(SRC_ROOT, f), error: err.message });
        console.error(`  ERROR: ${relative(SRC_ROOT, f)}: ${err.message}`);
    }
}

// ── Summary ─────────────────────────────────────────────────────────────────
console.log("\n═══ Summary ═══");
console.log(`  Processed:              ${processed}`);
console.log(`    Extended existing fn:  ${extendedExisting}`);
console.log(`    Created new fn:        ${createdNew}`);
console.log(`  Already clean:          ${alreadyClean}`);
console.log(`  Skipped (no .pure.ts):  ${skipped}`);

if (nameOverrides.size > 0) {
    console.log(`\n  ⚡ Name collisions resolved: ${nameOverrides.size}`);
}

if (manualFiles.length > 0) {
    console.log(`\n  ⚠ Manual handling needed: ${manualFiles.length}`);
    for (const m of manualFiles) {
        console.log(`    ${m.file} — ${m.reason}`);
    }
}

if (errorFiles.length > 0) {
    console.log(`\n  ❌ Errors: ${errorFiles.length}`);
    for (const e of errorFiles) {
        console.log(`    ${e.file}: ${e.error}`);
    }
}
