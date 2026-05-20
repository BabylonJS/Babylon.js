#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * splitRemainingFiles.mjs
 *
 * Splits files that have bare-import, declare-module, prototype-assignment,
 * or static-property-assignment side effects (but NOT RegisterClass or shader-store-write)
 * into .pure.ts + .ts wrapper pairs.
 *
 * This handles the gap between splitRegisterClass.mjs (Phase 2) and the Phase 9
 * wrap scripts which require .pure.ts to already exist.
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, basename, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { readSideEffectsManifest } from "../sideEffectsManifest.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "../../..");
const SRC = join(REPO_ROOT, "packages/dev/core/src");
const MANIFEST_PATH = join(REPO_ROOT, "scripts/treeshaking/side-effects-manifest/core");

const PURE_HEADER = "/** This file must only contain pure code and pure imports */\n\n";
const BARE_RE = /^import\s+["']([^"']+)["']\s*;?\s*$/;

const DRY_RUN = process.argv.includes("--dry-run");
const VERBOSE = process.argv.includes("--verbose");

const manifest = readSideEffectsManifest(MANIFEST_PATH);

let created = 0;
let skipped = 0;
const writtenFiles = [];

const TARGET_TYPES = new Set(["bare-import", "declare-module", "prototype-assignment", "static-property-assignment"]);

for (const entry of manifest.manifest) {
    if (entry.sideEffects.length === 0) continue;

    const types = new Set(entry.sideEffects.map((s) => s.type));

    // Only process files whose ALL side effects are in our target set
    const isTarget = [...types].every((t) => TARGET_TYPES.has(t));
    if (!isTarget) continue;

    const filePath = join(SRC, entry.file);
    const purePath = filePath.replace(/\.ts$/, ".pure.ts");

    if (existsSync(purePath)) {
        if (VERBOSE) console.log(`  SKIP (already has .pure.ts): ${entry.file}`);
        skipped++;
        continue;
    }

    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    // Separate bare imports from the rest
    const bareImports = [];
    const pureLines = [];
    for (const line of lines) {
        if (BARE_RE.test(line.trim())) {
            bareImports.push(line);
        } else {
            pureLines.push(line);
        }
    }

    // Check if pure content has any meaningful exports
    const pureContent = pureLines.join("\n").trim();
    if (!pureContent || (!pureContent.includes("export") && !pureContent.includes("class ") && !pureContent.includes("function "))) {
        if (VERBOSE) console.log(`  SKIP (no meaningful pure content): ${entry.file}`);
        skipped++;
        continue;
    }

    if (DRY_RUN) {
        console.log(`  WOULD SPLIT: ${entry.file} (${bareImports.length} bare imports, types: ${[...types].join(",")})`);
        created++;
        continue;
    }

    // Write .pure.ts
    writeFileSync(purePath, PURE_HEADER + pureContent + "\n", "utf-8");
    writtenFiles.push(purePath);

    // Write wrapper .ts
    const pureModule = "./" + basename(entry.file).replace(/\.ts$/, ".pure");
    const wrapperLines = [`export * from "${pureModule}";`, ""];
    for (const bi of bareImports) {
        wrapperLines.push(bi.trim());
    }
    wrapperLines.push("");
    writeFileSync(filePath, wrapperLines.join("\n"), "utf-8");
    writtenFiles.push(filePath);

    created++;
    console.log(`  SPLIT: ${entry.file} (${bareImports.length} bare imports, types: ${[...types].join(",")})`);
}

console.log(`\n--- Summary ---`);
console.log(`Created:  ${created}`);
console.log(`Skipped:  ${skipped}`);

if (writtenFiles.length > 0 && !DRY_RUN) {
    console.log(`\nFormatting ${writtenFiles.length} files with Prettier...`);
    try {
        execSync(`npx prettier --write ${writtenFiles.map((f) => `"${f}"`).join(" ")}`, {
            cwd: REPO_ROOT,
            stdio: "pipe",
        });
        console.log(`Formatted ${writtenFiles.length} files.`);
    } catch (e) {
        console.warn("Prettier formatting failed (non-fatal):", e.message.split("\n")[0]);
    }
}
