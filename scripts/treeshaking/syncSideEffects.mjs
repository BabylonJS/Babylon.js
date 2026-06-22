#!/usr/bin/env node
/* eslint-disable babylonjs/syntax */
/* eslint-disable no-console */
/**
 * Sync Side-Effects Manifest → package.json sideEffects field
 *
 * Reads the manifest produced by auditSideEffects.mjs and writes the
 * "sideEffects" array into @babylonjs/core package.json (the public package).
 *
 * NOTE: @dev/core is private and never consumed by external bundlers,
 * so its sideEffects field is left as-is (all files marked as side-effectful).
 *
 * Approach:
 *   1. For top-level directories where ALL .ts files have side effects
 *      (e.g. Shaders/, ShadersWGSL/), emit a single recursive glob:
 *      "Shaders/**".
 *
 *   2. For files outside those directories, use simple `*`/`**` globs where
 *      the generated glob matches side-effectful files and no side-effect-free
 *      sibling files:
 *      "Animations/*types.js".
 *
 *   3. For files that cannot be safely grouped with a portable glob, emit the
 *      explicit path:
 *      "Actions/action.js".
 *
 * Usage:
 *   node scripts/treeshaking/syncSideEffects.mjs [--dry-run] [--check] [--verbose]
 *
 * Options:
 *   --dry-run   Print the generated array but don't write to package.json
 *   --check     Validate package.json without writing
 *   --verbose   Print detailed information about glob/individual decisions
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, relative, resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { readSideEffectsManifest } from "./sideEffectsManifest.mjs";
import { getPackageConfig, resolvePackageFromArgv } from "./packageConfig.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_CONFIG = getPackageConfig(resolvePackageFromArgv());
const PUBLIC_PKG_NAME = `@babylonjs/${PACKAGE_CONFIG.package}`;
const REPO_ROOT = PACKAGE_CONFIG.repoRoot;
const CORE_SRC = PACKAGE_CONFIG.srcRoot;
const PUBLIC_PKG_JSON = PACKAGE_CONFIG.publicPkgJson;
const MANIFEST_PATH = PACKAGE_CONFIG.manifestDir;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * @param {string} filePath
 * @returns {string}
 */
function toPosixPath(filePath) {
    return filePath.split(/[/\\]+/).join("/");
}

/**
 * @param {string} filePath
 * @returns {string}
 */
function getTopDir(filePath) {
    const normalizedPath = toPosixPath(filePath);
    const slashIndex = normalizedPath.indexOf("/");
    return slashIndex === -1 ? normalizedPath : normalizedPath.substring(0, slashIndex);
}

/**
 * @param {string} filePath
 * @returns {string}
 */
function getDirectory(filePath) {
    const normalizedPath = toPosixPath(filePath);
    const slashIndex = normalizedPath.lastIndexOf("/");
    return slashIndex === -1 ? "" : normalizedPath.substring(0, slashIndex);
}

/**
 * @param {string} filePath
 * @returns {string}
 */
function getFileName(filePath) {
    const normalizedPath = toPosixPath(filePath);
    const slashIndex = normalizedPath.lastIndexOf("/");
    return slashIndex === -1 ? normalizedPath : normalizedPath.substring(slashIndex + 1);
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeRegExp(value) {
    return value.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

/**
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function compareStrings(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * @param {string} pattern
 * @returns {RegExp}
 */
function globToRegExp(pattern) {
    let source = "^";
    for (let index = 0; index < pattern.length; index++) {
        const char = pattern[index];
        if (char === "*") {
            if (pattern[index + 1] === "*") {
                source += ".*";
                index++;
            } else {
                source += "[^/]*";
            }
        } else {
            source += escapeRegExp(char);
        }
    }
    return new RegExp(`${source}$`);
}

/**
 * Generated shader .ts files are ignored by git and can survive locally after their .fx source is deleted.
 * Exclude those stale artifacts so local generated output cannot drift package metadata.
 * @param {string} filePath
 * @returns {boolean}
 */
function isStaleGeneratedShader(filePath) {
    const relPath = toPosixPath(relative(CORE_SRC, filePath));
    if (!relPath.startsWith("Shaders/") && !relPath.startsWith("ShadersWGSL/")) {
        return false;
    }

    const sourcePath = filePath.replace(/\.ts$/, "");
    return !statSyncNoThrow(`${sourcePath}.fx`)?.isFile() && !statSyncNoThrow(`${sourcePath}.wgsl`)?.isFile();
}

/**
 * @param {string} filePath
 * @returns {import("fs").Stats | undefined}
 */
function statSyncNoThrow(filePath) {
    try {
        return statSync(filePath);
    } catch {
        return undefined;
    }
}

/**
 * Recursively count all .ts files (excluding .d.ts, .test.ts, .spec.ts) per
 * top-level directory.
 * @returns {Record<string, number>}
 */
function countTsFilesByTopDir() {
    const counts = {};
    function walk(dir) {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const fullPath = join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts") && !entry.name.endsWith(".test.ts") && !entry.name.endsWith(".spec.ts")) {
                if (isStaleGeneratedShader(fullPath)) {
                    continue;
                }
                const topDir = getTopDir(relative(CORE_SRC, fullPath));
                counts[topDir] = (counts[topDir] || 0) + 1;
            }
        }
    }
    walk(CORE_SRC);
    return counts;
}

