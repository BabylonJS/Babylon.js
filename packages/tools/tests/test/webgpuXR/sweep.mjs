// Sweeps harness configuration axes looking for any config that reproduces
// "renders N frames, then geometry stops while the clear keeps presenting".
import { execFileSync } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

const BASE = { frameBudget: 12 };

const CASES = [
    ["baseline (pool3, array2, rgba8, depth24s8, UA-clear, depthClear=0)", {}],
    ["no UA clear of the sub-image", { compositorClearsTexture: false }],
    ["UA depth clear = 1.0 (spec-correct)", { compositorDepthClearValue: 1.0 }],
    ["colorFormat bgra8unorm", { colorFormat: "bgra8unorm" }],
    ["no pool rotation (poolDepth 1)", { poolDepth: 1 }],
    ["deeper pool (poolDepth 6)", { poolDepth: 6 }],
    ["separate per-eye textures (arrayLayers 1)", { arrayLayers: 1 }],
    ["no depth sub-image", { provideDepth: false }],
    ["depth24plus (no stencil)", { depthStencilFormat: "depth24plus" }],
    ["depth16unorm", { depthStencilFormat: "depth16unorm" }],
    ["half-Z projection matrices", { projectionHalfZ: true }],
    ["quest-sized sub-image 2064x2208", { width: 2064, height: 2208, frameBudget: 8 }],
    ["viewport inset (sub-image viewport smaller than texture)", { viewportInset: 64 }],
];

const results = [];
for (const [name, cfg] of CASES) {
    const merged = { ...BASE, ...cfg };
    process.stdout.write(`\n### ${name}\n    ${JSON.stringify(merged)}\n`);
    let out = "";
    try {
        out = execFileSync(process.execPath, [path.join(here, "run.mjs"), JSON.stringify(merged)], { encoding: "utf8", timeout: 180000 });
    } catch (e) {
        out = (e.stdout || "") + (e.stderr || "");
    }
    const verdictIdx = out.indexOf("=== VERDICT ===");
    const verdict = verdictIdx >= 0 ? out.slice(verdictIdx) : out.slice(-1500);
    const repro = /REPRODUCED/.test(out);
    const errBlock = out.match(/(GPU ERRORS:.*|MOCK ERRORS:.*|ERROR:.*)/g);
    console.log("    " + verdict.trim().split("\n").slice(1).join("\n    "));
    if (errBlock) console.log("    " + errBlock.slice(0, 3).join("\n    ").slice(0, 600));
    results.push({ name, repro, verdict: verdict.trim() });
}

console.log("\n\n================ SWEEP SUMMARY ================");
for (const r of results) {
    const m = r.verdict.match(/e0: frames WITH geometry = (\d+)\/(\d+)/);
    const m1 = r.verdict.match(/e1: frames WITH geometry = (\d+)\/(\d+)/);
    console.log(`${r.repro ? "*** REPRO ***" : "   ok        "}  e0=${m ? m[1] + "/" + m[2] : "?"}  e1=${m1 ? m1[1] + "/" + m1[2] : "?"}  ${r.name}`);
}
