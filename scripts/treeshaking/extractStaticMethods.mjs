#!/usr/bin/env node
/**
 * extractStaticMethods.mjs
 *
 * Reads namespace augmentation specs from the original branch's .types.ts files,
 * then extracts corresponding static methods in the fresh branch's source files.
 *
 * Steps for each file:
 * 1. If no .pure.ts exists, split the file (move content → .pure.ts, create thin wrapper)
 * 2. Find static methods on the class
 * 3. Extract each to a standalone exported function ClassNameMethodName
 * 4. Create/update .types.ts with namespace augmentations
 * 5. Add/update register function with runtime assignments
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRESH_ROOT = path.resolve(__dirname, "../..");
const ORIGINAL_ROOT = path.resolve(FRESH_ROOT, "../experimentingWithTreeShaking");
const CORE_SRC = path.join(FRESH_ROOT, "packages/dev/core/src");
const DRY_RUN = process.argv.includes("--dry-run");

// ── 1. Collect namespace augmentation specs from the original branch ─────────

function parseNamespaceAugmentations(content) {
    const results = [];
    const lines = content.split("\n");
    let i = 0;

    while (i < lines.length) {
        // Match: declare module "./foo.pure" {
        const declareMatch = lines[i].match(/^\s*declare\s+module\s+"([^"]+)"\s*\{/);
        if (!declareMatch) {
            i++;
            continue;
        }

        const modulePath = declareMatch[1];
        i++;

        // Look for namespace blocks inside this declare module
        while (i < lines.length && !lines[i].match(/^}\s*$/)) {
            const nsMatch = lines[i].match(/^\s*namespace\s+(\w+)\s*\{/);
            if (!nsMatch) {
                i++;
                continue;
            }

            const className = nsMatch[1];
            const methods = [];
            i++;

            // Parse method mappings inside namespace
            while (i < lines.length && !lines[i].match(/^\s*\}\s*$/)) {
                // Pattern 1: export { StandaloneName as OriginalName };
                const reexportMatch = lines[i].match(/export\s+\{\s*(\w+)\s+as\s+(\w+)\s*\}/);
                if (reexportMatch) {
                    methods.push({ standaloneName: reexportMatch[1], originalName: reexportMatch[2] });
                }

                // Pattern 2: export let OriginalName: typeof StandaloneName;
                const letMatch = lines[i].match(/export\s+let\s+(\w+)\s*:\s*typeof\s+(\w+)/);
                if (letMatch) {
                    methods.push({ standaloneName: letMatch[2], originalName: letMatch[1] });
                }

                i++;
            }

            if (methods.length > 0) {
                results.push({ modulePath, className, methods });
            }
            i++; // skip closing }
        }
        i++; // skip closing }
    }

    return results;
}

// ── 2. Find and extract static methods from class definitions ────────────────

/**
 * Find a static method in source lines, including its JSDoc comment.
 * Returns { startLine, endLine, jsdocStart, signature, body, indent }
 */
