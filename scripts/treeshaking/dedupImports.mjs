#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * dedupImports.mjs
 *
 * Deduplicates imports in .pure.ts files.
 * When the same name is imported both as `import type { X }` and `import { X }` from the same path,
 * the type import is removed (the value import covers it).
 * When the exact same import line appears twice, duplicates are removed.
 */

import { readFileSync, writeFileSync, readdirSync } from "fs";
import { join, dirname, relative } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "../..");
const SRC_ROOT = join(REPO_ROOT, "packages/dev/core/src");

const DRY_RUN = process.argv.includes("--dry-run");

function walk(dir, results = []) {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
        const p = join(dir, e.name);
        if (e.isDirectory()) {
            walk(p, results);
        } else if (e.name.endsWith(".pure.ts")) {
            results.push(p);
        }
    }
    return results;
}

function parseImportLine(line) {
    const t = line.trim();

    // import type { A, B } from "path"
    const typeMatch = t.match(/^import\s+type\s+\{([^}]+)\}\s+from\s+["']([^"']+)["']\s*;?\s*$/);
    if (typeMatch) {
        const names = typeMatch[1].split(",").map((n) => n.trim()).filter(Boolean);
        return { kind: "type", names, fromPath: typeMatch[2], line: t };
    }

    // import { A, type B, C } from "path" — handle inline type qualifiers
    const valMatch = t.match(/^import\s+\{([^}]+)\}\s+from\s+["']([^"']+)["']\s*;?\s*$/);
    if (valMatch) {
        const rawNames = valMatch[1].split(",").map((n) => n.trim()).filter(Boolean);
        const valueNames = [];
        const inlineTypeNames = [];
        for (const n of rawNames) {
            if (n.startsWith("type ")) {
                inlineTypeNames.push(n.slice(5).trim());
            } else {
                valueNames.push(n);
            }
        }
        // If ALL names are inline type, treat as a type import
        if (valueNames.length === 0 && inlineTypeNames.length > 0) {
            return { kind: "type", names: inlineTypeNames, fromPath: valMatch[2], line: t };
        }
        // If mixed, return both sets
        return { kind: "value", names: valueNames, inlineTypeNames, fromPath: valMatch[2], line: t };
    }

    return null;
}

let fixedFiles = 0;
const modifiedFiles = [];

