#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isLintFile, isLintSourceFile, SourceDirectoryGlob, TestDirectoryGlob } from "./lint-globs.mjs";

const require = createRequire(import.meta.url);
const MaxCommandLength = 24_000;
// Measured on the full monorepo: these limits keep every shard well below the default Node heap for roughly
// the single-process wall time. The core package alone exceeds the file limit and always runs by itself.
const MaxFilesPerShard = 400;
const MaxPackagesPerShard = 8;
const SkippedDirectories = new Set([".git", "dist", "node_modules"]);
// Mirrors the global `packages/public/**` ignore in eslint.config.mjs so ignored packages do not produce empty shards.
const SkippedPaths = new Set(["packages/public"]);
const GlobSyntaxPattern = /[*?[\]{}()\\]/;

export function resolveLocalBin(packageName, relativeBinPath) {
    return path.join(path.dirname(require.resolve(`${packageName}/package.json`)), relativeBinPath);
}

export function chunkFileArguments(files, fixedArguments = [], maxCommandLength = MaxCommandLength) {
    const chunks = [];
    let chunk = [];
    let length = fixedArguments.reduce((total, argument) => total + argument.length + 3, 0);

    for (const file of files) {
        const argumentLength = file.length + 3;
        if (chunk.length > 0 && length + argumentLength > maxCommandLength) {
            chunks.push(chunk);
            chunk = [];
            length = fixedArguments.reduce((total, argument) => total + argument.length + 3, 0);
        }
        chunk.push(file);
        length += argumentLength;
    }

    if (chunk.length > 0) {
        chunks.push(chunk);
    }
    return chunks;
}

export function runEslint(files, cliArguments = [], options = {}) {
    const eslintPath = options.eslintPath ?? resolveLocalBin("eslint", "bin/eslint.js");
    const spawn = options.spawnSyncImpl ?? spawnSync;
    const fixedArguments = [eslintPath, ...cliArguments, "--"];
    const chunks = chunkFileArguments(files, fixedArguments, options.maxCommandLength);
    let result = { status: 0, signal: null };

    for (const chunk of chunks) {
        result = spawn(process.execPath, [...fixedArguments, ...chunk], {
            cwd: options.cwd,
            stdio: "inherit",
        });
        if (result.error || result.signal || result.status !== 0) {
            return result;
        }
    }
    return result;
}

export function completeChildProcess(result, processObject = process) {
    if (result.error) {
        throw result.error;
    }
    if (result.signal) {
        processObject.kill(processObject.pid, result.signal);
        return;
    }
    processObject.exitCode = result.status ?? 1;
}

/**
 * Finds every file in the shared lint scopes. ESLint still applies its own ignores to the shard patterns;
 * skipping directories that ESLint always ignores only avoids walking them and launching empty shards.
 * @param {string} cwd Repository root.
 * @returns {string[]} Sorted repository-relative file paths.
 */
export function findLintFiles(cwd = process.cwd()) {
    const files = [];
    const pending = ["packages"];
    while (pending.length > 0) {
        const directory = pending.pop();
        let entries;
        try {
            entries = readdirSync(path.join(cwd, directory), { withFileTypes: true });
        } catch (error) {
            if (error.code === "ENOENT") {
                continue;
            }
            throw error;
        }
        for (const entry of entries) {
            const file = `${directory}/${entry.name}`;
            if (entry.isDirectory()) {
                if (!SkippedDirectories.has(entry.name) && !SkippedPaths.has(file)) {
                    pending.push(file);
                }
            } else if (entry.isFile() && isLintFile(file)) {
                files.push(file);
            }
        }
    }
    return files.sort();
}

/**
 * Groups lint files into per-package ESLint invocations. A package is the directory above a file's first
 * `src` or `test` segment; every glob emitted for a package only matches files owned by that package, so no
 * file is linted twice and the union of all shards equals the shared lint scopes. Small packages are batched
 * to amortize ESLint startup, bounded by both file and package counts because each package's tsconfig adds a
 * TypeScript program to the process.
 * @param {string[]} files Repository-relative lint files.
 * @param {{ maxFiles?: number, maxPackages?: number }} limits Batching limits per shard.
 * @returns {{ name: string, patterns: string[], fileCount: number }[]} Shards in a stable order.
 */
export function createLintShards(files, { maxFiles = MaxFilesPerShard, maxPackages = MaxPackagesPerShard } = {}) {
    const packages = new Map();
    for (const file of files) {
        const segments = file.split("/");
        const isSource = isLintSourceFile(file);
        const anchorIndex = segments.indexOf(isSource ? "src" : "test", 1);
        const ownerIndex = segments.findIndex((segment, index) => index > 0 && (segment === "src" || segment === "test"));
        const base = segments.slice(0, anchorIndex).join("/");
        if (GlobSyntaxPattern.test(base)) {
            throw new Error(`Cannot create a lint shard for "${base}" because the path contains glob syntax.`);
        }
        const name = segments.slice(0, ownerIndex).join("/");
        const lintPackage = packages.get(name) ?? { name, patterns: new Set(), fileCount: 0 };
        lintPackage.patterns.add(`${base}/${isSource ? SourceDirectoryGlob : TestDirectoryGlob}`);
        lintPackage.fileCount++;
        packages.set(name, lintPackage);
    }

    const shards = [];
    let shard;
    for (const lintPackage of [...packages.values()].sort((a, b) => (a.name < b.name ? -1 : 1))) {
        if (!shard || shard.fileCount + lintPackage.fileCount > maxFiles || shard.names.length >= maxPackages) {
            shard = { names: [], patterns: [], fileCount: 0 };
            shards.push(shard);
        }
        shard.names.push(lintPackage.name);
        shard.patterns.push(...lintPackage.patterns);
        shard.fileCount += lintPackage.fileCount;
    }
    return shards.map(({ names, patterns, fileCount }) => ({
        name: names.length === 1 ? names[0] : `${names[0]} … ${names[names.length - 1]} (${names.length} packages)`,
        patterns,
        fileCount,
    }));
}

/**
 * Lints the shared scopes one shard at a time. Type-aware rules keep a TypeScript program per tsconfig alive
 * for the lifetime of the ESLint process, so a single process over the whole monorepo exhausts the heap.
 * Lint failures in one shard do not stop the remaining shards; crashes and fatal ESLint errors do.
 * @param {string[]} cliArguments Arguments forwarded to every ESLint invocation.
 * @param {object} options Execution overrides.
 * @returns {{ status: number | null, signal: NodeJS.Signals | null, error?: Error }} The aggregated result.
 */
export function runFullLint(cliArguments = [], options = {}) {
    const cwd = options.cwd ?? process.cwd();
    const log = options.log ?? console.error;
    const shards = options.shards ?? createLintShards(findLintFiles(cwd));
    if (shards.length === 0) {
        log("No lintable files found.");
        return { status: 0, signal: null };
    }
    let status = 0;

    for (const [index, shard] of shards.entries()) {
        log(`Linting ${shard.name} [${index + 1}/${shards.length}, ${shard.fileCount} files]`);
        const result = runEslint(shard.patterns, ["--no-error-on-unmatched-pattern", ...cliArguments], { ...options, cwd });
        if (result.error || result.signal || (result.status !== 0 && result.status !== 1)) {
            return result;
        }
        status ||= result.status;
    }
    return { status, signal: null };
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
    try {
        completeChildProcess(runFullLint(process.argv.slice(2)));
    } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    }
}
