#!/usr/bin/env node
/**
 * extractTypes.mjs
 *
 * Extracts `declare module` blocks from `.pure.ts` files into `.types.ts` files.
 *
 * Key behaviours:
 *   1. `declare module "X"` paths are rewritten to `"X.pure"` so the
 *      augmentation targets the pure file, not the side-effectful wrapper.
 *   2. Locally-defined types/interfaces/classes referenced inside declare module
 *      blocks become `import { type Foo } from "./file.pure"` in the `.types.ts`.
 *   3. Imports in the `.pure.ts` that are ONLY needed by declare module blocks
 *      are removed from `.pure.ts` (moved to `.types.ts`).
 *   4. `export * from "./<name>.types"` is added to the wrapper `.ts` file (NOT `.pure.ts`).
 *
 * Usage: node scripts/treeshaking/extractTypes.mjs [--dry-run]
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import path from "path";

const DRY_RUN = process.argv.includes("--dry-run");
const ROOT = process.cwd();
const CORE_SRC = path.join(ROOT, "packages/dev/core/src");

// Find all .pure.ts files with `declare module` blocks
const files = execSync(`grep -rl "declare module" ${CORE_SRC} --include="*.pure.ts"`, { encoding: "utf-8" }).trim().split("\n").filter(Boolean).sort();

console.log(`Found ${files.length} .pure.ts files with declare module blocks\n`);

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

/** Find closing brace index starting from `startIdx`. */
function findBlockEnd(lines, startIdx) {
    let depth = 0;
    let opened = false;
    for (let k = startIdx; k < lines.length; k++) {
        for (const ch of lines[k]) {
            if (ch === "{") {
                depth++;
                opened = true;
            }
            if (ch === "}") depth--;
        }
        if (opened && depth === 0) return k;
    }
    return lines.length - 1;
}

/**
 * Parse all named imports from source lines.
 * Handles multi-line imports.
 * Returns array of ImportInfo objects.
 */
function parseImports(lines) {
    const results = [];
    let i = 0;
    while (i < lines.length) {
        if (!/^\s*import\s/.test(lines[i])) {
            i++;
            continue;
        }

        let text = lines[i];
        let end = i;
        // Multi-line: has `{` but not `}` on same line
        if (text.includes("{") && !text.includes("}")) {
            end++;
            while (end < lines.length && !lines[end].includes("}")) {
                text += "\n" + lines[end];
                end++;
            }
            if (end < lines.length) text += "\n" + lines[end];
        }

        const fromMatch = text.match(/from\s+"([^"]+)"/);
        const namesMatch = text.match(/\{([^}]+)\}/);
        if (fromMatch && namesMatch) {
            const isTypeOnly = /^\s*import\s+type\s/.test(lines[i]);
            const names = namesMatch[1]
                .split(",")
                .map((n) => n.trim())
                .filter(Boolean)
                .map((n) => {
                    const isInlineType = n.startsWith("type ");
                    const clean = n.replace(/^type\s+/, "");
                    const parts = clean.split(/\s+as\s+/);
                    return { name: parts[0].trim(), alias: parts.length > 1 ? parts[1].trim() : parts[0].trim(), isType: isTypeOnly || isInlineType };
                });
            results.push({ startLine: i, endLine: end, names, fromPath: fromMatch[1], isTypeOnly, raw: text });
        }
        i = end + 1;
    }
    return results;
}

/** Collect all PascalCase / _Prefixed identifiers from text. */
function collectIds(text) {
    const ids = new Set();
    for (const m of text.matchAll(/\b([A-Z_]\w*)\b/g)) ids.add(m[1]);
    return ids;
}

/**
 * Rebuild an import line from parts.
 * @param {boolean} forceType  – if true, emit `import type { … }` regardless
 */
function buildImportLine(names, fromPath, forceType = false) {
    const parts = names.map((n) => {
        let s = "";
        if (!forceType && n.isType) s += "type ";
        s += n.name;
        if (n.alias && n.alias !== n.name) s += ` as ${n.alias}`;
        return s;
    });
    const kw = forceType ? "import type" : "import";
    return `${kw} { ${parts.join(", ")} } from "${fromPath}";`;
}

// ──────────────────────────────────────────────────────────────────────────────

let processed = 0;

