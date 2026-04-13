#!/usr/bin/env node
/**
 * Lint only files changed in the current branch (compared to origin/master).
 *
 * Usage:
 *   node scripts/lint-changed.mjs [--fix] [--base <ref>]
 *
 * Options:
 *   --fix          Apply ESLint auto-fixes
 *   --base <ref>   Compare against a different base ref (default: origin/master)
 */
import { execFileSync, spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const fix = args.includes("--fix");
const baseIdx = args.indexOf("--base");
const baseRef = baseIdx !== -1 && args[baseIdx + 1] ? args[baseIdx + 1] : "origin/master";

const lintablePattern = /\.(ts|tsx|js)$/;

// Find the merge-base so we compare against the fork point, not the tip of master.
let mergeBase;
try {
    mergeBase = execFileSync("git", ["merge-base", "HEAD", baseRef], { encoding: "utf-8" }).trim();
} catch {
    console.error(`Could not determine merge-base with ${baseRef}. Are you on a branch?`);
    process.exit(1);
}

// List changed files (excluding deletions) relative to the merge-base.
const diffOutput = execFileSync("git", ["diff", "--name-only", "--diff-filter=d", mergeBase], { encoding: "utf-8" }).trim();

if (!diffOutput) {
    console.log("No changed files to lint.");
    process.exit(0);
}

const files = diffOutput
    .split("\n")
    .filter((f) => lintablePattern.test(f))
    .filter((f) => f.startsWith("packages/"));

if (files.length === 0) {
    console.log("No lintable files changed.");
    process.exit(0);
}

console.log(`Linting ${files.length} changed file(s)…`);

const eslintArgs = ["eslint", "--quiet", "--no-warn-ignored", "--cache", ...(fix ? ["--fix"] : []), "--", ...files];

const result = spawnSync("npx", eslintArgs, { stdio: "inherit" });
process.exit(result.status ?? 1);
