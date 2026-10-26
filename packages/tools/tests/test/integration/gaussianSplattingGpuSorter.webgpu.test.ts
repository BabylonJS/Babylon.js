import { expect, test, type Page } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateInitEngineForVisualization } from "../playwright/visualizationPlaywright.utils";

// Opt-in WebGPU regression for the Gaussian Splatting GPU radix sort. It runs the real compute pipeline, reads the sorted index
// buffer back and compares it, padding included, with a CPU reference of the documented ordering: back-to-front (farthest first),
// 16-bit depth keys quantized over the depth range of the bounds, stable for equal keys, only splats inside the intervals.
// The .webgpu suffix includes this suite in the BrowserStack WebGPU CI job, without matching WebGL-only projects.

type CameraKind = "z" | "negx" | "general";

interface IGpuSortStage {
    label: string;
    vertexCount: number;
    intervals: number[] | null;
    cameras: CameraKind[];
}

interface IGpuSortCase {
    textureCount: number;
    stages: IGpuSortStage[];
}

interface IGpuSortStageResult {
    label: string;
    problems: string[];
    paddedCount: number[];
    activeCount: number;
    outputsDiffer: boolean;
}

const runGpuSortCase = async (testCase: IGpuSortCase): Promise<IGpuSortStageResult[]> => {
    const B = window.BABYLON;
    const engine = window.engine as import("core/Engines/webgpuEngine").WebGPUEngine;
    const Sorter = B.GaussianSplattingGpuSorter;
    const textureWidth = 1024;
    const maxKey = 65535;
    const coordMax = 65535;

    // Centers are k + 0.25 with integer k in [0, 65535]: depths are exact in float32 for the axis-aligned cameras, and the
    // quantization scale is exactly 1, so the GPU keys can be reproduced bit for bit. 30% of the coordinates come from a small
    // pool of values, which creates many equal keys to check the stability of the sort.
    let seed = 0x9e3779b9;
    const random = () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const pool: number[] = [];
    for (let i = 0; i < 64; i++) {
        pool.push(Math.floor(random() * 65536));
    }
    const coordinate = () => (random() < 0.3 ? pool[Math.floor(random() * pool.length)] : Math.floor(random() * 65536)) + 0.25;

    const height = Math.max(1, Math.ceil(testCase.textureCount / textureWidth));
    const centers = new Float32Array(textureWidth * height * 4);
    for (let i = 0; i < testCase.textureCount; i++) {
        centers[i * 4] = coordinate();
        centers[i * 4 + 1] = coordinate();
        centers[i * 4 + 2] = coordinate();
        centers[i * 4 + 3] = 1;
    }
    const texture = B.RawTexture.CreateRGBATexture(centers, textureWidth, height, engine, false, false, B.Constants.TEXTURE_NEAREST_SAMPLINGMODE, B.Constants.TEXTURETYPE_FLOAT);

    const cameras = {
        z: {
            world: B.Matrix.Identity(),
            view: B.Matrix.Identity(),
            rightHanded: false,
        },
        // The forward axis of this view is +x and the scene is right-handed: depth = -x.
        negx: {
            world: B.Matrix.Identity(),
            view: B.Matrix.FromArray([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1]),
            rightHanded: true,
        },
        general: {
            world: B.Matrix.Compose(new B.Vector3(0.01, 0.02, 0.015), B.Quaternion.FromEulerAngles(0.4, 1.1, -0.7), new B.Vector3(3, -2, 5)),
            view: B.Matrix.LookAtLH(new B.Vector3(-100, 50, -400), new B.Vector3(300, 300, 300), B.Vector3.Up()),
            rightHanded: false,
        },
    };
    const depthOf = (kind: CameraKind, x: number, y: number, z: number) => {
        if (kind === "z") {
            return z;
        }
        if (kind === "negx") {
            return -x;
        }
        const position = B.Vector3.TransformCoordinates(B.Vector3.TransformCoordinates(new B.Vector3(x, y, z), cameras.general.world), cameras.general.view);
        return position.z;
    };

    const sorter = new Sorter(engine, "gpuSortTest");
    const outputs: import("core/Meshes/GaussianSplatting/gaussianSplattingGpuSorter").GaussianSplattingGpuSortOutput[] = [];
    const results: IGpuSortStageResult[] = [];
    const sleep = async () => await new Promise<void>((resolve) => setTimeout(resolve, 8));

    try {
        await Sorter.LoadDependenciesAsync();

        for (const stage of testCase.stages) {
            const problems: string[] = [];
            const vertexCount = stage.vertexCount;
            sorter.setSource({ vertexCount, textureWidth, centersTexture: texture, boundsMin: [0, 0, 0], boundsMax: [coordMax, coordMax, coordMax] });
            sorter.setIntervals(stage.intervals);
            while (outputs.length < stage.cameras.length) {
                outputs.push(sorter.createOutput());
            }

            // The compute shaders compile asynchronously: sort() only enqueues once they are ready. All the outputs are sorted in the same frame.
            let sorted = false;
            for (let frame = 0; frame < 1000 && !sorted; frame++) {
                engine.beginFrame();
                const enqueued = stage.cameras.map((kind, index) =>
                    sorter.sort(outputs[index], cameras[kind].world, cameras[kind].view, { rightHanded: cameras[kind].rightHanded })
                );
                engine.endFrame();
                sorted = enqueued.every((value) => value);
                await sleep();
            }
            if (!sorted) {
                problems.push("sort() never enqueued");
            }

            // Source splat of each sorted slot.
            const sources: number[] = [];
            if (stage.intervals) {
                for (let i = 0; i + 1 < stage.intervals.length; i += 2) {
                    const start = Math.min(Math.max(stage.intervals[i], 0), vertexCount);
                    const length = Math.min(Math.max(stage.intervals[i + 1], 0), vertexCount - start);
                    for (let j = 0; j < length; j++) {
                        sources.push(start + j);
                    }
                }
            } else {
                for (let i = 0; i < vertexCount; i++) {
                    sources.push(i);
                }
            }
            const activeCount = sources.length;
            const paddedCount = Math.max((activeCount + 15) & ~15, 16);

            const readOutputs: Float32Array[] = [];
            const paddedCounts: number[] = [];
            for (let index = 0; index < stage.cameras.length; index++) {
                const kind = stage.cameras[index];
                const output = outputs[index];
                paddedCounts.push(output.paddedCount);
                if (output.paddedCount !== paddedCount || output.instanceCount !== paddedCount / 16) {
                    problems.push(`output ${index}: paddedCount ${output.paddedCount} / instanceCount ${output.instanceCount}, expected ${paddedCount} / ${paddedCount / 16}`);
                }
                const actual = new Float32Array(paddedCount);
                await output.buffer!.read(0, paddedCount * Float32Array.BYTES_PER_ELEMENT, actual, true);
                readOutputs.push(actual);

                const depths = new Float64Array(activeCount);
                for (let slot = 0; slot < activeCount; slot++) {
                    const src = sources[slot];
                    depths[slot] = depthOf(kind, centers[src * 4], centers[src * 4 + 1], centers[src * 4 + 2]);
                }
                let depthMin = Infinity;
                let depthMax = -Infinity;
                for (let corner = 0; corner < 8; corner++) {
                    const depth = depthOf(kind, corner & 1 ? coordMax : 0, corner & 2 ? coordMax : 0, corner & 4 ? coordMax : 0);
                    depthMin = Math.min(depthMin, depth);
                    depthMax = Math.max(depthMax, depth);
                }
                const scale = maxKey / (depthMax - depthMin);

                const padding = actual.subarray(activeCount);
                for (let i = 0; i < padding.length; i++) {
                    if (padding[i] !== vertexCount) {
                        problems.push(`output ${index}: padding slot ${activeCount + i} is ${padding[i]}, expected ${vertexCount}`);
                        break;
                    }
                }

                if (kind !== "general") {
                    const keys = new Uint32Array(activeCount);
                    for (let slot = 0; slot < activeCount; slot++) {
                        keys[slot] = Math.floor(Math.min(Math.max((depthMax - depths[slot]) * scale, 0), maxKey));
                    }
                    // Array.prototype.sort is stable, but the slot is compared anyway so the reference does not depend on it.
                    const order = Array.from({ length: activeCount }, (_, slot) => slot).sort((a, b) => keys[a] - keys[b] || a - b);
                    let mismatches = 0;
                    for (let slot = 0; slot < activeCount; slot++) {
                        const expected = sources[order[slot]];
                        if (actual[slot] !== expected) {
                            if (mismatches++ === 0) {
                                problems.push(`output ${index} (${kind}): slot ${slot} is ${actual[slot]}, expected ${expected} (key ${keys[order[slot]]})`);
                            }
                        }
                    }
                    if (mismatches > 0) {
                        problems.push(`output ${index} (${kind}): ${mismatches}/${activeCount} slots differ from the CPU reference`);
                    }
                } else {
                    // Arbitrary matrices round differently on the CPU and the GPU: check that the output is a permutation of the active
                    // splats and that it is ordered back-to-front up to one quantization step.
                    const slotOfSource = new Map<number, number>();
                    for (let slot = 0; slot < activeCount; slot++) {
                        slotOfSource.set(sources[slot], slot);
                    }
                    const seen = new Uint8Array(activeCount);
                    let invalid = 0;
                    for (let slot = 0; slot < activeCount; slot++) {
                        const sourceSlot = slotOfSource.get(actual[slot]);
                        if (sourceSlot === undefined || seen[sourceSlot]) {
                            invalid++;
                        } else {
                            seen[sourceSlot] = 1;
                        }
                    }
                    if (invalid > 0) {
                        problems.push(`output ${index} (${kind}): ${invalid} slots are not a permutation of the active splats`);
                    } else {
                        const step = 1 / scale;
                        let misordered = 0;
                        for (let slot = 0; slot + 1 < activeCount; slot++) {
                            const a = depths[slotOfSource.get(actual[slot])!];
                            const b = depths[slotOfSource.get(actual[slot + 1])!];
                            if (a < b - step * 1.001) {
                                misordered++;
                            }
                        }
                        if (misordered > 0) {
                            problems.push(`output ${index} (${kind}): ${misordered} neighbouring slots are not back-to-front`);
                        }
                    }
                }
            }

            let outputsDiffer = false;
            if (readOutputs.length > 1 && activeCount > 1) {
                outputsDiffer = readOutputs[0].subarray(0, activeCount).some((value, slot) => value !== readOutputs[1][slot]);
            }
            results.push({ label: stage.label, problems, paddedCount: paddedCounts, activeCount, outputsDiffer });
        }
    } finally {
        sorter.dispose();
        texture.dispose();
        engine.dispose();
        window.engine = null;
    }
    return results;
};

