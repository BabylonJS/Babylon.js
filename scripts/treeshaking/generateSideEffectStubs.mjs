#!/usr/bin/env node
/**
 * Phase 11 — Generate side-effect warning stubs for augmented prototype methods.
 *
 * Reads every `.types.ts` file under packages/dev/core/src/, parses the
 * `declare module` blocks to extract method/property declarations, then injects
 * lightweight stubs into the corresponding target class files.
 *
 * When a user calls an augmented method without importing its side-effect module,
 * they get a helpful console.warn instead of "TypeError: x is not a function".
 *
 * Usage:
 *   node scripts/treeshaking/generateSideEffectStubs.mjs [--dry-run] [--verbose]
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname, relative, posix } from "path";
import { globSync } from "glob";

const ROOT = resolve(import.meta.dirname, "../../packages/dev/core/src");
const REPO_ROOT = resolve(import.meta.dirname, "../..");
const DRY_RUN = process.argv.includes("--dry-run");
const CHECK = process.argv.includes("--check");
const VERBOSE = process.argv.includes("--verbose");

/** @type {Map<string, string>} path → expected content (used in --check mode) */
const expectedContents = new Map();

const REGION_START = "// #region GENERATED_SIDE_EFFECT_STUBS — do not edit, regenerate with `npm run generate:side-effect-stubs`";
const REGION_END = "// #endregion GENERATED_SIDE_EFFECT_STUBS";

// ── Step 1: Find all .types.ts files ────────────────────────────────────────

const typesFiles = globSync("**/*.types.ts", { cwd: ROOT, absolute: true }).sort();
if (VERBOSE) console.log(`Found ${typesFiles.length} .types.ts files`);

// ── Step 2: Parse declare module blocks ─────────────────────────────────────

/**
 * @typedef {{ name: string, isMethod: boolean, isInternal: boolean }} MemberDecl
 * @typedef {{ modulePath: string, interfaceName: string, members: MemberDecl[] }} AugBlock
 */

/**
 * Parse a .types.ts file and extract all declare module blocks with their members.
 * @param {string} filePath
 * @returns {AugBlock[]}
 */
function parseTypesFile(filePath) {
    const src = readFileSync(filePath, "utf-8");
    /** @type {AugBlock[]} */
    const blocks = [];

    // Match: declare module "path" { ... interface Name { ... } ... }
    // We use a state-machine approach for robustness with nested braces
    const declareModuleRe = /declare\s+module\s+"([^"]+)"\s*\{/g;

    let dmMatch;
    while ((dmMatch = declareModuleRe.exec(src)) !== null) {
        const modulePath = dmMatch[1];
        const outerStart = dmMatch.index + dmMatch[0].length;

        // Find the matching closing brace for the declare module block
        let depth = 1;
        let pos = outerStart;
        while (pos < src.length && depth > 0) {
            if (src[pos] === "{") depth++;
            else if (src[pos] === "}") depth--;
            pos++;
        }
        const blockBody = src.slice(outerStart, pos - 1);

        // Find interface declarations inside
        const interfaceRe = /export\s+interface\s+(\w+)(?:<[^>]*>)?\s*\{/g;
        let ifMatch;
        while ((ifMatch = interfaceRe.exec(blockBody)) !== null) {
            const interfaceName = ifMatch[1];
            const ifStart = ifMatch.index + ifMatch[0].length;

            // Find matching close brace for the interface
            let iDepth = 1;
            let iPos = ifStart;
            while (iPos < blockBody.length && iDepth > 0) {
                if (blockBody[iPos] === "{") iDepth++;
                else if (blockBody[iPos] === "}") iDepth--;
                iPos++;
            }
            const ifBody = blockBody.slice(ifStart, iPos - 1);

            // Extract members — look for lines that declare methods or properties
            const members = parseInterfaceMembers(ifBody);

            blocks.push({ modulePath, interfaceName, members });
        }
    }

    return blocks;
}

/**
 * Parse interface body to extract member declarations.
 * Handles multi-line method signatures by tracking parenthesis depth.
 * @param {string} body
 * @returns {MemberDecl[]}
 */
