import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";

declare const BABYLON: typeof import("core/index") & typeof import("loaders/index");

for (const backend of ["webgl2", "webgpu"] as const) {
    for (const kind of ["activation", "roughness"] as const) {
        test(`converted transmission ${kind} on ${backend}`, async ({ page }) => {
            await page.goto(`${getGlobalConfig().baseUrl}/empty.html`);
            const result = await page.evaluate(
                async ({ backend, kind }) => {
                    const canvas = document.createElement("canvas");
                    canvas.width = canvas.height = 64;
                    canvas.style.width = canvas.style.height = "64px";
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
                            const roughness = kind === "roughness";
                            light.intensity = roughness ? 20 : 0;
                            const image = document.createElement("canvas");
                            image.width = image.height = 2;
                            const context = image.getContext("2d")!;
                            context.fillStyle = "white";
                            context.fillRect(0, 0, 2, 2);
                            const data = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, ...(roughness ? [0.2, 0.8] : [0, 1])]);
                            const source = {
                                asset: { version: "2.0" },
                                extensionsUsed: [
                                    "KHR_materials_retroreflection",
                                    "KHR_materials_transmission",
                                    "KHR_materials_volume",
                                    "KHR_materials_diffuse_transmission",
                                    "KHR_animation_pointer",
                                ],
                                scene: 0,
                                scenes: [{ nodes: [0] }],
                                nodes: [{ mesh: 0 }],
                                meshes: [{ primitives: [{ attributes: { POSITION: 0, TEXCOORD_0: 1 }, material: 0 }] }],
                                materials: [
                                    {
                                        pbrMetallicRoughness: {
                                            metallicFactor: 0,
                                            roughnessFactor: roughness ? 0.2 : 0,
                                            ...(roughness ? { metallicRoughnessTexture: { index: 0 } } : {}),
                                        },
                                        extensions: {
                                            KHR_materials_retroreflection: { retroreflectionFactor: 0.75 },
                                            ...(roughness
                                                ? {
                                                      KHR_materials_volume: { thicknessFactor: 1, attenuationDistance: 1 },
                                                      KHR_materials_diffuse_transmission: { diffuseTransmissionFactor: 0.5, diffuseTransmissionTexture: { index: 0 } },
                                                  }
                                                : { KHR_materials_transmission: { transmissionFactor: 0 } }),
                                        },
                                    },
                                ],
                                textures: [{ source: 0 }],
                                images: [{ uri: image.toDataURL() }],
                                accessors: [
                                    { bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] },
                                    { bufferView: 1, componentType: 5126, count: 3, type: "VEC2" },
                                    { bufferView: 2, componentType: 5126, count: 2, type: "SCALAR", min: [0], max: [1] },
                                    { bufferView: 3, componentType: 5126, count: 2, type: "SCALAR" },
                                ],
                                bufferViews: [
                                    { buffer: 0, byteLength: 36 },
                                    { buffer: 0, byteOffset: 36, byteLength: 24 },
                                    { buffer: 0, byteOffset: 60, byteLength: 8 },
                                    { buffer: 0, byteOffset: 68, byteLength: 8 },
                                ],
                                buffers: [
                                    { byteLength: data.byteLength, uri: "data:application/octet-stream;base64," + btoa(String.fromCharCode(...new Uint8Array(data.buffer))) },
                                ],
                                animations: [
                                    {
                                        samplers: [{ input: 2, output: 3, interpolation: "LINEAR" }],
                                        channels: [
                                            {
                                                sampler: 0,
                                                target: {
                                                    path: "pointer",
                                                    extensions: {
                                                        KHR_animation_pointer: {
                                                            pointer:
                                                                "/materials/0/" +
                                                                (roughness ? "pbrMetallicRoughness/roughnessFactor" : "extensions/KHR_materials_transmission/transmissionFactor"),
                                                        },
                                                    },
                                                },
                                            },
                                        ],
                                    },
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
                                    pluginOptions: { gltf: { useOpenPBR: false, targetFps: 60 } },
                                });
                                await completion;
                            } finally {
                                BABYLON.SceneLoader.OnPluginActivatedObservable.remove(observer);
                            }
                            const material = loaded.meshes.find((mesh) => mesh.material)!.material;
                            if (!(material instanceof BABYLON.OpenPBRMaterial)) {
                                throw new Error("Missing converted material");
                            }
                            for (const mesh of loaded.meshes) {
                                mesh.setEnabled(false);
                            }
                            const front = roughness
                                ? BABYLON.MeshBuilder.CreateSphere("front", { diameter: 2, segments: 32 }, scene)
                                : BABYLON.MeshBuilder.CreatePlane("front", { size: 2 }, scene);
                            front.material = material;
                            const background = BABYLON.MeshBuilder.CreatePlane("background", { size: 4 }, scene);
                            background.position.z = 1;
                            const green = new BABYLON.StandardMaterial("green", scene);
                            green.disableLighting = true;
                            green.emissiveColor = new BABYLON.Color3(0, 1, 0);
                            background.material = green;
                            const group = loaded.animationGroups[0].pause();
                            const capture = async () => {
                                for (let frame = 0; frame < 3; frame++) {
                                    await scene.whenReadyAsync();
                                    engine.beginFrame();
                                    scene.render();
                                    engine.endFrame();
                                }
                                const pixels = await engine.readPixels(0, 0, 64, 64);
                                if (!(pixels instanceof Uint8Array)) {
                                    throw new Error("Missing rendered transmission pixels");
                                }
                                return Array.from(pixels);
                            };
                            const before = await capture();
                            group.goToFrame(60);
                            const active = await capture();
                            group.stop();
                            if (!roughness) {
                                material.transmissionWeight = 0;
                                const disabled = await capture();
                                const center = (32 * 64 + 32) * 4;
                                return { greens: [before[center + 1], active[center + 1], disabled[center + 1]], roughnessSamples: [] };
                            }
                            const roughnessSamples = [];
                            const processed = material.specularRoughnessTexture!;
                            for (const factor of [0.8, 0.4]) {
                                Reflect.set(group.targetedAnimations[0].target, "specularRoughness", factor);
                                const actual = await capture();
                                const pixels = await processed.readPixels();
                                if (!(pixels instanceof Uint8Array)) {
                                    throw new Error("Missing converted roughness pixels");
                                }
                                const scalar = material.specularRoughness;
                                const sharedMetallic = material._useRoughnessFromMetallicTextureGreen;
                                const expected = 0.5 + factor * 0.5;
                                material.specularRoughnessTexture = null;
                                material.specularRoughness = expected;
                                material._useRoughnessFromMetallicTextureGreen = false;
                                const reference = await capture();
                                roughnessSamples.push({
                                    scalar,
                                    sharedMetallic,
                                    pixel: pixels[1],
                                    expected,
                                    changed: actual.filter((value, i) => i % 4 !== 3 && Math.abs(value - reference[i]) > 3).length,
                                });
                                material.specularRoughnessTexture = processed;
                                material.specularRoughness = scalar;
                            }
                            return { greens: [], roughnessSamples };
                        } finally {
                            scene.dispose();
                        }
                    } finally {
                        engine.dispose();
                        canvas.remove();
                    }
                },
                { backend, kind }
            );
            if (kind === "activation") {
                expect(result.greens[0]).toBeLessThan(30);
                expect(result.greens[1]).toBeGreaterThan(200);
                expect(result.greens[2]).toBeLessThan(30);
            } else {
                expect(result.roughnessSamples).toHaveLength(2);
                for (const sample of result.roughnessSamples) {
                    expect(sample.scalar).toBe(1);
                    expect(sample.sharedMetallic).toBe(false);
                    expect(Math.abs(sample.pixel - sample.expected * 255)).toBeLessThanOrEqual(1);
                    expect(sample.changed).toBe(0);
                }
            }
        });
    }
}
