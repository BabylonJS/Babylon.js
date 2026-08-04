// Playwright runner for the local WebGPU-XR repro harness.
// Serves ./public over http (WebGPU needs a secure-ish context; localhost qualifies),
// launches real Chrome (Playwright's bundled Chromium has no WebGPU), and prints the
// per-frame / per-eye pixel oracle.
import { chromium } from "playwright";
import * as http from "node:http";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const pub = path.join(here, "public");

const MIME = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".css": "text/css" };

function serve(port) {
    return new Promise((resolve) => {
        const server = http.createServer((req, res) => {
            const url = (req.url || "/").split("?")[0];
            const file = path.join(pub, url === "/" ? "harness.html" : url);
            if (!file.startsWith(pub) || !fs.existsSync(file)) {
                res.writeHead(404);
                res.end("nope");
                return;
            }
            res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
            fs.createReadStream(file).pipe(res);
        });
        server.listen(port, "127.0.0.1", () => resolve(server));
    });
}

const cfgArg = process.argv.slice(2).join(" ").trim();
const cfg = cfgArg ? JSON.parse(cfgArg) : {};

const PORT = 7300 + Math.floor(Math.random() * 600);
const server = await serve(PORT);

const browser = await chromium.launch({
    channel: "chrome",
    headless: process.env.HEADED !== "1",
    args: ["--use-angle=default", "--enable-unsafe-webgpu", ...(process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(" ") : [])],
});
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });

page.on("console", (m) => {
    const t = m.text();
    if (process.env.VERBOSE === "1" || /error|Error|FATAL|mockxr|harness/.test(t)) {
        console.log("  [page]", t.slice(0, 400));
    }
});
page.on("pageerror", (e) => console.log("  [pageerror]", e.message));

await page.addInitScript((c) => {
    window.__XRMOCK_CONFIG = c;
    if (c && c.stacks) {
        window.__GPUTRACE_STACKS = true;
    }
}, cfg);

await page.goto(`http://127.0.0.1:${PORT}/harness.html`);

await page.waitForFunction(() => window.__HARNESS && window.__HARNESS.done, null, { timeout: 90000 }).catch(() => console.log("  !! timed out waiting for harness"));

const out = await page.evaluate(() => ({
    status: window.__HARNESS.status,
    error: window.__HARNESS.error,
    log: window.__HARNESS.log,
    gpuErrors: window.__HARNESS.gpuErrors.slice(0, 20),
    mock: {
        errors: (window.__XRMOCK_STATE.errors || []).slice(0, 20),
        layerInit: window.__XRMOCK_STATE.layerInit,
        subImageCalls: window.__XRMOCK_STATE.subImageCalls,
        renderStates: window.__XRMOCK_STATE.renderStates,
        frames: window.__XRMOCK_STATE.frames,
    },
    trace: window.__GPUTRACE ? window.__GPUTRACE.frames : [],
    xrtraceDigest: window.__HARNESS.xrtraceDigest,
    xrtracePayloadBytes: window.__HARNESS.xrtracePayloadBytes,
    xrtraceNotes: window.__HARNESS.xrtraceNotes,
}));

console.log("\n=== harness log ===");
for (const l of out.log) console.log("  " + l);
if (out.error) console.log("ERROR:", out.error);
if (out.gpuErrors.length) console.log("GPU ERRORS:", out.gpuErrors);
if (out.mock.errors.length) console.log("MOCK ERRORS:", out.mock.errors);
console.log("layerInit:", JSON.stringify(out.mock.layerInit));
console.log("subImageCalls:", out.mock.subImageCalls);
console.log("renderStates:", JSON.stringify(out.mock.renderStates));

console.log("\n=== per-frame pixel oracle  (geo = geometry px, clr = clear-colour px, void = transparent-black px) ===");
console.log("frame pool |            eye0 geo    clr   void dom             |            eye1 geo    clr   void dom");
const verdict = [];
const fmt = (e) =>
    e
        ? `${String(e.geoPx).padStart(6)} ${String(e.clearPx).padStart(6)} ${String(e.voidPx).padStart(6)} cy=${String(e.geoCY).padStart(5)} gnd=${String(e.groundPx).padStart(5)}@${String(e.groundCY).padStart(5)} box=${String(e.boxPx).padStart(5)}`
        : "                     -";
for (const f of out.mock.frames) {
    console.log(`${String(f.frame).padStart(5)} ${String(f.poolId).padStart(4)} | ${fmt(f.eyes[0])} | ${fmt(f.eyes[1])}`);
    verdict.push({ frame: f.frame, e0: f.eyes[0] ? f.eyes[0].geoPx : -1, e1: f.eyes[1] ? f.eyes[1].geoPx : -1 });
}

