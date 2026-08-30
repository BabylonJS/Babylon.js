import { test, expect, type Page } from "@playwright/test";
import { getGlobalConfig, evaluateInitEngine, evaluateCreateScene, evaluateDisposeEngine } from "@tools/test-tools";

let page: Page;

/**
 * Equivalence integration test (runs under BOTH the webgl2 and webgpu Playwright projects):
 * mutating a MultiTexture via insertLayerAsync / removeLayerAsync / addLayerAsync must produce
 * byte-for-byte the same layers and the same presented composite as instantiating the texture
 * with the same final layer combination. Covers the semitransparent + oversized-source case that
 * previously produced a black / divergent composite (1024px sources into a 128x128 texture).
 */
test.describe("MultiTexture layered ops equivalence", () => {
    test.beforeAll(async ({ browser }, testInfo) => {
        page = await browser.newPage();
        await page.setViewportSize({ width: 16, height: 16 });
        await page.goto(getGlobalConfig().baseUrl + `/empty.html`, { waitUntil: "load", timeout: 0 });
        await page.waitForSelector("#babylon-canvas", { timeout: 20000 });
        await page.waitForFunction(() => (window as any).BABYLON);
        page.setDefaultTimeout(0);
    });

    test.beforeEach(async ({}, testInfo) => {
        const engineName = testInfo.project.name === "webgpu" ? "webgpu" : "webgl2";
        await page.evaluate(() => {
            (window as any).scene?.dispose();
            (window as any).scene = null;
        });
        await page.evaluate(evaluateInitEngine, { engineName });
        await page.evaluate(evaluateCreateScene);
    });

    test.afterEach(async () => {
        await page.evaluate(evaluateDisposeEngine);
    });

    test.afterAll(async () => {
        await page.close();
    });

    for (const scenario of [
        {
            name: "insertLayerAsync",
            initial: ["rock", "star"],
            ops: [{ op: "insert", layer: 1, url: "circle" }],
            expected: ["rock", "circle", "star"],
        },
        {
            name: "removeLayerAsync",
            initial: ["rock", "circle", "star"],
            ops: [{ op: "remove", layer: 1 }],
            expected: ["rock", "star"],
        },
        {
            name: "addLayerAsync",
            initial: ["rock", "star"],
            ops: [{ op: "add", url: "circle" }],
            expected: ["rock", "star", "circle"],
        },
        {
            name: "mixed insert-remove-add",
            initial: ["rock"],
            ops: [
                { op: "insert", layer: 1, url: "star" },
                { op: "insert", layer: 2, url: "circle" },
                { op: "remove", layer: 0 },
                { op: "add", url: "rock" },
            ],
            expected: ["star", "circle", "rock"],
        },
    ] as const) {
        test(`${scenario.name}: mutation equals direct instantiation`, async () => {
            const diag = await page.evaluate(
                async ({ scenarioName, initial, ops, expected }) => {
                    const B = (window as any).BABYLON;
                    const scene = (window as any).scene;
                    const engine = (window as any).engine;
                    const TEX = 128;
                    const SRC = 1024;

                    const makePng = (w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void) => {
                        const canvas = document.createElement("canvas");
                        canvas.width = w;
                        canvas.height = h;
                        const ctx = canvas.getContext("2d")!;
                        paint(ctx);
                        return canvas.toDataURL("image/png");
                    };

                    const rock = makePng(SRC, SRC, (x) => {
                        x.fillStyle = "rgb(148,120,92)";
                        x.fillRect(0, 0, SRC, SRC);
                    });
                    const star = makePng(SRC, SRC, (x) => {
                        x.beginPath();
                        x.arc(SRC / 2, SRC / 2, SRC * 0.34, 0, Math.PI * 2);
                        x.fillStyle = "rgb(255,220,60)";
                        x.fill();
                    });
                    const circle = makePng(SRC, SRC, (x) => {
                        x.beginPath();
                        x.arc(SRC / 2, SRC / 2, SRC * 0.42, 0, Math.PI * 2);
                        x.fillStyle = "rgba(30,80,220,0.5019607843137255)";
                        x.fill();
                    });
                    const byName = { rock, star, circle } as Record<string, string>;

                    const build = (name: string, urls: string[], options: any = {}) =>
                        new Promise<any>((resolve, reject) => {
                            try {
                                const mt = new B.MultiTexture(name, urls, scene, {
                                    width: TEX,
                                    height: TEX,
                                    ...options,
                                    onLoad: () => resolve(mt),
                                    onError: reject,
                                });
                            } catch (e) {
                                reject(e);
                            }
                        });

                    const compositeBytes = async (mt: any): Promise<number[] | null> => {
                        // The composite re-renders asynchronously once its effect compiles, and
                        // getContent() returns null until the render target has drawn. Pump a bounded
                        // number of frames and retry instead of blocking on readiness.
                        for (let i = 0; i < 60; i++) {
                            try {
                                scene.render();
                            } catch (e) {
                                /* ignore per-frame render errors */
                            }
                            const content = await (mt as any).composite.getContent();
                            if (content) {
                                const arr = content as ArrayBufferView;
                                return Array.from(new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength));
                            }
                        }
                        return null;
                    };
                    const pixelsOf = (mt: any) => mt.pixels.map((p: Uint8ClampedArray | null) => (p ? Array.from(p) : null));

                    // Path A: mutate.
                    async function runMutations(): Promise<any> {
                        const mt = await build(
                            "mut",
                            initial.map((n) => byName[n])
                        );
                        for (const op of ops as { op: string; layer?: number; url?: string }[]) {
                            if (op.op === "insert") {
                                await mt.insertLayerAsync(op.layer!, byName[op.url!]);
                            } else if (op.op === "remove") {
                                await mt.removeLayerAsync(op.layer!);
                            } else if (op.op === "add") {
                                await mt.addLayerAsync(byName[op.url!]);
                            }
                        }
                        return mt;
                    }

                    // Path B: direct instantiation with the final combination.
                    const mtMut = await runMutations();
                    const mtDirect = await build(
                        "direct",
                        expected.map((n) => byName[n])
                    );

                    const [compositeMut, compositeDirect] = [await compositeBytes(mtMut), await compositeBytes(mtDirect)];

                    const [pixelsMut, pixelsDirect] = [pixelsOf(mtMut), pixelsOf(mtDirect)];

                    return {
                        scenario: scenarioName,
                        compositeEqual: compositeMut != null && compositeDirect != null && JSON.stringify(compositeMut) === JSON.stringify(compositeDirect),
                        compositeMutTail: compositeMut?.slice(0, 16) ?? [],
                        compositeDirectTail: compositeDirect?.slice(0, 16) ?? [],
                        pixelsEqual: JSON.stringify(pixelsMut) === JSON.stringify(pixelsDirect),
                        blank: compositeMut == null || compositeMut.length === 0 || compositeMut.every((v: number) => v === 0),
                    };
                },
                { scenarioName: scenario.name, initial: scenario.initial, ops: scenario.ops, expected: scenario.expected }
            );
            expect(diag.compositeEqual, `composite ${scenario.name}: ${JSON.stringify(diag.compositeMutTail)} vs ${JSON.stringify(diag.compositeDirectTail)}`).toBe(true);
            expect(diag.pixelsEqual, `pixels ${scenario.name} differ`).toBe(true);
            expect(diag.blank, `composite ${scenario.name} is blank/black`).toBe(false);
        });
    }
});
