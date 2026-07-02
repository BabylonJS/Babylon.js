#!/usr/bin/env node

import { readdir, readFile, stat, writeFile } from "fs/promises";
import { basename, join, resolve } from "path";
import ts from "typescript";

const targets = process.argv.slice(2);

if (targets.length === 0) {
    process.stderr.write("Usage: node scripts/downlevelNativeScripts.mjs <file-or-directory> [...]\n");
    process.exit(1);
}

// The TC39 decorator migration forces the Native UMD bundle to be emitted at an ES2015 target (the
// `accessor` keyword requires ES2015+, and esbuild cannot emit ES5 classes). Babylon Native's Chakra
// engine consumes ES5-level script, so the bundle must be down-leveled before it runs.
//
// We use the TypeScript transpiler (not Babel) for this. Babel's ES5 class transform emits
// `Reflect.construct`/`_wrapNativeSuper` machinery for classes that extend native built-ins (e.g.
// `Error`, `Array`); that machinery executes at class-definition time and hard-crashes Chakra when
// the bundle loads. TypeScript instead lowers classes with its `__extends` helper (plain prototype
// assignment, no `Reflect.construct`) - the exact emit Babylon Native ran successfully for years when
// the UMD bundles were built directly at an ES5 target. `ts.transpileModule` performs a purely
// syntactic, single-file transform (no type checking), so it does not choke on the multi-megabyte
// bundle, and it inlines self-contained helpers (no external `tslib`/`regeneratorRuntime` required).
const compilerOptions = {
    target: ts.ScriptTarget.ES5,
    // The bundles are UMD/IIFE scripts with no top-level module syntax; leave module output untouched.
    module: ts.ModuleKind.None,
    // Lower `for..of`, spread and other iterator protocols correctly for ES5.
    downlevelIteration: true,
    // Inline the emit helpers into each file so the bundle stays self-contained on Chakra.
    importHelpers: false,
    newLine: ts.NewLineKind.LineFeed,
    sourceMap: false,
    // The ES5/`module: none`/`downlevelIteration` combination emits TS 7.0 deprecation notices; they
    // are informational and do not affect the emitted output.
    ignoreDeprecations: "6.0",
};

function isNativeScriptFile(filePath) {
    return /^babylon.*\.js$/i.test(basename(filePath));
}

async function collectFiles(target) {
    const resolvedTarget = resolve(target);
    const targetStat = await stat(resolvedTarget);

    if (targetStat.isFile()) {
        return isNativeScriptFile(resolvedTarget) ? [resolvedTarget] : [];
    }

    if (!targetStat.isDirectory()) {
        return [];
    }

    const entries = await readdir(resolvedTarget, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const entryPath = join(resolvedTarget, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await collectFiles(entryPath)));
        } else if (entry.isFile() && isNativeScriptFile(entryPath)) {
            files.push(entryPath);
        }
    }

    return files;
}

const files = [...new Set((await Promise.all(targets.map(collectFiles))).flat())];

if (files.length === 0) {
    process.stdout.write("No Babylon Native scripts found to downlevel.\n");
    process.exit(0);
}

for (const file of files) {
    const code = await readFile(file, "utf8");
    const result = ts.transpileModule(code, { compilerOptions, fileName: file, reportDiagnostics: true });

    // `transpileModule` only surfaces syntactic and command-line/config diagnostics (it has no type
    // information). Command-line/config diagnostics (code >= 5000) are informational for our
    // transpile-only use; a real problem shows up as a syntactic error (code < 5000).
    const fatalDiagnostics = (result.diagnostics || []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error && diagnostic.code < 5000);
    if (fatalDiagnostics.length > 0) {
        const formatted = ts.formatDiagnostics(fatalDiagnostics, {
            getCanonicalFileName: (fileName) => fileName,
            getCurrentDirectory: () => process.cwd(),
            getNewLine: () => "\n",
        });
        throw new Error(`TypeScript reported errors while down-leveling ${file}:\n${formatted}`);
    }

    if (!result.outputText) {
        throw new Error(`TypeScript did not produce output for ${file}`);
    }

    await writeFile(file, result.outputText, "utf8");
    process.stdout.write(`Downleveled ${file}\n`);
}

process.stdout.write(`Downleveled ${files.length} Babylon Native script file(s).\n`);