/**
 * @returns {string[]}
 */
function listPublicJsFilesFromSource() {
    const files = [];
    function walk(dir) {
        for (const entry of readdirSync(dir, { withFileTypes: true })) {
            const fullPath = join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts") && !entry.name.endsWith(".test.ts") && !entry.name.endsWith(".spec.ts")) {
                if (isStaleGeneratedShader(fullPath)) {
                    continue;
                }
                files.push(toPosixPath(relative(CORE_SRC, fullPath)).replace(/\.ts$/, ".js"));
            }
        }
    }
    walk(CORE_SRC);
    return files.sort(compareStrings);
}

/**
 * Update the "sideEffects" field in a package.json file.
 * @param {string} pkgPath
 * @param {string[]} sideEffects
 */
function updatePackageJson(pkgPath, sideEffects) {
    const raw = readFileSync(pkgPath, "utf-8");
    const pkg = JSON.parse(raw);
    pkg.sideEffects = sideEffects;
    // Preserve the 4-space indent used by Babylon.js
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 4) + "\n");
}

/**
 * @param {string} file
 * @returns {string[]}
 */
function createCandidatePatterns(file) {
    const directory = getDirectory(file);
    const fileName = getFileName(file);
    const prefix = directory ? `${directory}/` : "";
    const stem = fileName.replace(/\.js$/, "");
    const candidates = [];

    candidates.push(`**/${fileName}`);

    if (fileName.endsWith(".types.js")) {
        candidates.push("**/*types.js", `${prefix}*.types.js`, `${prefix}*types.js`);
    }

    if (fileName.endsWith("SceneComponent.js")) {
        candidates.push("**/*SceneComponent.js");
    }

    if (fileName.endsWith("SceneComponent.types.js")) {
        candidates.push("**/*SceneComponent.types.js");
    }

    const dotIndex = stem.indexOf(".");
    if (dotIndex !== -1) {
        candidates.push(`${prefix}${stem.substring(0, dotIndex + 1)}*.js`);
    }

    for (const part of stem.split(/[._-]/)) {
        if (part.length >= 4) {
            candidates.push(`${prefix}*${part}*.js`, `${prefix}${part}*.js`, `${prefix}*${part}.js`);
        }
        if (part.length >= 8) {
            candidates.push(`**/*${part}*.js`, `**/${part}*.js`, `**/*${part}.js`);
        }
    }

    return [...new Set(candidates)].sort(compareStrings);
}

/**
 * @param {string[]} sideEffectFiles
 * @param {string[]} allFiles
 * @returns {{ pattern: string; files: string[] }[]}
 */
function createSafeGlobCandidates(sideEffectFiles, allFiles) {
    const sideEffectSet = new Set(sideEffectFiles);
    const candidates = new Map();

    for (const file of sideEffectFiles) {
        for (const pattern of createCandidatePatterns(file)) {
            if (candidates.has(pattern)) {
                continue;
            }

            const matcher = globToRegExp(pattern);
            const matchedFiles = allFiles.filter((candidate) => matcher.test(candidate));
            const matchedSideEffectFiles = matchedFiles.filter((candidate) => sideEffectSet.has(candidate));
            if (matchedSideEffectFiles.length > 1 && matchedFiles.length === matchedSideEffectFiles.length) {
                candidates.set(pattern, { pattern, files: matchedSideEffectFiles.sort(compareStrings) });
            }
        }
    }

    return [...candidates.values()].sort((a, b) => compareStrings(a.pattern, b.pattern));
}

/**
 * @param {string[]} files
 * @param {string[]} allFiles
 * @param {Set<string>} globDirs
 * @param {boolean} verbose
 * @returns {string[]}
 */
