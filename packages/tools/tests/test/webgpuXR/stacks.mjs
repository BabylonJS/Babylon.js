// Names the JS call site of every zero-draw render pass on a watched XR texture.
// Reasoning about "which subsystem should be rendering" has been wrong repeatedly on this bug;
// this asks the stack directly.
import { chromium } from "playwright";
import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { extname, join } from "path";

const PORT = 8899;
const ROOT = new URL("./public/", import.meta.url).pathname;
const MIME = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json" };
const srv = createServer((req, res) => {
    // Constrain every request to ROOT: `join` alone happily resolves "/../secrets" outside the harness.
    const p = join(ROOT, decodeURIComponent(req.url.split("?")[0]));
    if (!p.startsWith(ROOT) || !existsSync(p)) {
        res.writeHead(404);
        res.end();
        return;
    }
    res.writeHead(200, { "Content-Type": MIME[extname(p)] || "application/octet-stream" });
    res.end(readFileSync(p));
});
await new Promise((r) => srv.listen(PORT, "127.0.0.1", r));

const cfg = JSON.parse(process.argv[2] || "{}");
const b = await chromium.launch({ channel: "chrome", args: ["--use-angle=default", "--enable-unsafe-webgpu"] });
const page = await (await b.newContext()).newPage();
await page.addInitScript((c) => {
    window.__XRMOCK_CONFIG = c;
    window.__GPUTRACE_STACKS = true;
}, cfg);
await page.goto(`http://127.0.0.1:${PORT}/harness.html`);
await page.waitForFunction(() => window.__HARNESS && window.__HARNESS.done, null, { timeout: 90000 }).catch(() => {});

const res = await page.evaluate(() => {
    const out = [];
    const frames = (window.__GPUTRACE && window.__GPUTRACE.frames) || [];
    frames.forEach((f, fi) => {
        (f.events || []).forEach((r) => {
            if (r.kind !== "renderPass" || !r.colors || !r.colors.length) return;
            out.push({
                frame: fi,
                draws: r.draws,
                label: r.label,
                loadOp: r.colors[0].loadOp,
                layer: r.colors[0].target && r.colors[0].target.baseArrayLayer,
                stack: r.stack,
            });
        });
    });
    return out;
});

const seen = new Map();
for (const p of res) {
    if (p.draws !== 0) continue;
    const frames = (p.stack || "")
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.startsWith("at "));
    // Drop the tracer's own frames; keep the first real Babylon call sites.
    const sig = frames
        .filter((l) => !/gpu-trace\.js/.test(l))
        .slice(0, 6)
        .join("\n    ");
    const key = p.loadOp + "|" + sig;
    if (!seen.has(key)) seen.set(key, { count: 0, sample: p, sig });
    seen.get(key).count++;
}
console.log(`\ntotal passes: ${res.length}   zero-draw passes: ${res.filter((p) => p.draws === 0).length}\n`);
for (const [, v] of seen) {
    console.log(`### ZERO-DRAW PASS  loadOp=${v.sample.loadOp}  layer=${v.sample.layer}  x${v.count}  (first frame ${v.sample.frame})`);
    console.log("    " + v.sig + "\n");
}
await b.close();
srv.close();
