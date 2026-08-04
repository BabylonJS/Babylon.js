// Playwright runner for the local WebGPU-XR repro harness.
// Serves ./public over http (WebGPU needs a secure context; localhost qualifies), launches a
// WebGPU-capable Chromium, and prints the per-frame / per-eye pixel oracle.
//
// Browser selection: defaults to Playwright's bundled Chromium, which does expose WebGPU on a
// localhost page. (about:blank is an opaque origin and reports no navigator.gpu, which is an easy
// way to conclude wrongly that bundled Chromium cannot do WebGPU at all.) Set CHANNEL=chrome to use
// an installed Chrome instead. On a GPU-less machine such as a CI agent, pass
// CHROME_ARGS="--use-angle=swiftshader --enable-features=Vulkan" to fall back to the SwiftShader
// software adapter.
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
            // Minimal same-origin page used to probe WebGPU availability without booting the harness.
            if (url === "/__probe") {
                res.writeHead(200, { "content-type": "text/html" });
                res.end("<!doctype html><title>probe</title>");
                return;
            }
            // Containment: strip the leading slash so `resolve` cannot be short-circuited by an absolute
            // request path, and compare against `pub + sep` so a sibling directory sharing the prefix
            // (".../publicity") cannot pass the check.
            const rel = (url === "/" ? "harness.html" : url).replace(/^\/+/, "");
            const file = path.resolve(pub, rel);
            if (!file.startsWith(pub + path.sep) || !fs.existsSync(file)) {
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
// SwiftShader rasterises on the CPU, so a CI agent is orders of magnitude slower than a desktop GPU
// (40 frames: ~3s locally, >180s on an ADO agent). The regression shows up on frame 1, so CI only
// needs a handful of frames to catch it.
if (process.env.FRAME_BUDGET && cfg.frameBudget === undefined) {
    cfg.frameBudget = +process.env.FRAME_BUDGET;
}

const PORT = 7300 + Math.floor(Math.random() * 600);
const server = await serve(PORT);

// --- WATCHDOG -------------------------------------------------------------------------------------
// Every step below can hang on a machine whose GPU stack is unhealthy: the browser may never launch,
// and requestAdapter() is specified to return a promise that can simply never settle. Unbounded, that
// turns this test into something that can wedge a CI job for its full timeout, which is far worse than
// not running at all. So the whole run is time-boxed and reports the phase it died in.
let phase = "launching browser";
const t0 = Date.now();
const setPhase = (p) => {
    phase = p;
    if (process.env.CI) {
        console.log(`WEBGPU-XR: phase=${p} (+${Date.now() - t0}ms)`);
    }
};
const STEP_TIMEOUT_MS = +(process.env.STEP_TIMEOUT_MS || 180000);
const watchdog = setTimeout(async () => {
    console.log(`WEBGPU-XR: SKIPPED - timed out after ${STEP_TIMEOUT_MS}ms while "${phase}". The GPU stack on this machine could not run the test.`);
    // Without the page's own milestone log, a timeout says only "it was slow" and not which stage was
    // slow, which is the only thing that makes the next attempt cheaper.
    try {
        const log = await Promise.race([globalThis.__page?.evaluate(() => (window.__HARNESS && window.__HARNESS.log) || []), new Promise((r) => setTimeout(() => r(null), 5000))]);
        if (log && log.length) {
            console.log(`WEBGPU-XR: last page milestones:\n  ${log.slice(-8).join("\n  ")}`);
        } else {
            console.log("WEBGPU-XR: the page reported no milestones (its main thread never yielded).");
        }
    } catch {
        console.log("WEBGPU-XR: could not read page milestones.");
    }
    process.exit(process.env.ALLOW_NO_WEBGPU === "1" ? 0 : 1);
}, STEP_TIMEOUT_MS);

setPhase("launching browser");
const browser = await chromium.launch({
    ...(process.env.CHANNEL ? { channel: process.env.CHANNEL } : {}),
    headless: process.env.HEADED !== "1",
    args: ["--use-angle=default", "--enable-unsafe-webgpu", ...(process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(" ") : [])],
});
setPhase("opening page");
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
globalThis.__page = page;

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

setPhase("probing for a WebGPU adapter");
await page.goto(`http://127.0.0.1:${PORT}/__probe`);
const ADAPTER_TIMEOUT_MS = +(process.env.ADAPTER_TIMEOUT_MS || 60000);
const adapter = await Promise.race([
    page
        .evaluate(async () => {
            if (!navigator.gpu) {
                return null;
            }
            const a = await navigator.gpu.requestAdapter();
            if (!a) {
                return null;
            }
            const i = a.info || {};
            return `${i.vendor || "?"}/${i.architecture || "?"}`;
        })
        .catch((e) => `__error__:${String(e).split("\n")[0]}`),
    new Promise((r) => setTimeout(() => r("__timeout__"), ADAPTER_TIMEOUT_MS)),
]);
if (!adapter || adapter === "__timeout__" || String(adapter).startsWith("__error__")) {
    // Printed so a CI log can be grepped to prove whether this test really ran. A regression test that
    // silently no-ops is worse than no test, so the skip is loud and only tolerated when asked for.
    const why = adapter === "__timeout__" ? `requestAdapter() did not settle within ${ADAPTER_TIMEOUT_MS}ms` : adapter ? String(adapter).slice(10) : "no WebGPU adapter available";
    console.log(`WEBGPU-XR: SKIPPED - ${why}.`);
    clearTimeout(watchdog);
    await browser.close().catch(() => {});
    server.close();
    process.exit(process.env.ALLOW_NO_WEBGPU === "1" ? 0 : 1);
}
console.log(`WEBGPU-XR: RAN - WebGPU adapter = ${adapter}`);

setPhase("rendering frames");
// A renderer crash (SwiftShader exhausting a small /dev/shm in a CI container is the classic case)
// otherwise surfaces later as an opaque "Target crashed" thrown from page.evaluate. Catching it here
// turns it into a diagnosable infrastructure skip instead of an uncaught throw.
let crashed = false;
page.on("crash", () => {
    crashed = true;
    console.log("WEBGPU-XR: the browser tab crashed (renderer process died).");
});
await page.goto(`http://127.0.0.1:${PORT}/harness.html`);

// Bounded independently of the watchdog, so a slow agent can be given more room without loosening the
// overall time box.
const HARNESS_WAIT_MS = +(process.env.HARNESS_WAIT_MS || 90000);
await page
    .waitForFunction(() => window.__HARNESS && window.__HARNESS.done, null, { timeout: HARNESS_WAIT_MS })
    .catch(() => console.log(`  !! timed out waiting for harness after ${HARNESS_WAIT_MS}ms`));
setPhase("reading back pixels");
clearTimeout(watchdog);

if (crashed) {
    console.log("WEBGPU-XR: SKIPPED - the browser tab crashed, so the run proves nothing either way.");
    await browser.close().catch(() => {});
    server.closeAllConnections?.();
    server.close();
    process.exit(process.env.ALLOW_NO_WEBGPU === "1" ? 0 : 1);
}

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
// `server.close()` only stops new connections; keep-alive sockets from the page keep the handle open,
// which left the process lingering ~60s after the verdict was already known. Kill them explicitly.
server.closeAllConnections?.();
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
process.exit(0);
