import { test, expect, Page } from "@playwright/test";
import { evaluateDisposeEngine, evaluateCreateScene, evaluateInitEngine, getGlobalConfig, logPageErrors } from "@tools/test-tools";

// The page (empty.html) exposes the full Babylon bundle, including the glTF serializer (GLTF2Export).
declare const BABYLON: typeof import("core/index") & typeof import("serializers/index") & typeof import("loaders/index");

interface Window {
    BABYLON: typeof BABYLON;
    scene: InstanceType<typeof BABYLON.Scene> | null;
}
declare const window: Window & typeof globalThis;

const debug = process.env.DEBUG === "true";
let page: Page;

test.describe("OpenPBR KHR_materials_transmission export base color", () => {
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        await page.goto(getGlobalConfig().baseUrl + `/empty.html`, { waitUntil: "load", timeout: 0 });
        await page.waitForSelector("#babylon-canvas", { timeout: 20000 });
        await page.waitForFunction(() => window.BABYLON);
        page.setDefaultTimeout(0);
        await logPageErrors(page, debug);
    });
    test.setTimeout(debug ? 1000000 : 30000);

    test.beforeEach(async () => {
        await page.goto(getGlobalConfig().baseUrl + `/empty.html`, { waitUntil: "load", timeout: 0 });
        await page.evaluate(evaluateInitEngine, {});
        await page.evaluate(evaluateCreateScene);
    });

    test.afterEach(async () => {
        await page.evaluate(evaluateDisposeEngine);
    });

    test.afterAll(async () => {
        await page.close();
    });

    // glTF uses the base color as the metal F0 as well as the dielectric/transmission tint, so the
    // exporter must only pull the base color toward the transmission tint for the dielectric fraction
    // (1 - metalness) of the transmission weight. Otherwise transmissive metals export as white.
    const exportBaseColorFactorAsync = async (metalness: number) =>
        await page.evaluate(async (metalness) => {
            const scene = window.scene!;
            const box = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
            const mat = new BABYLON.OpenPBRMaterial("metalTransmission", scene);
            mat.geometryThinWalled = 1;
            mat.baseColor = new BABYLON.Color3(0.9, 0.6, 0.2);
            mat.baseMetalness = metalness;
            mat.transmissionWeight = 1;
            mat.transmissionColor = BABYLON.Color3.White();
            box.material = mat;

            const gltf = await BABYLON.GLTF2Export.GLTFAsync(scene, "metal");
            const json = JSON.parse(gltf.files["metal.gltf"] as string);
            const exported = json.materials[0];
            return {
                baseColorFactor: exported.pbrMetallicRoughness.baseColorFactor as number[],
                metallicFactor: exported.pbrMetallicRoughness.metallicFactor as number | undefined,
                transmissionFactor: exported.extensions?.KHR_materials_transmission?.transmissionFactor as number | undefined,
            };
        }, metalness);

    test("fully metallic transmissive material keeps its base color", async () => {
        const result = await exportBaseColorFactorAsync(1);
        expect(result.transmissionFactor).toBeCloseTo(1, 3);
        expect(result.baseColorFactor[0]).toBeCloseTo(0.9, 3);
        expect(result.baseColorFactor[1]).toBeCloseTo(0.6, 3);
        expect(result.baseColorFactor[2]).toBeCloseTo(0.2, 3);
    });

    test("partially metallic transmissive material lerps the base color by the dielectric transmission", async () => {
        const result = await exportBaseColorFactorAsync(0.25);
        // lerp(baseColor, white, transmission * (1 - metalness)) = lerp(baseColor, white, 0.75)
        expect(result.baseColorFactor[0]).toBeCloseTo(0.9 + (1 - 0.9) * 0.75, 3);
        expect(result.baseColorFactor[1]).toBeCloseTo(0.6 + (1 - 0.6) * 0.75, 3);
        expect(result.baseColorFactor[2]).toBeCloseTo(0.2 + (1 - 0.2) * 0.75, 3);
    });

    for (const tintEdit of ["unchanged", "factor", "texture"]) {
        for (const transmissionWeight of [0.5, 1]) {
            test(`imported thin-walled transmission exports its current tint (${tintEdit}, weight: ${transmissionWeight})`, async () => {
                const result = await page.evaluate(
                    async ({ tintEdit, transmissionWeight }) => {
                        const scene = window.scene!;
                        const colorImage = (color: string) => {
                            const canvas = document.createElement("canvas");
                            canvas.width = canvas.height = 2;
                            const context = canvas.getContext("2d")!;
                            context.fillStyle = color;
                            context.fillRect(0, 0, 2, 2);
                            return canvas.toDataURL();
                        };
                        const data = new Float32Array([-1, -1, 0, -1, 1, 0, 1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 1, 1]);
                        const textured = tintEdit === "texture";
                        const source = {
                            asset: { version: "2.0" },
                            extensionsUsed: ["KHR_materials_transmission"],
                            scene: 0,
                            scenes: [{ nodes: [0] }],
                            nodes: [{ mesh: 0 }],
                            meshes: [{ primitives: [{ attributes: { POSITION: 0, TEXCOORD_0: 1 }, material: 0 }] }],
                            materials: [
                                {
                                    name: "editedTint",
                                    pbrMetallicRoughness: {
                                        metallicFactor: 0,
                                        baseColorFactor: textured ? [1, 1, 1, 1] : [1, 0, 0, 1],
                                        ...(textured ? { baseColorTexture: { index: 0 } } : {}),
                                    },
                                    extensions: { KHR_materials_transmission: { transmissionFactor: transmissionWeight } },
                                },
                            ],
                            ...(textured ? { textures: [{ source: 0 }], images: [{ uri: colorImage("red") }] } : {}),
                            accessors: [
                                { bufferView: 0, componentType: 5126, count: 6, type: "VEC3", min: [-1, -1, 0], max: [1, 1, 0] },
                                { bufferView: 1, componentType: 5126, count: 6, type: "VEC2" },
                            ],
                            bufferViews: [
                                { buffer: 0, byteLength: 72 },
                                { buffer: 0, byteOffset: 72, byteLength: 48 },
                            ],
                            buffers: [{ byteLength: data.byteLength, uri: "data:application/octet-stream;base64," + btoa(String.fromCharCode(...new Uint8Array(data.buffer))) }],
                        };
                        const loaded = await BABYLON.ImportMeshAsync("data:" + JSON.stringify(source), scene, {
                            pluginExtension: ".gltf",
                            pluginOptions: { gltf: { useOpenPBR: true } },
                        });
                        const material = loaded.meshes.find((mesh) => mesh.material)!.material as InstanceType<typeof BABYLON.OpenPBRMaterial>;
                        if (tintEdit === "factor") {
                            material.transmissionColor = new BABYLON.Color3(0, 1, 0);
                        } else if (textured) {
                            material.transmissionColorTexture = new BABYLON.Texture(colorImage("#00ff00"), scene, false, false, BABYLON.Texture.NEAREST_SAMPLINGMODE);
                        }
                        await scene.whenReadyAsync();
                        const exported = await BABYLON.GLTF2Export.GLTFAsync(scene, "tint");
                        const gltf = JSON.parse(exported.files["tint.gltf"] as string);
                        const pbr = gltf.materials.find((entry: { name: string }) => entry.name === "editedTint").pbrMetallicRoughness;
                        let texel = [255, 255, 255, 255];
                        if (pbr.baseColorTexture) {
                            const uri = gltf.images[gltf.textures[pbr.baseColorTexture.index].source].uri as string;
                            const bitmap = await createImageBitmap(exported.files[uri] as Blob, { colorSpaceConversion: "none", premultiplyAlpha: "none" });
                            const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
                            const context = canvas.getContext("2d")!;
                            context.drawImage(bitmap, 0, 0);
                            texel = Array.from(context.getImageData(0, 0, 1, 1).data);
                            bitmap.close();
                        }
                        return {
                            imported: material._gltfTransmissionSurfaceToCoat,
                            thinWalled: material.geometryThinWalled,
                            factor: (pbr.baseColorFactor ?? [1, 1, 1, 1]) as number[],
                            texel,
                        };
                    },
                    { tintEdit, transmissionWeight }
                );
                expect(result.imported).toBe(true);
                expect(result.thinWalled).toBe(1);
                const weight = tintEdit === "unchanged" ? 0 : transmissionWeight;
                const expected = [1 - weight, weight, 0];
                for (let channel = 0; channel < 3; channel++) {
                    const encoded = result.texel[channel] / 255;
                    const linear = encoded <= 0.04045 ? encoded / 12.92 : Math.pow((encoded + 0.055) / 1.055, 2.4);
                    expect(Math.abs(result.factor[channel] * linear - expected[channel])).toBeLessThan(0.01);
                }
            });
        }
    }

    // Rebaking the base color combines it with the transmission weight texture. When the two use different
    // UV sets, the exporter leaves the base color exported by the material exporter untouched instead.
    const exportWithTexturesAsync = async (transmissionUVSet: number) =>
        await page.evaluate(async (transmissionUVSet) => {
            const scene = window.scene!;
            const box = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
            const mat = new BABYLON.OpenPBRMaterial("transmissionUV", scene);
            mat.geometryThinWalled = 1;
            mat.baseColor = new BABYLON.Color3(0.9, 0.6, 0.2);
            const pixels = new Uint8Array([255, 128, 64, 255, 255, 128, 64, 255, 255, 128, 64, 255, 255, 128, 64, 255]);
            const baseColorTexture = BABYLON.RawTexture.CreateRGBATexture(pixels, 2, 2, scene);
            baseColorTexture.name = "baseColor";
            mat.baseColorTexture = baseColorTexture;
            const transmissionTexture = BABYLON.RawTexture.CreateRGBATexture(new Uint8Array(pixels), 2, 2, scene);
            transmissionTexture.name = "transmission";
            transmissionTexture.coordinatesIndex = transmissionUVSet;
            mat.transmissionWeight = 1;
            mat.transmissionWeightTexture = transmissionTexture;
            mat.transmissionColor = BABYLON.Color3.White();
            box.material = mat;

            const gltf = await BABYLON.GLTF2Export.GLTFAsync(scene, "uv");
            const json = JSON.parse(gltf.files["uv.gltf"] as string);
            const exported = json.materials[0];
            const transmission = exported.extensions?.KHR_materials_transmission;
            return {
                baseColorFactor: exported.pbrMetallicRoughness.baseColorFactor as number[] | undefined,
                baseColorTexCoord: (exported.pbrMetallicRoughness.baseColorTexture?.texCoord ?? 0) as number,
                hasBaseColorTexture: !!exported.pbrMetallicRoughness.baseColorTexture,
                transmissionTexCoord: (transmission?.transmissionTexture?.texCoord ?? 0) as number,
                hasTransmissionTexture: !!transmission?.transmissionTexture,
            };
        }, transmissionUVSet);

    test("rebakes the base color when the base color and transmission textures share a UV set", async () => {
        const result = await exportWithTexturesAsync(0);
        expect(result.hasBaseColorTexture).toBe(true);
        expect(result.hasTransmissionTexture).toBe(true);
        expect(result.baseColorFactor ?? [1, 1, 1, 1]).toEqual([1, 1, 1, 1]);
    });

    test("keeps the original base color when the base color and transmission textures use different UV sets", async () => {
        const result = await exportWithTexturesAsync(1);
        expect(result.hasBaseColorTexture).toBe(true);
        expect(result.baseColorTexCoord).toBe(0);
        expect(result.hasTransmissionTexture).toBe(true);
        expect(result.transmissionTexCoord).toBe(1);
        expect(result.baseColorFactor![0]).toBeCloseTo(0.9, 3);
        expect(result.baseColorFactor![1]).toBeCloseTo(0.6, 3);
        expect(result.baseColorFactor![2]).toBeCloseTo(0.2, 3);
    });

    // The subsurface and transmission weights are baked into one glTF transmission texture, which can only
    // use one UV set. With mismatched UV sets, the export keeps the transmission weight mask (and its UV set)
    // and falls back to the subsurface weight factor, instead of silently keeping whichever comes first.
    test("keeps the transmission weight texture when the subsurface and transmission weight textures use different UV sets", async () => {
        const result = await page.evaluate(async () => {
            const scene = window.scene!;
            const box = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
            const mat = new BABYLON.OpenPBRMaterial("mixedWeightUV", scene);
            const pixels = new Uint8Array([255, 128, 64, 255, 255, 128, 64, 255, 255, 128, 64, 255, 255, 128, 64, 255]);
            const baseColorTexture = BABYLON.RawTexture.CreateRGBATexture(pixels, 2, 2, scene);
            baseColorTexture.name = "baseColor";
            mat.baseColorTexture = baseColorTexture;
            const subsurfaceTexture = BABYLON.RawTexture.CreateRGBATexture(new Uint8Array(pixels), 2, 2, scene);
            subsurfaceTexture.name = "subsurface";
            mat.subsurfaceWeight = 0.5;
            mat.subsurfaceWeightTexture = subsurfaceTexture;
            const transmissionTexture = BABYLON.RawTexture.CreateRGBATexture(new Uint8Array(pixels), 2, 2, scene);
            transmissionTexture.name = "transmission";
            transmissionTexture.coordinatesIndex = 1;
            mat.transmissionWeight = 1;
            mat.transmissionWeightTexture = transmissionTexture;
            box.material = mat;

            const errors: string[] = [];
            const previousOnNewCacheEntry = BABYLON.Logger.OnNewCacheEntry;
            BABYLON.Logger.OnNewCacheEntry = (entry: string) => {
                if (entry.includes("different UV sets")) {
                    errors.push(entry);
                }
                previousOnNewCacheEntry?.(entry);
            };
            try {
                const gltf = await BABYLON.GLTF2Export.GLTFAsync(scene, "mixed");
                const json = JSON.parse(gltf.files["mixed.gltf"] as string);
                const exported = json.materials[0];
                const transmission = exported.extensions?.KHR_materials_transmission;
                return {
                    errorCount: errors.length,
                    hasTransmissionTexture: !!transmission?.transmissionTexture,
                    transmissionTexCoord: (transmission?.transmissionTexture?.texCoord ?? 0) as number,
                    hasBaseColorTexture: !!exported.pbrMetallicRoughness.baseColorTexture,
                    baseColorTexCoord: (exported.pbrMetallicRoughness.baseColorTexture?.texCoord ?? 0) as number,
                };
            } finally {
                BABYLON.Logger.OnNewCacheEntry = previousOnNewCacheEntry;
            }
        });
        // One error for the weight textures; the base color guard then warns too, since the transmission mask is on UV1.
        expect(result.errorCount).toBeGreaterThanOrEqual(1);
        expect(result.hasTransmissionTexture).toBe(true);
        expect(result.transmissionTexCoord).toBe(1);
        expect(result.hasBaseColorTexture).toBe(true);
        expect(result.baseColorTexCoord).toBe(0);
    });

    // Hardware-sRGB sources sample as linear RGB, but exported base color images must contain sRGB texels,
    // including after opacity packing and when imported glTF inputs bypass native OpenPBR tint rebaking.
    for (const { useSRGBBuffer, imported } of [
        { useSRGBBuffer: false, imported: false },
        { useSRGBBuffer: true, imported: false },
        { useSRGBBuffer: false, imported: true },
        { useSRGBBuffer: true, imported: true },
    ]) {
        for (const withOpacityTexture of [false, true]) {
            test(`exported base color texels are correct (imported: ${imported}, sRGB buffer: ${useSRGBBuffer}, opacity texture: ${withOpacityTexture})`, async () => {
                const result = await page.evaluate(
                    async ({ useSRGBBuffer, withOpacityTexture, imported }) => {
                        const scene = window.scene!;
                        const RGBA = BABYLON.Constants.TEXTUREFORMAT_RGBA;
                        const NEAREST = BABYLON.Texture.NEAREST_SAMPLINGMODE;
                        const UNSIGNED_BYTE = BABYLON.Constants.TEXTURETYPE_UNSIGNED_BYTE;
                        const solid = (value: number, srgb: boolean) =>
                            new BABYLON.RawTexture(new Uint8Array(16).fill(value), 2, 2, RGBA, scene, false, false, NEAREST, UNSIGNED_BYTE, undefined, srgb);

                        const box = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
                        const mat = new BABYLON.OpenPBRMaterial("srgbBaseColor", scene);
                        mat._gltfTransmissionSurfaceToCoat = imported;
                        mat.geometryThinWalled = 1;
                        mat.baseColor = BABYLON.Color3.White();
                        const baseColorTexture = solid(128, useSRGBBuffer);
                        baseColorTexture.name = "baseColor";
                        mat.baseColorTexture = baseColorTexture;
                        if (withOpacityTexture) {
                            const opacityTexture = solid(128, false);
                            opacityTexture.name = "opacity";
                            mat.geometryOpacityTexture = opacityTexture;
                        }
                        mat.transmissionWeight = 0.5;
                        mat.transmissionColor = BABYLON.Color3.White();
                        if (imported) {
                            mat.transmissionColorTexture = baseColorTexture;
                        }
                        box.material = mat;

                        const gltf = await BABYLON.GLTF2Export.GLTFAsync(scene, "srgb");
                        const json = JSON.parse(gltf.files["srgb.gltf"] as string);
                        const baseColorInfo = json.materials[0].pbrMetallicRoughness.baseColorTexture;
                        const uri = json.images[json.textures[baseColorInfo.index].source].uri as string;
                        const bitmap = await createImageBitmap(gltf.files[uri] as Blob, { colorSpaceConversion: "none", premultiplyAlpha: "none" });
                        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
                        const context = canvas.getContext("2d")!;
                        context.drawImage(bitmap, 0, 0);
                        const texel = Array.from(context.getImageData(0, 0, 1, 1).data);
                        return {
                            supportsSRGBBuffers: !!scene.getEngine().getCaps().supportSRGBBuffers,
                            gammaSpace: baseColorTexture.gammaSpace,
                            texel,
                        };
                    },
                    { useSRGBBuffer, withOpacityTexture, imported }
                );

                if (useSRGBBuffer) {
                    expect(result.supportsSRGBBuffers).toBe(true);
                }
                expect(result.gammaSpace).toBe(!useSRGBBuffer);
                // Native inputs neutralize transmission tint; imported glTF inputs keep their authored RGB.
                const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
                const toSRGB = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
                const expected = imported ? 128 : toSRGB(toLinear(128 / 255) * 0.5 + 0.5) * 255;
                for (let i = 0; i < 3; i++) {
                    expect(Math.abs(result.texel[i] - expected)).toBeLessThanOrEqual(2);
                }
                expect(Math.abs(result.texel[3] - 128)).toBeLessThanOrEqual(2);
            });
        }
    }
});