function parseInterfaceMembers(body) {
    /** @type {MemberDecl[]} */
    const members = [];

    // Remove multi-line comments (JSDoc) to simplify parsing
    const stripped = body.replace(/\/\*\*[\s\S]*?\*\//g, "");

    // Split into lines and process with parenthesis/brace depth tracking
    const lines = stripped.split("\n");
    let parenDepth = 0; // Track open parens for multi-line method signatures
    let braceDepth = 0; // Track open braces for nested object type literals

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("*")) continue;

        // If we're inside a parenthesized parameter list, just track depth
        if (parenDepth > 0) {
            for (const ch of trimmed) {
                if (ch === "(") parenDepth++;
                else if (ch === ")") parenDepth--;
            }
            continue;
        }

        // If we're inside a nested object type literal, just track brace depth
        if (braceDepth > 0) {
            for (const ch of trimmed) {
                if (ch === "{") braceDepth++;
                else if (ch === "}") braceDepth--;
            }
            continue;
        }

        // Match property or method declarations:
        // Method: name(params): returnType;
        // Method: name<T>(params): returnType;
        // Property: name: Type;
        // Optional property: name?: Type;
        // We look for: identifier followed by ( for method, or : or ? for property
        const memberMatch = trimmed.match(/^(\w+)(?:\s*<[^>]*>)?\s*(\(|[?]?\s*:)/);
        if (!memberMatch) continue;

        const name = memberMatch[1];
        const delimiter = memberMatch[2];

        // Skip TypeScript keywords that might false-match
        if (["export", "readonly", "static", "declare", "import", "type", "interface", "class", "extends", "implements"].includes(name)) continue;

        const isMethod = delimiter === "(";
        const isInternal = name.startsWith("_");

        // Track parenthesis depth for multi-line method signatures
        if (isMethod) {
            for (const ch of trimmed) {
                if (ch === "(") parenDepth++;
                else if (ch === ")") parenDepth--;
            }
        }

        // Track brace depth for nested object type literals (e.g., prop: { key: value })
        if (!isMethod) {
            for (const ch of trimmed) {
                if (ch === "{") braceDepth++;
                else if (ch === "}") braceDepth--;
            }
        }

        members.push({ name, isMethod, isInternal });
    }

    return members;
}

// ── Step 3: Resolve target files and group stubs ────────────────────────────

/**
 * @typedef {{ methods: Map<string, string>, properties: Map<string, string> }} ClassStubs
 * methods: Map<methodName, className>, properties: Map<propName, className>
 */

/** @type {Map<string, Map<string, ClassStubs>>} targetFile -> className -> stubs */
const stubsByFile = new Map();

let totalMethods = 0;
let totalProperties = 0;
let totalSkipped = 0;

for (const typesFile of typesFiles) {
    const blocks = parseTypesFile(typesFile);

    for (const block of blocks) {
        // Resolve the module path relative to the .types.ts file location
        const typeDir = dirname(typesFile);
        let resolvedBase = resolve(typeDir, block.modulePath);

        // Find the actual .ts or .pure.ts file
        let targetFile = null;
        // Prefer .pure.ts for the target (stubs attached to the pure class)
        if (existsSync(resolvedBase + ".pure.ts")) {
            targetFile = resolvedBase + ".pure.ts";
        } else if (existsSync(resolvedBase + ".ts")) {
            targetFile = resolvedBase + ".ts";
        } else {
            if (VERBOSE) console.log(`  SKIP: cannot resolve target for declare module "${block.modulePath}" from ${relative(ROOT, typesFile)}`);
            continue;
        }

        if (!stubsByFile.has(targetFile)) {
            stubsByFile.set(targetFile, new Map());
        }
        const classMap = stubsByFile.get(targetFile);
        if (!classMap.has(block.interfaceName)) {
            classMap.set(block.interfaceName, { methods: new Map(), properties: new Map() });
        }
        const stubs = classMap.get(block.interfaceName);

        for (const member of block.members) {
            if (member.isInternal) {
                totalSkipped++;
                continue;
            }

            if (member.isMethod) {
                if (!stubs.methods.has(member.name)) {
                    stubs.methods.set(member.name, block.interfaceName);
                    totalMethods++;
                }
            } else {
                if (!stubs.properties.has(member.name)) {
                    stubs.properties.set(member.name, block.interfaceName);
                    totalProperties++;
                }
            }
        }
    }
}

