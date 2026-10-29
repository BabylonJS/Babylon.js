import { expect, test } from "@playwright/test";
import { type AnimationManager, type EngineContext, type FgRuntime, type Mesh, type SceneContext, type getViewProjectionMatrix, type stopAnimationManager } from "@babylonjs/lite";
import sharp from "sharp";

type LiteTestWindow = Window &
    typeof globalThis & {
        liteDefaultFlowGraph: FgRuntime;
        liteAttachFlowGraph: () => Promise<FgRuntime>;
        liteDetachFlowGraph: (runtime: FgRuntime) => void;
        liteFlowGraphCount: () => number;
        liteFlowGraphRuntimes: () => FgRuntime[];
        liteBlueSphereGlowing: () => boolean;
        liteBlueSpherePickCount: () => number;
        liteAnimationManager: AnimationManager;
        liteStopAnimationManager: typeof stopAnimationManager;
        liteEngine: EngineContext;
        litePrimaryScene: SceneContext;
        liteMeshes: Mesh[];
        liteGetViewProjectionMatrix: typeof getViewProjectionMatrix;
        testFlowGraph?: FgRuntime;
        debugNode: object | null;
    };

const TestUrl = `http://localhost:${process.env.INSPECTOR_TEST_PORT ?? "9001"}/?experience=lite&physics=off`;

test.skip(!process.env.INSPECTOR_TEST_PORT, "Set INSPECTOR_TEST_PORT to a running Inspector test app to run the Lite WebGPU UI tests.");

test.use({
    browserName: "chromium",
    channel: "chrome",
    launchOptions: {
        args: ["--enable-unsafe-webgpu", "--ignore-gpu-blocklist", ...(process.env.CUSTOM_FLAGS?.split(" ") ?? [])],
    },
});

test("Lite Inspector shows the running default flow graph without editor commands or properties", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(TestUrl);
    await page.waitForFunction(() => "liteDefaultFlowGraph" in window);
    expect(
        await page.evaluate(() => {
            const state = window as LiteTestWindow;
            return {
                count: state.liteFlowGraphCount(),
                isDefault: state.liteFlowGraphRuntimes()[0] === state.liteDefaultFlowGraph,
            };
        })
    ).toEqual({ count: 1, isDefault: true });
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).liteDefaultFlowGraph.started)).toBe(true);

    const scene = page.getByRole("treeitem", { name: "Scene", exact: true });
    await scene.click();
    await scene.press("ArrowRight");
    const graphs = page.getByRole("treeitem", { name: "Flow Graphs", exact: true });
    await graphs.click();
    await graphs.press("ArrowRight");
    const runtime = page.getByRole("treeitem", { name: "Unnamed Flow Graph", exact: true });
    await expect(runtime).toHaveCount(1);
    await expect(runtime).toBeVisible();
    await runtime.click();
    await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).liteDefaultFlowGraph)).toBe(true);
    // The existing shared Pinned and Animation sections also apply to plain runtime objects.
    await expect(page.locator(".fui-AccordionHeader")).toHaveText(["Pinned", "Animation"]);
    await expect(page.getByRole("group", { name: "No Animations", exact: true })).toBeVisible();
    await expect(runtime.getByRole("button")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Edit Graph", exact: true })).toHaveCount(0);
    await runtime.click({ button: "right" });
    await expect(page.getByRole("menuitem", { name: "Edit Graph", exact: true })).toHaveCount(0);
    await page.keyboard.press("Escape");

    expect(
        await page.evaluate(() => {
            const state = window as LiteTestWindow;
            try {
                state.liteDetachFlowGraph(state.liteDefaultFlowGraph);
            } catch (error) {
                return error instanceof Error ? error.message : String(error);
            }
            return null;
        })
    ).toBe("The default flow graph belongs to the Lite test scene and must not be detached.");
    expect(await page.evaluate(() => (window as LiteTestWindow).liteFlowGraphCount())).toBe(1);
    expect(await page.evaluate(() => (window as LiteTestWindow).liteDefaultFlowGraph.started)).toBe(true);
    expect(errors).toEqual([]);
});

