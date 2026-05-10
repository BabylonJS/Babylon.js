#!/usr/bin/env node
/* eslint-disable babylonjs/syntax */
/* eslint-disable no-console */
/**
 * CI Manifest Drift Check
 *
 * Regenerates the side-effects manifest and compares it to the committed copy.
 * Exits with code 1 if they differ, indicating that either:
 *   - Someone modified source files without re-running the audit, or
 *   - The audit script's detection logic changed.
 *
 * Usage:
 *   node scripts/treeshaking/checkManifestDrift.mjs
 *
 * This should run in CI after the TypeScript build step.
 */

import { execSync } from "child_process";
import { readFileSync, rmSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../..");
const COMMITTED_MANIFEST = resolve(__dirname, "side-effects-manifest.json");
const TMP_MANIFEST = resolve(__dirname, ".tmp-manifest-check.json");

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
    console.log("Regenerating side-effects manifest...\n");

    // Run the audit script and write output to a temp file
    try {
        execSync(`node ${resolve(__dirname, "auditSideEffects.mjs")} --out ${TMP_MANIFEST}`, { cwd: REPO_ROOT, stdio: ["pipe", "pipe", "pipe"] });
    } catch (err) {
        console.error("Failed to run auditSideEffects.mjs:");
        console.error(err.stderr?.toString() ?? err.message);
        process.exit(2);
    }

    // Read both manifests
    let committed, regenerated;
    try {
        committed = readFileSync(COMMITTED_MANIFEST, "utf-8");
    } catch {
        console.error(`Committed manifest not found at ${COMMITTED_MANIFEST}.\n` + "Run: npm run update:manifest");
        process.exit(2);
    }

    try {
        regenerated = readFileSync(TMP_MANIFEST, "utf-8");
    } catch {
        console.error("Failed to read regenerated manifest.");
        process.exit(2);
    }

    // Clean up temp file
    rmSync(TMP_MANIFEST, { force: true });

    // Parse and compare (normalize to avoid whitespace/key-order noise)
    const committedObj = JSON.parse(committed);
    const regeneratedObj = JSON.parse(regenerated);

    const committedNorm = JSON.stringify(committedObj, null, 2);
    const regeneratedNorm = JSON.stringify(regeneratedObj, null, 2);

    if (committedNorm === regeneratedNorm) {
        console.log("✅ Manifest is up-to-date — no drift detected.\n");
        process.exit(0);
    }

    // Diff: report what changed
    console.error("❌ Manifest drift detected!\n");

    const cFiles = new Set(committedObj.manifest.map((e) => e.file));
    const rFiles = new Set(regeneratedObj.manifest.map((e) => e.file));

    const added = [...rFiles].filter((f) => !cFiles.has(f));
    const removed = [...cFiles].filter((f) => !rFiles.has(f));

    if (added.length > 0) {
        console.error(`  Files newly detected with side effects (${added.length}):`);
        for (const f of added.slice(0, 20)) {
            console.error(`    + ${f}`);
        }
        if (added.length > 20) {
            console.error(`    ... and ${added.length - 20} more`);
        }
    }

    if (removed.length > 0) {
        console.error(`\n  Files no longer detected with side effects (${removed.length}):`);
        for (const f of removed.slice(0, 20)) {
            console.error(`    - ${f}`);
        }
        if (removed.length > 20) {
            console.error(`    ... and ${removed.length - 20} more`);
        }
    }

    if (added.length === 0 && removed.length === 0) {
        // Same files but different side-effect details
        console.error("  Same set of files, but side-effect details differ.");
        console.error("  (e.g., line numbers or detected patterns changed)");
    }

    console.error(
        "\nTo fix: regenerate the manifest and commit it:\n" +
            "  npm run update:manifest\n" +
            "  node scripts/treeshaking/syncSideEffects.mjs\n" +
            "  git add scripts/treeshaking/side-effects-manifest.json packages/public/@babylonjs/core/package.json\n"
    );

    process.exit(1);
}

main();