function createSideEffectsEntries(files, allFiles, globDirs, verbose) {
    const entries = [];

    // 0. All barrel index files are side-effectful (they re-export wrappers
    //    that call Register* functions, so bundlers must traverse them)
    entries.push("**/index.js");

    // 1. Glob patterns for fully side-effectful directories
    for (const dir of [...globDirs].sort(compareStrings)) {
        entries.push(`${dir}/**`);
    }

    const remainingFiles = [];
    for (const file of [...files].sort(compareStrings)) {
        const topDir = getTopDir(file);
        if (globDirs.has(topDir)) {
            continue;
        }

        const jsPath = file.replace(/\.ts$/, ".js");
        if (jsPath === "index.js" || jsPath.endsWith("/index.js")) {
            continue;
        }
        remainingFiles.push(jsPath);
    }

    const uncoveredFiles = new Set(remainingFiles);
    const candidateGlobs = createSafeGlobCandidates(
        remainingFiles,
        allFiles.filter((file) => !globDirs.has(getTopDir(file)))
    );
    const selectedGlobs = [];

    while (true) {
        let bestGlob;
        let bestCoveredFiles = [];
        for (const candidate of candidateGlobs) {
            const coveredFiles = candidate.files.filter((file) => uncoveredFiles.has(file));
            if (
                coveredFiles.length > 1 &&
                (!bestGlob ||
                    coveredFiles.length > bestCoveredFiles.length ||
                    (coveredFiles.length === bestCoveredFiles.length && candidate.pattern.length < bestGlob.pattern.length))
            ) {
                bestGlob = candidate;
                bestCoveredFiles = coveredFiles;
            }
        }

        if (!bestGlob) {
            break;
        }

        selectedGlobs.push(bestGlob.pattern);
        for (const file of bestCoveredFiles) {
            uncoveredFiles.delete(file);
        }
    }

    for (const pattern of selectedGlobs.sort(compareStrings)) {
        entries.push(pattern);
        if (verbose) {
            const matcher = globToRegExp(pattern);
            const matchedCount = remainingFiles.filter((file) => matcher.test(file)).length;
            console.log(`GLOB: ${pattern} (${matchedCount} files)`);
        }
    }

    for (const file of [...uncoveredFiles].sort(compareStrings)) {
        entries.push(file);
    }

    if (verbose) {
        console.log(`Portable glob patterns: ${selectedGlobs.length}`);
        console.log(`Individual files after grouping: ${uncoveredFiles.size}`);
    }

    return entries;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes("--dry-run");
    const check = args.includes("--check");
    const verbose = args.includes("--verbose");

    // Read manifest
    const manifest = readSideEffectsManifest(MANIFEST_PATH);
    const seFiles = manifest.manifest.map((r) => toPosixPath(r.file));

    // Count side-effectful files per top-level directory
    const seByTopDir = {};
    for (const file of seFiles) {
        const topDir = getTopDir(file);
        seByTopDir[topDir] = (seByTopDir[topDir] || 0) + 1;
    }

    // Count ALL .ts files per top-level directory
    const allByTopDir = countTsFilesByTopDir();
    const allFiles = listPublicJsFilesFromSource();

    // Determine which top-level directories can be covered by a glob
    // (ALL files in the directory have side effects AND directory has >1 file)
    const globDirs = new Set();
    for (const [dir, seCount] of Object.entries(seByTopDir)) {
        const totalCount = allByTopDir[dir] || 0;
        if (seCount === totalCount && totalCount > 1) {
            globDirs.add(dir);
            if (verbose) {
                console.log(`GLOB: ${dir}/** (${totalCount} files, all side-effectful)`);
            }
        }
    }

    const entries = createSideEffectsEntries(seFiles, allFiles, globDirs, verbose);

    if (verbose || dryRun) {
        console.log(`\nGlob patterns: ${globDirs.size}`);
        console.log(`Total sideEffects entries: ${entries.length}`);
    }

    if (dryRun) {
        console.log(`\n=== ${PUBLIC_PKG_NAME} sideEffects ===`);
        console.log(JSON.stringify(entries, null, 2));
        return;
    }

    if (check) {
        // Compare expected entries to what's currently in package.json
        const raw = readFileSync(PUBLIC_PKG_JSON, "utf-8");
        const pkg = JSON.parse(raw);
        const current = JSON.stringify(pkg.sideEffects ?? [], null, 2);
        const expected = JSON.stringify(entries, null, 2);
        if (current === expected) {
            console.log(`✅ ${PUBLIC_PKG_NAME} package.json sideEffects is up-to-date.\n`);
            process.exit(0);
        } else {
            console.error(`❌ ${PUBLIC_PKG_NAME} package.json sideEffects is out of date!`);
            console.error(`To fix: node scripts/treeshaking/syncSideEffects.mjs${PACKAGE_CONFIG.package === "core" ? "" : ` --package ${PACKAGE_CONFIG.package}`}\n`);
            if (process.env.TF_BUILD) {
                console.log(
                    `##vso[task.logissue type=error]${PUBLIC_PKG_NAME} package.json sideEffects is out of date. Run: node scripts/treeshaking/syncSideEffects.mjs${PACKAGE_CONFIG.package === "core" ? "" : ` --package ${PACKAGE_CONFIG.package}`}`
                );
            }
            process.exit(1);
        }
    }

    // Write to the public @babylonjs/<pkg> package.json only
    // (@dev/<pkg> is private and never consumed by external bundlers)
    updatePackageJson(PUBLIC_PKG_JSON, entries);
    console.log(`Updated ${PUBLIC_PKG_JSON} — ${entries.length} sideEffects entries`);
}

main();