test("Lite Inspector default flow graph ignores bounding-box-only and occluded sphere clicks", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(TestUrl);
    await page.waitForFunction(() => {
        const state = window as LiteTestWindow;
        return state.liteDefaultFlowGraph?.started && state.liteMeshes[1].worldMatrix[12] !== 0;
    });
    await page.evaluate(() => {
        const state = window as LiteTestWindow;
        state.liteStopAnimationManager(state.liteAnimationManager);
    });
    const setup = await page.evaluate(() => {
        const state = window as LiteTestWindow;
        const camera = state.litePrimaryScene.camera;
        if (!camera) {
            throw new Error("The Lite test scene has no camera.");
        }
        const canvas = state.liteEngine.canvas as HTMLCanvasElement;
        const matrix = state.liteGetViewProjectionMatrix(camera, canvas.width / canvas.height);
        const world = state.liteMeshes[1].worldMatrix;
        const rect = canvas.getBoundingClientRect();
        const project = (x: number, y: number, z: number) => {
            const worldX = world[0] * x + world[4] * y + world[8] * z + world[12];
            const worldY = world[1] * x + world[5] * y + world[9] * z + world[13];
            const worldZ = world[2] * x + world[6] * y + world[10] * z + world[14];
            const w = matrix[3] * worldX + matrix[7] * worldY + matrix[11] * worldZ + matrix[15];
            const ndcX = (matrix[0] * worldX + matrix[4] * worldY + matrix[8] * worldZ + matrix[12]) / w;
            const ndcY = (matrix[1] * worldX + matrix[5] * worldY + matrix[9] * worldZ + matrix[13]) / w;
            return { x: rect.left + ((ndcX + 1) * rect.width) / 2, y: rect.top + ((1 - ndcY) * rect.height) / 2 };
        };
        const centre = project(0, 0, 0);
        const corners = [];
        const insetExtent = 0.95 * 0.6;
        for (const x of [-insetExtent, insetExtent]) {
            for (const y of [-insetExtent, insetExtent]) {
                for (const z of [-insetExtent, insetExtent]) {
                    corners.push(project(x, y, z));
                }
            }
        }
        corners.sort((left, right) => Math.hypot(right.x - centre.x, right.y - centre.y) - Math.hypot(left.x - centre.x, left.y - centre.y));
        const smallBox = state.liteMeshes[2];
        return {
            centre,
            corner: corners[0],
            background: { x: rect.left + rect.width / 2, y: rect.top + 100 },
            originalPosition: [smallBox.position.x, smallBox.position.y, smallBox.position.z],
            originalWorld: [smallBox.worldMatrix[12], smallBox.worldMatrix[13], smallBox.worldMatrix[14]],
        };
    });
    const pixelAt = async (point: { x: number; y: number }) =>
        sharp(await page.screenshot({ clip: { x: Math.floor(point.x), y: Math.floor(point.y), width: 1, height: 1 } }))
            .removeAlpha()
            .raw()
            .toBuffer();
    const completedPicks = () => page.evaluate(() => (window as LiteTestWindow).liteBlueSpherePickCount());
    const isGlowing = () => page.evaluate(() => (window as LiteTestWindow).liteBlueSphereGlowing());

    try {
        expect(await isGlowing()).toBe(false);
        const background = await pixelAt(setup.background);
        const corner = await pixelAt(setup.corner);
        expect(Math.max(...corner.map((value, index) => Math.abs(value - background[index])))).toBeLessThan(20);
        const beforeCorner = await completedPicks();
        await page.mouse.click(setup.corner.x, setup.corner.y);
        await expect.poll(completedPicks).toBe(beforeCorner + 1);
        expect(await isGlowing()).toBe(false);

        await page.evaluate(() => {
            const state = window as LiteTestWindow;
            const camera = state.litePrimaryScene.camera;
            if (!camera) {
                throw new Error("The Lite test scene has no camera.");
            }
            const sphereWorld = state.liteMeshes[1].worldMatrix;
            const smallBox = state.liteMeshes[2];
            const dx = camera.worldMatrix[12] - sphereWorld[12];
            const dy = camera.worldMatrix[13] - sphereWorld[13];
            const dz = camera.worldMatrix[14] - sphereWorld[14];
            const distance = Math.hypot(dx, dy, dz);
            smallBox.position.set(
                sphereWorld[12] + dx / distance - (smallBox.worldMatrix[12] - smallBox.position.x),
                sphereWorld[13] + dy / distance - (smallBox.worldMatrix[13] - smallBox.position.y),
                sphereWorld[14] + dz / distance - (smallBox.worldMatrix[14] - smallBox.position.z)
            );
        });
        await expect
            .poll(async () => {
                const pixel = await pixelAt(setup.centre);
                return pixel[0] > pixel[1] + 40 && pixel[0] > pixel[2] + 40;
            })
            .toBe(true);
        const beforeOccluded = await completedPicks();
        await page.mouse.click(setup.centre.x, setup.centre.y);
        await expect.poll(completedPicks).toBe(beforeOccluded + 1);
        expect(await isGlowing()).toBe(false);
    } finally {
        await page.evaluate((position) => {
            (window as LiteTestWindow).liteMeshes[2].position.set(position[0], position[1], position[2]);
        }, setup.originalPosition);
        await expect
            .poll(() =>
                page.evaluate(() => {
                    const world = (window as LiteTestWindow).liteMeshes[2].worldMatrix;
                    return [world[12], world[13], world[14]];
                })
            )
            .toEqual(setup.originalWorld);
    }

    await page.mouse.click(setup.centre.x, setup.centre.y);
    await expect.poll(isGlowing).toBe(true);
    await page.mouse.click(setup.centre.x, setup.centre.y);
    await expect.poll(isGlowing).toBe(false);
    expect(
        await page.evaluate(() => {
            const state = window as LiteTestWindow;
            return {
                count: state.liteFlowGraphCount(),
                isDefault: state.liteFlowGraphRuntimes()[0] === state.liteDefaultFlowGraph,
                started: state.liteDefaultFlowGraph.started,
            };
        })
    ).toEqual({ count: 1, isDefault: true, started: true });
    expect(errors).toEqual([]);
});