const initPage = async (page: Page) => {
    const config = getGlobalConfig();
    await page.route("**/favicon.ico", (route) => route.fulfill({ status: 204 }));
    await page.goto(config.baseUrl + "/empty.html");
    await page.waitForSelector("#babylon-canvas");
    await page.waitForFunction(() => window.BABYLON?.Tools);
    const supported = await page.evaluate(async () => !!navigator.gpu && !!(await navigator.gpu.requestAdapter()));
    test.skip(!supported, "WebGPU is not available");
    await page.evaluate(evaluateInitEngineForVisualization, {
        engineName: "webgpu",
        useLargeWorldRendering: false,
        useReverseDepthBuffer: "false",
        useNonCompatibilityMode: "false",
        baseUrl: config.baseUrl,
    });
    const sorterSupported = await page.evaluate(() => window.BABYLON.GaussianSplattingGpuSorter.IsSupported(window.engine!));
    test.skip(!sorterSupported, "WebGPU compute shaders are not available");
};

const runCase = async (page: Page, testCase: IGpuSortCase) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
        if (message.type() === "error" || /validation.*error|WebGPU.*(?:error|invalid)/i.test(message.text())) {
            errors.push(message.text());
        }
    });
    await initPage(page);
    const results = await page.evaluate(runGpuSortCase, testCase);
    expect(
        results.map((result) => ({ label: result.label, problems: result.problems })),
        "GPU sort output must match the CPU reference"
    ).toEqual(results.map((result) => ({ label: result.label, problems: [] })));
    expect(errors).toEqual([]);
    return results;
};

