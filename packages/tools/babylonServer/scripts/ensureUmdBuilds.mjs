#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * Ensures all required UMD bundles served by the local CDN dev server are fresh.
 *
 * The local CDN dev server uses `build:dev:fast` outputs. A root `build:umd`
 * can write files with the same names, so file existence alone is not enough to
 * prove an output belongs to the dev-server build path. This script keeps a
 * dev-server stamp outside the UMD package output directories and rebuilds when
 * the stamp is missing, stale, or no longer matches the served file.
 *
 * Usage: node scripts/ensureUmdBuilds.mjs
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "fs";
import { basename, dirname, relative, resolve } from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const UMD_ROOT = resolve(__dirname, "../../../public/umd");
const REPO_ROOT = resolve(__dirname, "../../../..");
const DEV_ROOT = resolve(REPO_ROOT, "packages/dev");
const TOOLS_ROOT = resolve(REPO_ROOT, "packages/tools");
const SHARED_UI_SOURCE_ROOT = resolve(DEV_ROOT, "sharedUiComponents/src");
const STAMP_ROOT = resolve(__dirname, "../dist/umd-dev-stamps");
const STAMP_VERSION = 1;
const MTIME_TOLERANCE_MS = 2;
const DRY_RUN = process.argv.includes("--dry-run");
const mtimeCache = new Map();

const globalInputs = [
    resolve(REPO_ROOT, "packages/public/rollupUMDHelper.mjs"),
    resolve(REPO_ROOT, "packages/public/glTF2Interface/babylonjs-gltf2interface.stub.ts"),
    resolve(REPO_ROOT, "packages/tools/babylonServer/scripts/ensureUmdBuilds.mjs"),
];

/**
 * Each entry: npm workspace name, relative path to expected output file, and
 * source roots that should make the local CDN output stale when changed.
 * Derived from the umdUrlMap in vite.config.ts — the file that the server
 * actually needs to serve for the default index.html page to work.
 */
const requiredBuilds = [
    { packageName: "babylonjs", outputFile: "babylonjs/babylon.max.js", sourceRoots: [resolve(DEV_ROOT, "core/src")] },
    { packageName: "babylonjs-gui", outputFile: "babylonjs-gui/babylon.gui.js", sourceRoots: [resolve(DEV_ROOT, "gui/src")] },
    { packageName: "babylonjs-loaders", outputFile: "babylonjs-loaders/babylonjs.loaders.js", sourceRoots: [resolve(DEV_ROOT, "loaders/src")] },
    { packageName: "babylonjs-serializers", outputFile: "babylonjs-serializers/babylonjs.serializers.js", sourceRoots: [resolve(DEV_ROOT, "serializers/src")] },
    { packageName: "babylonjs-materials", outputFile: "babylonjs-materials/babylonjs.materials.js", sourceRoots: [resolve(DEV_ROOT, "materials/src")] },
    { packageName: "babylonjs-post-process", outputFile: "babylonjs-post-process/babylonjs.postProcess.js", sourceRoots: [resolve(DEV_ROOT, "postProcesses/src")] },
    {
        packageName: "babylonjs-procedural-textures",
        outputFile: "babylonjs-procedural-textures/babylonjs.proceduralTextures.js",
        sourceRoots: [resolve(DEV_ROOT, "proceduralTextures/src")],
    },
    {
        packageName: "babylonjs-inspector-legacy",
        outputFile: "babylonjs-inspector/babylon.inspector.bundle.max.js",
        sourceRoots: [resolve(DEV_ROOT, "inspector/src"), SHARED_UI_SOURCE_ROOT],
    },
    {
        packageName: "babylonjs-inspector",
        outputFile: "babylonjs-inspector-v2/babylon.inspector-v2.bundle.max.js",
        sourceRoots: [resolve(DEV_ROOT, "inspector-v2/src"), SHARED_UI_SOURCE_ROOT],
    },
    {
        packageName: "babylonjs-node-editor",
        outputFile: "babylonjs-node-editor/babylon.nodeEditor.max.js",
        sourceRoots: [resolve(TOOLS_ROOT, "nodeEditor/src"), SHARED_UI_SOURCE_ROOT],
    },
    {
        packageName: "babylonjs-node-geometry-editor",
        outputFile: "babylonjs-node-geometry-editor/babylon.nodeGeometryEditor.max.js",
        sourceRoots: [resolve(TOOLS_ROOT, "nodeGeometryEditor/src"), SHARED_UI_SOURCE_ROOT],
    },
    {
        packageName: "babylonjs-node-render-graph-editor",
        outputFile: "babylonjs-node-render-graph-editor/babylon.nodeRenderGraphEditor.max.js",
        sourceRoots: [resolve(TOOLS_ROOT, "nodeRenderGraphEditor/src"), SHARED_UI_SOURCE_ROOT],
    },
    {
        packageName: "babylonjs-node-particle-editor",
        outputFile: "babylonjs-node-particle-editor/babylon.nodeParticleEditor.max.js",
        sourceRoots: [resolve(TOOLS_ROOT, "nodeParticleEditor/src"), SHARED_UI_SOURCE_ROOT],
    },
    {
        packageName: "babylonjs-gui-editor",
        outputFile: "babylonjs-gui-editor/babylon.guiEditor.max.js",
        sourceRoots: [resolve(TOOLS_ROOT, "guiEditor/src"), SHARED_UI_SOURCE_ROOT],
    },
    { packageName: "babylonjs-accessibility", outputFile: "babylonjs-accessibility/babylon.accessibility.max.js", sourceRoots: [resolve(TOOLS_ROOT, "accessibility/src")] },
    { packageName: "babylonjs-addons", outputFile: "babylonjs-addons/babylonjs.addons.js", sourceRoots: [resolve(DEV_ROOT, "addons/src")] },
    {
        packageName: "babylonjs-ktx2decoder",
        outputFile: "babylonjs-ktx2decoder/babylon.ktx2Decoder.max.js",
        sourceRoots: [resolve(TOOLS_ROOT, "ktx2Decoder/src"), resolve(DEV_ROOT, "core/src/Materials/Textures/ktx2decoderTypes.ts")],
    },
];

