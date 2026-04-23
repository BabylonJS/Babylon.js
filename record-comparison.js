// Records comparison videos: localhost (with fix) vs public (legacy) playground
// Usage: node record-comparison.js
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const SNIPPET = "#HU04H3#0";
const OUT_DIR = path.resolve(__dirname, "comparison-videos");
if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function record(label, url) {
    console.log(`[${label}] launching browser...`);
    const browser = await chromium.launch({
        headless: true,
        args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
    });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        recordVideo: { dir: OUT_DIR, size: { width: 1280, height: 720 } },
    });
    const page = await context.newPage();
    page.on("console", (msg) => console.log(`[${label}/console]`, msg.text()));

    console.log(`[${label}] loading ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });

    // Wait for the render canvas to appear (Playground lazy-loads it)
    await page.waitForSelector("#renderCanvas", { state: "attached", timeout: 90000 });
    // Give the scene time to fully initialize and render
    await page.waitForTimeout(10000);

    const canvas = await page.$("#renderCanvas");
    const box = await canvas.boundingBox();
    console.log(`[${label}] canvas box`, box);
    if (!box || box.width < 50 || box.height < 50) {
        // Canvas may be hidden under the editor; force the canvas area into view by hiding the editor
        await page.evaluate(() => {
            const monaco = document.querySelector("#monacoHost") || document.querySelector(".vs-dark");
            if (monaco) (monaco).style.display = "none";
            const canvasZone = document.querySelector("#canvasZone");
            if (canvasZone) {
                (canvasZone).style.position = "fixed";
                (canvasZone).style.top = "0";
                (canvasZone).style.left = "0";
                (canvasZone).style.width = "100%";
                (canvasZone).style.height = "100%";
            }
            window.dispatchEvent(new Event("resize"));
        });
        await page.waitForTimeout(2000);
    }
    const finalBox = (await canvas.boundingBox()) || box;
    console.log(`[${label}] using box`, finalBox);

    // Perform the drag inside the canvas — left-to-right then release
    const startX = finalBox.x + finalBox.width * 0.3;
    const endX = finalBox.x + finalBox.width * 0.7;
    const y = finalBox.y + finalBox.height * 0.5;

    await page.mouse.move(startX, y);
    await page.mouse.down();
    // Move smoothly across in steps
    const steps = 30;
    for (let i = 1; i <= steps; i++) {
        const x = startX + ((endX - startX) * i) / steps;
        await page.mouse.move(x, y, { steps: 1 });
        await page.waitForTimeout(15);
    }
    await page.mouse.up();
    console.log(`[${label}] drag complete, recording inertia tail...`);

    // Let inertia play out
    await page.waitForTimeout(4000);

    await page.close();
    await context.close();
    await browser.close();

    // Find the freshly written video file in OUT_DIR and rename it
    const files = fs.readdirSync(OUT_DIR).filter((f) => f.endsWith(".webm"));
    const newest = files
        .map((f) => ({ f, mtime: fs.statSync(path.join(OUT_DIR, f)).mtimeMs }))
        .sort((a, b) => b.mtime - a.mtime)[0];
    if (newest) {
        const target = path.join(OUT_DIR, `${label}.webm`);
        fs.renameSync(path.join(OUT_DIR, newest.f), target);
        console.log(`[${label}] saved -> ${target}`);
    }
}

(async () => {
    await record("local-fixed", `http://localhost:1338/${SNIPPET}`);
    await record("public-legacy", `https://playground.babylonjs.com/${SNIPPET}`);
    console.log("\nDone. Videos saved to:", OUT_DIR);
})();
