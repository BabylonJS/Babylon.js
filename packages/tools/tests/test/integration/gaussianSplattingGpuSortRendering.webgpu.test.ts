import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateInitEngineForVisualization } from "../playwright/visualizationPlaywright.utils";

type SortScene = "plain" | "compound" | "sog";

// The .webgpu suffix also includes these integration tests in the BrowserStack WebGPU CI job.
// Use the real CPU worker's rendered image as the oracle, without platform-dependent reference images.
for (const kind of ["plain", "compound", "sog"] as const) {
    test(`WebGPU mesh GPU sort renders ${kind} like the CPU worker before and after camera motion`, async ({ page }) => {
        test.setTimeout(60000);
        const config = getGlobalConfig();
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        page.on("console", (message) => {
            if (message.type() === "error" || /validation.*error|WebGPU.*(?:error|invalid)/i.test(message.text())) {
                errors.push(message.text());
            }
        });
        await page.goto(config.baseUrl + "/empty.html");
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
        test.skip(!sorterSupported, "WebGPU compute sorting is not supported");

        const result = await page.evaluate(async (sceneKind: SortScene) => {
            const B = window.BABYLON;
            const engine = window.engine as import("core/Engines/webgpuEngine").WebGPUEngine;
            const size = 160;
            engine.setSize(size, size);

            const compare = (expected: Uint8Array, actual: Uint8Array) => {
                let changed = 0;
                let totalDifference = 0;
                let foreground = 0;
                for (let pixel = 0; pixel < size * size; pixel++) {
                    let maxDifference = 0;
                    let brightness = 0;
                    for (let channel = 0; channel < 3; channel++) {
                        const offset = pixel * 4 + channel;
                        const difference = Math.abs(expected[offset] - actual[offset]);
                        maxDifference = Math.max(maxDifference, difference);
                        totalDifference += difference;
                        brightness = Math.max(brightness, expected[offset]);
                    }
                    changed += maxDifference > 8 ? 1 : 0;
                    foreground += brightness > 16 ? 1 : 0;
                }
                return { changedRatio: changed / (size * size), meanDifference: totalDifference / (size * size * 3), foreground };
            };

            const makeData = (count: number, colorOffset = 0) => {
                const data = new ArrayBuffer(count * 32);
                for (let i = 0; i < count; i++) {
                    // .splat: xyz + scale xyz (float32), RGBA + quaternion wxyz (uint8).
                    new Float32Array(data, i * 32, 6).set([Math.cos(i * 2.4) * 0.22, Math.sin(i * 2.4) * 0.15, (((i * 13) % count) - count / 2) * 0.07, 0.28, 0.24, 0.2]);
                    const color = [24, 24, 24, 120, 255, 128, 128, 128];
                    color[(i + colorOffset) % 3] = 240;
                    new Uint8Array(data, i * 32 + 24, 8).set(color);
                }
                return data;
            };

            const reference: Uint8Array[] = [];
            const comparisons: ReturnType<typeof compare>[] = [];
            const states: { gpuMode: boolean; worker: boolean; sog: boolean; compound: boolean; applied: number[] }[] = [];
            let sensitivity: ReturnType<typeof compare> | null = null;
            try {
                for (const useGpuSort of [false, true]) {
                    const scene = new B.Scene(engine);
                    scene.clearColor = new B.Color4(0, 0, 0, 1);
                    const camera = new B.FreeCamera("camera", new B.Vector3(0, 0, -5), scene);
                    camera.minZ = 0.01;
                    camera.setTarget(B.Vector3.Zero());
                    const mesh =
                        sceneKind === "compound" ? new B.GaussianSplattingCompoundMesh("compound", null, scene, true) : new B.GaussianSplattingMesh("splats", null, scene, true);
                    mesh.useGpuSort = useGpuSort;
                    try {
                        if (sceneKind === "sog") {
                            // The same compressed asset used by the SOG visualization tests; keep its quantized textures.
                            await B.ImportMeshAsync("https://raw.githubusercontent.com/CedricGuillemet/dump/master/hornedlizard/hornedlizard.sog", scene, {
                                pluginOptions: { splat: { gaussianSplattingMesh: mesh, useSogTextures: true } },
                            });
                            mesh.rotation.x = Math.PI;
                            camera.position.set(-0.25, 1.5, -2.4);
                            camera.setTarget(new B.Vector3(0, -0.2, 0.2));
                        } else if (sceneKind === "compound") {
                            const compound = mesh as import("core/Meshes/GaussianSplatting/gaussianSplattingCompoundMesh").GaussianSplattingCompoundMesh;
                            const sources = [0, 1, 2].map((part) => {
                                const source = new B.GaussianSplattingMesh(`part${part}`, null, scene, true);
                                source.useGpuSort = false;
                                source.updateData(makeData(17, part), undefined, { flipY: false });
                                return source;
                            });
                            const parts = compound.addParts(sources);
                            parts.forEach((part, index) => {
                                part.position.set((index - 1) * 0.18, 0, (index - 1) * 0.65);
                                part.rotation.y = (index - 1) * 0.5;
                                part.scaling.set(1 + index * 0.1, 1, 1);
                            });
                            mesh.position.x = 0.11;
                            mesh.rotation.y = 0.2;
                        } else {
                            mesh.updateData(makeData(33), undefined, { flipY: false });
                        }

                        const render = async () => {
                            engine.beginFrame();
                            scene.render();
                            engine.endFrame();
                            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
                        };
                        const capture = async () => {
                            engine.beginFrame();
                            scene.render();
                            engine.endFrame();
                            // Read before the next animation frame presents/discards the canvas backbuffer.
                            const pixels = await engine.readPixels(0, 0, size, size);
                            if (pixels.byteLength !== size * size * 4) {
                                throw new Error(`Unexpected canvas readback size: ${pixels.byteLength}`);
                            }
                            return new Uint8Array(pixels.buffer, pixels.byteOffset, pixels.byteLength).slice();
                        };
                        const view = () => mesh["_cameraViewInfos"].get(camera.uniqueId);
                        const applied: number[] = [];
                        for (let pose = 0; pose < 2; pose++) {
                            const previousSort = view()?.sortAppliedId ?? 0;
                            if (pose === 1) {
                                camera.position.set(4, 0.4, 2.5);
                                camera.setTarget(B.Vector3.Zero());
                            }
                            let stableFrames = 0;
                            const deadline = performance.now() + 15000;
                            while (stableFrames < 3 && performance.now() < deadline) {
                                await render();
                                const info = view();
                                stableFrames = scene.isReady() && mesh._isDepthSortSettled && info?.splatIndexBufferSet && info.sortAppliedId > previousSort ? stableFrames + 1 : 0;
                            }
                            if (stableFrames < 3) {
                                throw new Error(`${sceneKind} GPU=${useGpuSort} pose=${pose}: rendering/sorting did not settle`);
                            }
                            if (mesh["_gpuMode"] !== useGpuSort || (useGpuSort && (!mesh["_gpuSorter"] || mesh["_gpuSortForbidden"]))) {
                                throw new Error(`${sceneKind}: requested GPU=${useGpuSort}, actual GPU=${mesh["_gpuMode"]} (no fallback allowed)`);
                            }
                            applied.push(view()!.sortAppliedId);
                            const pixels = await capture();
                            if (!useGpuSort) {
                                reference.push(pixels);
                            } else {
                                comparisons.push(compare(reference[pose], pixels));
                                if (pose === 0) {
                                    // Negative control: reverse the actual bound GPU output. The image oracle must notice wrong blending order.
                                    const output = view()!.gpuOutput!;
                                    const original = new Float32Array(output.paddedCount);
                                    await output.buffer!.read(0, original.byteLength, original, true);
                                    const reversed = original.slice();
                                    reversed.subarray(0, mesh.getTotalVertices()).reverse();
                                    try {
                                        output.buffer!.update(reversed);
                                        sensitivity = compare(reference[pose], await capture());
                                    } finally {
                                        output.buffer!.update(original);
                                    }
                                }
                            }
                        }
                        const output = view()?.gpuOutput;
                        states.push({
                            gpuMode: mesh["_gpuMode"],
                            worker: !!mesh["_worker"],
                            sog: output?._keysCsSog ?? false,
                            compound: output?._keysCsCompound ?? false,
                            applied,
                        });
                    } finally {
                        scene.dispose();
                    }
                }
                return { comparisons, states, sensitivity };
            } finally {
                engine.dispose();
                window.engine = null;
            }
        }, kind);

        await test.info().attach("render-comparison", { body: JSON.stringify(result, null, 2), contentType: "application/json" });
        expect(result.states[0]).toMatchObject({ gpuMode: false, worker: true });
        expect(result.states[1]).toMatchObject({ gpuMode: true, worker: false, sog: kind === "sog", compound: kind === "compound" });
        for (const state of result.states) {
            expect(state.applied[0]).toBeGreaterThan(0);
            expect(state.applied[1]).toBeGreaterThan(state.applied[0]);
        }
        for (const comparison of result.comparisons) {
            expect(comparison.foreground, "The CPU reference must not be an empty/black frame").toBeGreaterThan(500);
            // The full SOG cloud has many nearly equal depths: the worker and GPU use different depth quantization.
            // Bound the average error below 2/255, allowing at most 6% of pixels to differ by over 8/255.
            expect(comparison.changedRatio, `GPU and CPU ordering must blend to the same image: ${JSON.stringify(result)}`).toBeLessThan(kind === "sog" ? 0.06 : 0.01);
            expect(comparison.meanDifference).toBeLessThan(kind === "sog" ? 2 : 1);
        }
        expect(result.sensitivity!.changedRatio, "Reversing the bound GPU order must fail the image comparison").toBeGreaterThan(0.06);
        expect(result.sensitivity!.meanDifference).toBeGreaterThan(kind === "sog" ? 2 : 1);
        expect(errors).toEqual([]);
    });
}