const stage = (vertexCount: number, intervals: number[] | null = null, cameras: CameraKind[] = ["z"], label = `${vertexCount} splats`): IGpuSortStage => ({
    label: intervals ? `${label} [${intervals.join(",")}]` : label,
    vertexCount,
    intervals,
    cameras,
});

const runTextureRefreshCase = async () => {
    const B = window.BABYLON;
    const engine = window.engine as import("core/Engines/webgpuEngine").WebGPUEngine;
    const scene = new B.Scene(engine);
    const texture = new B.RenderTargetTexture("gpuSortCenters", { width: 2, height: 1 }, scene, {
        type: B.Constants.TEXTURETYPE_FLOAT,
        samplingMode: B.Constants.TEXTURE_NEAREST_SAMPLINGMODE,
        generateDepthBuffer: false,
    });
    const sorter = new B.GaussianSplattingGpuSorter(engine, "gpuSortTextureRefresh");
    const orders: number[][][] = [];
    const identity = B.Matrix.Identity();
    let keptOutputBuffers = true;
    const validationErrors: string[] = [];
    const onError = (event: GPUUncapturedErrorEvent) => validationErrors.push(event.error.message);
    engine._device.addEventListener("uncapturederror", onError);
    try {
        await B.GaussianSplattingGpuSorter.LoadDependenciesAsync();
        const source = { vertexCount: 2, textureWidth: 2, centersTexture: texture, boundsMin: [0, 0, 0], boundsMax: [0, 0, 3] };
        sorter.setSource(source);
        const outputs = [sorter.createOutput(), sorter.createOutput()];
        const buffers = outputs.map((output) => output.buffer);
        for (let stage = 0; stage < 3; stage++) {
            if (stage > 0) {
                texture.resize({ width: 2 << stage, height: 1 });
            }
            source.textureWidth = texture.getSize().width;
            const data = new Float32Array(source.textureWidth * 4);
            data[2] = stage === 1 ? 3 : 1;
            data[3] = data[7] = 1;
            data[6] = stage === 1 ? 0 : 2;
            engine.updateRawTexture(texture.getInternalTexture()!, data, B.Constants.TEXTUREFORMAT_RGBA, false, undefined, B.Constants.TEXTURETYPE_FLOAT);
            sorter.setSource(source);
            let sorted = false;
            for (let frame = 0; frame < 1000 && !sorted; frame++) {
                engine.beginFrame();
                const enqueued = outputs.map((output) => sorter.sort(output, identity, identity));
                engine.endFrame();
                sorted = enqueued.every(Boolean);
                await new Promise<void>((resolve) => setTimeout(resolve, 8));
            }
            if (!sorted) {
                throw new Error("sort() never enqueued after refreshing the texture");
            }
            const stageOrders: number[][] = [];
            for (const [index, output] of outputs.entries()) {
                const actual = new Float32Array(output.paddedCount);
                await output.buffer!.read(0, actual.byteLength, actual, true);
                stageOrders.push(Array.from(actual.subarray(0, 2)));
                keptOutputBuffers &&= output.buffer === buffers[index];
            }
            orders.push(stageOrders);
        }
        await engine._device.queue.onSubmittedWorkDone();
        return { orders, keptOutputBuffers, validationErrors };
    } finally {
        engine._device.removeEventListener("uncapturederror", onError);
        sorter.dispose();
        texture.dispose();
        scene.dispose();
        engine.dispose();
        window.engine = null;
    }
};

