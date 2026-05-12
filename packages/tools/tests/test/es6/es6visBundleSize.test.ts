/**
 * ES6 Bundle Size Comparison Test
 *
 * For each scene under es6Vis/src/scenes/, bundles all three import styles
 * (barrel, deep, pure) with esbuild and asserts:
 *   - pure bundle ≤ deep bundle
 *   - deep bundle < barrel bundle
 *
 * This validates that the pure barrel and deep imports actually tree-shake
 * better than the full index barrel.
 *
 * Prerequisites: `npm run build:es6` must have been run.
 */

import { readdirSync, statSync, existsSync, mkdirSync, rmSync } from "fs";
import { join, resolve } from "path";
import { build } from "esbuild";

const STYLES = ["barrel", "deep", "pure"] as const;

const scenesDir = resolve(__dirname, "../../es6Vis/src/scenes");
const tmpDir = resolve(__dirname, "../.tmp-es6vis-bundles");

const SCENES = readdirSync(scenesDir).filter((name) => {
    const dir = join(scenesDir, name);
    return statSync(dir).isDirectory() && STYLES.every((style) => existsSync(join(dir, `${style}.ts`)));
});

async function bundleSize(entryPoint: string, outfile: string): Promise<number> {
    await build({
        entryPoints: [entryPoint],
        bundle: true,
        minify: true,
        format: "esm",
        platform: "browser",
        target: "es2022",
        outfile,
        logLevel: "silent",
        // Treat canvas/DOM globals as external (they're browser-only)
        external: [],
    });
    return statSync(outfile).size;
}

beforeAll(() => {
    mkdirSync(tmpDir, { recursive: true });
});

afterAll(() => {
    rmSync(tmpDir, { recursive: true, force: true });
});

describe.each(SCENES)("ES6 bundle size: %s", (sceneName) => {
    const sizes: Record<string, number> = {};

    beforeAll(async () => {
        for (const style of STYLES) {
            const entry = join(scenesDir, sceneName, `${style}.ts`);
            const out = join(tmpDir, `${sceneName}-${style}.mjs`);
            sizes[style] = await bundleSize(entry, out);
        }

        // Log sizes for visibility in CI output
        // eslint-disable-next-line no-console
        console.log(
            `  ${sceneName} bundle sizes: barrel=${(sizes.barrel / 1024).toFixed(0)}KB, ` +
                `deep=${(sizes.deep / 1024).toFixed(0)}KB, ` +
                `pure=${(sizes.pure / 1024).toFixed(0)}KB`
        );
    });

    test("pure ≤ deep", () => {
        expect(sizes.pure).toBeLessThanOrEqual(sizes.deep);
    });

    test("deep < barrel", () => {
        expect(sizes.deep).toBeLessThan(sizes.barrel);
    });
});