test("Lite Inspector default flow graph repeatedly toggles sphere color on clicks while ignoring drags and other targets", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1600, height: 900 });
    await page.goto(TestUrl);
    await page.waitForFunction(() => {
        const state = window as LiteTestWindow;
        return state.liteDefaultFlowGraph?.started && state.liteMeshes[1].worldMatrix[12] !== 0;
    });

    const getCanvasPoint = async (index = 1) =>
        page.evaluate((index) => {
            const state = window as LiteTestWindow;
            const camera = state.litePrimaryScene.camera;
            if (!camera) {
                throw new Error("The Lite test scene has no camera.");
            }
            const canvas = state.liteEngine.canvas as HTMLCanvasElement;
            const matrix = state.liteGetViewProjectionMatrix(camera, canvas.width / canvas.height);
            const world = state.liteMeshes[index].worldMatrix;
            const [x, y, z] = [world[12], world[13], world[14]];
            const w = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15];
            const ndcX = (matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12]) / w;
            const ndcY = (matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13]) / w;
            const rect = canvas.getBoundingClientRect();
            return { x: rect.left + ((ndcX + 1) * rect.width) / 2, y: rect.top + ((1 - ndcY) * rect.height) / 2 };
        }, index);
    const readSpherePixel = async () => {
        const point = await getCanvasPoint();
        return sharp(await page.screenshot({ clip: { x: Math.floor(point.x), y: Math.floor(point.y), width: 1, height: 1 } }))
            .removeAlpha()
            .raw()
            .toBuffer();
    };
    const isGlowing = () => page.evaluate(() => (window as LiteTestWindow).liteBlueSphereGlowing());
    const clickSphere = async (glowing: boolean) => {
        const point = await getCanvasPoint();
        await page.mouse.click(point.x, point.y);
        await expect.poll(isGlowing).toBe(glowing);
    };

    expect(await isGlowing()).toBe(false);
    const baseline = await readSpherePixel();
    await clickSphere(true);
    await expect.poll(async () => (await readSpherePixel())[0]).toBeGreaterThan(baseline[0] + 80);
    await clickSphere(false);
    await expect
        .poll(async () => {
            const restored = await readSpherePixel();
            return Math.max(...baseline.map((value, index) => Math.abs(restored[index] - value)));
        })
        .toBeLessThan(20);
    await clickSphere(true);
    await clickSphere(false);

    const canvasBounds = await page.locator("#canvas").boundingBox();
    if (!canvasBounds) {
        throw new Error("The primary canvas is not visible.");
    }
    await page.mouse.click(canvasBounds.x + canvasBounds.width / 2, canvasBounds.y + 100);
    expect(await isGlowing()).toBe(false);
    const box = await getCanvasPoint(0);
    await page.mouse.click(box.x, box.y);
    expect(await isGlowing()).toBe(false);
    const sphere = await getCanvasPoint();
    await page.mouse.move(sphere.x, sphere.y);
    await page.mouse.down();
    await page.mouse.move(sphere.x + 30, sphere.y, { steps: 6 });
    await page.mouse.up();
    expect(await isGlowing()).toBe(false);
    const nextSphere = await getCanvasPoint();
    await page.mouse.move(nextSphere.x, nextSphere.y);
    await page.mouse.down();
    await page.mouse.move(nextSphere.x + 30, nextSphere.y, { steps: 6 });
    await page.mouse.move(nextSphere.x, nextSphere.y, { steps: 6 });
    await page.mouse.up();
    expect(await isGlowing()).toBe(false);

    try {
        await page.evaluate(async () => {
            const state = window as LiteTestWindow;
            state.testFlowGraph = await state.liteAttachFlowGraph();
        });
        await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).testFlowGraph!.started)).toBe(true);
        expect(await page.evaluate(() => (window as LiteTestWindow).liteFlowGraphCount())).toBe(2);
        await clickSphere(true);
        await clickSphere(false);
        await page.evaluate(() => {
            const state = window as LiteTestWindow;
            state.liteDetachFlowGraph(state.testFlowGraph!);
            delete state.testFlowGraph;
        });
        await clickSphere(true);
        await clickSphere(false);
        expect(
            await page.evaluate(() => {
                const state = window as LiteTestWindow;
                return {
                    count: state.liteFlowGraphCount(),
                    isDefault: state.liteFlowGraphRuntimes()[0] === state.liteDefaultFlowGraph,
                    started: state.liteDefaultFlowGraph.started,
                };
            })
        ).toEqual({ count: 1, isDefault: true, started: true });
    } finally {
        await page.evaluate(() => {
            const state = window as LiteTestWindow;
            if (state.testFlowGraph && state.liteFlowGraphRuntimes().includes(state.testFlowGraph)) {
                state.liteDetachFlowGraph(state.testFlowGraph);
            }
            delete state.testFlowGraph;
        });
    }
    expect(errors).toEqual([]);
});