test.describe("WebGPU Gaussian Splatting GPU sort", () => {
    test.describe.configure({ timeout: 60000 });

    test("refreshes resized centers behind the same texture and outputs", async ({ page }) => {
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (message) => {
            if (message.type() === "error" || /validation.*error|WebGPU.*(?:error|invalid)/i.test(message.text())) {
                errors.push(message.text());
            }
        });
        await initPage(page);
        const result = await page.evaluate(runTextureRefreshCase);
        expect(result.validationErrors).toEqual([]);
        expect(errors).toEqual([]);
        expect(result.orders).toEqual([
            [
                [1, 0],
                [1, 0],
            ],
            [
                [0, 1],
                [0, 1],
            ],
            [
                [1, 0],
                [1, 0],
            ],
        ]);
        expect(result.keptOutputBuffers).toBe(true);
    });

    test("empty input only writes padding over previous results", async ({ page }) => {
        const results = await runCase(page, {
            textureCount: 100,
            // The first stage fills the output, so stale indices must be replaced by the padding of the empty stages.
            stages: [stage(100), stage(100, []), stage(100, [10, 0, 500, 10]), stage(0), stage(100)],
        });
        expect(results.map((result) => result.activeCount)).toEqual([100, 0, 0, 0, 100]);
        expect(results.map((result) => result.paddedCount[0])).toEqual([112, 16, 16, 16, 112]);
    });

    test("small counts are padded to a multiple of 16", async ({ page }) => {
        const results = await runCase(page, {
            textureCount: 300,
            stages: [40, 1, 15, 16, 17, 255, 256, 257, 40].map((count) => stage(count)),
        });
        expect(results.map((result) => result.paddedCount[0])).toEqual([48, 16, 16, 16, 32, 256, 256, 272, 48]);
    });

    test("partial and full 1024-key blocks", async ({ page }) => {
        await runCase(page, {
            textureCount: 2049,
            stages: [1500, 1023, 1024, 1025, 2047, 2048, 2049, 1500].map((count) => stage(count)),
        });
    });

    test("scan chunk boundaries (64 blocks of 1024 keys per chunk)", async ({ page }) => {
        const results = await runCase(page, {
            textureCount: 3 * 65536 + 777,
            stages: [65535, 65536, 65537, 2 * 65536, 2 * 65536 + 1, 3 * 65536 + 777, 1025].map((count) => stage(count)),
        });
        expect(results.map((result) => result.activeCount)).toEqual([65535, 65536, 65537, 131072, 131073, 197385, 1025]);
    });

    test("interval filtering", async ({ page }) => {
        const results = await runCase(page, {
            textureCount: 150000,
            stages: [
                stage(5000, [100, 300, 1000, 1, 2000, 2500, 4999, 1]),
                // Unordered, empty, clamped and fully out-of-range intervals
                stage(5000, [3000, 200, 0, 0, 100, 300, 4990, 100, 6000, 5]),
                // Intervals spanning several 1024-key blocks and a scan chunk
                stage(150000, [70000, 70000, 10, 500, 120000, 20000]),
                stage(150000, [149999, 1]),
                stage(150000),
            ],
        });
        expect(results.map((result) => result.activeCount)).toEqual([2802, 510, 90500, 1, 150000]);
    });

    test("independent camera outputs of the same sorter", async ({ page }) => {
        const results = await runCase(page, {
            textureCount: 70000,
            stages: [
                stage(70000, [5, 40000, 41000, 28000], ["z", "negx", "general"]),
                // The cameras are given to the outputs in a different order, on a different splat count
                stage(1500, null, ["negx", "z"]),
                stage(70000, null, ["general", "z"]),
            ],
        });
        for (const result of results.slice(0, 2)) {
            expect(result.outputsDiffer, `${result.label}: the two views must be sorted differently`).toBe(true);
        }
        expect(results[0].activeCount).toBe(68000);
    });
});
