#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { LintFiles } from "./lint-globs.mjs";

const require = createRequire(import.meta.url);
const MaxCommandLength = 24_000;

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

export function runFullLint(cliArguments = [], options = {}) {
    return runEslint(LintFiles, cliArguments, options);
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
