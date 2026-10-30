import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";

declare const BABYLON: typeof import("core/index") & typeof import("loaders/index");

async function evaluateConvertedNormals(backend: "webgl2" | "webgpu") {
    const results = [];
    for (const mode of ["base", "coat", "both"]) {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 64;
        document.body.appendChild(canvas);
        const engine = backend === "webgpu" ? new BABYLON.WebGPUEngine(canvas) : new BABYLON.Engine(canvas, false);
        try {
            if (engine instanceof BABYLON.WebGPUEngine) {
                await engine.initAsync();
            }
            const image = document.createElement("canvas");
            image.width = image.height = 4;
            const context = image.getContext("2d")!;
            context.fillStyle = "rgb(204,128,230)";
            context.fillRect(0, 0, 4, 4);
            const positions = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]);
            const scene = new BABYLON.Scene(engine);
            try {
                new BABYLON.ArcRotateCamera("camera", 0, 1, 4, BABYLON.Vector3.Zero(), scene);
                const source = {
                    asset: { version: "2.0" },
                    extensionsUsed: [
                        "KHR_materials_retroreflection",
                        "KHR_materials_clearcoat",
                        "KHR_materials_transmission",
                        "KHR_materials_volume",
                        ...(mode === "both" ? ["KHR_materials_diffuse_transmission"] : []),
                    ],
                    scene: 0,
                    scenes: [{ nodes: [0] }],
                    nodes: [{ mesh: 0 }],
                    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, material: 0 }] }],
                    materials: [
                        {
                            pbrMetallicRoughness: { metallicFactor: 0, baseColorFactor: [0.8, 0.6, 0.4, 1] },
                            ...(mode !== "coat" ? { normalTexture: { index: 0, scale: 0.5 } } : {}),
                            extensions: {
                                KHR_materials_retroreflection: { retroreflectionFactor: 0.5 },
                                KHR_materials_clearcoat: {
                                    clearcoatFactor: mode === "base" ? 0 : mode === "coat" ? 1 : 0.5,
                                    ...(mode !== "base" ? { clearcoatNormalTexture: { index: 0, scale: 0.5 } } : {}),
                                },
                                KHR_materials_transmission: { transmissionFactor: 1 },
                                KHR_materials_volume: { thicknessFactor: 1, attenuationDistance: 1 },
                                ...(mode === "both"
                                    ? { KHR_materials_diffuse_transmission: { diffuseTransmissionFactor: 0.5, diffuseTransmissionColorFactor: [0.8, 0.6, 0.4] } }
                                    : {}),
                            },
                        },
                    ],
                    textures: [{ source: 0 }],
                    images: [{ uri: image.toDataURL() }],
                    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", max: [1, 1, 0], min: [0, 0, 0] }],
                    bufferViews: [{ buffer: 0, byteLength: positions.byteLength }],
                    buffers: [{ byteLength: positions.byteLength, uri: "data:application/octet-stream;base64," + btoa(String.fromCharCode(...new Uint8Array(positions.buffer))) }],
                };
                let loader: InstanceType<typeof BABYLON.GLTFFileLoader> | undefined;
                const observer = BABYLON.SceneLoader.OnPluginActivatedObservable.add((plugin) => {
                    if (plugin instanceof BABYLON.GLTFFileLoader) {
                        loader = plugin;
                    }
                });
                let result;
                try {
                    result = await BABYLON.ImportMeshAsync(`data:${JSON.stringify(source)}`, scene, { pluginExtension: ".gltf", pluginOptions: { gltf: { useOpenPBR: false } } });
                    await loader!.whenCompleteAsync();
                } finally {
                    BABYLON.SceneLoader.OnPluginActivatedObservable.remove(observer);
                }
                const material = result.meshes.find((mesh) => mesh.material)!.material as InstanceType<typeof BABYLON.OpenPBRMaterial>;
                const normalSources = scene.textures.filter((texture) => texture.name.endsWith(" (Normal)") || texture.name.endsWith(" (ClearCoat Normal)"));
                if (normalSources.length !== (mode === "both" ? 2 : 1)) {
                    throw new Error(`${mode}: normal source textures missing`);
                }
                await scene.whenReadyAsync();
                const output = material.geometryCoatNormalTexture!;
                let renders = 0;
                (output as InstanceType<typeof BABYLON.ProceduralTexture>).onGeneratedObservable.add(() => renders++);
                engine.beginFrame();
                scene.render();
                engine.endFrame();
                await output.readPixels();
                for (const strength of [0.5, 2, 4, 0]) {
                    for (const texture of normalSources) {
                        texture.level = strength;
                    }
                    engine.beginFrame();
                    scene.render();
                    engine.endFrame();
                    const pixels = await output.readPixels();
                    if (!(pixels instanceof Uint8Array) || pixels.length !== 64) {
                        throw new Error(`${mode}: expected all 16 normal texels`);
                    }
                    const normal = [((204 / 255) * 2 - 1) * strength, ((128 / 255) * 2 - 1) * strength, (230 / 255) * 2 - 1];
                    const length = Math.hypot(...normal);
                    const expected = normal.map((value) => ((value / length) * 0.5 + 0.5) * 255);
                    let maxError = 0;
                    for (let i = 0; i < pixels.length; i++) {
                        if (i % 4 !== 3) {
                            maxError = Math.max(maxError, Math.abs(pixels[i] - expected[i % 4]));
                        }
                    }
                    const count = renders;
                    engine.beginFrame();
                    scene.render();
                    engine.endFrame();
                    results.push({ mode, strength, maxError, repeatedRenders: renders - count, outputLevel: output.level });
                }
            } finally {
                scene.dispose();
            }
        } finally {
            engine.dispose();
            canvas.remove();
        }
    }
    return results;
}

for (const backend of ["webgl2", "webgpu"] as const) {
    test(`converted coat normals preserve strengths above one on ${backend}`, async ({ page }) => {
        await page.goto(`${getGlobalConfig().baseUrl}/empty.html`);
        test.skip(backend === "webgpu" && !(await page.evaluate(() => !!navigator.gpu)), "WebGPU is unavailable in this browser");
        await page.addScriptTag({ url: `${getGlobalConfig().baseUrl}/loaders/babylonjs.loaders.min.js` });
        const results = await page.evaluate(evaluateConvertedNormals, backend);
        expect(results).toHaveLength(12);
        for (const result of results) {
            expect(result.maxError, JSON.stringify(result)).toBeLessThanOrEqual(3);
            expect(result.repeatedRenders, JSON.stringify(result)).toBe(0);
            expect(result.outputLevel).toBe(1);
        }
    });
}
