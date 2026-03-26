/* eslint-disable no-console */
import * as fs from "fs";
import * as path from "path";
import { transformPackageLocation } from "./pathTransform.js";
import type { BuildType } from "./packageMapping.js";
import { checkArgs } from "./utils.js";

/**
 * Regex patterns for matching import/export/require/dynamic-import specifiers in emitted JS and .d.ts files.
 * Each pattern captures the prefix (keyword + quotes) and the module specifier separately.
 */
const SPECIFIER_PATTERNS = [
    // import ... from "specifier"  /  export ... from "specifier"
    /((?:from|module)\s+)(["'])([^"']+)\2/g,
    // require("specifier")
    /(require\s*\(\s*)(["'])([^"']+)\2(\s*\))/g,
    // import("specifier")  (dynamic import)
    /(import\s*\(\s*)(["'])([^"']+)\2(\s*\))/g,
];

interface PostCompileTransformOptions {
    outDir: string;
    buildType: BuildType;
    basePackage: string;
    appendJS?: boolean | string;
}

function collectFiles(dir: string, extensions: string[]): string[] {
    const results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            // Skip node_modules
            if (entry.name === "node_modules") continue;
            results.push(...collectFiles(fullPath, extensions));
        } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
            results.push(fullPath);
        }
    }
    return results;
}

/**
 * Walk all .js and .d.ts files in outDir, rewrite import specifiers using transformPackageLocation.
 */
function transformFilesInDir(options: PostCompileTransformOptions): void {
    const resolvedDir = path.resolve(options.outDir);
    if (!fs.existsSync(resolvedDir)) {
        console.error(`postCompileTransform: outDir does not exist: ${resolvedDir}`);
        process.exit(1);
    }

    const files = collectFiles(resolvedDir, [".js", ".d.ts", ".d.mts"]);
    let totalTransformed = 0;

    for (const filePath of files) {
        const original = fs.readFileSync(filePath, "utf-8");
        let content = original;

        for (const pattern of SPECIFIER_PATTERNS) {
            // Reset lastIndex since we reuse the regex
            pattern.lastIndex = 0;
            content = content.replace(pattern, (...args: string[]) => {
                // For the from/module pattern: args[1]=prefix, args[2]=quote, args[3]=specifier
                // For require/import(): args[1]=prefix, args[2]=quote, args[3]=specifier, args[4]=suffix
                const prefix = args[1];
                const quote = args[2];
                const specifier = args[3];
                const suffix = args[4] || "";

                const transformed = transformPackageLocation(
                    specifier,
                    {
                        buildType: options.buildType,
                        basePackage: options.basePackage,
                        packageOnly: false,
                        appendJS: options.appendJS,
                    },
                    filePath
                );

                if (transformed && transformed !== specifier) {
                    return `${prefix}${quote}${transformed}${quote}${suffix}`;
                }
                return args[0]; // full match unchanged
            });
        }

        if (content !== original) {
            fs.writeFileSync(filePath, content, "utf-8");
            totalTransformed++;
        }
    }

    console.log(`postCompileTransform: processed ${files.length} files, transformed ${totalTransformed} in ${resolvedDir}`);
}

/**
 * CLI entry point for the post-compile path transform command.
 * Reads options from command-line args (--outDir, --buildType, --basePackage, --appendJS).
 */
export function postCompileTransformCommand(): void {
    const outDir = checkArgs(["--outDir", "-o"], false, true) as string;
    const buildType = checkArgs(["--buildType", "-bt"], false, true) as string;
    const basePackage = checkArgs(["--basePackage", "-bp"], false, true) as string;
    const appendJS = checkArgs(["--appendJS", "-ajs"], true) as boolean;

    if (!outDir || !buildType || !basePackage) {
        console.error("postCompileTransform: missing required args. Usage:");
        console.error("  build-tools -c transform-paths --outDir <dir> --buildType <es6|umd|lts|esm> --basePackage <package>");
        process.exit(1);
    }

    transformFilesInDir({
        outDir,
        buildType: buildType as BuildType,
        basePackage,
        appendJS,
    });
}