for (const filePath of files) {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");
    const baseName = path.basename(filePath, ".pure.ts");

    // ── 1. Locate declare module blocks ────────────────────────────────────
    const declareBlocks = [];
    {
        let i = 0;
        while (i < lines.length) {
            if (/^\s*declare\s+module\s+"/.test(lines[i])) {
                // Collect leading eslint-disable / comment lines that belong to this block
                let blockStart = i;
                for (let j = i - 1; j >= 0; j--) {
                    const t = lines[j].trim();
                    if (t.startsWith("//") || t.startsWith("/*") || t.startsWith("*")) {
                        blockStart = j;
                    } else if (t === "") {
                        // Include blank only if preceded by a comment
                        if (j > 0 && /^\s*(\/\/|\/\*|\*)/.test(lines[j - 1])) {
                            blockStart = j;
                        } else break;
                    } else break;
                }
                const blockEnd = findBlockEnd(lines, i);
                declareBlocks.push({ startLine: blockStart, endLine: blockEnd, declareLine: i });
                i = blockEnd + 1;
            } else {
                i++;
            }
        }
    }
    if (declareBlocks.length === 0) continue;

    // ── 2. Extract declare module text & identify referenced identifiers ──
    const declareLineRanges = new Set();
    for (const b of declareBlocks) for (let k = b.startLine; k <= b.endLine; k++) declareLineRanges.add(k);

    const declareText = declareBlocks.map((b) => lines.slice(b.startLine, b.endLine + 1).join("\n")).join("\n");
    const declareIds = collectIds(declareText);

    // Collect names that are the augmented interface/class names inside declare module
    // blocks — these are resolved from the target module, NOT from imports.
    // e.g. `declare module "../scene" { export interface Scene { ... } }` — "Scene" comes
    // from the "../scene" module, not from an import.
    const augmentedNames = new Set();
    for (const b of declareBlocks) {
        const blockLines = lines.slice(b.startLine, b.endLine + 1);
        for (const line of blockLines) {
            const m = line.match(/^\s*export\s+(?:interface|class|namespace|enum)\s+(\w+)/);
            if (m) augmentedNames.add(m[1]);
        }
    }

    // declareBodyIds: identifiers used in declare blocks BUT excluding the augmented names
    // These are the types that actually need imports (parameter types, return types, etc.)
    const declareBodyIds = new Set([...declareIds].filter((id) => !augmentedNames.has(id)));

    // ── 3. Identify locally-defined exported types used in declare blocks ─
    // These need to become `import type { … } from "./<baseName>.pure"` in .types.ts
    // Only include types that are used as actual type references (not augmented names)
    const localNames = [];
    for (let k = 0; k < lines.length; k++) {
        if (declareLineRanges.has(k)) continue;
        const m = lines[k].match(/^\s*(?:export\s+)?(?:interface|type|class|enum|const enum)\s+(\w+)/);
        if (m && declareBodyIds.has(m[1])) localNames.push(m[1]);
    }

    // ── 4. Parse existing imports & split them ────────────────────────────
    const imports = parseImports(lines);

    // Build remaining-source text: everything EXCEPT declare blocks AND import lines.
    // We exclude import lines so that an imported name doesn't count as "used" just
    // because it appears in its own import statement.
    const importLineRanges = new Set();
    for (const imp of imports) for (let k = imp.startLine; k <= imp.endLine; k++) importLineRanges.add(k);

    const remainingText = lines.filter((_, idx) => !declareLineRanges.has(idx) && !importLineRanges.has(idx)).join("\n");
    const remainingIds = collectIds(remainingText);

    // For each import, decide: keep in pure, move to types, or both
    const importsForTypes = new Map(); // fromPath → [names]
    const importsToRewrite = []; // { imp, keptNames }

    for (const imp of imports) {
        const forTypes = [];
        const forPure = [];
        for (const n of imp.names) {
            const id = n.alias || n.name;
            const inDeclare = declareBodyIds.has(id);
            const inRemaining = remainingIds.has(id);
            if (inDeclare) forTypes.push(n);
            if (inRemaining || !inDeclare) forPure.push(n);
        }
        if (forTypes.length > 0) {
            // .types.ts imports: strip .pure suffix (types import from the base)
            const typesPath = imp.fromPath.replace(/\.pure$/, "");
            if (!importsForTypes.has(typesPath)) importsForTypes.set(typesPath, []);
            for (const n of forTypes) {
                const arr = importsForTypes.get(typesPath);
                if (!arr.some((e) => e.name === n.name)) arr.push(n);
            }
        }
        if (forPure.length < imp.names.length) {
            // Some names were removed → rewrite in pure
            importsToRewrite.push({ imp, keptNames: forPure });
        }
    }

    // Also add local names as imports in .types.ts
    if (localNames.length > 0) {
        const localPath = `./${baseName}.pure`;
        if (!importsForTypes.has(localPath)) importsForTypes.set(localPath, []);
        for (const name of localNames) {
            const arr = importsForTypes.get(localPath);
            if (!arr.some((e) => e.name === name)) arr.push({ name, alias: name, isType: true });
        }
    }

    // ── 5. Build .types.ts content ────────────────────────────────────────
    const typesFileLines = [];

    // Imports (all as type-only)
    for (const [fromPath, names] of importsForTypes) {
        const parts = names.map((n) => {
            const s = n.alias && n.alias !== n.name ? `${n.name} as ${n.alias}` : n.name;
            return `type ${s}`;
        });
        typesFileLines.push(`import { ${parts.join(", ")} } from "${fromPath}"`);
    }

    // Declare module blocks — always rewrite paths to add .pure suffix
    for (const block of declareBlocks) {
        const blockLines = lines.slice(block.startLine, block.endLine + 1).map((line) => {
            return line.replace(/^(\s*declare\s+module\s+")([^"]+)(")/, (_, pre, modPath, post) => {
                // Don't double-add .pure
                if (modPath.endsWith(".pure")) return pre + modPath + post;
                return pre + modPath + ".pure" + post;
            });
        });
        typesFileLines.push(...blockLines);
    }

    // If no imports were generated, add `export {};` so the file is treated as a module
    // (TypeScript requires this for `declare module "..."` with relative paths)
    if (importsForTypes.size === 0) {
        typesFileLines.unshift("export {};", "");
    }

    const typesContent = typesFileLines.join("\n") + "\n";

    // ── 6. Build modified .pure.ts content ────────────────────────────────
    const linesToRemove = new Set();
    // Mark declare module blocks for removal
    for (const b of declareBlocks) {
        for (let k = b.startLine; k <= b.endLine; k++) linesToRemove.add(k);
        // Trailing blanks
        let k = b.endLine + 1;
        while (k < lines.length && lines[k].trim() === "") {
            linesToRemove.add(k);
            k++;
        }
    }
    // `export {};`
    for (let k = 0; k < lines.length; k++) {
        if (lines[k].trim() === "export {};") {
            linesToRemove.add(k);
            if (k + 1 < lines.length && lines[k + 1].trim() === "") linesToRemove.add(k + 1);
        }
    }
    // Mark fully-removed imports
    for (const { imp, keptNames } of importsToRewrite) {
        if (keptNames.length === 0) {
            for (let k = imp.startLine; k <= imp.endLine; k++) linesToRemove.add(k);
        }
    }

    // Build replacement map for partially-removed imports
    const replacements = new Map();
    for (const { imp, keptNames } of importsToRewrite) {
        if (keptNames.length > 0 && keptNames.length < imp.names.length) {
            replacements.set(imp.startLine, buildImportLine(keptNames, imp.fromPath, imp.isTypeOnly));
        }
    }

    const filteredLines = [];
    for (let k = 0; k < lines.length; k++) {
        if (linesToRemove.has(k)) {
            if (replacements.has(k)) filteredLines.push(replacements.get(k));
            continue;
        }
        filteredLines.push(lines[k]);
    }

    // Insert `export * from "./<baseName>.types";` into the WRAPPER .ts file (not .pure.ts)
    const typesExport = `export * from "./${baseName}.types";`;
    const wrapperPath = filePath.replace(".pure.ts", ".ts");
    if (existsSync(wrapperPath)) {
        const wrapperContent = readFileSync(wrapperPath, "utf8");
        if (!wrapperContent.includes(`${baseName}.types`)) {
            const wrapperLines = wrapperContent.split("\n");
            // Find insertion point: after existing export * lines
            let wIdx = 0;
            while (wIdx < wrapperLines.length && /^\s*(export\s+\*\s+from\s|import\s|\/\/)/.test(wrapperLines[wIdx])) wIdx++;
            // Skip blank lines
            while (wIdx > 0 && wrapperLines[wIdx - 1].trim() === "") wIdx--;
            wrapperLines.splice(wIdx, 0, typesExport);
            writeFileSync(wrapperPath, wrapperLines.join("\n"));
        }
    }

    // Collapse runs of 3+ blank lines into 2
    const finalLines = [];
    let blankRun = 0;
    for (const line of filteredLines) {
        if (line.trim() === "") {
            blankRun++;
            if (blankRun > 2) continue;
        } else blankRun = 0;
        finalLines.push(line);
    }

    const typesPath = filePath.replace(".pure.ts", ".types.ts");
    if (DRY_RUN) {
        console.log(`[DRY] ${path.relative(ROOT, typesPath)}`);
    } else {
        writeFileSync(typesPath, typesContent);
        writeFileSync(filePath, finalLines.join("\n"));
        console.log(`  ${path.relative(ROOT, typesPath)}`);
    }
    processed++;
}

console.log(`\nDone: ${processed} files processed`);
