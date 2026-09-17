#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { FormatFiles } from "./lint-globs.mjs";
import { completeChildProcess, resolveLocalBin } from "./lint.mjs";

export function runFormat(cliArguments = [], options = {}) {
    const prettierPath = options.prettierPath ?? resolveLocalBin("prettier", "bin/prettier.cjs");
    const spawn = options.spawnSyncImpl ?? spawnSync;
    return spawn(process.execPath, [prettierPath, ...cliArguments, "--", ...FormatFiles], {
        cwd: options.cwd,
        stdio: "inherit",
    });
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
    try {
        completeChildProcess(runFormat(process.argv.slice(2)));
    } catch (error) {
        console.error(error instanceof Error ? error.message : error);
        process.exitCode = 1;
    }
}
