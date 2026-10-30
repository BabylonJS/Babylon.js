import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";

declare const BABYLON: typeof import("core/index") & typeof import("loaders/index") & typeof import("serializers/index");

for (const backend of ["webgl2", "webgpu"] as const) {
    for (const kind of ["BLEND", "MASK", "coat mask", "coat roughness", "merged coat", "thin transmission"] as const) {
        test(`retroreflection ${kind} round trip on ${backend}`, async ({ page }) => {
            await page.goto(`${getGlobalConfig().baseUrl}/empty.html`);
            await page.addScriptTag({ url: `${getGlobalConfig().baseUrl}/loaders/babylonjs.loaders.min.js` });
            const result = await page.evaluate(
                async ({ backend, kind }) => {
                    const canvas = document.createElement("canvas");
                    document.body.appendChild(canvas);
                    const engine = backend === "webgpu" ? new BABYLON.WebGPUEngine(canvas) : new BABYLON.Engine(canvas);
                    const scenes: InstanceType<typeof BABYLON.Scene>[] = [];
                    try {
                        if (engine instanceof BABYLON.WebGPUEngine) {
                            await engine.initAsync();
                        }
                        const textureCanvas = document.createElement("canvas");
                        textureCanvas.width = textureCanvas.height = 2;
                        const context = textureCanvas.getContext("2d")!;
                        context.fillStyle = "#4080ff";
                        context.fillRect(0, 0, 2, 2);
                        const data = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1]);
                        const opacity = kind === "BLEND" || kind === "MASK";
                        const source = {
                            asset: { version: "2.0" },
                            extensionsUsed: ["KHR_materials_retroreflection", "KHR_materials_clearcoat", "KHR_materials_transmission"],
                            scene: 0,
                            scenes: [{ nodes: [0] }],
                            nodes: [{ mesh: 0 }],
                            meshes: [{ primitives: [{ attributes: { POSITION: 0, TEXCOORD_0: 1 }, material: 0 }] }],
                            materials: [
                                {
                                    name: "retro",
                                    ...(opacity ? { alphaMode: kind, alphaCutoff: 0.3 } : {}),
                                    pbrMetallicRoughness: { metallicFactor: 0, baseColorFactor: opacity ? [1, 0, 0, 0.25] : [0.8, 0.6, 0.4, 1] },
                                    extensions: {
                                        KHR_materials_retroreflection: { retroreflectionFactor: 0.75 },
                                        ...(kind.includes("coat")
                                            ? {
                                                  KHR_materials_clearcoat: {
                                                      clearcoatFactor: 1,
                                                      clearcoatRoughnessFactor: 0.7,
                                                      ...(kind !== "coat roughness" ? { clearcoatTexture: { index: 0 } } : {}),
                                                      ...(kind !== "coat mask" ? { clearcoatRoughnessTexture: { index: 1 } } : {}),
                                                  },
                                              }
                                            : {}),
                                        ...(kind === "thin transmission" ? { KHR_materials_transmission: { transmissionFactor: 1 } } : {}),
                                    },
                                },
                            ],
                            textures: [{ source: 0 }, { source: 0 }],
                            images: [{ uri: textureCanvas.toDataURL() }],
                            accessors: [
                                { bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 0] },
                                { bufferView: 1, componentType: 5126, count: 3, type: "VEC2" },
                            ],
                            bufferViews: [
                                { buffer: 0, byteLength: 36 },
                                { buffer: 0, byteOffset: 36, byteLength: 24 },
                            ],
                            buffers: [{ byteLength: data.byteLength, uri: "data:application/octet-stream;base64," + btoa(String.fromCharCode(...new Uint8Array(data.buffer))) }],
                        };
                        const load = async (url: string, pluginExtension: ".gltf" | ".glb") => {
                            const scene = new BABYLON.Scene(engine);
                            scenes.push(scene);
                            let completion: Promise<void> | undefined;
                            const observer = BABYLON.SceneLoader.OnPluginActivatedObservable.add((plugin) => {
                                if (plugin instanceof BABYLON.GLTFFileLoader) {
                                    completion = plugin.whenCompleteAsync();
                                }
                            });
                            try {
                                const imported = await BABYLON.ImportMeshAsync(url, scene, { pluginExtension, pluginOptions: { gltf: { useOpenPBR: false } } });
                                await completion;
                                const material = imported.meshes.find((mesh) => mesh.material)!.material;
                                if (!(material instanceof BABYLON.OpenPBRMaterial)) {
                                    throw new Error("Retroreflection did not select OpenPBR");
                                }
                                return { scene, material };
                            } finally {
                                BABYLON.SceneLoader.OnPluginActivatedObservable.remove(observer);
                            }
                        };
                        let loaded = await load(`data:${JSON.stringify(source)}`, ".gltf");
                        const samples = [];
                        for (let round = 0; round < 2; round++) {
                            const exported = await BABYLON.GLTF2Export.GLTFAsync(loaded.scene, "roundtrip");
                            const json = JSON.parse(exported.files["roundtrip.gltf"] as string);
                            const material = json.materials[0];
                            const glb = await BABYLON.GLTF2Export.GLBAsync(loaded.scene, "roundtrip");
                            const url = URL.createObjectURL(glb.files["roundtrip.glb"] as Blob);
                            try {
                                loaded = await load(url, ".glb");
                            } finally {
                                URL.revokeObjectURL(url);
                            }
                            samples.push({
                                factor: material.pbrMetallicRoughness.baseColorFactor ?? [1, 1, 1, 1],
                                alphaMode: material.alphaMode,
                                alphaCutoff: material.alphaCutoff,
                                opacity: loaded.material.geometryOpacity,
                                color: loaded.material.baseColor.asArray(),
                                weightTexture: !!loaded.material.coatWeightTexture,
                                roughnessTexture: !!loaded.material.coatRoughnessTexture,
                                exportedWeightTexture: !!material.extensions?.KHR_materials_clearcoat?.clearcoatTexture,
                                exportedRoughnessTexture: !!material.extensions?.KHR_materials_clearcoat?.clearcoatRoughnessTexture,
                            });
                        }
                        return samples;
                    } finally {
                        for (const scene of scenes) {
                            scene.dispose();
                        }
                        engine.dispose();
                        canvas.remove();
                    }
                },
                { backend, kind }
            );
            for (const sample of result) {
                if (kind === "BLEND" || kind === "MASK") {
                    expect(sample.alphaMode).toBe(kind);
                    expect(sample.factor).toEqual([1, 0, 0, 0.25]);
                    expect(sample.opacity).toBeCloseTo(0.25);
                    if (kind === "MASK") {
                        expect(sample.alphaCutoff).toBeCloseTo(0.3);
                    }
                } else if (kind === "thin transmission") {
                    for (let i = 0; i < 3; i++) {
                        expect(sample.factor[i]).toBeCloseTo([0.8, 0.6, 0.4][i], 5);
                        expect(sample.color[i]).toBeCloseTo([0.8, 0.6, 0.4][i], 5);
                    }
                } else {
                    expect(sample.weightTexture).toBe(kind !== "coat roughness");
                    expect(sample.roughnessTexture).toBe(kind !== "coat mask");
                    expect(sample.exportedWeightTexture).toBe(kind !== "coat roughness");
                    expect(sample.exportedRoughnessTexture).toBe(kind !== "coat mask");
                }
            }
        });
    }
}
