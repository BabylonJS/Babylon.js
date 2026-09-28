#!/usr/bin/env node
/**
 * Lint only source and test files changed in the current branch.
 *
 * Usage:
 *   node scripts/lint-changed.mjs [--fix] [--base <ref>]
 *   node scripts/lint-changed.mjs --staged <file...>
 *
 * Options:
 *   --fix          Apply ESLint auto-fixes
 *   --base <ref>   Compare against a different base ref (default: origin/master)
 *   --staged       Lint the file list supplied by lint-staged
 */
import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isLintFile, LintFiles } from "./lint-globs.mjs";
import { completeChildProcess, resolveLocalBin, runEslint } from "./lint.mjs";

const PluginBuildInputPattern = /^packages\/tools\/eslintBabylonPlugin\/(?:package\.json|tsconfig[^/]*\.json|src\/[\s\S]+\.(?:ts|tsx))$/;
const SharedLintScriptPattern = /^scripts\/lint(?:-changed|-globs)?\.mjs$/;
const FullLintFiles = new Set(["eslint.config.mjs", "lint-staged.config.mjs", "package-lock.json", "scripts/format.mjs"]);

function isPluginBuildInput(file) {
    return file === "tsconfig.build.json" || PluginBuildInputPattern.test(file);
}

export function parseArguments(argumentsToParse) {
    let baseRef = "origin/master";
    let fix = false;
    let baseSeen = false;

    for (let index = 0; index < argumentsToParse.length; index++) {
        const argument = argumentsToParse[index];
        if (argument === "--fix") {
            if (fix) {
                throw new Error("--fix may only be specified once.");
            }
            fix = true;
        } else if (argument === "--base") {
            if (baseSeen) {
                throw new Error("--base may only be specified once.");
            }
            const value = argumentsToParse[++index];
            if (!value || value.startsWith("--")) {
                throw new Error("--base requires a ref.");
            }
            baseRef = value;
            baseSeen = true;
        } else {
            throw new Error(`Unknown argument: ${argument}`);
        }
    }

    return { baseRef, fix };
}

export function splitNullDelimited(output) {
    if (!output) {
        return [];
    }
    return output.split("\0").filter(Boolean);
}

export function requiresFullLint(file) {
    const basename = path.posix.basename(file);
    return (
        FullLintFiles.has(file) ||
        basename === "package.json" ||
        basename === "tsdoc.json" ||
        /^tsconfig.*\.json$/.test(basename) ||
        SharedLintScriptPattern.test(file) ||
        isPluginBuildInput(file) ||
        file === "scripts/treeshaking/side-effects-manifest.json" ||
        file.startsWith("scripts/treeshaking/side-effects-manifest/")
    );
}

export function runChangedLint(argumentsToParse, options = {}) {
    const { baseRef, fix } = parseArguments(argumentsToParse);
    const cwd = options.cwd ?? process.cwd();
    const exec = options.execFileSyncImpl ?? execFileSync;
    let mergeBase;

    try {
        mergeBase = exec("git", ["merge-base", "--", "HEAD", baseRef], { cwd, encoding: "utf8" }).trim();
    } catch {
        throw new Error(`Could not determine merge-base with ${baseRef}. Are you on a branch?`);
    }

    const allDiffOutput = exec("git", ["diff", "--no-renames", "--name-only", "-z", mergeBase, "--"], { cwd, encoding: "utf8" });
    const existingDiffOutput = exec("git", ["diff", "--no-renames", "--name-only", "--diff-filter=ACMRTUXB", "-z", mergeBase, "--"], { cwd, encoding: "utf8" });
    const untrackedOutput = exec("git", ["ls-files", "--others", "--exclude-standard", "-z"], { cwd, encoding: "utf8" });
    const untrackedFiles = splitNullDelimited(untrackedOutput);
    const allChangedFiles = [...new Set([...splitNullDelimited(allDiffOutput), ...untrackedFiles])];
    const existingChangedFiles = [...new Set([...splitNullDelimited(existingDiffOutput), ...untrackedFiles])];
    return lintChanges(allChangedFiles, existingChangedFiles, fix, options);
}

export function runStagedLint(fileNames, options = {}) {
    if (fileNames.length === 0 || fileNames.some((file) => file.startsWith("--"))) {
        throw new Error("--staged requires file paths and does not accept other options.");
    }
    const cwd = options.cwd ?? process.cwd();
    const files = [...new Set(fileNames.map((file) => path.relative(cwd, path.resolve(cwd, file)).split(path.sep).join("/")))];
    return lintChanges(files, files, false, options);
}

function lintChanges(allChangedFiles, existingChangedFiles, fix, options) {
    const cwd = options.cwd ?? process.cwd();
    const spawn = options.spawnSyncImpl ?? spawnSync;
    const log = options.log ?? console.log;
    const pluginBuildInputChanged = allChangedFiles.some(isPluginBuildInput);
    const fullLint = allChangedFiles.some(requiresFullLint);

    if (pluginBuildInputChanged) {
        log("ESLint plugin build inputs changed; rebuilding the local plugin.");
        const typescriptPath = options.typescriptPath ?? resolveLocalBin("typescript", "bin/tsc");
        const buildResult = spawn(process.execPath, [typescriptPath, "-b", "packages/tools/eslintBabylonPlugin/tsconfig.build.json"], {
            cwd,
            stdio: "inherit",
        });
        if (buildResult.error || buildResult.signal || buildResult.status !== 0) {
            return buildResult;
        }
    }

    const files = fullLint ? LintFiles : existingChangedFiles.filter(isLintFile);
    if (files.length === 0) {
        log("No lintable files changed.");
        return { status: 0, signal: null };
    }

    const lintArguments = ["--quiet", "--no-warn-ignored", fullLint ? "--no-cache" : "--cache", ...(fix ? ["--fix"] : [])];
    if (fullLint) {
        log("Lint configuration changed; linting all source and test files without cache.");
    } else {
        log(`Linting ${files.length} changed file(s)…`);
    }
    return runEslint(files, lintArguments, {
        cwd,
        eslintPath: options.eslintPath,
        maxCommandLength: options.maxCommandLength,
        spawnSyncImpl: spawn,
    });
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
    try {
        const args = process.argv.slice(2);
        completeChildProcess(args[0] === "--staged" ? runStagedLint(args.slice(1)) : runChangedLint(args));
    } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    }
}
