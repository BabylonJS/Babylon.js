#!/usr/bin/env node
/**
 * createPureForAugmentTargets.mjs
 *
 * Creates .pure.ts files for modules that are targeted by `declare module`
 * augmentations but don't yet have .pure.ts counterparts.
 *
 * For each such file:
 *   1. Copies the content to foo.pure.ts
 *   2. Replaces foo.ts with a thin wrapper: `export * from "./foo.pure"; import { register… } …`
 *   3. Adds imports from .pure to the .pure.ts file's register function
 *
 * These files have no side effects in the manifest, so the split is mechanical:
 * - The .pure.ts gets all the code
 * - The .ts becomes `export * from "./foo.pure"`
 *
 * Usage: node scripts/treeshaking/migration/createPureForAugmentTargets.mjs
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { execSync, spawnSync } from "child_process";
import path from "path";

const ROOT = process.cwd();
const CORE_SRC = path.join(ROOT, "packages/dev/core/src");

// Find all declare module paths in .pure.ts files
const grepOut = execSync(`grep -rh "declare module \\"" ${CORE_SRC} --include="*.pure.ts"`, { encoding: "utf-8" });
const modPaths = [
    ...new Set(
        grepOut
            .split("\n")
            .filter(Boolean)
            .map((l) => l.match(/declare module "([^"]+)"/)?.[1])
            .filter(Boolean)
    ),
];

// Find which ones need .pure.ts files
const grepCache = {};
const needPure = [];

for (const modPath of modPaths) {
    if (!grepCache[modPath]) {
        const res = spawnSync("grep", ["-rl", `declare module "${modPath}"`, "--include=*.pure.ts", "-r", CORE_SRC], { encoding: "utf-8" });
        grepCache[modPath] = res.stdout.trim().split("\n").filter(Boolean);
    }
    const sample = grepCache[modPath][0];
    if (!sample) continue;
    const dir = path.dirname(sample);
    const purePath = path.resolve(dir, modPath + ".pure.ts");
    const basePath = path.resolve(dir, modPath + ".ts");
    if (!existsSync(purePath) && existsSync(basePath)) {
        needPure.push(basePath);
    }
}

const uniqueFiles = [...new Set(needPure)].sort();
console.log(`Found ${uniqueFiles.length} files that need .pure.ts counterparts:\n`);

for (const tsFile of uniqueFiles) {
    const rel = path.relative(ROOT, tsFile);
    const baseName = path.basename(tsFile, ".ts");
    const pureFile = tsFile.replace(/\.ts$/, ".pure.ts");
    const content = readFileSync(tsFile, "utf-8");

    // Check if the file has a register function already (from wrapRemainingEffects)
    const hasRegister = /export function register\w+\(\)/.test(content);

    // Check if file imports from .pure files (already in tree-shaking mode)
    const importsPure = /from\s+"[^"]*\.pure"/.test(content);

    // Rewrite imports in the content: change non-pure imports to .pure imports
    // for files that have .pure counterparts
    let pureContent = content;

    // Add the "pure code" header if not present
    if (!pureContent.startsWith("/** This file must only contain pure code")) {
        pureContent = `/** This file must only contain pure code and pure imports */\n\n${pureContent}`;
    }

    // Create the thin wrapper
    let wrapperLines = [`export * from "./${baseName}.pure";`];

    if (hasRegister) {
        // Find the register function name
        const regMatch = content.match(/export function (register\w+)\(\)/);
        if (regMatch) {
            wrapperLines.push("");
            wrapperLines.push(`import { ${regMatch[1]} } from "./${baseName}.pure";`);
            wrapperLines.push(`${regMatch[1]}();`);
        }
    }

    wrapperLines.push("");
    const wrapperContent = wrapperLines.join("\n");

    // Write the pure file
    writeFileSync(pureFile, pureContent);
    // Write the thin wrapper
    writeFileSync(tsFile, wrapperContent);

    console.log(`  ${rel} → split into .pure.ts + thin wrapper`);
}

console.log(`\nDone: ${uniqueFiles.length} files split`);
