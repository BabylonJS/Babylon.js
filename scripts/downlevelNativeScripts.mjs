#!/usr/bin/env node

import { transformAsync } from "@babel/core";
import { readdir, readFile, stat, writeFile } from "fs/promises";
import { basename, join, resolve } from "path";

const targets = process.argv.slice(2);

if (targets.length === 0) {
    process.stderr.write("Usage: node scripts/downlevelNativeScripts.mjs <file-or-directory> [...]\n");
    process.exit(1);
}

const babelOptions = {
    babelrc: false,
    configFile: false,
    sourceMaps: false,
    compact: true,
    comments: false,
    sourceType: "script",
    assumptions: {
        constantSuper: true,
        noClassCalls: true,
        setClassMethods: true,
        setPublicClassFields: true,
        superIsCallableConstructor: true,
    },
    // The TC39 decorator migration forces the Native UMD bundle to be emitted at an ES2015 target
    // (the `accessor` keyword requires ES2015+). Babylon Native's Chakra engine consumes ES5-level
    // script, so transforming classes alone is not enough: arrow functions, let/const, template
    // literals, for-of, destructuring, default/rest params and async/generators all remain and abort
    // the engine. Run the full preset-env transform down to ES5. `forceAllTransforms` ignores any
    // browserslist target and lowers every ES2015+ construct, and Babel inlines a self-contained
    // regenerator runtime for async/generators (no external `regeneratorRuntime` global required).
    // `useBuiltIns: false` keeps library behavior untouched (Chakra already provides the ES2015
    // built-ins the previous ES5 TypeScript output relied on).
    presets: [
        [
            "@babel/preset-env",
            {
                bugfixes: true,
                modules: false,
                useBuiltIns: false,
                forceAllTransforms: true,
                ignoreBrowserslistConfig: true,
            },
        ],
    ],
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
    const result = await transformAsync(code, { ...babelOptions, filename: file });
    if (!result?.code) {
        throw new Error(`Babel did not produce output for ${file}`);
    }

    await writeFile(file, result.code, "utf8");
    process.stdout.write(`Downleveled ${file}\n`);
}

process.stdout.write(`Downleveled ${files.length} Babylon Native script file(s).\n`);
