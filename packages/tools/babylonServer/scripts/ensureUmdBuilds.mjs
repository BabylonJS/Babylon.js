#!/usr/bin/env node
/**
 * Ensures all required UMD bundles exist before starting the Vite dev server.
 *
 * - Checks each UMD package directory for its expected output file.
 * - Builds only missing packages (in parallel batches) using `build:dev:fast`.
 * - If everything is already built, exits instantly.
 *
 * Usage: node scripts/ensureUmdBuilds.mjs
 */

import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const UMD_ROOT = resolve(__dirname, "../../../public/umd");
const REPO_ROOT = resolve(__dirname, "../../../..");

/**
 * Each entry: [npm workspace name, relative path to expected output file]
 * Derived from the umdUrlMap in vite.config.ts — the file that the server
 * actually needs to serve for the default index.html page to work.
 */
const requiredBuilds = [
    ["babylonjs", "babylonjs/babylon.max.js"],
    ["babylonjs-gui", "babylonjs-gui/babylon.gui.js"],
    ["babylonjs-loaders", "babylonjs-loaders/babylonjs.loaders.js"],
    ["babylonjs-serializers", "babylonjs-serializers/babylonjs.serializers.js"],
    ["babylonjs-materials", "babylonjs-materials/babylonjs.materials.js"],
    ["babylonjs-post-process", "babylonjs-post-process/babylonjs.postProcess.js"],
    ["babylonjs-procedural-textures", "babylonjs-procedural-textures/babylonjs.proceduralTextures.js"],
    ["babylonjs-inspector-legacy", "babylonjs-inspector/babylon.inspector.bundle.max.js"],
    ["babylonjs-inspector", "babylonjs-inspector-v2/babylon.inspector-v2.bundle.max.js"],
    ["babylonjs-node-editor", "babylonjs-node-editor/babylon.nodeEditor.max.js"],
    ["babylonjs-node-geometry-editor", "babylonjs-node-geometry-editor/babylon.nodeGeometryEditor.max.js"],
    ["babylonjs-node-render-graph-editor", "babylonjs-node-render-graph-editor/babylon.nodeRenderGraphEditor.max.js"],
    ["babylonjs-node-particle-editor", "babylonjs-node-particle-editor/babylon.nodeParticleEditor.max.js"],
    ["babylonjs-gui-editor", "babylonjs-gui-editor/babylon.guiEditor.max.js"],
    ["babylonjs-accessibility", "babylonjs-accessibility/babylon.accessibility.max.js"],
    ["babylonjs-addons", "babylonjs-addons/babylonjs.addons.js"],
    ["babylonjs-ktx2decoder", "babylonjs-ktx2decoder/babylon.ktx2Decoder.max.js"],
];

// Find which packages are missing their output files
const missing = requiredBuilds.filter(([, file]) => !existsSync(resolve(UMD_ROOT, file)));

if (missing.length === 0) {
    console.log("✓ All UMD bundles are up to date.");
    process.exit(0);
}

console.log(`⚡ Building ${missing.length} missing UMD package(s) with esbuild fast mode...`);
for (const [pkg] of missing) {
    console.log(`  → ${pkg}`);
}

// Build missing packages in parallel using npm workspace commands.
// We limit concurrency to avoid overwhelming the CPU.
const MAX_PARALLEL = 4;
const batches = [];
for (let i = 0; i < missing.length; i += MAX_PARALLEL) {
    batches.push(missing.slice(i, i + MAX_PARALLEL));
}

let failed = false;
for (const batch of batches) {
    const promises = batch.map(
        ([pkg]) =>
            new Promise((resolvePromise) => {
                const child = spawn("npm", ["run", "build:dev:fast", "-w", pkg], {
                    cwd: REPO_ROOT,
                    stdio: ["ignore", "ignore", "pipe"],
                    shell: true,
                });

                let stderr = "";
                child.stderr.on("data", (d) => (stderr += d));

                child.on("close", (code) => {
                    if (code !== 0) {
                        console.error(`  ✗ ${pkg} failed (exit ${code})`);
                        if (stderr) console.error(stderr.trim());
                        failed = true;
                    } else {
                        console.log(`  ✓ ${pkg}`);
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

console.log(`\n✓ All ${missing.length} UMD package(s) built successfully.`);
