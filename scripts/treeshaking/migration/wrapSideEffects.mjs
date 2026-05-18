#!/usr/bin/env node
/**
 * Phase 9 — wrapSideEffects.mjs
 *
 * For every `.ts` file in `@babylonjs/core/src` that contains a `declare module`
 * block, this script:
 *
 *  1. Creates a `.types.ts`  — the `declare module` block(s) + their type imports
 *  2. Updates `.pure.ts`     — adds `export * from "./<name>.types"`,
 *                              a `registerXxx()` function wrapping all side-effect
 *                              statements, and upgrades any `import type` to value
 *                              imports where side-effect code uses them as values.
 *  3. Thins `.ts`            — re-exports `.pure.ts` (which re-exports `.types.ts`)
 *                              + imports and calls the registration function
 *
 * Usage:
 *   node scripts/treeshaking/migration/wrapSideEffects.mjs [--dry-run] [--file <relpath>]
 *
 * Options:
 *   --dry-run   Print what would be done without writing files
 *   --file      Process only the specified file (relative to src/)
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, basename, dirname } from "path";
import { execSync } from "child_process";

// ─── Configuration ──────────────────────────────────────────────────────────

const SRC_ROOT = resolve(new URL(".", import.meta.url).pathname, "../../../packages/dev/core/src");

const DRY_RUN = process.argv.includes("--dry-run");
const SINGLE_FILE = (() => {
    const idx = process.argv.indexOf("--file");
    return idx >= 0 ? process.argv[idx + 1] : null;
})();

// Basenames that appear in multiple directories — need disambiguation
const COLLISIONS = new Set([
    "engine.alpha",
    "engine.computeShader",
    "engine.cubeTexture",
    "engine.dynamicTexture",
    "engine.multiRender",
    "engine.rawTexture",
    "engine.readTexture",
    "engine.renderTarget",
    "engine.renderTargetCube",
    "engine.renderTargetTexture",
    "engine.videoTexture",
    "physicsEngineComponent",
]);

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Convert a filename like "engine.multiRender" to PascalCase: "EngineMultiRender"
 */
function filenameToPascal(name) {
    return name
        .split(/[.\-_]/)
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join("");
}

/**
 * Build the registration function name for a file.
 */
function registrationFnName(relPath) {
    const base = basename(relPath, ".ts");
    const pascal = filenameToPascal(base);

    if (COLLISIONS.has(base)) {
        const dir = dirname(relPath);
        if (dir.includes("WebGPU")) return `registerWebGPU${pascal}`;
        if (dir.includes("/v1")) return `registerV1${pascal}`;
        if (dir.includes("/v2")) return `registerV2${pascal}`;
        if (dir.includes("Native")) return `registerNative${pascal}`;
        if (dir.includes("AbstractEngine")) return `registerAbstract${pascal}`;
        const dirPascal = filenameToPascal(dir.split("/").pop());
        return `register${dirPascal}${pascal}`;
    }

    return `register${pascal}`;
}

/**
 * Find all files with `declare module` in them (excluding .pure.ts, .types.ts, .d.ts)
 */
