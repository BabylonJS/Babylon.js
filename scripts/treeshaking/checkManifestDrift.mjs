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

import { execFileSync } from "child_process";
import { rmSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { readSideEffectsManifest } from "./sideEffectsManifest.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../..");
const COMMITTED_MANIFEST = resolve(__dirname, "side-effects-manifest/core");
const TMP_MANIFEST_ROOT = resolve(__dirname, ".tmp-manifest-check");
const TMP_MANIFEST = resolve(TMP_MANIFEST_ROOT, "core");
const MANIFEST_ANNOTATION_FILE = "scripts/treeshaking/side-effects-manifest/core/_root.json";
const IS_ADO = !!process.env.TF_BUILD;

function escapeAdo(value) {
    return String(value).replace(/%/g, "%AZP25").replace(/\r/g, "%0D").replace(/\n/g, "%0A").replace(/]/g, "%5D").replace(/;/g, "%3B");
}

function adoError(msg, sourcePath = MANIFEST_ANNOTATION_FILE) {
    if (IS_ADO) {
        console.log(`##vso[task.logissue type=error;sourcepath=${escapeAdo(sourcePath)};linenumber=1]${escapeAdo(msg)}`);
    }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
    console.log("Regenerating side-effects manifest...\n");

    // Run the audit script and write output to a temp file
    try {
        execFileSync(process.execPath, [resolve(__dirname, "auditSideEffects.mjs"), "--out", TMP_MANIFEST], { cwd: REPO_ROOT, stdio: ["pipe", "pipe", "pipe"] });
    } catch (err) {
        console.error("Failed to run auditSideEffects.mjs:");
        console.error(err.stderr?.toString() ?? err.message);
        process.exit(2);
    }

    // Read both manifests
    let committedManifest, regeneratedManifest;
    try {
        committedManifest = readSideEffectsManifest(COMMITTED_MANIFEST);
    } catch {
        const msg = `Committed manifest not found at ${COMMITTED_MANIFEST}. Run: npm run update:manifest`;
        console.error(msg);
        adoError(msg);
        process.exit(2);
    }

    try {
        regeneratedManifest = readSideEffectsManifest(TMP_MANIFEST);
    } catch {
        console.error("Failed to read regenerated manifest.");
        process.exit(2);
    }

    // Clean up temp file
    rmSync(TMP_MANIFEST_ROOT, { recursive: true, force: true });

    // Parse and compare (normalize to avoid whitespace/key-order noise)
    const committedNorm = JSON.stringify({ version: committedManifest.version, files: committedManifest.files }, null, 2);
    const regeneratedNorm = JSON.stringify({ version: regeneratedManifest.version, files: regeneratedManifest.files }, null, 2);

    if (committedNorm === regeneratedNorm) {
        console.log("✅ Manifest is up-to-date — no drift detected.\n");
        process.exit(0);
    }

    // Diff: report what changed
    console.error("❌ Manifest drift detected!\n");
    adoError("Side-effects manifest drift detected. Run: npm run update:manifest");

    const cFiles = new Set(committedManifest.manifest.map((e) => e.file));
    const rFiles = new Set(regeneratedManifest.manifest.map((e) => e.file));

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
            "  git add scripts/treeshaking/side-effects-manifest/core packages/public/@babylonjs/core/package.json\n"
    );

    process.exit(1);
}

main();
