#!/usr/bin/env node

import { readdir, readFile, stat, writeFile } from "fs/promises";
import { basename, join, resolve } from "path";
import { fileURLToPath } from "url";
import ts from "typescript";

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

export function downlevelJavaScriptToEs5(code, fileName) {
    const result = ts.transpileModule(code, { compilerOptions, fileName, reportDiagnostics: true });

    // `transpileModule` only surfaces syntactic and command-line/config diagnostics (it has no type
    // information). Command-line/config diagnostics (code >= 5000) are informational for our
    // transpile-only use; a real problem shows up as a syntactic error (code < 5000).
    const fatalDiagnostics = (result.diagnostics || []).filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error && diagnostic.code < 5000);
    if (fatalDiagnostics.length > 0) {
        const formatted = ts.formatDiagnostics(fatalDiagnostics, {
            getCanonicalFileName: (diagnosticFileName) => diagnosticFileName,
            getCurrentDirectory: () => process.cwd(),
            getNewLine: () => "\n",
        });
        throw new Error(`TypeScript reported errors while down-leveling ${fileName}:\n${formatted}`);
    }

    if (!result.outputText) {
        throw new Error(`TypeScript did not produce output for ${fileName}`);
    }

    // The original source map describes the ES2015 bundle, not this transformed output.
    return result.outputText.replace(/\n?\/\/[#@]\s*sourceMappingURL=.*(?:\r?\n)?$/, "\n");
}

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

async function main(targets) {
    if (targets.length === 0) {
        process.stderr.write("Usage: node scripts/downlevelNativeScripts.mjs <file-or-directory> [...]\n");
        process.exitCode = 1;
        return;
    }

    const files = [...new Set((await Promise.all(targets.map(collectFiles))).flat())];

    if (files.length === 0) {
        process.stdout.write("No Babylon Native scripts found to downlevel.\n");
        return;
    }

    for (const file of files) {
        const code = await readFile(file, "utf8");
        await writeFile(file, downlevelJavaScriptToEs5(code, file), "utf8");
        process.stdout.write(`Downleveled ${file}\n`);
    }

    process.stdout.write(`Downleveled ${files.length} Babylon Native script file(s).\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    await main(process.argv.slice(2));
}