function packageOutputDir(build) {
    return build.outputFile.split("/")[0];
}

function relativeFromRepoRoot(path) {
    return relative(REPO_ROOT, path).split("\\").join("/");
}

function stampPath(build) {
    return resolve(STAMP_ROOT, `${build.packageName}.json`);
}

function outputPath(build) {
    return resolve(UMD_ROOT, build.outputFile);
}

function inputPaths(build) {
    const outputDir = packageOutputDir(build);
    return [
        ...globalInputs,
        resolve(UMD_ROOT, outputDir, "package.json"),
        resolve(UMD_ROOT, outputDir, "rollup.config.umd.mjs"),
        resolve(UMD_ROOT, outputDir, "tsconfig.build.json"),
        resolve(UMD_ROOT, outputDir, "src"),
        ...build.sourceRoots,
    ];
}

function shouldIgnorePath(path) {
    const name = basename(path);
    return name === "node_modules" || name === ".git" || name === "dist" || name === ".rollup.cache";
}

function latestMtimeForPath(path) {
    const cached = mtimeCache.get(path);
    if (cached) {
        return cached;
    }

    const latest = { path: "", mtimeMs: 0 };

    function visit(path) {
        if (shouldIgnorePath(path)) {
            return;
        }

        let stat;
        try {
            stat = statSync(path);
        } catch {
            return;
        }

        if (stat.mtimeMs > latest.mtimeMs) {
            latest.path = path;
            latest.mtimeMs = stat.mtimeMs;
        }

        if (stat.isDirectory()) {
            let entries;
            try {
                entries = readdirSync(path);
            } catch {
                return;
            }

            for (const entry of entries) {
                visit(resolve(path, entry));
            }
        }
    }

    visit(path);
    mtimeCache.set(path, latest);

    return latest;
}

function latestMtime(paths) {
    const latest = { path: "", mtimeMs: 0 };

    for (const path of paths) {
        const pathLatest = latestMtimeForPath(path);
        if (pathLatest.mtimeMs > latest.mtimeMs) {
            latest.path = pathLatest.path;
            latest.mtimeMs = pathLatest.mtimeMs;
        }
    }

    return latest;
}

function readStamp(build) {
    try {
        return JSON.parse(readFileSync(stampPath(build), "utf8"));
    } catch {
        return null;
    }
}

function mtimeMatches(left, right) {
    return Math.abs(left - right) <= MTIME_TOLERANCE_MS;
}