function findStaticMethod(lines, className, methodName) {
    // Find the class
    let classStart = -1;
    let classEnd = -1;
    let braceDepth = 0;

    for (let i = 0; i < lines.length; i++) {
        if (classStart === -1) {
            // Match class declaration
            if (lines[i].match(new RegExp(`\\bclass\\s+${className}\\b`)) && lines[i].includes("{")) {
                classStart = i;
                braceDepth = 0;
                for (const ch of lines[i]) {
                    if (ch === "{") braceDepth++;
                    if (ch === "}") braceDepth--;
                }
                if (braceDepth === 0) {
                    classEnd = i;
                    break;
                }
                continue;
            }
        } else {
            for (const ch of lines[i]) {
                if (ch === "{") braceDepth++;
                if (ch === "}") braceDepth--;
            }
            if (braceDepth === 0) {
                classEnd = i;
                break;
            }
        }
    }

    if (classStart === -1 || classEnd === -1) return null;

    // Find the static method within the class
    for (let i = classStart + 1; i < classEnd; i++) {
        // Match: public static MethodName( or static MethodName(
        const methodPattern = new RegExp(`\\bstatic\\s+${methodName}\\s*[<(]`);
        if (!methodPattern.test(lines[i])) continue;

        // Found the method signature line. Now find the JSDoc above it.
        let jsdocStart = i;
        let j = i - 1;
        // Skip blank lines and decorators
        while (j >= classStart + 1 && lines[j].trim() === "") j--;
        // Check for JSDoc
        if (j >= classStart + 1 && lines[j].trim().endsWith("*/")) {
            // Find start of JSDoc
            let k = j;
            while (k >= classStart + 1 && !lines[k].trim().startsWith("/**")) k--;
            if (k >= classStart + 1) {
                jsdocStart = k;
            }
        }

        // Find method end by counting braces
        let methodBraceDepth = 0;
        let methodEnd = -1;
        let foundOpenBrace = false;
        for (let k = i; k <= classEnd; k++) {
            for (const ch of lines[k]) {
                if (ch === "{") {
                    methodBraceDepth++;
                    foundOpenBrace = true;
                }
                if (ch === "}") methodBraceDepth--;
            }
            if (foundOpenBrace && methodBraceDepth === 0) {
                methodEnd = k;
                break;
            }
        }

        if (methodEnd === -1) continue;

        // Extract the method signature (removing public/static/protected)
        const sigLine = lines[i];
        const indent = sigLine.match(/^(\s*)/)[1];

        return {
            startLine: i,
            endLine: methodEnd,
            jsdocStart,
            classStart,
            classEnd,
            indent,
        };
    }

    return null;
}

/**
 * Extract a static method from a class and create a standalone function.
 * Returns the standalone function lines and the modified source lines.
 */
function extractMethod(lines, className, originalName, standaloneName) {
    const info = findStaticMethod(lines, className, originalName);
    if (!info) {
        console.warn(`  WARN: Could not find static ${className}.${originalName}`);
        return { standaloneLines: null, removeRange: null };
    }

    const { startLine, endLine, jsdocStart, indent } = info;

    // Extract JSDoc lines
    const jsdocLines = [];
    for (let i = jsdocStart; i < startLine; i++) {
        // Remove class-level indentation
        jsdocLines.push(lines[i].replace(indent, ""));
    }

    // Extract signature line
    let sigLine = lines[startLine];
    // Remove the class-level indentation
    sigLine = sigLine.replace(indent, "");
    // Remove access modifier and static keyword
    sigLine = sigLine.replace(/^\s*(public\s+|private\s+|protected\s+)?static\s+/, "");
    // Convert to standalone function: MethodName( → ClassNameMethodName(
    sigLine = sigLine.replace(new RegExp(`^${originalName}\\s*`), `${standaloneName}`);
    // Add export function prefix
    sigLine = `export function ${sigLine}`;

    // Extract body lines (everything between { and })
    const bodyLines = [];
    for (let i = startLine + 1; i < endLine; i++) {
        // Remove one level of indentation (class indent)
        let line = lines[i];
        if (line.startsWith(indent + "    ")) {
            line = line.substring(indent.length);
        } else if (line.startsWith(indent)) {
            line = line.substring(indent.length);
        }
        bodyLines.push(line);
    }

    // Build standalone function
    const standaloneLines = [...jsdocLines, sigLine, ...bodyLines, "}"];

    // Determine range to remove (including JSDoc and trailing blank line)
    let removeEnd = endLine;
    // Also remove trailing blank line
    if (removeEnd + 1 < lines.length && lines[removeEnd + 1].trim() === "") {
        removeEnd++;
    }

    return {
        standaloneLines,
        removeRange: { start: jsdocStart, end: removeEnd },
    };
}

// ── 3. Create .pure.ts if needed ─────────────────────────────────────────────

