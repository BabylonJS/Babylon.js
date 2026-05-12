/**
 * ES6 Visualization Tests
 *
 * Verifies that three ES6 import styles produce visually identical renders:
 *   1. barrel  — `import { ... } from "@babylonjs/core"`
 *   2. deep    — `import { Engine } from "@babylonjs/core/Engines/engine"` etc.
 *   3. pure    — `import { ... } from "@babylonjs/core/pure"` + registrations
 *
 * Each style renders the same scene to an 800×600 canvas. Screenshots are
 * compared against a single committed reference image per scene.
 *
 * Scenes are auto-discovered: any subdirectory under es6Vis/src/scenes/ that
 * contains barrel.ts, deep.ts, and pure.ts is picked up automatically.
 *
 * Prerequisites: `npm run build:es6` must have been run.
 */

import * as fs from "fs";
import * as path from "path";
import { test, expect } from "@playwright/test";

const STYLES = ["barrel", "deep", "pure"] as const;

/** Maximum allowed pixel difference ratio (0.01 = 1%). */
const MAX_DIFF_PIXEL_RATIO = 0.01;

/** Auto-discover scene directories. */
const scenesDir = path.resolve(__dirname, "../../es6Vis/src/scenes");
const SCENES = fs.readdirSync(scenesDir).filter((name) => {
    const dir = path.join(scenesDir, name);
    return fs.statSync(dir).isDirectory() && STYLES.every((style) => fs.existsSync(path.join(dir, `${style}.ts`)));
});

for (const sceneName of SCENES) {
    test.describe(`ES6 Vis: ${sceneName}`, () => {
        for (const style of STYLES) {
            test(`${style} import renders correctly`, async ({ page }) => {
                await page.goto(`/?scene=${sceneName}&style=${style}`);

                // Wait for the render loop to signal readiness
                await page.waitForFunction(() => (window as Record<string, unknown>).__ready === true, null, { timeout: 30_000 });

                // Grab the canvas element
                const canvas = page.locator("#renderCanvas");
                await expect(canvas).toBeVisible();

                // Screenshot the canvas and compare against the shared reference
                const screenshot = await canvas.screenshot();
                expect(screenshot).toMatchSnapshot(`es6vis-${sceneName}.png`, {
                    maxDiffPixelRatio: MAX_DIFF_PIXEL_RATIO,
                });
            });
        }
    });
}