if (out.xrtraceDigest) {
    console.log("\n=== DEVICE TELEMETRY PAYLOAD DRY-RUN (this is what a headset run would POST) ===");
    console.log("payload bytes: " + out.xrtracePayloadBytes);
    console.log("notes: " + JSON.stringify(out.xrtraceNotes));
    console.log(out.xrtraceDigest);
}
console.log("\n=== VERDICT ===");
console.log(`frames captured: ${verdict.length}`);
const missing = { e0: [], e1: [] };
for (const k of ["e0", "e1"]) {
    const withGeo = verdict.filter((v) => v[k] > 0).length;
    const firstBad = verdict.findIndex((v) => v[k] <= 0);
    missing[k] = verdict.filter((v) => v[k] <= 0).map((v) => v.frame);
    console.log(`${k}: frames WITH geometry = ${withGeo}/${verdict.length}; first frame WITHOUT geometry = ${firstBad}`);
    if (firstBad > 0 && firstBad < verdict.length) {
        console.log(`  *** ${k} REPRODUCED: rendered ${firstBad} frame(s), then geometry stopped ***`);
    }
}

if (process.env.TRACE) {
    const want = String(process.env.TRACE)
        .split(",")
        .map((n) => +n);
    console.log("\n=== GPU sub-image trace ===");
    for (const f of out.trace.filter((f) => want.includes(f.frame))) {
        console.log(`--- frame ${f.frame} ---`);
        for (const e of f.events) {
            if (e.kind === "renderPass") {
                const c = e.colors.map((c) => `${c.target ? c.target.tex + "[L" + c.baseArrayLayerFix + "]" : "?"}`).join(",");
                for (const col of e.colors) {
                    console.log(
                        `  PASS enc#${e.enc} ${e.label || ""} color=${col.target ? col.target.tex + " L" + col.target.baseArrayLayer + " dim=" + col.target.dimension : "-"} load=${col.loadOp} clear=${JSON.stringify(col.clearValue)} store=${col.storeOp}` +
                            (e.depth
                                ? ` | depth=${e.depth.target.tex} L${e.depth.target.baseArrayLayer} load=${e.depth.depthLoadOp} clr=${e.depth.depthClearValue} store=${e.depth.depthStoreOp} ro=${e.depth.depthReadOnly}`
                                : " | depth=-") +
                            ` | draws=${e.draws} bundles=${e.bundles} ended=${e.ended} vp=${JSON.stringify(e.viewports[0])} sc=${JSON.stringify(e.scissors[0])}`
                    );
                }
                if (!e.colors.length) console.log(`  PASS enc#${e.enc} (no watched color) depth=${e.depth ? e.depth.target.tex : "-"} draws=${e.draws}`);
            } else if (e.kind === "submit") {
                console.log(`  SUBMIT encs=[${e.encs.join(",")}] touchesSubImage=${e.touchesWatched}`);
            } else {
                console.log(`  ${e.kind} enc#${e.enc} src=${e.src} dst=${e.dst} srcZ=${e.srcZ} dstZ=${e.dstZ}`);
            }
        }
    }
}

fs.writeFileSync(path.join(here, "last-run.json"), JSON.stringify(out, null, 2));

await browser.close();
server.close();

// --- ASSERTION ------------------------------------------------------------------------------------
// This runner is a test, not a viewer: it exits non-zero when the oracle says geometry is missing.
// EXPECT_REPRO=1 inverts it, for negative controls (`forceLayer0`, or re-running with a fix reverted)
// where the run is only meaningful if it DOES fail.
const failures = [];
if (out.error) failures.push(`page error: ${out.error}`);
if (out.gpuErrors.length) failures.push(`GPU errors: ${JSON.stringify(out.gpuErrors.slice(0, 3))}`);
if (!verdict.length) failures.push("no frames captured - the oracle never ran, so this run proves nothing");
for (const k of ["e0", "e1"]) {
    if (missing[k].length) {
        failures.push(`${k}: ${missing[k].length}/${verdict.length} frame(s) without geometry (frames ${missing[k].slice(0, 8).join(",")})`);
    }
}

const expectRepro = process.env.EXPECT_REPRO === "1";
if (expectRepro) {
    if (failures.length) {
        console.log(`\nEXPECTED FAILURE observed (EXPECT_REPRO=1):\n  ${failures.join("\n  ")}`);
        process.exit(0);
    }
    console.log("\nFAIL: EXPECT_REPRO=1 but every frame rendered geometry on both eyes - the control did not fire.");
    process.exit(1);
}
if (failures.length) {
    console.log(`\nFAIL:\n  ${failures.join("\n  ")}`);
    process.exit(1);
}
console.log(`\nPASS: geometry present on both eyes for all ${verdict.length} frames.`);