function ensurePureFile(basePath) {
    const purePath = basePath.replace(".ts", ".pure.ts");
    if (existsSync(purePath)) return purePath;

    // The file needs splitting
    const content = readFileSync(basePath, "utf8");
    const lines = content.split("\n");
    const baseName = path.basename(basePath, ".ts");

    // The .pure.ts gets all the content plus the pure header
    const pureLines = ["/** This file must only contain pure code and pure imports */", "", ...lines];

    // The .ts becomes a thin wrapper
    const wrapperLines = [`export * from "./${baseName}.pure";`];

    // Check for a register function name
    const className = findMainClassName(lines);
    if (className) {
        // Add a register function to .pure.ts
        const registerName = `register${className}`;
        pureLines.push("");
        pureLines.push("let _registered = false;");
        pureLines.push("");
        pureLines.push(`/**`);
        pureLines.push(` * Register side effects for ${baseName}.`);
        pureLines.push(` * Safe to call multiple times; only the first call has an effect.`);
        pureLines.push(` */`);
        pureLines.push(`export function ${registerName}(): void {`);
        pureLines.push(`    if (_registered) {`);
        pureLines.push(`        return;`);
        pureLines.push(`    }`);
        pureLines.push(`    _registered = true;`);
        pureLines.push("}");

        // Update thin wrapper
        wrapperLines.push(`import { ${registerName} } from "./${baseName}.pure";`);
        wrapperLines.push(`${registerName}();`);
    }

    if (DRY_RUN) {
        console.log(`  [DRY] Would create ${path.relative(FRESH_ROOT, purePath)}`);
    } else {
        writeFileSync(purePath, pureLines.join("\n") + "\n");
        writeFileSync(basePath, wrapperLines.join("\n") + "\n");
        console.log(`  Split: ${path.relative(FRESH_ROOT, basePath)} → .pure.ts + thin wrapper`);
    }

    return purePath;
}

function findMainClassName(lines) {
    for (const line of lines) {
        const m = line.match(/export\s+class\s+(\w+)/);
        if (m) return m[1];
    }
    return null;
}

// ── 4. Build types.ts content ────────────────────────────────────────────────

function buildTypesContent(augmentations, pureBaseName) {
    const lines = ["export {};", ""];

    for (const aug of augmentations) {
        lines.push(`declare module "${aug.modulePath}" {`);
        lines.push(`    namespace ${aug.className} {`);

        for (const m of aug.methods) {
            lines.push(`        export { ${m.standaloneName} as ${m.originalName} };`);
        }

        lines.push("    }");
        lines.push("}");
    }

    return lines.join("\n") + "\n";
}

// ── 5. Main processing ──────────────────────────────────────────────────────

// Find all .types.ts files with namespace augmentations in the original branch
const originalTypesFiles = execSync(`grep -rl "namespace.*{" "${path.join(ORIGINAL_ROOT, "packages/dev/core/src")}"/**/*.types.ts 2>/dev/null || true`, { encoding: "utf8" })
    .trim()
    .split("\n")
    .filter(Boolean);

console.log(`Found ${originalTypesFiles.length} files with namespace augmentations in original branch\n`);

let processed = 0;
let skipped = 0;

