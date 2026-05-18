#!/usr/bin/env node
/* eslint-disable babylonjs/syntax */
/* eslint-disable no-console */
/**
 * Tree-Shaking Bundle Smoke Test
 *
 * Verifies that importing side-effect-free modules produces minimal/empty bundles.
 * Uses both Rollup and Webpack programmatically.
 *
 * Usage:
 *   node scripts/treeshaking/bundleSmokeTest.mjs
 *
 * Prerequisites:
 *   - packages/dev/core must be compiled (dist/ must exist)
 *   - rollup and webpack must be available
 */

import { writeFileSync, mkdirSync, readFileSync, rmSync, statSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "../..");
const TMP_DIR = join(REPO_ROOT, "scripts/treeshaking/.tmp");
const CORE_DIST = join(REPO_ROOT, "packages/dev/core/dist");
const IS_ADO = !!process.env.TF_BUILD;

function adoError(msg) {
    if (IS_ADO) {
        console.log(`##vso[task.logissue type=error]${msg}`);
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensureDir(dir) {
    mkdirSync(dir, { recursive: true });
}

function cleanup() {
    rmSync(TMP_DIR, { recursive: true, force: true });
}

function fileSize(path) {
    try {
        return statSync(path).size;
    } catch {
        return -1;
    }
}

// ---------------------------------------------------------------------------
// Test cases
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} TestCase
 * @property {string} name
 * @property {string} entryCode - JS code for the entry file
 * @property {number} maxBundleSizeBytes - Threshold for the test to pass
 * @property {number} [minBundleSizeBytes] - Lower threshold for sanity cases that must retain imported code
 * @property {string} description
 */

/** @type {TestCase[]} */
const TEST_CASES = [
    {
        name: "thinmaths-import",
        entryCode: `import "${CORE_DIST}/Maths/ThinMaths/index.js";\n`,
        // ThinMaths is marked side-effect-free. If tree-shaking works,
        // an import with no used exports should produce a near-empty bundle.
        // We use a generous threshold since the module does export real code.
        maxBundleSizeBytes: 500,
        description: "Bare import of ThinMaths (side-effect-free) should produce near-empty bundle",
    },
    {
        name: "thinmaths-named-import",
        entryCode: `import { ThinMatrix } from "${CORE_DIST}/Maths/ThinMaths/index.js";\nconsole.log(ThinMatrix);\n`,
        // When we actually USE an export, the bundle should contain code.
        // This is a sanity check that bundling works at all.
        maxBundleSizeBytes: Infinity, // no size limit — just verify it bundles
        description: "Named import of ThinMatrix should bundle successfully (sanity check)",
    },
    {
        name: "math-color-pure-bare",
        entryCode: `import "${CORE_DIST}/Maths/math.color.pure.js";\n`,
        maxBundleSizeBytes: 500,
        description: "Bare import of math.color.pure (side-effect-free) should produce near-empty bundle",
    },
    {
        name: "math-color-pure-named",
        entryCode: `import { Color3 } from "${CORE_DIST}/Maths/math.color.pure.js";\nconsole.log(Color3);\n`,
        maxBundleSizeBytes: Infinity,
        description: "Named import of Color3 from math.color.pure should bundle (sanity check)",
    },
    {
        name: "math-vector-pure-bare",
        entryCode: `import "${CORE_DIST}/Maths/math.vector.pure.js";\n`,
        maxBundleSizeBytes: 500,
        description: "Bare import of math.vector.pure (side-effect-free) should produce near-empty bundle",
    },
    {
        name: "maths-pure-barrel-bare",
        entryCode: `import "${CORE_DIST}/Maths/pure.js";\n`,
        maxBundleSizeBytes: 500,
        description: "Bare import of Maths/pure barrel should produce near-empty bundle",
    },
    {
        name: "cameras-pure-barrel-bare",
        entryCode: `import "${CORE_DIST}/Cameras/pure.js";\n`,
        maxBundleSizeBytes: 500,
        description: "Bare import of Cameras/pure barrel should produce near-empty bundle",
    },
    {
        name: "root-pure-barrel-bare",
        entryCode: `import "${CORE_DIST}/pure.js";\n`,
        maxBundleSizeBytes: 500,
        description: "Bare import of root pure barrel should produce near-empty bundle",
    },
    {
        name: "root-pure-barrel-named",
        entryCode: `import { Color3 } from "${CORE_DIST}/pure.js";\nconsole.log(Color3);\n`,
        maxBundleSizeBytes: Infinity,
        description: "Named import of Color3 from root pure barrel should bundle (sanity check)",
    },
    // ── Phase 4: free-function granularity tests ────────────────────────────
    {
        name: "vector-functions-bare",
        entryCode: `import "${CORE_DIST}/Maths/math.vector.functions.js";\n`,
        maxBundleSizeBytes: 500,
        description: "Bare import of math.vector.functions (side-effect-free) should produce near-empty bundle",
    },
    {
        name: "vector-functions-named",
        entryCode: `import { Vector3Dot } from "${CORE_DIST}/Maths/math.vector.functions.js";\nconsole.log(Vector3Dot);\n`,
        maxBundleSizeBytes: Infinity,
        description: "Named import of single free function should bundle only that function",
    },
    {
        name: "scalar-functions-bare",
        entryCode: `import "${CORE_DIST}/Maths/math.scalar.functions.js";\n`,
        maxBundleSizeBytes: 500,
        description: "Bare import of math.scalar.functions (side-effect-free) should produce near-empty bundle",
    },
    {
        name: "scalar-functions-named",
        entryCode: `import { ExtractAsInt } from "${CORE_DIST}/Maths/math.scalar.functions.js";\nconsole.log(ExtractAsInt);\n`,
        maxBundleSizeBytes: Infinity,
        description: "Named import of ExtractAsInt should bundle only that function",
    },
    {
        name: "geospatial-functions-bare",
        entryCode: `import "${CORE_DIST}/Maths/math.geospatial.functions.js";\n`,
        maxBundleSizeBytes: 500,
        description: "Bare import of math.geospatial.functions (side-effect-free) should produce near-empty bundle",
    },
    {
        name: "pure-barrel-named-function",
        entryCode: `import { Vector3Dot } from "${CORE_DIST}/Maths/pure.js";\nconsole.log(Vector3Dot);\n`,
        maxBundleSizeBytes: Infinity,
        description: "Named import of free function through pure barrel should bundle only that function",
    },
    // ── Phase 9: registration function tests ────────────────────────────────
    {
        name: "registration-pure-bare",
        entryCode: `import "${CORE_DIST}/Culling/ray.pure.js";\n`,
        maxBundleSizeBytes: 500,
        description: "Bare import of .pure.js with registration function — function should be tree-shaken",
    },
    {
        name: "registration-pure-named-call",
        entryCode: `import { RegisterRay } from "${CORE_DIST}/Culling/ray.pure.js";\nRegisterRay();\n`,
        maxBundleSizeBytes: Infinity,
        minBundleSizeBytes: 100,
        description: "Import + call of registration function should bundle correctly (sanity check)",
    },
    {
        name: "registration-types-only",
        entryCode: `import "${CORE_DIST}/Buffers/buffer.align.types.js";\n`,
        maxBundleSizeBytes: 500,
        description: "Bare import of .types.js should produce near-empty bundle (types only)",
    },
    {
        name: "registration-engine-pure-bare",
        entryCode: `import "${CORE_DIST}/Rendering/depthRendererSceneComponent.pure.js";\n`,
        maxBundleSizeBytes: 500,
        description: "Bare import of scene component .pure.js — registration function should be tree-shaken",
    },
    {
        name: "registration-engine-pure-named-call",
        entryCode: `import { RegisterDepthRendererSceneComponent } from "${CORE_DIST}/Rendering/depthRendererSceneComponent.pure.js";\nimport { DepthRenderer } from "${CORE_DIST}/Rendering/depthRenderer.pure.js";\nRegisterDepthRendererSceneComponent(DepthRenderer);\n`,
        maxBundleSizeBytes: Infinity,
        minBundleSizeBytes: 100,
        description: "Import + call of scene component registration function should bundle correctly",
    },
];

// ---------------------------------------------------------------------------
// Rollup test
// ---------------------------------------------------------------------------

async function testWithRollup(testCase) {
    const { rollup } = await import("rollup");

    const entryPath = join(TMP_DIR, `${testCase.name}-entry.mjs`);
    const outPath = join(TMP_DIR, `${testCase.name}-rollup-out.mjs`);
    writeFileSync(entryPath, testCase.entryCode);

    try {
        const bundle = await rollup({
            input: entryPath,
            // Treat everything outside the entry and core dist as external
            external: (id) => {
                if (id === entryPath) {
                    return false;
                }
                if (id.startsWith(CORE_DIST)) {
                    return false;
                }
                return true;
            },
            treeshake: {
                moduleSideEffects: (id) => {
                    // Mirror what package.json sideEffects says:
                    // Everything in core has side effects EXCEPT ThinMaths, .pure files, and pure barrels
                    if (id.includes("/Maths/ThinMaths/")) {
                        return false;
                    }
                    if (id.endsWith(".pure.js")) {
                        return false;
                    }
                    if (id.endsWith("/pure.js")) {
                        return false;
                    }
                    if (id.endsWith(".functions.js")) {
                        return false;
                    }
                    return true;
                },
            },
            logLevel: "silent",
        });

        await bundle.write({
            file: outPath,
            format: "esm",
        });
        await bundle.close();

        const size = fileSize(outPath);
        const content = readFileSync(outPath, "utf-8").trim();
        const minSize = testCase.minBundleSizeBytes ?? 0;
        const passed = size >= minSize && size <= testCase.maxBundleSizeBytes;

        return {
            bundler: "rollup",
            name: testCase.name,
            passed,
            size,
            minSize,
            maxSize: testCase.maxBundleSizeBytes,
            contentPreview: content.substring(0, 200),
        };
    } catch (err) {
        return {
            bundler: "rollup",
            name: testCase.name,
            passed: false,
            error: err.message,
        };
    }
}

// ---------------------------------------------------------------------------
// Webpack test
// ---------------------------------------------------------------------------

async function testWithWebpack(testCase) {
    const require = createRequire(import.meta.url);
    const webpack = require("webpack");

    const entryPath = join(TMP_DIR, `${testCase.name}-entry.mjs`);
    const outDir = join(TMP_DIR, `${testCase.name}-webpack-out`);
    writeFileSync(entryPath, testCase.entryCode);

    return new Promise((resolvePromise) => {
        const compiler = webpack({
            mode: "production",
            entry: entryPath,
            output: {
                path: outDir,
                filename: "bundle.js",
            },
            optimization: {
                usedExports: true,
                sideEffects: true,
                minimize: true,
            },
            resolve: {
                extensions: [".js", ".mjs"],
                alias: {
                    // The compiled output uses "core/..." path-mapped imports
                    core: CORE_DIST,
                },
            },
            // Tell webpack that ThinMaths files, .pure files, and pure barrels have no side effects
            module: {
                rules: [
                    {
                        test: /Maths[\\/]ThinMaths/,
                        sideEffects: false,
                    },
                    {
                        test: /\.pure\.js$/,
                        sideEffects: false,
                    },
                    {
                        test: /[\\/]pure\.js$/,
                        sideEffects: false,
                    },
                    {
                        test: /\.functions\.js$/,
                        sideEffects: false,
                    },
                ],
            },
        });

        compiler.run((err, stats) => {
            compiler.close(() => {});

            if (err) {
                resolvePromise({
                    bundler: "webpack",
                    name: testCase.name,
                    passed: false,
                    error: err.message,
                });
                return;
            }

            if (stats.hasErrors()) {
                const info = stats.toJson({ errors: true });
                resolvePromise({
                    bundler: "webpack",
                    name: testCase.name,
                    passed: false,
                    error: info.errors
                        .map((e) => e.message)
                        .join("\n")
                        .substring(0, 500),
                });
                return;
            }

            const bundlePath = join(outDir, "bundle.js");
            const size = fileSize(bundlePath);
            const content = size > 0 ? readFileSync(bundlePath, "utf-8").trim() : "";
            const minSize = testCase.minBundleSizeBytes ?? 0;
            const passed = size >= minSize && size <= testCase.maxBundleSizeBytes;

            resolvePromise({
                bundler: "webpack",
                name: testCase.name,
                passed,
                size,
                minSize,
                maxSize: testCase.maxBundleSizeBytes,
                contentPreview: content.substring(0, 200),
            });
        });
    });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
    console.log("\n=== Tree-Shaking Bundle Smoke Tests ===\n");

    // Check that core is compiled
    try {
        statSync(join(CORE_DIST, "Maths/ThinMaths/index.js"));
    } catch {
        const msg = "packages/dev/core/dist/ not found. Run `npm run build:source` first.";
        console.error(`ERROR: ${msg}`);
        adoError(msg);
        process.exit(1);
    }

    ensureDir(TMP_DIR);

    const results = [];
    let allPassed = true;

    for (const tc of TEST_CASES) {
        console.log(`--- ${tc.name}: ${tc.description} ---\n`);

        const rollupResult = await testWithRollup(tc);
        results.push(rollupResult);
        const rollupIcon = rollupResult.passed ? "PASS" : "FAIL";
        console.log(
            `  Rollup:  ${rollupIcon}  (${rollupResult.size ?? "N/A"} bytes${rollupResult.minSize ? `, min ${rollupResult.minSize}` : ""}${rollupResult.maxSize !== Infinity ? `, max ${rollupResult.maxSize}` : ""})`
        );
        if (rollupResult.error) {
            console.log(`    Error: ${rollupResult.error}`);
        }
        if (rollupResult.contentPreview && !rollupResult.passed) {
            console.log(`    Content: ${rollupResult.contentPreview}`);
        }

        const webpackResult = await testWithWebpack(tc);
        results.push(webpackResult);
        const webpackIcon = webpackResult.passed ? "PASS" : "FAIL";
        console.log(
            `  Webpack: ${webpackIcon}  (${webpackResult.size ?? "N/A"} bytes${webpackResult.minSize ? `, min ${webpackResult.minSize}` : ""}${webpackResult.maxSize !== Infinity ? `, max ${webpackResult.maxSize}` : ""})`
        );
        if (webpackResult.error) {
            console.log(`    Error: ${webpackResult.error}`);
        }
        if (webpackResult.contentPreview && !webpackResult.passed) {
            console.log(`    Content: ${webpackResult.contentPreview}`);
        }

        console.log();

        if (!rollupResult.passed || !webpackResult.passed) {
            allPassed = false;
            if (!rollupResult.passed) {
                adoError(`Tree-shaking smoke test FAILED: ${tc.name} (Rollup) — ${rollupResult.size} bytes, max ${rollupResult.maxSize}`);
            }
            if (!webpackResult.passed) {
                adoError(`Tree-shaking smoke test FAILED: ${tc.name} (Webpack) — ${webpackResult.size} bytes, max ${webpackResult.maxSize}`);
            }
        }
    }

    cleanup();

    console.log(allPassed ? "All tests passed!" : "Some tests FAILED.");
    process.exit(allPassed ? 0 : 1);
}

main();
