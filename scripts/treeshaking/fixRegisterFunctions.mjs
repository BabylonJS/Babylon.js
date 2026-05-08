#!/usr/bin/env node
/**
 * fixRegisterFunctions.mjs
 *
 * Renames `registerXxx()` → `RegisterXxx()` in .pure.ts files and their
 * thin-wrapper .ts callers, and adds JSDoc if missing.
 *
 * SAFETY: Only renames in .pure.ts files (function declarations),
 * their corresponding thin-wrapper .ts files (import + call),
 * and treeshaking scripts. Does NOT touch other files to avoid
 * renaming class methods like `registerAction()` on ActionManager.
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");
const CORE_SRC = path.join(ROOT, "packages/dev/core/src");
const SCRIPTS_DIR = path.join(ROOT, "scripts/treeshaking");

function findFiles(dir, ext) {
    const results = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...findFiles(fullPath, ext));
        } else if (entry.name.endsWith(ext)) {
            results.push(fullPath);
        }
    }
    return results;
}

const pureFiles = findFiles(CORE_SRC, ".pure.ts");
console.log(`Found ${pureFiles.length} .pure.ts files total`);

// Phase 1: Collect renames from .pure.ts export function declarations
const renameMap = new Map(); // oldName -> newName

for (const pureFile of pureFiles) {
    const content = readFileSync(pureFile, "utf8");
    const fnMatches = [...content.matchAll(/export function (register[A-Z]\w*)\s*\(/g)];
    for (const m of fnMatches) {
        const oldName = m[1];
        const newName = oldName.charAt(0).toUpperCase() + oldName.slice(1);
        if (oldName !== newName) {
            renameMap.set(oldName, newName);
        }
    }
}

console.log(`Found ${renameMap.size} unique register functions to rename\n`);

// Use a regex that also excludes `.` before the name to avoid renaming
// method calls like `obj.registerXxx()`
function makeRenameRegex(oldName) {
    return new RegExp(`(?<![a-zA-Z0-9_.])${oldName}(?![a-zA-Z0-9_])`, "g");
}

let filesChanged = 0;

// Phase 2: Rename in .pure.ts files
for (const pureFile of pureFiles) {
    let content = readFileSync(pureFile, "utf8");
    let changed = false;

    for (const [oldName, newName] of renameMap) {
        if (!content.includes(oldName)) continue;
        const newContent = content.replace(makeRenameRegex(oldName), newName);
        if (newContent !== content) {
            content = newContent;
            changed = true;
        }
    }

    // Also rename _registered -> _Registered
    if (content.includes("_registered")) {
        const newContent = content.replace(/\b_registered\b/g, "_Registered");
        if (newContent !== content) {
            content = newContent;
            changed = true;
        }
    }

    // Add JSDoc before Register functions missing it
    if (content.includes("export function Register")) {
        const lines = content.split("\n");
        const newLines = [];
        for (let i = 0; i < lines.length; i++) {
            const match = lines[i].match(/^export function (Register(\w+))\s*\(/);
            if (match) {
                let j = i - 1;
                while (j >= 0 && lines[j].trim() === "") j--;
                if (j >= 0 && lines[j].trim() === "*/") {
                    // Already has JSDoc
                    newLines.push(lines[i]);
                } else {
                    const moduleName = match[2];
                    const moduleNameLower = moduleName.charAt(0).toLowerCase() + moduleName.slice(1);
                    newLines.push(`/**`);
                    newLines.push(` * Register side effects for ${moduleNameLower}.`);
                    newLines.push(` * Safe to call multiple times; only the first call has an effect.`);
                    newLines.push(` */`);
                    newLines.push(lines[i]);
                    changed = true;
                }
            } else {
                newLines.push(lines[i]);
            }
        }
        if (changed || newLines.length !== lines.length) {
            content = newLines.join("\n");
        }
    }

    if (changed) {
        writeFileSync(pureFile, content);
        filesChanged++;
    }
}

console.log(`Phase 2 done: ${filesChanged} .pure.ts files changed`);

// Phase 3: Rename in corresponding thin-wrapper .ts files only
let wrappersChanged = 0;

for (const pureFile of pureFiles) {
    const dir = path.dirname(pureFile);
    const base = path.basename(pureFile, ".pure.ts");
    const wrapperFile = path.join(dir, base + ".ts");

    if (!existsSync(wrapperFile)) continue;

    let content = readFileSync(wrapperFile, "utf8");
    let changed = false;

    for (const [oldName, newName] of renameMap) {
        if (!content.includes(oldName)) continue;
        const newContent = content.replace(makeRenameRegex(oldName), newName);
        if (newContent !== content) {
            content = newContent;
            changed = true;
        }
    }

    if (changed) {
        writeFileSync(wrapperFile, content);
        wrappersChanged++;
    }
}

console.log(`Phase 3 done: ${wrappersChanged} wrapper .ts files changed`);

// Phase 4: Rename in treeshaking script files
let scriptsChanged = 0;
const scriptFiles = findFiles(SCRIPTS_DIR, ".mjs");

for (const scriptFile of scriptFiles) {
    // Don't process this script itself
    if (path.basename(scriptFile) === "fixRegisterFunctions.mjs") continue;

    let content = readFileSync(scriptFile, "utf8");
    let changed = false;

    for (const [oldName, newName] of renameMap) {
        if (!content.includes(oldName)) continue;
        const newContent = content.replace(makeRenameRegex(oldName), newName);
        if (newContent !== content) {
            content = newContent;
            changed = true;
        }
    }

    if (changed) {
        writeFileSync(scriptFile, content);
        scriptsChanged++;
    }
}

console.log(`Phase 4 done: ${scriptsChanged} script files changed`);
console.log(`\nTotal: renamed ${renameMap.size} functions across ${filesChanged + wrappersChanged + scriptsChanged} files`);

// Verify no lowercase register functions remain in .pure.ts
let remaining = 0;
for (const f of pureFiles) {
    const c = readFileSync(f, "utf8");
    const m = c.match(/export function register[A-Z]/g);
    if (m) remaining += m.length;
}
console.log(`Remaining lowercase register functions: ${remaining}`);
