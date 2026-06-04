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

import { spawnSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../..");
const IS_ADO = !!process.env.TF_BUILD;
const MAX_FAILURE_LINES = 80;

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

function escapeAdo(value) {
    return String(value).replace(/%/g, "%AZP25").replace(/\r/g, "%0D").replace(/\n/g, "%0A").replace(/]/g, "%5D").replace(/;/g, "%3B");
}

function adoError(message, sourcePath) {
    if (IS_ADO) {
        console.log(`##vso[task.logissue type=error;sourcepath=${escapeAdo(sourcePath)};linenumber=1]${escapeAdo(message)}`);
    }
}

function printFailureOutput(stdout, stderr) {
    const lines = [];
    if (stdout?.trim()) {
        lines.push(...stdout.trim().split("\n"));
    }
    if (stderr?.trim()) {
        lines.push(...stderr.trim().split("\n"));
    }

    for (const line of lines) {
        if (line.startsWith("##vso[")) {
            console.log(line);
        }
    }

    const displayLines = lines.filter((line) => !line.startsWith("##vso["));
    const selectedLines = displayLines.slice(-MAX_FAILURE_LINES);
    if (displayLines.length > selectedLines.length) {
        console.error(`    ... ${displayLines.length - selectedLines.length} earlier line(s) omitted`);
    }
    for (const line of selectedLines) {
        console.error(`    ${line}`);
    }
}

console.log("═══ Tree-Shaking Verification ═══\n");

for (const { name, script, args } of checks) {
    process.stdout.write(`  ${name}... `);
    const result = spawnSync(process.execPath, [script, ...args], { cwd: REPO_ROOT, encoding: "utf8" });
    if (result.status === 0) {
        console.log("✅");
    } else {
        console.log("❌");

        const stdout = result.stdout ?? "";
        const stderr = result.stderr ?? "";
        if (![stdout, stderr].some((output) => output.includes("##vso[task.logissue"))) {
            adoError(`${name} check failed. See log output for details.`, script);
        }
        printFailureOutput(stdout, stderr);

        if (result.error) {
            console.error(`    ${result.error.message}`);
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