for (const filePath of walk(SRC_ROOT)) {
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    // Build a map of all imports: path → { typeNames: Set, valueNames: Set, typeLineIdxs: [], valueLineIdxs: [] }
    const importMap = new Map();
    const importLineIdxs = new Set();

    for (let i = 0; i < lines.length; i++) {
        const parsed = parseImportLine(lines[i]);
        if (!parsed) continue;

        if (!importMap.has(parsed.fromPath)) {
            importMap.set(parsed.fromPath, { typeNames: new Set(), valueNames: new Set(), typeLineIdxs: [], valueLineIdxs: [] });
        }
        const entry = importMap.get(parsed.fromPath);

        if (parsed.kind === "type") {
            for (const n of parsed.names) entry.typeNames.add(n);
            entry.typeLineIdxs.push(i);
        } else {
            for (const n of parsed.names) entry.valueNames.add(n);
            // Handle inline type names (import { type X, Y })
            if (parsed.inlineTypeNames) {
                for (const n of parsed.inlineTypeNames) entry.typeNames.add(n);
            }
            entry.valueLineIdxs.push(i);
        }
        importLineIdxs.add(i);
    }

    // Check for duplicates: type names that are also in value imports from same path
    let needsFix = false;
    const linesToRemove = new Set();
    const linesToRewrite = new Map(); // lineIdx → new line

    for (const [fromPath, entry] of importMap) {
        // If both type and value imports exist from same path
        if (entry.typeNames.size > 0 && entry.valueNames.size > 0) {
            // Names that are in both type and value → remove from type
            const overlap = new Set();
            for (const n of entry.typeNames) {
                if (entry.valueNames.has(n)) {
                    overlap.add(n);
                }
            }
            if (overlap.size > 0) {
                needsFix = true;
                // Remove overlapping names from type imports
                const remainingTypeNames = [...entry.typeNames].filter((n) => !overlap.has(n));
                // Mark all type import lines for removal/rewrite
                for (const idx of entry.typeLineIdxs) {
                    if (remainingTypeNames.length === 0) {
                        linesToRemove.add(idx);
                    } else {
                        // Rewrite with remaining names only
                        linesToRewrite.set(idx, `import type { ${remainingTypeNames.join(", ")} } from "${fromPath}";`);
                        remainingTypeNames.length = 0; // only emit once
                    }
                }
            }
        }

        // Also merge multiple value imports from same path
        if (entry.valueLineIdxs.length > 1) {
            needsFix = true;
            // Deduplicate: value names win over type names
            const allValueNames = [...entry.valueNames];
            const remainingInlineTypes = [...entry.typeNames].filter((n) => !entry.valueNames.has(n));
            const namesParts = [];
            for (const n of remainingInlineTypes) namesParts.push(`type ${n}`);
            for (const n of allValueNames) namesParts.push(n);
            // Keep first line, remove rest
            linesToRewrite.set(entry.valueLineIdxs[0], `import { ${namesParts.join(", ")} } from "${fromPath}";`);
            for (let i = 1; i < entry.valueLineIdxs.length; i++) {
                linesToRemove.add(entry.valueLineIdxs[i]);
            }
        }

        // Merge multiple type imports from same path
        if (entry.typeLineIdxs.length > 1 && !linesToRemove.has(entry.typeLineIdxs[0])) {
            needsFix = true;
            const remainingTypeNames = [...entry.typeNames].filter((n) => !entry.valueNames.has(n));
            if (remainingTypeNames.length === 0) {
                for (const idx of entry.typeLineIdxs) linesToRemove.add(idx);
            } else {
                linesToRewrite.set(entry.typeLineIdxs[0], `import type { ${remainingTypeNames.join(", ")} } from "${fromPath}";`);
                for (let i = 1; i < entry.typeLineIdxs.length; i++) {
                    linesToRemove.add(entry.typeLineIdxs[i]);
                }
            }
        }
    }

    if (!needsFix) continue;

    const newLines = [];
    for (let i = 0; i < lines.length; i++) {
        if (linesToRemove.has(i)) continue;
        if (linesToRewrite.has(i)) {
            newLines.push(linesToRewrite.get(i));
        } else {
            newLines.push(lines[i]);
        }
    }

    const newContent = newLines.join("\n");
    if (newContent !== content) {
        if (!DRY_RUN) {
            writeFileSync(filePath, newContent, "utf-8");
        }
        fixedFiles++;
        modifiedFiles.push(filePath);
        const rel = relative(SRC_ROOT, filePath);
        console.log(`  FIXED: ${rel} (${linesToRemove.size} lines removed, ${linesToRewrite.size} lines rewritten)`);
    }
}

console.log(`\n--- Summary ---`);
console.log(`Fixed: ${fixedFiles} files`);

if (modifiedFiles.length > 0 && !DRY_RUN) {
    console.log(`\nFormatting ${modifiedFiles.length} files with Prettier...`);
    try {
        // Format in batches to avoid command line length limits
        const batchSize = 50;
        for (let i = 0; i < modifiedFiles.length; i += batchSize) {
            const batch = modifiedFiles.slice(i, i + batchSize);
            execSync(`npx prettier --write ${batch.map((f) => `"${f}"`).join(" ")}`, {
                cwd: REPO_ROOT,
                stdio: "pipe",
            });
        }
        console.log(`Formatted ${modifiedFiles.length} files.`);
    } catch (e) {
        console.warn("Prettier formatting failed (non-fatal):", e.message.split("\n")[0]);
    }
}