function findCandidates() {
    const out = execSync(`grep -rl "declare module" --include="*.ts" . | grep -v '\\.types\\.ts$' | grep -v '\\.pure\\.ts$' | grep -v '\\.d\\.ts$'`, {
        cwd: SRC_ROOT,
        encoding: "utf-8",
    });
    return out
        .trim()
        .split("\n")
        .map((p) => p.replace(/^\.\//, ""))
        .filter(Boolean)
        .sort();
}

// ─── Parsing ────────────────────────────────────────────────────────────────

/**
 * Parse a single import statement (possibly multi-line) and return structured info.
 */
function parseImport(line) {
    const isTypeOnly = /^import\s+type\s/.test(line.trim());
    const fromMatch = line.match(/from\s+["']([^"']+)["']/);
    const fromPath = fromMatch ? fromMatch[1] : null;

    // Extract imported names (handle multi-line)
    const names = [];

    // Handle namespace imports: import * as Foo from "..."
    const nsMatch = line.match(/import\s+(?:type\s+)?\*\s+as\s+(\w+)/);
    if (nsMatch) {
        names.push({ original: "*", local: nsMatch[1], isNamespace: true });
    } else {
        const braceMatch = line.match(/\{([^}]+)\}/s);
        if (braceMatch) {
            for (const part of braceMatch[1].split(",")) {
                const trimmed = part.trim();
                if (!trimmed) continue;
                const asParts = trimmed.split(/\s+as\s+/);
                names.push({
                    original: asParts[0].trim(),
                    local: asParts[asParts.length - 1].trim(),
                });
            }
        }
    }

    return { line, isTypeOnly, fromPath, names };
}

/**
 * Parse the .ts file into structured regions.
 */
function parseFile(content) {
    const lines = content.split("\n");
    const regions = {
        headerComment: [],
        reExportLines: [],
        imports: [], // parseImport results
        declareModules: [], // full text of each declare module block
        sideEffects: [], // lines of side-effect code
    };

    let i = 0;
    const n = lines.length;

    // 1. Skip leading comment
    if (lines[0] && (lines[0].startsWith("/**") || lines[0].startsWith("//"))) {
        while (i < n) {
            regions.headerComment.push(lines[i]);
            if (lines[i].includes("*/") && i > 0) {
                i++;
                break;
            }
            if (lines[i].startsWith("//")) {
                i++;
                if (i < n && !lines[i].startsWith("//")) break;
                continue;
            }
            i++;
        }
    }

    while (i < n && lines[i].trim() === "") i++;

    // 2. Collect re-export lines, imports, declare modules, side effects
    let inDeclareModule = false;
    let braceDepth = 0;
    let currentDeclareBlock = [];

    while (i < n) {
        const line = lines[i];
        const trimmed = line.trim();

        if (inDeclareModule) {
            currentDeclareBlock.push(line);
            braceDepth += (line.match(/{/g) || []).length;
            braceDepth -= (line.match(/}/g) || []).length;
            if (braceDepth <= 0) {
                regions.declareModules.push(currentDeclareBlock.join("\n"));
                currentDeclareBlock = [];
                inDeclareModule = false;
            }
            i++;
            continue;
        }

        if (trimmed.startsWith("declare module ")) {
            inDeclareModule = true;
            braceDepth = 0;
            currentDeclareBlock = [line];
            braceDepth += (line.match(/{/g) || []).length;
            braceDepth -= (line.match(/}/g) || []).length;
            if (braceDepth <= 0) {
                regions.declareModules.push(currentDeclareBlock.join("\n"));
                currentDeclareBlock = [];
                inDeclareModule = false;
            }
            i++;
            continue;
        }

        if (trimmed.startsWith("export * from ") || (trimmed.startsWith("export {") && trimmed.includes("from "))) {
            regions.reExportLines.push(line);
            i++;
            continue;
        }

        if (trimmed.startsWith("import ")) {
            let importLine = line;
            while (!importLine.includes(";") && i + 1 < n) {
                i++;
                importLine += "\n" + lines[i];
            }
            regions.imports.push(parseImport(importLine));
            i++;
            continue;
        }

        // Skip blank lines / pure-comment lines between sections
        if (regions.sideEffects.length === 0) {
            if (trimmed === "" || trimmed.startsWith("//")) {
                i++;
                continue;
            }
            // Multi-line comment block (not inline annotations like /*#__PURE__*/)
            if (trimmed.startsWith("/*") && !trimmed.includes("*/")) {
                // Start of a multi-line comment — skip the whole block
                while (i < n && !lines[i].includes("*/")) i++;
                i++; // skip the closing line
                continue;
            }
            // Single-line block comment with nothing after it
            if (trimmed.startsWith("/*") && trimmed.endsWith("*/")) {
                i++;
                continue;
            }
            // Continuation of multi-line comment (e.g., " * ...")
            if (trimmed.startsWith("*")) {
                i++;
                continue;
            }
        }

        regions.sideEffects.push(line);
        i++;
    }

    return regions;
}

// ─── Import analysis ────────────────────────────────────────────────────────

/**
 * For a block of text (declare module or side-effect code), find which imports
 * from the original .ts file are referenced (by local name).
 * For declare module blocks, excludes names that appear as `interface Foo` or
 * `namespace Foo` declarations (these are defining, not referencing).
 */
function findReferencedImports(text, allImports, isDeclareModule = false) {
    // Collect names being defined in the declare module block
    const declaredNames = new Set();
    if (isDeclareModule) {
        for (const m of text.matchAll(/\b(?:interface|namespace|class|enum)\s+(\w+)/g)) {
            declaredNames.add(m[1]);
        }
    }

    const needed = [];
    for (const imp of allImports) {
        for (const { local } of imp.names) {
            if (declaredNames.has(local)) continue;
            const regex = new RegExp(`\\b${local}\\b`);
            if (regex.test(text)) {
                needed.push(imp);
                break;
            }
        }
    }
    return needed;
}

/**
 * For MULTIPLE declare module blocks, find which imports are referenced.
 * Processes each block separately so that a name declared in one block
 * (e.g., `interface AbstractMesh`) is NOT excluded from another block
 * where it's used as a type reference (e.g., `Octree<AbstractMesh>`).
 */
function findReferencedImportsMultiBlock(blocks, allImports) {
    const neededSet = new Set();
    for (const blockText of blocks) {
        // For this block, find names being DECLARED
        const declaredNames = new Set();
        for (const m of blockText.matchAll(/\b(?:interface|namespace|class|enum)\s+(\w+)/g)) {
            declaredNames.add(m[1]);
        }

        for (const imp of allImports) {
            if (neededSet.has(imp)) continue;
            for (const { local } of imp.names) {
                if (declaredNames.has(local)) continue;
                const regex = new RegExp(`\\b${local}\\b`);
                if (regex.test(blockText)) {
                    neededSet.add(imp);
                    break;
                }
            }
        }
    }
    return [...neededSet];
}

/**
 * From side-effect code, find class/function names used as values
 * (e.g., Foo.prototype, new Foo(), Foo.Bar =, RegisterClass(..., Foo), Foo(...)).
 * Returns Set of local names.
 */
function findValueUsages(sideEffectText) {
    const usages = new Set();
    // Pattern: Name.prototype
    for (const m of sideEffectText.matchAll(/\b([A-Z]\w+)\.prototype\b/g)) {
        usages.add(m[1]);
    }
    // Pattern: Name.SomeStatic = (static assignment, including _private statics)
    for (const m of sideEffectText.matchAll(/\b([A-Z]\w+)\.(\w+)\s*=/g)) {
        usages.add(m[1]);
    }
    // Pattern: RegisterClass("...", Name)
    for (const m of sideEffectText.matchAll(/RegisterClass\s*\([^,]+,\s*(\w+)\s*\)/g)) {
        usages.add(m[1]);
    }
    // Pattern: new Name(
    for (const m of sideEffectText.matchAll(/\bnew\s+([A-Z]\w+)\s*\(/g)) {
        usages.add(m[1]);
    }
    // Pattern: instanceof Name
    for (const m of sideEffectText.matchAll(/\binstanceof\s+([A-Z]\w+)\b/g)) {
        usages.add(m[1]);
    }
    // Pattern: FunctionName( — direct call (functions starting with uppercase)
    for (const m of sideEffectText.matchAll(/\b([A-Z]\w+)\s*\(/g)) {
        // Exclude patterns already caught: new X(, RegisterClass(
        usages.add(m[1]);
    }
    return usages;
}

/**
 * Build import lines from a Map of fromPath → [{local, original, needsValue, isTypeOnly}].
 * Splits type-only and value imports from the same path into separate lines.
 */
function buildMergedImportLines(namesByPath) {
    const lines = [];
    for (const [fromPath, names] of namesByPath) {
        // Handle namespace imports separately (import * as X from "...")
        const nsNames = names.filter((n) => n.original === "*");
        const regularNames = names.filter((n) => n.original !== "*");

        for (const ns of nsNames) {
            const kind = ns.isTypeOnly && !ns.needsValue ? "import type" : "import";
            lines.push(`${kind} * as ${ns.local} from "${fromPath}";`);
        }

        if (regularNames.length > 0) {
            // Split into value-needed and type-only
            const valueNames = regularNames.filter((n) => n.needsValue || !n.isTypeOnly);
            const typeOnlyNames = regularNames.filter((n) => !n.needsValue && n.isTypeOnly);

            if (valueNames.length > 0) {
                const nameStr = valueNames.map((n) => (n.original !== n.local ? `${n.original} as ${n.local}` : n.local)).join(", ");
                lines.push(`import { ${nameStr} } from "${fromPath}";`);
            }
            if (typeOnlyNames.length > 0) {
                const nameStr = typeOnlyNames.map((n) => (n.original !== n.local ? `${n.original} as ${n.local}` : n.local)).join(", ");
                lines.push(`import type { ${nameStr} } from "${fromPath}";`);
            }
        }
    }
    return lines;
}

/**
 * Convert an import to a `import type` version (for .types.ts).
 */
function toTypeImport(imp) {
    if (imp.isTypeOnly) return imp.line;
    // Replace `import {` with `import type {`
    return imp.line.replace(/^(\s*)import\s+\{/, "$1import type {");
}

/**
 * Get all exported names from a .pure.ts file (classes, functions, consts, etc.)
 */
function getExportedNames(pureContent) {
    const names = new Set();
    // export class Foo
    for (const m of pureContent.matchAll(/export\s+(?:abstract\s+)?class\s+(\w+)/g)) {
        names.add(m[1]);
    }
    // export function foo
    for (const m of pureContent.matchAll(/export\s+function\s+(\w+)/g)) {
        names.add(m[1]);
    }
    // export const/let/var foo
    for (const m of pureContent.matchAll(/export\s+(?:const|let|var)\s+(\w+)/g)) {
        names.add(m[1]);
    }
    // export enum Foo
    for (const m of pureContent.matchAll(/export\s+enum\s+(\w+)/g)) {
        names.add(m[1]);
    }
    // export { Foo, Bar } from "..."  — extract names
    for (const m of pureContent.matchAll(/export\s+\{([^}]+)\}\s+from/g)) {
        for (const part of m[1].split(",")) {
            const asParts = part.trim().split(/\s+as\s+/);
            names.add(asParts[asParts.length - 1].trim());
        }
    }
    return names;
}

/**
 * Parse imports from pure.ts content to get structured info.
 */
function parsePureImports(pureContent) {
    const imports = [];
    const importRegex = /^import\s+.*?from\s+["'][^"']+["'];?\s*$/gm;
    for (const m of pureContent.matchAll(importRegex)) {
        imports.push(parseImport(m[0]));
    }
    return imports;
}

// ─── File generation ────────────────────────────────────────────────────────

function processFile(relPath) {
    const absPath = resolve(SRC_ROOT, relPath);
    const content = readFileSync(absPath, "utf-8");
    const purePath = absPath.replace(/\.ts$/, ".pure.ts");
    const typesPath = absPath.replace(/\.ts$/, ".types.ts");
    const base = basename(relPath, ".ts");
    const pureBase = base + ".pure";
    const typesBase = base + ".types";
    const fnName = registrationFnName(relPath);

    // Skip if already has a .types.ts
    if (existsSync(typesPath)) {
        console.log(`  SKIP (already has .types.ts): ${relPath}`);
        return { skipped: true };
    }

    // Skip if no .pure.ts exists — these need manual splitting
    if (!existsSync(purePath)) {
        console.log(`  SKIP (no .pure.ts — needs manual split): ${relPath}`);
        return { skipped: true };
    }

    const regions = parseFile(content);

    if (regions.declareModules.length === 0) {
        console.log(`  SKIP (no declare module found after parsing): ${relPath}`);
        return { skipped: true };
    }

    const hasSideEffects = regions.sideEffects.length > 0;
    if (!hasSideEffects) {
        console.log(`  WARN (declare module but no side effects): ${relPath}`);
    }

    // ── 1. Build .types.ts ──────────────────────────────────────────────────
    const declareText = regions.declareModules.join("\n\n");
    const typeImports = findReferencedImportsMultiBlock(regions.declareModules, regions.imports);

    // Filter out names that are:
    //   - Only used as namespace/interface/class/enum declarations in their block
    //   - Only used in `typeof X` expressions (TypeScript resolves these from
    //     the augmented module without needing a local import)
    // We need to check each imported name individually.
    const filteredTypeImports = [];
    for (const imp of typeImports) {
        const usedNames = [];
        for (const { local, original } of imp.names) {
            let isNeeded = false;
            for (const block of regions.declareModules) {
                // Find names declared in THIS block
                const blockDeclared = new Set();
                for (const m of block.matchAll(/\b(?:interface|namespace|class|enum)\s+(\w+)/g)) {
                    blockDeclared.add(m[1]);
                }
                if (blockDeclared.has(local)) continue; // Skip — declared in this block

                // Check if the name appears in this block
                const allOccurrences = [...block.matchAll(new RegExp(`\\b${local}\\b`, "g"))];
                if (allOccurrences.length === 0) continue;

                // Check if ALL occurrences are in `typeof X` or `export { X as ... }` patterns.
                // TypeScript resolves both from the augmented module without needing a local import.
                const hasNonTypeofUsage = allOccurrences.some((m) => {
                    const before = block.slice(Math.max(0, m.index - 30), m.index);
                    // Check typeof pattern: "typeof X"
                    if (before.match(/typeof\s+$/)) return false;
                    // Check export re-export pattern: "export { X" or ", X" inside export {}
                    if (before.match(/export\s*\{\s*$/) || before.match(/,\s*$/)) {
                        // Could be inside `export { X as Y }` — check if we're inside braces
                        const lineStart = block.lastIndexOf("\n", m.index);
                        const line = block.slice(lineStart, m.index + local.length + 20);
                        if (/export\s*\{/.test(line)) return false;
                    }
                    return true;
                });

                if (hasNonTypeofUsage) {
                    isNeeded = true;
                    break;
                }
            }
            if (isNeeded) {
                usedNames.push({ local, original });
            }
        }
        if (usedNames.length > 0) {
            // Rebuild the import with only used names
            const nameStr = usedNames.map((n) => (n.original !== n.local ? `${n.original} as ${n.local}` : n.local)).join(", ");
            const newLine = `import type { ${nameStr} } from "${imp.fromPath}";`;
            filteredTypeImports.push({ ...imp, line: newLine, names: usedNames });
        }
    }
    // Convert all to type-only imports for the .types.ts file
    const typeImportLines = filteredTypeImports.map(toTypeImport).join("\n");

    // Rewrite self-referencing `declare module "./foo"` → `declare module "./foo.pure"`
    // to break circular dependency through the thin .ts wrapper and allow
    // typeof references to resolve directly from the .pure module's exports.
    let finalDeclareText = declareText;
    // Build patterns for self-referencing module paths
    const selfModulePatterns = [
        `./${base}`, // e.g., "./mesh"
    ];
    for (const selfPath of selfModulePatterns) {
        const escapedPath = selfPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        finalDeclareText = finalDeclareText.replace(new RegExp(`(declare\\s+module\\s+")${escapedPath}("\\s*\\{)`, "g"), `$1./${pureBase}$2`);
    }

    // If no type imports found, we still need the file to be a module
    // (otherwise `declare module "relative/path"` fails with TS2436).
    // An `export {}` at the top ensures module semantics.
    const moduleGuard = typeImportLines ? "" : "export {};\n\n";
    const typesContent = moduleGuard + (typeImportLines ? typeImportLines + "\n\n" : "") + finalDeclareText + "\n";

    // ── 2. Build side-effect registration function ──────────────────────────
    const sideEffectText = regions.sideEffects.join("\n").trim();

    // ── 3. Update .pure.ts ──────────────────────────────────────────────────
    const pureExists = existsSync(purePath);
    let pureContent = pureExists ? readFileSync(purePath, "utf-8") : "";
    const pureIsEmpty = !pureExists || pureContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "").trim() === "export {};";

    if (hasSideEffects) {
        const indentedSideEffects = sideEffectText
            .split("\n")
            .map((line) => (line.trim() ? "    " + line : ""))
            .join("\n");

        const registrationFn = `
let _registered = false;

/**
 * Register side effects for ${base}.
 * Safe to call multiple times; only the first call has an effect.
 */
export function ${fnName}(): void {
    if (_registered) {
        return;
    }
    _registered = true;

${indentedSideEffects}
}`.trim();

        if (pureIsEmpty) {
            // ── Empty .pure.ts: build from scratch ──
            // Need all imports that side-effect code references
            const neededImports = findReferencedImports(sideEffectText, regions.imports);
            const valueNames = findValueUsages(sideEffectText);

            // Group needed imports by fromPath, merging names and avoiding self-references
            const importsByPath = new Map();
            for (const imp of neededImports) {
                if (!imp.fromPath) continue;
                const resolvedFrom = imp.fromPath.replace(/^\.\//, "");
                if (resolvedFrom === pureBase || resolvedFrom === base) continue;

                for (const { local, original } of imp.names) {
                    if (!new RegExp(`\\b${local}\\b`).test(sideEffectText)) continue;
                    if (!importsByPath.has(imp.fromPath)) importsByPath.set(imp.fromPath, []);
                    const needsValue = valueNames.has(local);
                    importsByPath.get(imp.fromPath).push({ local, original, needsValue, isTypeOnly: imp.isTypeOnly });
                }
            }

            const importLines = buildMergedImportLines(importsByPath);

            // Preserve existing re-export lines from the original .pure.ts
            const existingReExports = [];
            if (pureContent) {
                for (const line of pureContent.split("\n")) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith("export * from ") || (trimmed.startsWith("export {") && trimmed.includes("from "))) {
                        // Don't duplicate the types re-export we're about to add
                        if (!trimmed.includes(typesBase)) {
                            existingReExports.push(line.trim());
                        }
                    }
                }
            }

            pureContent = `export * from "./${typesBase}";\n`;
            if (existingReExports.length > 0) {
                pureContent += existingReExports.join("\n") + "\n";
            }
            if (importLines.length > 0) {
                pureContent += "\n" + importLines.join("\n") + "\n";
            }
            pureContent += "\n" + registrationFn + "\n";
        } else {
            // ── Non-empty .pure.ts: append registration function ──

            // 1. Add types re-export if missing
            if (!pureContent.includes(`./${typesBase}`)) {
                const headerEnd = pureContent.indexOf("*/");
                if (headerEnd >= 0) {
                    const insertPos = pureContent.indexOf("\n", headerEnd) + 1;
                    pureContent = pureContent.slice(0, insertPos) + `\nexport * from "./${typesBase}";\n` + pureContent.slice(insertPos);
                } else {
                    pureContent = `export * from "./${typesBase}";\n\n` + pureContent;
                }
            }

            // 2. Find imports needed by side-effect code
            const neededImports = findReferencedImports(sideEffectText, regions.imports);
            const pureExportedNames = getExportedNames(pureContent);
            const pureImports = parsePureImports(pureContent);
            const valueNames = findValueUsages(sideEffectText);

            // Collect individual names to add, grouped by fromPath.
            // Each entry: { local, original, fromPath, needsValue }
            const namesToAdd = new Map(); // fromPath → [{ local, original, needsValue }]

            for (const imp of neededImports) {
                for (const { local, original } of imp.names) {
                    if (!new RegExp(`\\b${local}\\b`).test(sideEffectText)) continue;

                    // Check if already exported from .pure.ts
                    if (pureExportedNames.has(local)) continue;

                    // Check if already imported in .pure.ts
                    const existingImp = pureImports.find((pi) => pi.names.some((n) => n.local === local));

                    if (existingImp) {
                        // If side-effect code uses it as a value but it's import type, upgrade
                        if (existingImp.isTypeOnly && valueNames.has(local)) {
                            pureContent = pureContent.replace(existingImp.line, existingImp.line.replace(/^(\s*)import\s+type\s+/, "$1import "));
                        }
                        continue;
                    }

                    // Need to add this import name
                    if (!imp.fromPath) continue;

                    // Skip self-referencing imports (importing from the file itself)
                    const resolvedFrom = imp.fromPath.replace(/^\.\//, "");
                    if (resolvedFrom === pureBase || resolvedFrom === base) continue;

                    if (!namesToAdd.has(imp.fromPath)) namesToAdd.set(imp.fromPath, []);
                    const needsValue = valueNames.has(local);
                    namesToAdd.get(imp.fromPath).push({ local, original, needsValue, isTypeOnly: imp.isTypeOnly });
                }
            }

            // Build merged import lines per fromPath (splitting type/value)
            const newImportLines = buildMergedImportLines(namesToAdd);

            if (newImportLines.length > 0) {
                // Insert after the last import in .pure.ts
                const lastImportIdx = pureContent.lastIndexOf("\nimport ");
                if (lastImportIdx >= 0) {
                    const lineEnd = pureContent.indexOf("\n", lastImportIdx + 1);
                    pureContent = pureContent.slice(0, lineEnd + 1) + newImportLines.join("\n") + "\n" + pureContent.slice(lineEnd + 1);
                } else {
                    // No existing imports — add after the types re-export
                    const reExportEnd = pureContent.indexOf(";\n") + 2;
                    pureContent = pureContent.slice(0, reExportEnd) + newImportLines.join("\n") + "\n" + pureContent.slice(reExportEnd);
                }
            }

            // 3. Append the registration function at the end
            pureContent = pureContent.trimEnd() + "\n\n" + registrationFn + "\n";
        }
    } else {
        // No side effects — just add types re-export to .pure.ts
        if (pureIsEmpty) {
            pureContent = `export * from "./${typesBase}";\n`;
        } else if (!pureContent.includes(`./${typesBase}`)) {
            const headerEnd = pureContent.indexOf("*/");
            if (headerEnd >= 0) {
                const insertPos = pureContent.indexOf("\n", headerEnd) + 1;
                pureContent = pureContent.slice(0, insertPos) + `\nexport * from "./${typesBase}";\n` + pureContent.slice(insertPos);
            } else {
                pureContent = `export * from "./${typesBase}";\n\n` + pureContent;
            }
        }
    }

    // ── 4. Build thinned .ts wrapper ────────────────────────────────────────
    let newTsContent = `export * from "./${pureBase}";\n`;
    if (hasSideEffects) {
        newTsContent += `\nimport { ${fnName} } from "./${pureBase}";\n${fnName}();\n`;
    }

    // ── Report / Write ──
    console.log(`  ${DRY_RUN ? "[DRY] " : ""}${relPath}`);
    console.log(`    → ${typesBase}.ts (${regions.declareModules.length} declare module block(s))`);
    console.log(`    → ${pureBase}.ts (${fnName}(), ${regions.sideEffects.length} side-effect lines)`);
    console.log(`    → ${base}.ts (thin wrapper)`);

    if (!DRY_RUN) {
        writeFileSync(typesPath, typesContent, "utf-8");
        writeFileSync(purePath, pureContent, "utf-8");
        writeFileSync(absPath, newTsContent, "utf-8");
    }

    return { skipped: false, fnName, typesPath, purePath, absPath };
}

// ─── Entry point ────────────────────────────────────────────────────────────

const candidates = SINGLE_FILE ? [SINGLE_FILE] : findCandidates();
console.log(`Phase 9: Processing ${candidates.length} files with declare module blocks`);
if (DRY_RUN) console.log("  (dry run — no files will be written)\n");
else console.log("");

let processed = 0;
let skipped = 0;

for (const relPath of candidates) {
    try {
        const result = processFile(relPath);
        if (result.skipped) {
            skipped++;
        } else {
            processed++;
        }
    } catch (err) {
        console.error(`  ERROR processing ${relPath}: ${err.message}`);
        skipped++;
    }
}

console.log(`\nDone: ${processed} processed, ${skipped} skipped`);
