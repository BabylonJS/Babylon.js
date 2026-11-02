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

    // The rebaked base color must decode the source base color according to its gammaSpace. A texture in a
    // hardware sRGB buffer is already linear when sampled, so decoding it again would darken the export.
    // With an opacity texture, the base color is first merged into an intermediate texture that keeps the
    // source encoding, so that path must use the source texture's color space too.
    for (const useSRGBBuffer of [false, true]) {
        for (const withOpacityTexture of [false, true]) {
            test(`rebaked base color texels are correct (sRGB buffer: ${useSRGBBuffer}, opacity texture: ${withOpacityTexture})`, async () => {
                const result = await page.evaluate(
                    async ({ useSRGBBuffer, withOpacityTexture }) => {
                        const scene = window.scene!;
                        const RGBA = BABYLON.Constants.TEXTUREFORMAT_RGBA;
                        const NEAREST = BABYLON.Texture.NEAREST_SAMPLINGMODE;
                        const UNSIGNED_BYTE = BABYLON.Constants.TEXTURETYPE_UNSIGNED_BYTE;
                        const solid = (value: number, srgb: boolean) =>
                            new BABYLON.RawTexture(new Uint8Array(16).fill(value), 2, 2, RGBA, scene, false, false, NEAREST, UNSIGNED_BYTE, undefined, srgb);

                        const box = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
                        const mat = new BABYLON.OpenPBRMaterial("srgbBaseColor", scene);
                        mat.geometryThinWalled = 1;
                        mat.baseColor = BABYLON.Color3.White();
                        const baseColorTexture = solid(128, useSRGBBuffer);
                        baseColorTexture.name = "baseColor";
                        mat.baseColorTexture = baseColorTexture;
                        if (withOpacityTexture) {
                            const opacityTexture = solid(255, false);
                            opacityTexture.name = "opacity";
                            mat.geometryOpacityTexture = opacityTexture;
                        }
                        mat.transmissionWeight = 0.5;
                        mat.transmissionColor = BABYLON.Color3.White();
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
                    { useSRGBBuffer, withOpacityTexture }
                );

                if (useSRGBBuffer) {
                    expect(result.supportsSRGBBuffers).toBe(true);
                }
                expect(result.gammaSpace).toBe(!useSRGBBuffer);
                // lerp(decode(128), white, 0.5), encoded as sRGB.
                const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
                const toSRGB = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
                const expected = toSRGB(toLinear(128 / 255) * 0.5 + 0.5) * 255;
                for (let i = 0; i < 3; i++) {
                    expect(Math.abs(result.texel[i] - expected)).toBeLessThanOrEqual(2);
                }
            });
        }
    }
});