function evaluateBuild(build) {
    const servedFile = outputPath(build);
    const latestInput = latestMtime(inputPaths(build));

    if (!existsSync(servedFile)) {
        return { build, reason: "missing served file", latestInput };
    }

    const servedFileMtimeMs = statSync(servedFile).mtimeMs;
    const stamp = readStamp(build);
    if (!stamp) {
        return { build, reason: "missing dev-server stamp", latestInput };
    }

    if (stamp.version !== STAMP_VERSION || stamp.packageName !== build.packageName || stamp.outputFile !== build.outputFile) {
        return { build, reason: "stale dev-server stamp format", latestInput };
    }

    if (!mtimeMatches(stamp.outputMtimeMs, servedFileMtimeMs)) {
        return { build, reason: "served file changed outside the dev-server build", latestInput };
    }

    if (latestInput.mtimeMs > stamp.inputMtimeMs + MTIME_TOLERANCE_MS) {
        return { build, reason: `${relativeFromRepoRoot(latestInput.path)} is newer than the dev-server build`, latestInput };
    }

    return null;
}

function writeStamp(build, latestInput) {
    const servedFile = outputPath(build);
    if (!existsSync(servedFile)) {
        return false;
    }

    mkdirSync(STAMP_ROOT, { recursive: true });
    const servedFileMtimeMs = statSync(servedFile).mtimeMs;
    writeFileSync(
        stampPath(build),
        JSON.stringify(
            {
                version: STAMP_VERSION,
                packageName: build.packageName,
                outputFile: build.outputFile,
                outputMtimeMs: servedFileMtimeMs,
                inputMtimeMs: latestInput.mtimeMs,
                latestInput: latestInput.path ? relativeFromRepoRoot(latestInput.path) : null,
                buildCommand: `npm run build:dev:fast -w ${build.packageName}`,
                createdAt: new Date().toISOString(),
            },
            null,
            2
        ) + "\n"
    );

    return true;
}

const stampArgIndex = process.argv.indexOf("--stamp");
if (stampArgIndex !== -1) {
    const packageName = process.argv[stampArgIndex + 1];
    const build = requiredBuilds.find((entry) => entry.packageName === packageName);
    if (!build) {
        console.error(`Unknown UMD package: ${packageName ?? "<missing>"}`);
        process.exit(1);
    }

    if (!writeStamp(build, latestMtime(inputPaths(build)))) {
        console.error(`Cannot stamp ${build.packageName}; served file does not exist: ${build.outputFile}`);
        process.exit(1);
    }

    process.exit(0);
}

const staleBuilds = requiredBuilds.map(evaluateBuild).filter(Boolean);

if (staleBuilds.length === 0) {
    console.log("✓ All local CDN UMD bundles are fresh.");
    process.exit(0);
}

console.log(`⚡ Building ${staleBuilds.length} stale local CDN UMD package(s) with esbuild fast mode...`);
for (const { build, reason } of staleBuilds) {
    console.log(`  → ${build.packageName} (${reason})`);
}

if (DRY_RUN) {
    console.log("\nDry run only; no packages were built.");
    process.exit(0);
}

// Build missing packages in parallel using npm workspace commands.
// We limit concurrency to avoid overwhelming the CPU.
const MAX_PARALLEL = 4;
const batches = [];
for (let i = 0; i < staleBuilds.length; i += MAX_PARALLEL) {
    batches.push(staleBuilds.slice(i, i + MAX_PARALLEL));
}

let failed = false;
for (const batch of batches) {
    const promises = batch.map(
        ({ build }) =>
            new Promise((resolvePromise) => {
                const child = spawn("npm", ["run", "build:dev:fast", "-w", build.packageName], {
                    cwd: REPO_ROOT,
                    stdio: ["ignore", "ignore", "pipe"],
                    shell: true,
                });

                let stderr = "";
                child.stderr.on("data", (d) => (stderr += d));

                child.on("close", (code) => {
                    if (code !== 0) {
                        console.error(`  ✗ ${build.packageName} failed (exit ${code})`);
                        if (stderr) {
                            console.error(stderr.trim());
                        }
                        failed = true;
                    } else {
                        if (writeStamp(build, latestMtime(inputPaths(build)))) {
                            console.log(`  ✓ ${build.packageName}`);
                        } else {
                            console.error(`  ✗ ${build.packageName} did not produce ${build.outputFile}`);
                            failed = true;
                        }
                    }
                    resolvePromise();
                });
            })
    );
    await Promise.all(promises);
}

if (failed) {
    console.error("\n✗ Some UMD builds failed. Fix errors above and retry.");
    process.exit(1);
}

console.log(`\n✓ All ${staleBuilds.length} local CDN UMD package(s) built successfully.`);
