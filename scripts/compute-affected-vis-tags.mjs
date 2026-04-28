#!/usr/bin/env node
/**
 * compute-affected-vis-tags.mjs
 *
 * Determines which visualization test tags are affected by the files changed
 * in the current branch compared to origin/master.
 *
 * Usage:
 *   node scripts/compute-affected-vis-tags.mjs
 *   echo "packages/dev/core/src/Materials/PBR/foo.ts" | node scripts/compute-affected-vis-tags.mjs --stdin
 *
 * Output (stdout): comma-separated tags, "ALL", or "NONE"
 *
 * Exit codes:
 *   0 — success
 *   1 — error
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TAGMAP_PATH = path.join(ROOT, "packages/tools/tests/test/visualization/tagMap.json");

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);
const USE_STDIN = args.includes("--stdin");

// ---------------------------------------------------------------------------
// Minimatch-like glob matching (supports **, *, and simple patterns)
// ---------------------------------------------------------------------------
function globToRegex(glob) {
    let regex = "^";
    let i = 0;
    while (i < glob.length) {
        const ch = glob[i];
        if (ch === "*" && glob[i + 1] === "*") {
            // ** matches any number of path segments
            regex += ".*";
            i += 2;
            if (glob[i] === "/") i++; // skip trailing slash
        } else if (ch === "*") {
            // * matches anything except /
            regex += "[^/]*";
            i++;
        } else if (ch === "?") {
            regex += "[^/]";
            i++;
        } else if (".+^${}()|[]\\".includes(ch)) {
            regex += "\\" + ch;
            i++;
        } else {
            regex += ch;
            i++;
        }
    }
    regex += "$";
    return new RegExp(regex);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
    // Load tag map
    const tagMap = JSON.parse(fs.readFileSync(TAGMAP_PATH, "utf8"));
    const runAllTags = new Set(tagMap.runAllTags);

    // Compile path mappings to regexes (most specific first — longer globs)
    const mappings = tagMap.pathMappings
        .map((m) => ({
            regex: globToRegex(m.glob),
            tags: m.tags,
            glob: m.glob,
        }))
        .sort((a, b) => b.glob.length - a.glob.length);

    // Get changed files
    let changedFiles;
    if (USE_STDIN) {
        const input = fs.readFileSync(0, "utf8").trim();
        changedFiles = input
            ? input
                  .split("\n")
                  .map((f) => f.trim())
                  .filter(Boolean)
            : [];
    } else {
        try {
            const mergeBase = execSync("git merge-base HEAD origin/master", { encoding: "utf8", cwd: ROOT }).trim();
            const diff = execSync(`git diff --name-only ${mergeBase} HEAD`, { encoding: "utf8", cwd: ROOT }).trim();
            changedFiles = diff
                ? diff
                      .split("\n")
                      .map((f) => f.trim())
                      .filter(Boolean)
                : [];
        } catch (err) {
            // If git commands fail (e.g., shallow clone), fall back to ALL
            process.stderr.write(`[WARN] git diff failed, falling back to ALL: ${err.message}\n`);
            process.stdout.write("ALL\n");
            return;
        }
    }

    if (changedFiles.length === 0) {
        process.stdout.write("NONE\n");
        return;
    }

    // Match changed files to tags
    const affectedTags = new Set();
    const unmatchedFiles = [];

    for (const file of changedFiles) {
        let matched = false;
        for (const mapping of mappings) {
            if (mapping.regex.test(file)) {
                for (const tag of mapping.tags) {
                    affectedTags.add(tag);
                }
                matched = true;
                // Don't break — file might match multiple mappings
            }
        }
        if (!matched) {
            unmatchedFiles.push(file);
        }
    }

    // Check for run-all condition
    for (const tag of affectedTags) {
        if (runAllTags.has(tag)) {
            process.stderr.write(`[INFO] Run-all tag "${tag}" affected — running ALL tests\n`);
            process.stdout.write("ALL\n");
            return;
        }
    }

    // If no tags matched at all, output NONE
    if (affectedTags.size === 0) {
        process.stderr.write(`[INFO] No visualization-relevant files changed (${changedFiles.length} files checked)\n`);
        if (unmatchedFiles.length > 0 && unmatchedFiles.length <= 20) {
            process.stderr.write(`[INFO] Unmatched files: ${unmatchedFiles.join(", ")}\n`);
        }
        process.stdout.write("NONE\n");
        return;
    }

    // Output affected tags
    const tagList = [...affectedTags].sort().join(",");
    process.stderr.write(`[INFO] Affected tags (${affectedTags.size}): ${tagList}\n`);
    if (unmatchedFiles.length > 0) {
        process.stderr.write(`[INFO] ${unmatchedFiles.length} changed files didn't match any tag mapping\n`);
    }
    process.stdout.write(tagList + "\n");
}

main();
