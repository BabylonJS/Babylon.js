#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Post-compilation step: inject /*#__PURE__*‍/ annotations into .pure.js files.
 *
 * TypeScript preserves /*#__PURE__*‍/ for top-level const/let assignments, but
 * STRIPS them from static class field initializers (because tsc hoists the
 * assignment out of the class body and drops the comment).
 *
 * This script scans every .pure.js file in the compiled output and adds
 * /*#__PURE__*‍/ before call-expressions in top-level statements that don't
 * already have the annotation.
 *
 * Patterns matched:
 *
 * 1. Static field initializers (at column 0, hoisted by tsc):
 *   ClassName.field = new Ctor(...)
 *   ClassName.field = Ctor.Method(...)
 *   ClassName.field = FunctionName(...)
 *
 * NOTE: __decorate calls are intentionally NOT annotated. Property decorators
 * (e.g. @serialize()) emit __decorate([...], Proto, "prop", void 0) which
 * mutates the prototype (defining getters/setters). The return value is void 0
 * (unused), so /*#__PURE__*‍/ would tell Rollup to remove them — breaking
 * property access at runtime. File-level tree-shaking (via sideEffects:false
 * on pure barrels) is sufficient: if the class is unused, the whole .pure.js
 * file is excluded.
 *
 * Usage:
 *   node scripts/treeshaking/injectPureAnnotations.mjs [--dry-run] [--verbose] [--format]
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, relative, dirname } from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { globSync } from "glob";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const verbose = args.includes("--verbose");
const format = args.includes("--format");
const writtenFiles = [];

const __dirname = dirname(fileURLToPath(import.meta.url));

// Accept an optional positional argument for the directory to scan.
// Falls back to packages/dev/core/dist if not provided.
const positionalArgs = args.filter((a) => !a.startsWith("--"));
const distDir = positionalArgs.length > 0 ? resolve(positionalArgs[0]) : resolve(__dirname, "../../packages/dev/core/dist");

// Find all .pure.js files in dist/
const pureFiles = globSync("**/*.pure.js", { cwd: distDir, absolute: true });

if (pureFiles.length === 0) {
    console.error("No .pure.js files found in", distDir);
    console.error("Did you forget to run tsc first?");
    process.exit(1);
}

/**
 * Matches a top-level assignment whose RHS is a call expression that
 * doesn't already have a PURE annotation:
 *
 *   SomeClass.field = new Ctor(...)
 *   SomeClass.field = Ctor.Method(...)
 *   SomeClass.field = FunctionName(...)
 *
 * Capture groups:
 *   $1 = "SomeClass.field = "
 *   $2 = the call expression start ("new Ctor(" or "Ctor.Method(" etc.)
 *
 * Only matches lines that start at column 0 (^) to avoid touching code
 * inside function bodies.
 */
const STATIC_FIELD_RHS = /^(\w+\.\w+\s*=\s*)(?!\/\*#__PURE__\*\/\s*)(new\s+\w+|[A-Z]\w*\.\w+\(|[A-Z]\w*\()/gm;

let totalAnnotations = 0;
let totalFiles = 0;

for (const filePath of pureFiles) {
    const original = readFileSync(filePath, "utf-8");
    let patched = original;
    let fileAnnotations = 0;

    // 1. Annotate static field initializers with call expressions
    patched = patched.replace(STATIC_FIELD_RHS, (match, lhs, rhs) => {
        fileAnnotations++;
        return `${lhs}/*#__PURE__*/ ${rhs}`;
    });

    if (fileAnnotations > 0) {
        totalAnnotations += fileAnnotations;
        totalFiles++;
        const rel = relative(process.cwd(), filePath);

        if (verbose || dryRun) {
            console.log(`  ${dryRun ? "[dry-run] " : ""}${rel}: +${fileAnnotations} annotation(s)`);
        }

        if (!dryRun) {
            writeFileSync(filePath, patched, "utf-8");
            writtenFiles.push(filePath);
        }
    }
}

console.log(`\n${dryRun ? "[dry-run] " : ""}Injected ${totalAnnotations} /*#__PURE__*/ annotation(s) across ${totalFiles} file(s) (${pureFiles.length} .pure.js scanned).`);

// Optionally format all modified files with Prettier
if (format && !dryRun && writtenFiles.length > 0) {
    console.log(`\nFormatting ${writtenFiles.length} files with Prettier...`);
    try {
        const BATCH = 100;
        for (let i = 0; i < writtenFiles.length; i += BATCH) {
            const batch = writtenFiles.slice(i, i + BATCH);
            execSync(`npx prettier --write ${batch.map((f) => `"${f}"`).join(" ")}`, {
                stdio: "ignore",
            });
        }
        console.log(`Formatted ${writtenFiles.length} files.`);
    } catch (err) {
        console.error(`Warning: Prettier formatting failed: ${err.message}`);
    }
}
