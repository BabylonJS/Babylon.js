#!/usr/bin/env node
/**
 * computeKHRInteractivityAffected.mjs
 *
 * Inline gate for the KHR_interactivity conformance CI job. Determines whether the current branch
 * touches anything the conformance suite exercises, so the (slow, single-worker) job can be skipped
 * on PRs that change unrelated code instead of running on every build.
 *
 * The gate is computed inline by this job rather than consuming the Build job's `AFFECTED_TAGS`
 * output, so the conformance job does not have to wait on Build (which would delay it ~14 min).
 *
 * Usage:
 *   node scripts/computeKHRInteractivityAffected.mjs
 *   echo "packages/dev/core/src/FlowGraph/foo.ts" | node scripts/computeKHRInteractivityAffected.mjs --stdin
 *
 * Output (stdout): "true" (run the suite) or "false" (skip it).
 * On any git error the gate fails open ("true"), so a conformance-affecting change is never skipped
 * because history was unavailable.
 */

import * as path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Prefixes/paths that feed the KHR_interactivity conformance suite. Anchored to the same globs
// referenced in the CI discussion (core/src/FlowGraph/** → the runtime, loaders/src/glTF/** → the
// importer and object-model mapping) plus the harness, runner, pinned-asset manifest, Playwright
// config, and this gate itself. A change under any of these re-runs the suite.
const RelevantPrefixes = ["packages/dev/core/src/FlowGraph/", "packages/dev/loaders/src/glTF/", "packages/dev/loaders/test/external/KHR_interactivity/"];
const RelevantExactFiles = [
    "scripts/runKHRInteractivityAssetTests.mjs",
    "scripts/khr-interactivity-assets.json",
    "scripts/computeKHRInteractivityAffected.mjs",
    "playwright.khr-interactivity.config.ts",
    "playwright.config.ts",
];

function isRelevant(file) {
    return RelevantPrefixes.some((prefix) => file.startsWith(prefix)) || RelevantExactFiles.includes(file);
}

function getChangedFiles() {
    if (process.argv.slice(2).includes("--stdin")) {
        const input = readFileSync(0, "utf8").trim();
        return input
            ? input
                  .split("\n")
                  .map((f) => f.trim())
                  .filter(Boolean)
            : [];
    }
    const mergeBase = execSync("git merge-base HEAD origin/master", { encoding: "utf8", cwd: ROOT }).trim();
    const diff = execSync(`git diff --name-only ${mergeBase} HEAD`, { encoding: "utf8", cwd: ROOT }).trim();
    return diff
        ? diff
              .split("\n")
              .map((f) => f.trim())
              .filter(Boolean)
        : [];
}

function main() {
    let changedFiles;
    try {
        changedFiles = getChangedFiles();
    } catch (err) {
        // Fail open: if history is unavailable (e.g. a shallow clone the caller could not deepen),
        // run the suite rather than risk skipping a conformance-affecting change.
        process.stderr.write(`[WARN] git diff failed, running conformance to be safe: ${err.message}\n`);
        process.stdout.write("true\n");
        return;
    }

    if (changedFiles.length === 0) {
        process.stderr.write("[INFO] No changed files detected — skipping conformance.\n");
        process.stdout.write("false\n");
        return;
    }

    const relevant = changedFiles.filter(isRelevant);
    if (relevant.length > 0) {
        process.stderr.write(`[INFO] KHR_interactivity-affecting changes (${relevant.length}): ${relevant.slice(0, 20).join(", ")}\n`);
        process.stdout.write("true\n");
    } else {
        process.stderr.write(`[INFO] No KHR_interactivity-affecting files changed (${changedFiles.length} files checked) — skipping conformance.\n`);
        process.stdout.write("false\n");
    }
}

main();
