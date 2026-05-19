#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * catalogStaticHelpers.mjs
 *
 * Analyzes priority classes in packages/dev/core/src/ and catalogs their static
 * methods vs. the free (module-level) functions available in *.functions.ts files.
 *
 * Outputs:
 *   - Per-class count of static methods / static properties
 *   - Per-functions-file count of exported free functions
 *   - A "coverage" percentage (how many statics have free-function equivalents)
 *
 * Usage:
 *   node scripts/treeshaking/catalogStaticHelpers.mjs [--verbose]
 */

import { readFileSync, readdirSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = resolve(__dirname, "../../packages/dev/core/src");

const VERBOSE = process.argv.includes("--verbose");

// ── Priority files to catalog ───────────────────────────────────────────────
const TARGETS = [
    {
        label: "Vector2 / Vector3 / Vector4 / Quaternion / Matrix",
        sourceFile: "Maths/math.vector.pure.ts",
        classes: ["Vector2", "Vector3", "Vector4", "Quaternion", "Matrix"],
        functionFiles: ["Maths/math.vector.functions.ts", "Maths/math.quaternion.functions.ts", "Maths/ThinMaths/thinMath.matrix.functions.ts"],
    },
    {
        label: "Color3 / Color4",
        sourceFile: "Maths/math.color.pure.ts",
        classes: ["Color3", "Color4"],
        functionFiles: ["Maths/math.color.functions.ts"],
    },
    {
        label: "Animation",
        sourceFile: "Animations/animation.ts",
        classes: ["Animation"],
        functionFiles: [],
    },
    {
        label: "Mesh",
        sourceFile: "Meshes/mesh.pure.ts",
        classes: ["Mesh"],
        functionFiles: [],
    },
];

// Use the .pure.ts version if it exists, otherwise the base file
function resolveSource(relPath) {
    const purePath = relPath.replace(/\.ts$/, ".pure.ts");
    try {
        readFileSync(resolve(SRC_ROOT, purePath), "utf8");
        return purePath;
    } catch {
        return relPath;
    }
}

// ── Parse static members from a class ───────────────────────────────────────
function parseStaticMembers(source, className) {
    const methods = [];
    const props = [];

    // Match class body
    const classRe = new RegExp(`^(export\\s+)?class\\s+${className}\\b[^{]*\\{`, "m");
    const classMatch = source.match(classRe);
    if (!classMatch) return { methods, props };

    const startIdx = classMatch.index + classMatch[0].length;
    let depth = 1;
    let i = startIdx;
    while (i < source.length && depth > 0) {
        if (source[i] === "{") depth++;
        else if (source[i] === "}") depth--;
        i++;
    }
    const classBody = source.substring(startIdx, i - 1);

    // Find all static members
    // Pattern: public static NAME or static NAME
    const staticRe = /(?:public\s+)?static\s+(?:readonly\s+)?(\w+)\s*[<(:=;]/g;
    let m;
    while ((m = staticRe.exec(classBody)) !== null) {
        const name = m[0];
        const memberName = m[1];
        // Skip internal/private
        if (memberName.startsWith("_")) continue;

        // Determine if method (has `(`) or property (has `:` or `=`)
        const charAfterName = name.slice(name.indexOf(memberName) + memberName.length).trim()[0];
        if (charAfterName === "(" || charAfterName === "<") {
            methods.push(memberName);
        } else {
            props.push(memberName);
        }
    }

    // Deduplicate (overloads)
    return {
        methods: [...new Set(methods)],
        props: [...new Set(props)],
    };
}

// ── Parse exported functions from a functions file ──────────────────────────
function parseExportedFunctions(filePath) {
    let source;
    try {
        source = readFileSync(filePath, "utf8");
    } catch {
        return [];
    }
    const funcs = [];
    const re = /export\s+function\s+(\w+)/g;
    let m;
    while ((m = re.exec(source)) !== null) {
        funcs.push(m[1]);
    }
    return funcs;
}

// ── Main ────────────────────────────────────────────────────────────────────
function main() {
    console.log("\n=== Static Helpers Catalog ===\n");

    let totalStaticMethods = 0;
    let totalStaticProps = 0;
    let totalFreeFunctions = 0;

    for (const target of TARGETS) {
        const srcPath = resolveSource(target.sourceFile);
        let source;
        try {
            source = readFileSync(resolve(SRC_ROOT, srcPath), "utf8");
        } catch {
            console.log(`  [SKIP] ${srcPath} not found\n`);
            continue;
        }

        console.log(`─── ${target.label} (${srcPath}) ───`);

        for (const cls of target.classes) {
            const { methods, props } = parseStaticMembers(source, cls);
            totalStaticMethods += methods.length;
            totalStaticProps += props.length;
            console.log(`  ${cls}: ${methods.length} static methods, ${props.length} static properties`);
            if (VERBOSE && methods.length > 0) {
                console.log(`    Methods: ${methods.join(", ")}`);
            }
            if (VERBOSE && props.length > 0) {
                console.log(`    Props:   ${props.join(", ")}`);
            }
        }

        // Functions files
        const allFuncs = [];
        for (const ff of target.functionFiles) {
            const funcs = parseExportedFunctions(resolve(SRC_ROOT, ff));
            allFuncs.push(...funcs);
            if (funcs.length > 0) {
                console.log(`  → ${ff}: ${funcs.length} free functions`);
                if (VERBOSE) {
                    console.log(`    ${funcs.join(", ")}`);
                }
            }
        }
        totalFreeFunctions += allFuncs.length;
        console.log();
    }

    // Also scan for all *.functions.ts files in Maths/
    const mathsDir = resolve(SRC_ROOT, "Maths");
    const allFuncFiles = readdirSync(mathsDir).filter((f) => f.endsWith(".functions.ts"));
    const allFuncs = [];
    for (const f of allFuncFiles) {
        const funcs = parseExportedFunctions(join(mathsDir, f));
        allFuncs.push(...funcs);
    }

    console.log("─── Summary ───");
    console.log(`  Total static methods (priority classes):    ${totalStaticMethods}`);
    console.log(`  Total static properties (priority classes): ${totalStaticProps}`);
    console.log(`  Total free functions in Maths/*.functions.ts: ${allFuncs.length}`);
    console.log(`  Coverage ratio: ${allFuncs.length} / ${totalStaticMethods} = ${((allFuncs.length / totalStaticMethods) * 100).toFixed(1)}%`);
    console.log();

    if (VERBOSE) {
        console.log("  All free functions:");
        for (const f of allFuncs) {
            console.log(`    - ${f}`);
        }
    }
}

main();