for (const origTypesFile of originalTypesFiles) {
    const relPath = path.relative(ORIGINAL_ROOT, origTypesFile);
    const typesContent = readFileSync(origTypesFile, "utf8");

    // Parse namespace augmentations
    const augmentations = parseNamespaceAugmentations(typesContent);
    if (augmentations.length === 0) {
        console.log(`  Skip (no namespace augmentations): ${relPath}`);
        skipped++;
        continue;
    }

    console.log(`Processing: ${relPath}`);

    // Determine the source file in the fresh branch
    // The .types.ts corresponds to a .pure.ts or .ts file
    const freshTypesPath = path.join(FRESH_ROOT, relPath);
    const baseName = relPath.replace(".types.ts", "");
    let freshSourcePath = path.join(FRESH_ROOT, baseName + ".pure.ts");

    if (!existsSync(freshSourcePath)) {
        freshSourcePath = path.join(FRESH_ROOT, baseName + ".ts");
        if (!existsSync(freshSourcePath)) {
            console.warn(`  WARN: Source file not found: ${baseName}.{pure,}.ts`);
            skipped++;
            continue;
        }
    }

    // Ensure .pure.ts exists
    const purePath = ensurePureFile(freshSourcePath.endsWith(".pure.ts") ? freshSourcePath.replace(".pure.ts", ".ts") : freshSourcePath);

    // Read the .pure.ts file
    let sourceContent = readFileSync(purePath, "utf8");
    let sourceLines = sourceContent.split("\n");

    // Track which methods were successfully extracted
    const extractedMethods = [];
    const standaloneBlocks = [];

    // Process each class's methods
    for (const aug of augmentations) {
        for (const method of aug.methods) {
            const result = extractMethod(sourceLines, aug.className, method.originalName, method.standaloneName);
            if (result.standaloneLines && result.removeRange) {
                extractedMethods.push({ aug, method });
                standaloneBlocks.push(result.standaloneLines);

                // Remove the static method from source lines
                const { start, end } = result.removeRange;
                sourceLines.splice(start, end - start + 1);

                // Re-read to account for removed lines
                // (subsequent methods in the same class need updated indices)
            }
        }
    }

    if (extractedMethods.length === 0) {
        console.log(`  No methods extracted (all missing from source)`);
        skipped++;
        continue;
    }

    // Check if the class body is now empty (only whitespace inside {})
    // If so, collapse to single-line empty class
    for (const aug of augmentations) {
        const classPattern = new RegExp(`(export\\s+class\\s+${aug.className}\\b[^{]*\\{)`);
        const classMatch = sourceLines.join("\n").match(classPattern);
        if (classMatch) {
            // Find class start and end
            let classStart = -1;
            let braceDepth = 0;
            for (let i = 0; i < sourceLines.length; i++) {
                if (classStart === -1 && sourceLines[i].match(new RegExp(`\\bclass\\s+${aug.className}\\b`))) {
                    classStart = i;
                }
                if (classStart !== -1 && i >= classStart) {
                    for (const ch of sourceLines[i]) {
                        if (ch === "{") braceDepth++;
                        if (ch === "}") braceDepth--;
                    }
                    if (braceDepth === 0) {
                        // Check if class body is empty (only whitespace/blank lines)
                        const bodyLines = sourceLines.slice(classStart + 1, i);
                        const isEmpty = bodyLines.every((l) => l.trim() === "");
                        if (isEmpty) {
                            // Find the class declaration line and make it single-line
                            const classLine = sourceLines[classStart].replace(/\{.*$/, "{}");
                            sourceLines.splice(classStart, i - classStart + 1, classLine);
                        }
                        break;
                    }
                }
            }
        }
    }

    // Add export * from types file to the WRAPPER .ts file (not .pure.ts)
    const typesBaseName = path.basename(purePath, ".pure.ts");
    const typesExport = `export * from "./${typesBaseName}.types";`;
    const wrapperPath = purePath.replace(".pure.ts", ".ts");
    if (existsSync(wrapperPath)) {
        const wrapperContent = readFileSync(wrapperPath, "utf8");
        if (!wrapperContent.includes(`${typesBaseName}.types`)) {
            const wrapperLines = wrapperContent.split("\n");
            let wIdx = 0;
            while (wIdx < wrapperLines.length && /^\s*(export\s+\*\s+from\s|import\s|\/\/)/.test(wrapperLines[wIdx])) wIdx++;
            while (wIdx > 0 && wrapperLines[wIdx - 1].trim() === "") wIdx--;
            wrapperLines.splice(wIdx, 0, typesExport);
            writeFileSync(wrapperPath, wrapperLines.join("\n"));
        }
    }

    // Add standalone functions after the class
    // Find a good insertion point (after the class or at the end of file before register function)
    let insertionPoint = sourceLines.length;
    // Look for register function
    for (let i = 0; i < sourceLines.length; i++) {
        if (sourceLines[i].match(/^let\s+_registered\s*=\s*false/)) {
            insertionPoint = i;
            break;
        }
    }

    // Insert standalone functions
    const newFunctionLines = [];
    for (const block of standaloneBlocks) {
        newFunctionLines.push("", ...block);
    }
    sourceLines.splice(insertionPoint, 0, ...newFunctionLines);

    // Add registration assignments
    // Find the register function and add assignments before the closing }
    let registerEndIdx = -1;
    for (let i = sourceLines.length - 1; i >= 0; i--) {
        if (sourceLines[i].match(/^export\s+function\s+register\w+\(\)/) || sourceLines[i].match(/^\s*export\s+function\s+register\w+\(\)/)) {
            // Find the end of this function
            let depth = 0;
            for (let j = i; j < sourceLines.length; j++) {
                for (const ch of sourceLines[j]) {
                    if (ch === "{") depth++;
                    if (ch === "}") depth--;
                }
                if (depth === 0) {
                    registerEndIdx = j;
                    break;
                }
            }
            break;
        }
    }

    if (registerEndIdx !== -1) {
        // Add assignments before the closing }
        const assignments = extractedMethods.map(({ aug, method }) => `    ${aug.className}.${method.originalName} = ${method.standaloneName};`);
        // Check which ones are already present
        const existingContent = sourceLines.join("\n");
        const newAssignments = assignments.filter((a) => !existingContent.includes(a.trim()));
        if (newAssignments.length > 0) {
            sourceLines.splice(registerEndIdx, 0, "", ...newAssignments);
        }
    }

    // Update internal callers: ClassName.MethodName( → ClassNameMethodName(
    // Only within the same file
    for (const { aug, method } of extractedMethods) {
        const callPattern = new RegExp(`\\b${aug.className}\\.${method.originalName}\\b`, "g");
        for (let i = 0; i < sourceLines.length; i++) {
            // Don't replace in the register function assignments or in string literals
            if (sourceLines[i].includes(`${aug.className}.${method.originalName} = ${method.standaloneName}`)) continue;
            if (sourceLines[i].includes("declare module")) continue;
            if (sourceLines[i].includes("namespace")) continue;
            sourceLines[i] = sourceLines[i].replace(callPattern, method.standaloneName);
        }
    }

    // Write the modified .pure.ts
    if (DRY_RUN) {
        console.log(`  [DRY] Would write ${path.relative(FRESH_ROOT, purePath)}`);
    } else {
        writeFileSync(purePath, sourceLines.join("\n"));
    }

    // Write the .types.ts file
    // Check if .types.ts already exists (from extractTypes.mjs)
    const freshTypesFilePath = purePath.replace(".pure.ts", ".types.ts");
    let typesLines = [];
    if (existsSync(freshTypesFilePath)) {
        // Read existing and append namespace augmentations
        typesLines = readFileSync(freshTypesFilePath, "utf8").split("\n");
        // Remove trailing empty lines
        while (typesLines.length > 0 && typesLines[typesLines.length - 1].trim() === "") {
            typesLines.pop();
        }
    } else {
        typesLines = ["export {};"];
    }

    // Add namespace augmentations
    for (const aug of augmentations) {
        typesLines.push("");

        // Use the module path from the original (which targets .pure)
        typesLines.push(`declare module "${aug.modulePath}" {`);
        typesLines.push(`    namespace ${aug.className} {`);

        for (const m of aug.methods) {
            typesLines.push(`        export { ${m.standaloneName} as ${m.originalName} };`);
        }

        typesLines.push("    }");
        typesLines.push("}");
    }

    if (DRY_RUN) {
        console.log(`  [DRY] Would write ${path.relative(FRESH_ROOT, freshTypesFilePath)}`);
    } else {
        writeFileSync(freshTypesFilePath, typesLines.join("\n") + "\n");
    }

    // Ensure the wrapper .ts file re-exports from .types.ts
    const wrapperContent2 = readFileSync(wrapperPath, "utf8");
    if (!wrapperContent2.includes(`from "./${typesBaseName}.types"`)) {
        console.warn(`  WARN: Missing types re-export in wrapper ${path.relative(FRESH_ROOT, wrapperPath)}`);
    }

    console.log(`  Extracted ${extractedMethods.length} methods: ${extractedMethods.map((m) => m.method.originalName).join(", ")}`);
    processed++;
}

console.log(`\nDone: ${processed} files processed, ${skipped} skipped`);
