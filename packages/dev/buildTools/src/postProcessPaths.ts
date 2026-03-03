/* eslint-disable no-console */
import * as fs from "fs";
import * as path from "path";
import { globSync } from "glob";
import { transformPackageLocation } from "./pathTransform.js";
import type { BuildType } from "./packageMapping.js";
import { checkArgs } from "./utils.js";

/**
 * Options for the post-process paths operation.
 * These mirror the options previously passed to the ts-patch pathTransform plugin
 * via the "plugins" array in tsconfig.build.json files.
 */
export interface IPostProcessPathsOptions {
    /**
     * The build type. Can be "lts", "esm", "umd", "es6", or "namespace".
     * In all current tsconfig.build.json configs this is "es6".
     */
    buildType: BuildType;
    /**
     * The public package being built (e.g., "\@babylonjs/core", "\@babylonjs/gui").
     */
    basePackage: string;
    /**
     * Whether to append ".js" (or a specific extension string) to import paths.
     * When `true`, appends ".js". When a string, appends that string.
     * In all current tsconfig.build.json configs this is `true`.
     */
    appendJS?: boolean | string;
    /**
     * Only return the public package name, not the full sub-path.
     * Not used by tsconfig.build.json configs — only by webpack dev builds.
     */
    packageOnly?: boolean;
    /**
     * Keep dev package names instead of converting to public package names.
     * Not used by tsconfig.build.json configs — only by webpack dev builds.
     */
    keepDev?: boolean;
}

/**
 * Post-process compiled .js and .d.ts files to rewrite import/export paths.
 *
 * This replaces the ts-patch pathTransform plugin, applying the same
 * `transformPackageLocation` logic as a standalone step after `tsc` compilation.
 *
 * It handles all the same import/export patterns the AST-based transformer did:
 * - Static imports:  `import { X } from "path"`; `import "path"`
 * - Static exports:  `export { X } from "path"`; `export * from "path"`
 * - Dynamic imports: `import("path")`
 * - Import types:    `import("path").Type` (in .d.ts files)
 * - Module declarations: `declare module "path"`
 *
 * @param directory - The output directory containing compiled files
 * @param options - Transform options (same semantics as the ts-patch plugin config)
 * @param filePattern - Glob pattern relative to directory
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function postProcessPaths(directory: string, options: IPostProcessPathsOptions, filePattern?: string): void {
    const pattern = filePattern || "**/*.{js,d.ts}";
    const resolvedDir = path.resolve(directory);
    const files = globSync(pattern, {
        cwd: resolvedDir,
        absolute: true,
        windowsPathsNoEscape: true,
    });

    console.log(`Post-processing paths in ${resolvedDir} (${files.length} files, buildType: ${options.buildType}, basePackage: ${options.basePackage})`);

    let processedCount = 0;
    for (const filePath of files) {
        const content = fs.readFileSync(filePath, "utf-8");

        // Construct a synthetic sourceFilename prefixed with "src/" so that
        // transformPackageLocation can compute correct relative paths for
        // same-package imports (GetPathForComputed looks for "src" in the path).
        const relativeToDir = path.relative(resolvedDir, filePath).split(path.sep).join(path.posix.sep);
        const syntheticSourceFilename = "src/" + relativeToDir;

        const processed = rewriteImportPaths(content, options, syntheticSourceFilename);
        if (processed !== content) {
            fs.writeFileSync(filePath, processed);
            processedCount++;
        }
    }

    console.log(`Rewrote import paths in ${processedCount} of ${files.length} files.`);
}

/**
 * Rewrite import/export paths in a single file's content using `transformPackageLocation`.
 *
 * This is the pure, side-effect-free core of the post-processor. It can be used
 * independently for testing or for scenarios where you manage file I/O yourself.
 *
 * @param content - The file content to process
 * @param options - Transform options
 * @param sourceFilename - Synthetic source filename for relative path computation
 *   (should be prefixed with "src/" for correct same-package relative path resolution)
 * @returns The processed content with rewritten paths
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function rewriteImportPaths(content: string, options: IPostProcessPathsOptions, sourceFilename?: string): string {
    // Build the options object that transformPackageLocation expects.
    // ITransformerOptions requires packageOnly as boolean (not optional).
    const transformerOptions = {
        buildType: options.buildType,
        basePackage: options.basePackage,
        packageOnly: options.packageOnly ?? false,
        appendJS: options.appendJS,
        keepDev: options.keepDev,
    };

    const replacePath = (originalPath: string): string => {
        const transformed = transformPackageLocation(originalPath, transformerOptions, sourceFilename);
        return transformed ?? originalPath;
    };

    let result = content;

    // 1. Static imports/exports with `from`:
    //    import { X } from "path";
    //    import X from "path";
    //    import * as X from "path";
    //    export { X } from "path";
    //    export * from "path";
    result = result.replace(/(\bfrom\s+)(["'])([^"']+)\2/g, (_match, prefix: string, quote: string, importPath: string) => {
        const newPath = replacePath(importPath);
        return `${prefix}${quote}${newPath}${quote}`;
    });

    // 2. Dynamic imports (also covers import type in .d.ts):
    //    import("path")
    //    type X = import("path").Y
    result = result.replace(/(\bimport\s*\(\s*)(["'])([^"']+)\2(\s*\))/g, (_match, prefix: string, quote: string, importPath: string, suffix: string) => {
        const newPath = replacePath(importPath);
        return `${prefix}${quote}${newPath}${quote}${suffix}`;
    });

    // 3. Module declarations:
    //    declare module "path" { ... }
    result = result.replace(/(\bdeclare\s+module\s+)(["'])([^"']+)\2/g, (_match, prefix: string, quote: string, modulePath: string) => {
        const newPath = replacePath(modulePath);
        return `${prefix}${quote}${newPath}${quote}`;
    });

    // 4. Bare side-effect imports (no `from`, no parentheses):
    //    import "path";
    //    import "./sideEffect";
    // Uses \s+ (not \s*) after "import" to avoid matching import("path").
    // Does not match `import { X } from "path"` since `{` is not a quote char.
    // Does not match `import X from "path"` since `X` is not a quote char.
    result = result.replace(/(\bimport\s+)(["'])([^"']+)\2/g, (_match, prefix: string, quote: string, importPath: string) => {
        const newPath = replacePath(importPath);
        return `${prefix}${quote}${newPath}${quote}`;
    });

    return result;
}

/**
 * CLI command handler for the post-process-paths command.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function postProcessPathsCommand(): void {
    const directory = checkArgs(["--dir", "-d"], false, true) as string;
    const buildType = (checkArgs(["--build-type", "-bt"], false, true) as string) || "es6";
    const basePackage = checkArgs(["--base-package", "-bp"], false, true) as string;
    const appendJS = checkArgs("--append-js", true) as boolean;
    const packageOnly = checkArgs("--package-only", true) as boolean;
    const keepDev = checkArgs("--keep-dev", true) as boolean;
    const filePattern = checkArgs(["--pattern", "-p"], false, true) as string | undefined;

    if (!directory) {
        console.error("Error: --dir is required. Specify the output directory containing compiled files.");
        process.exit(1);
    }
    if (!basePackage) {
        console.error("Error: --base-package is required. Specify the public package name (e.g., @babylonjs/core).");
        process.exit(1);
    }

    postProcessPaths(
        directory,
        {
            buildType: buildType as BuildType,
            basePackage,
            appendJS: appendJS || undefined,
            packageOnly: packageOnly || undefined,
            keepDev: keepDev || undefined,
        },
        filePattern || undefined
    );
}
