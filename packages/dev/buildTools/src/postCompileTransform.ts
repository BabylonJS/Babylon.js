/* eslint-disable no-console */
import * as fs from "fs";
import * as path from "path";
import { transformPackageLocation } from "./pathTransform.js";
import { type BuildType } from "./packageMapping.js";
import { checkArgs } from "./utils.js";

/**
 * Regex patterns for matching import/export/require/dynamic-import specifiers in emitted JS and .d.ts files.
 * Each pattern captures the prefix (keyword + quotes) and the module specifier separately.
 */
const SPECIFIER_PATTERNS = [
    // import ... from "specifier"  /  export ... from "specifier"
    /((?:from|module)\s+)(["'])([^"']+)\2/g,
    // import "specifier"  (side-effect import, no bindings)
    /(import\s+)(["'])([^"']+)\2(\s*;)/g,
    // require("specifier")
    /(require\s*\(\s*)(["'])([^"']+)\2(\s*\))/g,
    // import("specifier")  (dynamic import)
    /(import\s*\(\s*)(["'])([^"']+)\2(\s*\))/g,
];

interface IPostCompileTransformOptions {
    outDir: string;
    buildType: BuildType;
    basePackage: string;
    appendJS?: boolean | string;
}

function CollectFiles(dir: string, extensions: string[]): string[] {
    const results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            // Skip node_modules
            if (entry.name === "node_modules") {
                continue;
            }
            results.push(...CollectFiles(fullPath, extensions));
        } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
            results.push(fullPath);
        }
    }
    return results;
}

/**
 * Walk all .js and .d.ts files in outDir, rewrite import specifiers using transformPackageLocation.
 * @param options - configuration for the transform, including buildType and basePackage for correct path resolution.
 */
function TransformFilesInDir(options: IPostCompileTransformOptions): void {
    const resolvedDir = path.resolve(options.outDir);
    if (!fs.existsSync(resolvedDir)) {
        console.error(`postCompileTransform: outDir does not exist: ${resolvedDir}`);
        process.exit(1);
    }

    const files = CollectFiles(resolvedDir, [".js", ".d.ts", ".d.mts"]);
    let totalTransformed = 0;

    for (const filePath of files) {
        const original = fs.readFileSync(filePath, "utf-8");
        let content = original;

        for (const pattern of SPECIFIER_PATTERNS) {
            // Reset lastIndex since we reuse the regex
            pattern.lastIndex = 0;
            content = content.replace(pattern, (...args: (string | number)[]) => {
                // The replace callback receives: (fullMatch, ...captureGroups, offset, fullString)
                // For the from/module pattern (3 groups): args[4] is the offset (number), not a suffix
                // For require/import() patterns (4 groups): args[4] is the closing paren capture group
                const prefix = args[1] as string;
                const quote = args[2] as string;
                const specifier = args[3] as string;
                // args.length === 6 means 3 capture groups (no suffix group); args.length === 7 means 4 capture groups
                const suffix = args.length === 7 ? (args[4] as string) : "";

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
                return args[0] as string; // full match unchanged
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
export function PostCompileTransformCommand(): void {
    const outDir = checkArgs(["--outDir", "-o"], false, true) as string;
    const buildType = checkArgs(["--buildType", "-bt"], false, true) as string;
    const basePackage = checkArgs(["--basePackage", "-bp"], false, true) as string;
    const appendJS = checkArgs(["--appendJS", "-ajs"], true) as boolean;

    if (!outDir || !buildType || !basePackage) {
        console.error("postCompileTransform: missing required args. Usage:");
        console.error("  build-tools -c transform-paths --outDir <dir> --buildType <es6|umd|lts|esm> --basePackage <package>");
        process.exit(1);
    }

    TransformFilesInDir({
        outDir,
        buildType: buildType as BuildType,
        basePackage,
        appendJS,
    });
}