test("Lite Inspector attaches, selects, and removes an extra flow graph while preserving the default", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(TestUrl);
    await page.waitForFunction(() => "liteDefaultFlowGraph" in window);
    const scene = page.getByRole("treeitem", { name: "Scene", exact: true });
    await scene.click();
    await scene.press("ArrowRight");
    const graphs = page.getByRole("treeitem", { name: "Flow Graphs", exact: true });
    await graphs.click();
    await graphs.press("ArrowRight");
    const runtimes = page.getByRole("treeitem", { name: "Unnamed Flow Graph", exact: true });
    await expect(runtimes).toHaveCount(1);

    try {
        await page.evaluate(async () => {
            const state = window as LiteTestWindow;
            state.testFlowGraph = await state.liteAttachFlowGraph();
        });
        expect(
            await page.evaluate(() => {
                const state = window as LiteTestWindow;
                const attached = state.liteFlowGraphRuntimes();
                return {
                    count: state.liteFlowGraphCount(),
                    hasDefault: attached.includes(state.liteDefaultFlowGraph),
                    hasExtra: attached.includes(state.testFlowGraph!),
                };
            })
        ).toEqual({ count: 2, hasDefault: true, hasExtra: true });
        await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).testFlowGraph!.started)).toBe(true);
        await expect(runtimes).toHaveCount(2);
        await runtimes.nth(1).click();
        await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode === (window as LiteTestWindow).testFlowGraph)).toBe(true);

        expect(
            await page.evaluate(() => {
                const state = window as LiteTestWindow;
                const extra = state.testFlowGraph!;
                state.liteDetachFlowGraph(extra);
                delete state.testFlowGraph;
                const attached = state.liteFlowGraphRuntimes();
                return {
                    count: state.liteFlowGraphCount(),
                    hasDefault: attached.includes(state.liteDefaultFlowGraph),
                    hasExtra: attached.includes(extra),
                    defaultStarted: state.liteDefaultFlowGraph.started,
                };
            })
        ).toEqual({ count: 1, hasDefault: true, hasExtra: false, defaultStarted: true });
        await expect(runtimes).toHaveCount(1);
        await expect(graphs).toBeVisible();
        await expect.poll(() => page.evaluate(() => (window as LiteTestWindow).debugNode)).toBeNull();
    } finally {
        await page.evaluate(() => {
            const state = window as LiteTestWindow;
            if (state.testFlowGraph && state.liteFlowGraphRuntimes().includes(state.testFlowGraph)) {
                state.liteDetachFlowGraph(state.testFlowGraph);
            }
            delete state.testFlowGraph;
        });
    }
    expect(errors).toEqual([]);
});
