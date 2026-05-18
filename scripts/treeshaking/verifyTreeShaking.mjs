#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Unified Tree-Shaking Verification
 *
 * Runs all tree-shaking invariant checks in sequence:
 *   1. Manifest drift (side-effects-manifest.json matches source)
 *   2. Pure barrels (pure.ts files match what would be generated)
 *   3. Side-effect stubs (generated stub regions match what would be generated)
 *
 * Exits 0 if all pass, 1 if any fail.
 *
 * Usage:
 *   node scripts/treeshaking/verifyTreeShaking.mjs
 *
 * Intended to run in CI after the TypeScript build step.
 */

import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../..");

const checks = [
    {
        name: "Manifest drift",
        cmd: `node ${resolve(__dirname, "checkManifestDrift.mjs")}`,
    },
    {
        name: "Pure barrels",
        cmd: `node ${resolve(__dirname, "generatePureBarrels.mjs")} --check`,
    },
    {
        name: "Side-effect stubs",
        cmd: `node ${resolve(__dirname, "generateSideEffectStubs.mjs")} --check`,
    },
];

let failures = 0;

console.log("═══ Tree-Shaking Verification ═══\n");

for (const { name, cmd } of checks) {
    process.stdout.write(`  ${name}... `);
    try {
        execSync(cmd, { cwd: REPO_ROOT, stdio: ["pipe", "pipe", "pipe"] });
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
