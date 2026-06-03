#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Unified Tree-Shaking Verification
 *
 * Runs all tree-shaking invariant checks in sequence:
 *   1. Manifest drift (side-effects-manifest/core/ matches source)
 *   2. Side-effect import closure (manifest-pure files do not add new imports from side-effectful files)
 *   3. Pure barrels (pure.ts files match what would be generated)
 *   4. Side-effect stubs (generated stub regions match what would be generated)
 *
 * Exits 0 if all pass, 1 if any fail.
 *
 * Usage:
 *   node scripts/treeshaking/verifyTreeShaking.mjs
 *
 * Intended to run in CI after the TypeScript build step.
 */

import { execFileSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../..");

const checks = [
    {
        name: "Manifest drift",
        script: resolve(__dirname, "checkManifestDrift.mjs"),
        args: [],
    },
    {
        name: "Side-effect import closure",
        script: resolve(__dirname, "checkSideEffectImportClosure.mjs"),
        args: [],
    },
    {
        name: "Pure barrels",
        script: resolve(__dirname, "generatePureBarrels.mjs"),
        args: ["--check"],
    },
    {
        name: "Side-effect stubs",
        script: resolve(__dirname, "generateSideEffectStubs.mjs"),
        args: ["--check"],
    },
];

let failures = 0;

console.log("═══ Tree-Shaking Verification ═══\n");

for (const { name, script, args } of checks) {
    process.stdout.write(`  ${name}... `);
    try {
        execFileSync(process.execPath, [script, ...args], { cwd: REPO_ROOT, stdio: ["pipe", "pipe", "pipe"] });
        console.log("✅");
    } catch (err) {
        console.log("❌");
        const stderr = err.stderr?.toString().trim();
        const stdout = err.stdout?.toString().trim();
        if (stderr) {
            for (const line of stderr.split("\n").slice(0, 10)) {
                console.error(`    ${line}`);
            }
        } else if (stdout) {
            for (const line of stdout.split("\n").slice(-10)) {
                console.error(`    ${line}`);
            }
        }
        failures++;
    }
}

console.log("");

if (failures > 0) {
    console.error(`❌ ${failures}/${checks.length} check(s) failed.\n`);
    process.exit(1);
} else {
    console.log(`✅ All ${checks.length} checks passed.\n`);
}
