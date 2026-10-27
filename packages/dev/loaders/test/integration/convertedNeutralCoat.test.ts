import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";

declare const BABYLON: typeof import("core/index") & typeof import("loaders/index");

async function evaluateConvertedNeutralCoat(backend: "webgl2" | "webgpu") {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 64;
    document.body.appendChild(canvas);
    const engine = backend === "webgpu" ? new BABYLON.WebGPUEngine(canvas, { antialias: false }) : new BABYLON.Engine(canvas, false);
    try {
        if (engine instanceof BABYLON.WebGPUEngine) {
            await engine.initAsync();
        }
        const scene = new BABYLON.Scene(engine);
        try {
            scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
            new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 0, -4), scene).setTarget(BABYLON.Vector3.Zero());
            const light = new BABYLON.PointLight("light", new BABYLON.Vector3(0, 0, -3), scene);
            light.intensity = 20;
            const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, scene);
            const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
            const samples = [];
            for (const specular of [0, 1]) {
                for (const retroreflection of [0, 1]) {
                    const source = {
                        asset: { version: "2.0" },
                        extensionsUsed: ["KHR_materials_retroreflection", "KHR_materials_transmission", "KHR_materials_volume", "KHR_materials_specular"],
                        scene: 0,
                        scenes: [{ nodes: [0] }],
                        nodes: [{ mesh: 0 }],
                        meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
                        materials: [
                            {
                                pbrMetallicRoughness: { metallicFactor: 0, roughnessFactor: 0.3 },
                                extensions: {
                                    KHR_materials_retroreflection: { retroreflectionFactor: retroreflection },
                                    KHR_materials_transmission: { transmissionFactor: 1 },
                                    KHR_materials_volume: { thicknessFactor: 1, attenuationDistance: 1 },
                                    KHR_materials_specular: { specularFactor: specular },
                                },
                            },
                        ],
                        accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", max: [1, 1, 0], min: [0, 0, 0] }],
                        bufferViews: [{ buffer: 0, byteLength: positions.byteLength }],
                        buffers: [
                            { byteLength: positions.byteLength, uri: "data:application/octet-stream;base64," + btoa(String.fromCharCode(...new Uint8Array(positions.buffer))) },
                        ],
                    };
                    let completion: Promise<void> | undefined;
                    const observer = BABYLON.SceneLoader.OnPluginActivatedObservable.add((plugin) => {
                        if (plugin instanceof BABYLON.GLTFFileLoader) {
                            completion = plugin.whenCompleteAsync();
                        }
                    });
                    let loaded;
                    try {
                        loaded = await BABYLON.ImportMeshAsync(`data:${JSON.stringify(source)}`, scene, {
                            pluginExtension: ".gltf",
                            pluginOptions: { gltf: { useOpenPBR: false } },
                        });
                        await completion;
                    } finally {
                        BABYLON.SceneLoader.OnPluginActivatedObservable.remove(observer);
                    }
                    const material = loaded.meshes.find((mesh) => mesh.material)!.material as InstanceType<typeof BABYLON.OpenPBRMaterial>;
                    for (const mesh of loaded.meshes) {
                        mesh.setEnabled(false);
                    }
                    sphere.material = material;
                    await scene.whenReadyAsync();
                    engine.beginFrame();
                    scene.render();
                    engine.endFrame();
                    const pixels = await engine.readPixels(0, 0, 64, 64);
                    if (!(pixels instanceof Uint8Array) || pixels.length !== 64 * 64 * 4) {
                        throw new Error("Expected a complete neutral-coat rendering");
                    }
                    const rgb = Array.from(pixels).filter((_, index) => index % 4 !== 3);
                    samples.push({ specular, retroreflection, coatWeight: material.coatWeight, pixels: rgb });
                }
            }
            const disabledMaximum = Math.max(...samples.filter((sample) => sample.specular === 0).flatMap((sample) => sample.pixels));
            const ordinary = samples.find((sample) => sample.specular === 1 && sample.retroreflection === 0)!;
            const retroreflective = samples.find((sample) => sample.specular === 1 && sample.retroreflection === 1)!;
            const disabledOrdinary = samples.find((sample) => sample.specular === 0 && sample.retroreflection === 0)!;
            const disabledRetroreflective = samples.find((sample) => sample.specular === 0 && sample.retroreflection === 1)!;
            return {
                coatWeights: samples.map((sample) => sample.coatWeight),
                disabledMaximum,
                activeMaximum: Math.max(...retroreflective.pixels),
                changedComponents: ordinary.pixels.filter((value, index) => Math.abs(value - retroreflective.pixels[index]) > 9).length,
                specularChangedComponents: retroreflective.pixels.filter((value, index) => value - disabledRetroreflective.pixels[index] > 9).length,
                disabledRetroChanges: disabledOrdinary.pixels.filter((value, index) => Math.abs(value - disabledRetroreflective.pixels[index]) > 1).length,
            };
        } finally {
            scene.dispose();
        }
    } finally {
        engine.dispose();
        canvas.remove();
    }
}

for (const backend of ["webgl2", "webgpu"] as const) {
    test(`neutral converted volumes preserve specular controls on ${backend}`, async ({ page }) => {
        await page.goto(`${getGlobalConfig().baseUrl}/empty.html`);
        test.skip(backend === "webgpu" && !(await page.evaluate(() => !!navigator.gpu)), "WebGPU is unavailable in this browser");
        await page.addScriptTag({ url: `${getGlobalConfig().baseUrl}/loaders/babylonjs.loaders.min.js` });
        const result = await page.evaluate(evaluateConvertedNeutralCoat, backend);
        expect(result.coatWeights).toEqual([0, 0, 0, 0]);
        expect(result.disabledMaximum).toBeLessThan(result.activeMaximum);
        expect(result.activeMaximum).toBeGreaterThan(50);
        expect(result.changedComponents).toBeGreaterThan(50);
        expect(result.specularChangedComponents).toBeGreaterThan(50);
        expect(result.disabledRetroChanges).toBe(0);
    });
}