// ── Step 4: Generate stub code and inject into target files ─────────────────

let filesModified = 0;

for (const [targetFile, classMap] of stubsByFile) {
    // Compute relative import path from target to devTools.ts
    const targetDir = dirname(targetFile);
    let relPath = posix.normalize(relative(targetDir, resolve(ROOT, "Misc/devTools")).split("\\").join("/"));
    if (!relPath.startsWith(".")) relPath = "./" + relPath;

    // Build stub code lines
    const lines = [];
    lines.push(REGION_START);
    lines.push(`import { _MissingSideEffect, _MissingSideEffectProperty } from "${relPath}";`);
    lines.push("");

    let fileStubCount = 0;

    for (const [className, stubs] of classMap) {
        // Methods
        for (const [methodName] of stubs.methods) {
            lines.push(`${className}.prototype.${methodName} ??= _MissingSideEffect("${className}", "${methodName}") as any;`);
            fileStubCount++;
        }
        // Properties
        for (const [propName] of stubs.properties) {
            lines.push(`if (!Object.getOwnPropertyDescriptor(${className}.prototype, "${propName}")) {`);
            lines.push(`    Object.defineProperty(${className}.prototype, "${propName}", _MissingSideEffectProperty("${className}", "${propName}"));`);
            lines.push(`}`);
            fileStubCount++;
        }
    }

    lines.push(REGION_END);

    if (fileStubCount === 0) continue;

    const stubBlock = lines.join("\n") + "\n";

    // Read target file and inject/replace stub block
    let content = readFileSync(targetFile, "utf-8");
    const regionStartIdx = content.indexOf(REGION_START);
    const regionEndIdx = content.indexOf(REGION_END);

    if (regionStartIdx !== -1 && regionEndIdx !== -1) {
        // Replace existing region
        content = content.slice(0, regionStartIdx) + stubBlock + content.slice(regionEndIdx + REGION_END.length + 1);
    } else {
        // Append at end of file
        if (!content.endsWith("\n")) content += "\n";
        content += "\n" + stubBlock;
    }

    if (DRY_RUN) {
        console.log(`[DRY RUN] Would write ${fileStubCount} stubs to ${relative(ROOT, targetFile)}`);
    } else if (CHECK) {
        expectedContents.set(targetFile, content);
    } else {
        writeFileSync(targetFile, content, "utf-8");
    }

    filesModified++;
    if (VERBOSE) {
        console.log(`  ${relative(ROOT, targetFile)}: ${fileStubCount} stubs`);
        for (const [className, stubs] of classMap) {
            for (const [m] of stubs.methods) console.log(`    method: ${className}.${m}()`);
            for (const [p] of stubs.properties) console.log(`    property: ${className}.${p}`);
        }
    }
}

// ── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n=== Phase 11: Side-Effect Stubs ===`);
console.log(`  .types.ts files parsed:  ${typesFiles.length}`);
console.log(`  Method stubs generated:  ${totalMethods}`);
console.log(`  Property stubs generated: ${totalProperties}`);
console.log(`  Internal members skipped: ${totalSkipped}`);
console.log(`  Target files modified:    ${filesModified}`);
if (DRY_RUN) console.log(`  (dry run — no files written)`);

// ── Check mode: compare expected vs on-disk ─────────────────────────────────
if (CHECK) {
    let driftCount = 0;
    for (const [filePath, expected] of expectedContents) {
        let actual = "";
        try {
            actual = readFileSync(filePath, "utf-8");
        } catch {
            // File doesn't exist on disk
        }
        if (actual !== expected) {
            driftCount++;
            if (driftCount <= 10) {
                console.error(`  DRIFT: ${relative(REPO_ROOT, filePath)}`);
            }
        }
    }
    if (driftCount > 0) {
        if (driftCount > 10) {
            console.error(`  ... and ${driftCount - 10} more`);
        }
        console.error(`\n❌ ${driftCount} file(s) have out-of-date side-effect stubs.`);
        console.error(`To fix: npm run generate:side-effect-stubs\n`);
        process.exit(1);
    } else {
        console.log(`\n✅ All side-effect stubs are up-to-date.\n`);
    }
}
