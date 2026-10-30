import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";

declare const BABYLON: typeof import("core/index") & typeof import("loaders/index") & typeof import("serializers/index");

for (const backend of ["webgl2", "webgpu"]) {
    for (const diffuse of [false, true]) {
        test(`OpenPBR glTF surface tint keeps independent texture coordinates (${backend}, diffuse transmission: ${diffuse})`, async ({ page }) => {
            test.setTimeout(120000);
            const warnings: string[] = [];
            page.on("console", (message) => {
                if (message.text().includes("different UV")) {
                    warnings.push(message.text());
                }
            });
            await page.goto(getGlobalConfig().baseUrl + "/empty.html");
            const result = await page.evaluate(
                async ({ backend, diffuse }) => {
                    const canvas = document.createElement("canvas");
                    canvas.width = canvas.height = 64;
                    canvas.style.width = canvas.style.height = "64px";
                    document.body.appendChild(canvas);
                    const engine = backend === "webgpu" ? new BABYLON.WebGPUEngine(canvas, { antialias: false }) : new BABYLON.Engine(canvas, false);
                    try {
                        if (engine instanceof BABYLON.WebGPUEngine) {
                            await engine.initAsync();
                        }
                        const image = document.createElement("canvas");
                        image.width = image.height = 8;
                        const context = image.getContext("2d")!;
                        context.globalCompositeOperation = "copy";
                        const texture = (pattern: "color" | "white" | "columns" | "rows" | "normal" | "coatNormal") => {
                            context.fillStyle = pattern === "normal" ? "#a080f0" : pattern === "coatNormal" ? "#80a0f0" : "white";
                            context.fillRect(0, 0, 8, 8);
                            if (pattern === "color" || pattern === "columns" || pattern === "rows") {
                                context.fillStyle = pattern === "color" ? "#ff4020" : "#40404040";
                                context.fillRect(0, 0, pattern === "rows" ? 8 : 4, pattern === "rows" ? 4 : 8);
                            }
                            return image.toDataURL();
                        };
                        const geometry = [-1, -1, 0, -1, 1, 0, 1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1];
                        const data = new Float32Array([
                            ...geometry,
                            ...Array.from({ length: 6 }, () => [0, 0, -1]).flat(),
                            ...Array.from({ length: 6 }, () => [0, 1, 0, 1]).flat(),
                        ]);
                        const source = (uv: number, pattern: "white" | "columns" | "rows", transform = false, withDiffuse = diffuse, withTangents = false) => ({
                            asset: { version: "2.0" },
                            extensionsUsed: [
                                "KHR_materials_transmission",
                                "KHR_materials_volume",
                                "KHR_materials_clearcoat",
                                "KHR_texture_transform",
                                ...(withDiffuse ? ["KHR_materials_diffuse_transmission"] : []),
                            ],
                            scene: 0,
                            scenes: [{ nodes: [0] }],
                            nodes: [{ mesh: 0 }],
                            meshes: [
                                { primitives: [{ attributes: { POSITION: 0, TEXCOORD_0: 1, TEXCOORD_1: 2, NORMAL: 3, ...(withTangents ? { TANGENT: 4 } : {}) }, material: 0 }] },
                            ],
                            materials: [
                                {
                                    doubleSided: true,
                                    pbrMetallicRoughness: { metallicFactor: 0, roughnessFactor: 0, baseColorFactor: [0.8, 0.9, 1, 1], baseColorTexture: { index: 0 } },
                                    normalTexture: { index: 2 },
                                    extensions: {
                                        ...(withDiffuse
                                            ? {
                                                  KHR_materials_diffuse_transmission: {
                                                      diffuseTransmissionFactor: 0.6,
                                                      diffuseTransmissionTexture: { index: 1, texCoord: uv },
                                                      diffuseTransmissionColorFactor: [0.7, 0.8, 0.9],
                                                      diffuseTransmissionColorTexture: { index: 0 },
                                                  },
                                              }
                                            : {}),
                                        KHR_materials_transmission: {
                                            transmissionFactor: 1,
                                            transmissionTexture: {
                                                index: 1,
                                                texCoord: uv,
                                                ...(transform ? { extensions: { KHR_texture_transform: { offset: [0.125, 0.25], scale: [0.5, 0.75], rotation: 0.25 } } } : {}),
                                            },
                                        },
                                        KHR_materials_volume: { thicknessFactor: 1, attenuationDistance: 1 },
                                        KHR_materials_clearcoat: {
                                            clearcoatFactor: 1,
                                            clearcoatRoughnessFactor: 0,
                                            clearcoatRoughnessTexture: { index: 1, texCoord: uv },
                                            clearcoatNormalTexture: { index: 3, texCoord: 1 },
                                            clearcoatTexture: {
                                                index: 1,
                                                texCoord: uv,
                                                ...(transform ? { extensions: { KHR_texture_transform: { offset: [0.125, 0.25], scale: [0.5, 0.75], rotation: 0.25 } } } : {}),
                                            },
                                        },
                                    },
                                },
                            ],
                            textures: [{ source: 0 }, { source: 1 }, { source: 2 }, { source: 3 }],
                            images: [{ uri: texture("color") }, { uri: texture(pattern) }, { uri: texture("normal") }, { uri: texture("coatNormal") }],
                            accessors: [
                                { bufferView: 0, componentType: 5126, count: 6, type: "VEC3", min: [-1, -1, 0], max: [1, 1, 0] },
                                { bufferView: 1, componentType: 5126, count: 6, type: "VEC2" },
                                { bufferView: 2, componentType: 5126, count: 6, type: "VEC2" },
                                { bufferView: 3, componentType: 5126, count: 6, type: "VEC3" },
                                { bufferView: 4, componentType: 5126, count: 6, type: "VEC4" },
                            ],
                            bufferViews: [
                                { buffer: 0, byteLength: 72 },
                                { buffer: 0, byteOffset: 72, byteLength: 48 },
                                { buffer: 0, byteOffset: 120, byteLength: 48 },
                                { buffer: 0, byteOffset: 168, byteLength: 72 },
                                { buffer: 0, byteOffset: 240, byteLength: 96 },
                            ],
                            buffers: [{ byteLength: data.byteLength, uri: "data:application/octet-stream;base64," + btoa(String.fromCharCode(...new Uint8Array(data.buffer))) }],
                        });
                        const capture = async (scene: InstanceType<typeof BABYLON.Scene>) => {
                            for (let frame = 0; frame < 3; frame++) {
                                await new Promise(requestAnimationFrame);
                                await scene.whenReadyAsync();
                                engine.beginFrame();
                                scene.render();
                                engine.endFrame();
                            }
                            return Array.from(await engine.readPixels(0, 0, 64, 64));
                        };
                        const scenes: InstanceType<typeof BABYLON.Scene>[] = [];
                        const load = async (gltf: ReturnType<typeof source>) => {
                            const scene = new BABYLON.Scene(engine);
                            scenes.push(scene);
                            new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 0, -4), scene).setTarget(BABYLON.Vector3.Zero());
                            const loaded = await BABYLON.ImportMeshAsync("data:" + JSON.stringify(gltf), scene, {
                                pluginExtension: ".gltf",
                                pluginOptions: { gltf: { useOpenPBR: true } },
                            });
                            const material = loaded.meshes.find((mesh) => mesh.material)!.material as InstanceType<typeof BABYLON.OpenPBRMaterial>;
                            // Readiness must wait for the edited shader, not keep rendering the previous effect.
                            material.allowShaderHotSwapping = false;
                            const background = BABYLON.MeshBuilder.CreatePlane("background", { size: 4 }, scene);
                            background.position.z = 1;
                            const white = new BABYLON.StandardMaterial("white", scene);
                            white.disableLighting = true;
                            white.emissiveColor.set(1, 1, 1);
                            background.material = white;
                            return { scene, material };
                        };
                        try {
                            const a = await load(source(0, "white"));
                            const whiteUV0 = await capture(a.scene);
                            a.scene.dispose();
                            const b = await load(source(1, "white"));
                            const whiteUV1 = await capture(b.scene);
                            b.scene.dispose();
                            const c = await load(source(0, "rows"));
                            const rowsUV0 = await capture(c.scene);
                            c.scene.dispose();
                            const d = await load(source(1, "columns"));
                            const columnsUV1 = await capture(d.scene);
                            const before = await capture(d.scene);
                            d.material.baseColor.set(0.2, 0.8, 0.4);
                            d.material.transmissionWeight = 0.4;
                            d.material.coatWeight = 0.25;
                            d.material.coatRoughness = 0.25;
                            d.material.specularRoughness = 0.4;
                            const edited = await capture(d.scene);
                            d.scene.dispose();
                            const editedSource = source(1, "columns");
                            editedSource.materials[0].pbrMetallicRoughness.baseColorFactor = [0.2, 0.8, 0.4, 1];
                            editedSource.materials[0].extensions.KHR_materials_transmission.transmissionFactor = 0.4;
                            editedSource.materials[0].extensions.KHR_materials_clearcoat.clearcoatFactor = 0.25;
                            editedSource.materials[0].extensions.KHR_materials_clearcoat.clearcoatRoughnessFactor = 0.25;
                            editedSource.materials[0].pbrMetallicRoughness.roughnessFactor = 0.4;
                            const f = await load(editedSource);
                            const reimported = await capture(f.scene);
                            f.scene.dispose();
                            const e = await load(source(1, "columns", true));
                            const transformed = await capture(e.scene);
                            const coat = e.material.coatWeightTexture as InstanceType<typeof BABYLON.Texture> | null;
                            const authored = {
                                coatWeight: e.material.coatWeight,
                                coatRoughness: e.material.coatRoughness,
                                coatUV: coat?.coordinatesIndex,
                                coatNormalUV: e.material.geometryCoatNormalTexture?.coordinatesIndex,
                                transform: coat ? [coat.uOffset, coat.vOffset, coat.uScale, coat.vScale, coat.wAng] : null,
                            };
                            const exported = await BABYLON.GLTF2Export.GLTFAsync(e.scene, "surface", { shouldExportNode: (node) => node.name !== "background" });
                            const gltf = JSON.parse(exported.files["surface.gltf"] as string);
                            const exportedMaterial = gltf.materials.find((material: { name: string }) => material.name === e.material.name);
                            let withoutDiffuse = transformed;
                            if (diffuse) {
                                const g = await load(source(1, "columns", true, false));
                                withoutDiffuse = await capture(g.scene);
                                g.scene.dispose();
                            }
                            const different = (left: number[], right: number[]) => left.filter((value, i) => i % 4 !== 3 && Math.abs(value - right[i]) > 3).length;
                            const liveColor = await load(source(0, "white"));
                            liveColor.material.baseColorTexture = null;
                            liveColor.material.baseColor.set(1, 1, 1);
                            liveColor.material._gltfDiffuseTransmissionColorTexture = null;
                            liveColor.material._gltfDiffuseTransmissionColor.set(1, 1, 1);
                            const whiteColor = await capture(liveColor.scene);
                            const color = diffuse ? liveColor.material._gltfDiffuseTransmissionColor : liveColor.material.baseColor;
                            color.set(0.2, 0.6, 0.8);
                            const tintedColor = await capture(liveColor.scene);
                            const colorReference = await load(source(0, "white"));
                            colorReference.material.baseColorTexture = null;
                            colorReference.material.baseColor.set(1, 1, 1);
                            colorReference.material._gltfDiffuseTransmissionColorTexture = null;
                            colorReference.material._gltfDiffuseTransmissionColor.set(1, 1, 1);
                            (diffuse ? colorReference.material._gltfDiffuseTransmissionColor : colorReference.material.baseColor).set(0.2, 0.6, 0.8);
                            const referenceColor = await capture(colorReference.scene);
                            color.set(1, 1, 1);
                            const restoredColor = await capture(liveColor.scene);
                            liveColor.scene.dispose();
                            colorReference.scene.dispose();
                            const tangentSource = source(0, "white", false, false, true);
                            tangentSource.images[0].uri = texture("white");
                            tangentSource.materials[0].pbrMetallicRoughness.baseColorFactor = [1, 1, 1, 1];
                            tangentSource.materials[0].extensions.KHR_materials_clearcoat.clearcoatNormalTexture.texCoord = 0;
                            tangentSource.materials[0].extensions.KHR_materials_clearcoat.clearcoatRoughnessFactor = 0.3;
                            tangentSource.materials[0].extensions.KHR_materials_transmission.transmissionFactor = 0.5;
                            const tangentMaterial = await load(tangentSource);
                            new BABYLON.DirectionalLight("light", new BABYLON.Vector3(0.3, 0.4, 1), tangentMaterial.scene).intensity = 5;
                            const convertedTangents = await capture(tangentMaterial.scene);
                            tangentMaterial.scene.dispose();
                            const tangentReference = await load(tangentSource);
                            tangentReference.material._gltfTransmissionSurfaceToCoat = false;
                            new BABYLON.DirectionalLight("light", new BABYLON.Vector3(0.3, 0.4, 1), tangentReference.scene).intensity = 5;
                            const referenceTangents = await capture(tangentReference.scene);
                            tangentReference.scene.dispose();
                            return {
                                liveColorDifference: different(whiteColor, tintedColor),
                                liveColorReferenceDifference: different(tintedColor, referenceColor),
                                restoredColorDifference: different(whiteColor, restoredColor),
                                tangentDifference: different(convertedTangents, referenceTangents),
                                whiteDifference: different(whiteUV0, whiteUV1),
                                patternDifference: different(rowsUV0, columnsUV1),
                                transformDifference: different(columnsUV1, transformed),
                                editDifference: different(before, edited),
                                editReferenceDifference: different(edited, reimported),
                                diffuseDifference: different(transformed, withoutDiffuse),
                                distinctColors: new Set(whiteUV1.filter((_, i) => i % 4 === 0).map((_, i) => whiteUV1.slice(i * 4, i * 4 + 3).join(","))).size,
                                authored,
                                exported: {
                                    baseColorFactor: exportedMaterial.pbrMetallicRoughness.baseColorFactor,
                                    baseColorUV: exportedMaterial.pbrMetallicRoughness.baseColorTexture.texCoord ?? 0,
                                    coatWeight: exportedMaterial.extensions.KHR_materials_clearcoat.clearcoatFactor,
                                    coatRoughness: exportedMaterial.extensions.KHR_materials_clearcoat.clearcoatRoughnessFactor,
                                    coatTexture: exportedMaterial.extensions.KHR_materials_clearcoat.clearcoatTexture,
                                    coatRoughnessTexture: exportedMaterial.extensions.KHR_materials_clearcoat.clearcoatRoughnessTexture,
                                    coatNormalTexture: exportedMaterial.extensions.KHR_materials_clearcoat.clearcoatNormalTexture,
                                },
                            };
                        } finally {
                            scenes.forEach((scene) => scene.dispose());
                        }
                    } finally {
                        engine.dispose();
                        canvas.remove();
                    }
                },
                { backend, diffuse }
            );
            expect(result.distinctColors, JSON.stringify(result)).toBeGreaterThan(2);
            expect(result.whiteDifference, JSON.stringify(result)).toBe(0);
            expect(result.liveColorDifference, JSON.stringify(result)).toBeGreaterThan(100);
            expect(result.liveColorReferenceDifference, JSON.stringify(result)).toBe(0);
            expect(result.restoredColorDifference, JSON.stringify(result)).toBe(0);
            expect(result.tangentDifference, JSON.stringify(result)).toBe(0);
            expect(result.patternDifference, JSON.stringify(result)).toBe(0);
            expect(result.transformDifference).toBeGreaterThan(100);
            expect(result.editDifference).toBeGreaterThan(100);
            expect(result.editReferenceDifference).toBe(0);
            if (diffuse) {
                expect(result.diffuseDifference).toBeGreaterThan(100);
            }
            expect(result.authored.coatWeight).toBe(1);
            expect(result.authored.coatRoughness).toBe(0);
            expect(result.authored.coatUV).toBe(1);
            expect(result.authored.coatNormalUV).toBe(1);
            expect(result.authored.transform).toEqual([0.125, 0.25, 0.5, 0.75, -0.25]);
            expect(result.exported.baseColorFactor).toEqual([0.8, 0.9, 1, 1]);
            expect(result.exported.baseColorUV).toBe(0);
            expect(result.exported.coatWeight).toBe(1);
            expect(result.exported.coatRoughness).toBe(0);
            expect(result.exported.coatTexture.texCoord).toBe(1);
            expect(result.exported.coatRoughnessTexture.texCoord).toBe(1);
            expect(result.exported.coatNormalTexture.texCoord).toBe(1);
            expect(result.exported.coatTexture.extensions.KHR_texture_transform.offset).toEqual([0.125, 0.25]);
            expect(result.exported.coatTexture.extensions.KHR_texture_transform.scale).toEqual([0.5, 0.75]);
            expect(result.exported.coatTexture.extensions.KHR_texture_transform.rotation).toBeCloseTo(0.25);
            expect(warnings).toEqual([]);
        });
    }
}
