import { test, expect, Page } from "@playwright/test";
import { evaluateDisposeEngine, evaluateCreateScene, evaluateInitEngine, getGlobalConfig, logPageErrors } from "@tools/test-tools";

// The page (empty.html) exposes the full Babylon bundle, so both the glTF serializer (GLTF2Export)
// and the glTF loader (SceneLoader + gltf plugin) are available for an export -> re-import round-trip.
declare const BABYLON: typeof import("core/index") & typeof import("serializers/index") & typeof import("loaders/index");

interface Window {
    BABYLON: typeof BABYLON;
    scene: InstanceType<typeof BABYLON.Scene> | null;
}
declare const window: Window & typeof globalThis;

const debug = process.env.DEBUG === "true";
let page: Page;

test.describe("OpenPBR KHR_materials_scatter glTF round-trip", () => {
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

    // A glTF KHR_texture_transform rotates around (0, 0), unlike the (0.5, 0.5) default of a new texture, so the
    // processed scatter strength texture must carry the rotation centers along with the rotation.
    for (const withColorTexture of [false, true]) {
        test(`thin-walled scatter strength keeps a rotated glTF texture transform${withColorTexture ? " when packed with the color texture" : ""}`, async () => {
            const result = await page.evaluate(async (withColorTexture) => {
                const scene = window.scene!;
                const RGBA = BABYLON.Constants.TEXTUREFORMAT_RGBA;
                const NEAREST = BABYLON.Texture.NEAREST_SAMPLINGMODE;
                const data = new Uint8Array(4 * 4 * 4);
                for (let i = 0; i < 16; i++) {
                    const value = 32 + (i % 4) * 64;
                    data.set([value, value, value, 255], i * 4);
                }

                const box = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
                const mat = new BABYLON.OpenPBRMaterial("rotatedScatter", scene);
                mat.geometryThinWalled = 1;
                mat.transmissionWeight = 0.5;
                mat.subsurfaceWeight = 1;
                // Configured as the glTF loader does for rotation = pi/4, offset = [0.1, 0.2], scale = [2, 1].
                const weight = new BABYLON.RawTexture(data, 4, 4, RGBA, scene, false, false, NEAREST);
                weight.wrapU = weight.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
                weight.uRotationCenter = 0;
                weight.vRotationCenter = 0;
                weight.wAng = -Math.PI / 4;
                weight.uOffset = 0.1;
                weight.vOffset = 0.2;
                weight.uScale = 2;
                mat.subsurfaceWeightTexture = weight;
                if (withColorTexture) {
                    mat.subsurfaceColorTexture = new BABYLON.RawTexture(new Uint8Array(64).fill(200), 4, 4, RGBA, scene, false, false, NEAREST);
                }
                box.material = mat;
                const sourceMatrix = Array.from(weight.getTextureMatrix().asArray());

                const glb = await BABYLON.GLTF2Export.GLBAsync(scene, "rt");
                const url = URL.createObjectURL(glb.files["rt.glb"] as Blob);
                const gltf = await BABYLON.GLTF2Export.GLTFAsync(scene, "rt");
                const json = JSON.parse(gltf.files["rt.gltf"] as string);
                const exportedTransform = json.materials[0].extensions.KHR_materials_scatter.scatterStrengthTexture?.extensions?.KHR_texture_transform ?? null;

                const scene2 = new BABYLON.Scene(scene.getEngine());
                let gltfLoader: { useOpenPBR: boolean; whenCompleteAsync: () => Promise<void> } | null = null;
                BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader) => {
                    if (loader.name === "gltf") {
                        gltfLoader = loader as unknown as { useOpenPBR: boolean; whenCompleteAsync: () => Promise<void> };
                        gltfLoader.useOpenPBR = true;
                    }
                });
                await BABYLON.SceneLoader.AppendAsync("", url, scene2, undefined, ".glb");
                await gltfLoader!.whenCompleteAsync();
                URL.revokeObjectURL(url);

                const reMat = scene2.materials.find((m) => m.getClassName() === "OpenPBRMaterial") as InstanceType<typeof BABYLON.OpenPBRMaterial> | undefined;
                const reWeight = reMat?.subsurfaceWeightTexture as InstanceType<typeof BABYLON.Texture> | null | undefined;
                return {
                    sourceMatrix,
                    exportedTransform,
                    reimportedMatrix: reWeight ? Array.from(reWeight.getTextureMatrix().asArray()) : null,
                };
            }, withColorTexture);

            expect(result.exportedTransform).not.toBeNull();
            expect(result.exportedTransform.rotation).toBeCloseTo(Math.PI / 4, 5);
            expect(result.exportedTransform.offset[0]).toBeCloseTo(0.1, 5);
            expect(result.exportedTransform.offset[1]).toBeCloseTo(0.2, 5);
            expect(result.exportedTransform.scale[0]).toBeCloseTo(2, 5);
            expect(result.reimportedMatrix).not.toBeNull();
            result.reimportedMatrix!.forEach((value, i) => expect(value).toBeCloseTo(result.sourceMatrix[i], 5));
        });
    }

    // Thin-walled: scatter strength is baked from the (textured) weights, multi-scatter color is the
    // subsurface color/texture, and anisotropy is the subsurface scatter anisotropy. No volume extension
    // is written, so the material re-imports as thin-walled.
    test("thin-walled scatter with textures and anisotropy round-trips", async () => {
        const result = await page.evaluate(async () => {
            const scene = window.scene!;
            const RGBA = BABYLON.Constants.TEXTUREFORMAT_RGBA;
            const NEAREST = BABYLON.Texture.NEAREST_SAMPLINGMODE;
            const solid = (r: number, g: number, b: number, a: number) =>
                new BABYLON.RawTexture(new Uint8Array([r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a]), 2, 2, RGBA, scene, false, false, NEAREST);

            const box = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
            const mat = new BABYLON.OpenPBRMaterial("thinScatter", scene);
            mat.geometryThinWalled = 1;
            mat.transmissionWeight = 0.4;
            mat.subsurfaceWeight = 0.6;
            mat.subsurfaceColor = new BABYLON.Color3(0.8, 0.3, 0.2);
            mat.subsurfaceColorTexture = solid(200, 80, 60, 255);
            mat.subsurfaceWeightTexture = solid(180, 180, 180, 255);
            mat.subsurfaceScatterAnisotropy = 0.3;
            box.material = mat;

            const glb = await BABYLON.GLTF2Export.GLBAsync(scene, "rt");
            const url = URL.createObjectURL(glb.files["rt.glb"] as Blob);

            const scene2 = new BABYLON.Scene(scene.getEngine());
            let gltfLoader: { useOpenPBR: boolean; whenCompleteAsync: () => Promise<void> } | null = null;
            BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader) => {
                if (loader.name === "gltf") {
                    gltfLoader = loader as unknown as { useOpenPBR: boolean; whenCompleteAsync: () => Promise<void> };
                    gltfLoader.useOpenPBR = true;
                }
            });
            await BABYLON.SceneLoader.AppendAsync("", url, scene2, undefined, ".glb");
            // Material finalization (e.g. the thin-walled scatter weight conversion) runs before the
            // loader's complete state, which is later than when AppendAsync resolves.
            await gltfLoader!.whenCompleteAsync();
            URL.revokeObjectURL(url);

            const reMat = scene2.materials.find((m) => m.getClassName() === "OpenPBRMaterial") as any;
            return reMat
                ? {
                      found: true,
                      thinWalled: !!reMat.geometryThinWalled,
                      subsurfaceScatterAnisotropy: reMat.subsurfaceScatterAnisotropy as number,
                      subsurfaceColor: reMat.subsurfaceColor.asArray() as number[],
                      hasSubsurfaceColorTexture: !!reMat.subsurfaceColorTexture,
                      hasSubsurfaceWeightTexture: !!reMat.subsurfaceWeightTexture,
                  }
                : { found: false };
        });

        expect(result.found).toBe(true);
        expect(result.thinWalled).toBe(true);
        // Anisotropy is stored directly in the extension and must survive the round-trip.
        expect(result.subsurfaceScatterAnisotropy).toBeCloseTo(0.3, 3);
        // multiscatterColorFactor == subsurfaceColor for thin-walled.
        expect(result.subsurfaceColor![0]).toBeCloseTo(0.8, 2);
        expect(result.subsurfaceColor![1]).toBeCloseTo(0.3, 2);
        expect(result.subsurfaceColor![2]).toBeCloseTo(0.2, 2);
        // The color texture (multiscatterColorTexture) and the scatter-strength texture must both round-trip.
        expect(result.hasSubsurfaceColorTexture).toBe(true);
        expect(result.hasSubsurfaceWeightTexture).toBe(true);
    });

    // Volumetric (transmission only): the transmission slab's single-scatter albedo is converted to a
    // multi-scatter color texture on export (using the transmission scatter anisotropy) and back on
    // import. KHR_materials_volume is written, so the material re-imports as non-thin-walled, and the
    // transmission scatter anisotropy round-trips exactly because there is no subsurface slab to blend.
    test("volumetric scatter with textures and anisotropy round-trips", async () => {
        const result = await page.evaluate(async () => {
            const scene = window.scene!;
            const RGBA = BABYLON.Constants.TEXTUREFORMAT_RGBA;
            const NEAREST = BABYLON.Texture.NEAREST_SAMPLINGMODE;
            const solid = (r: number, g: number, b: number, a: number) =>
                new BABYLON.RawTexture(new Uint8Array([r, g, b, a, r, g, b, a, r, g, b, a, r, g, b, a]), 2, 2, RGBA, scene, false, false, NEAREST);

            const box = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
            const mat = new BABYLON.OpenPBRMaterial("volScatter", scene);
            mat.geometryThinWalled = 0;
            mat.transmissionWeight = 0.8;
            mat.subsurfaceWeight = 0; // transmission-only, so the exported scatterAnisotropy is the transmission one
            mat.transmissionDepth = 1.0;
            mat.geometryThickness = 1.0; // nonzero thickness -> KHR_materials_volume, so it re-imports as volumetric
            mat.transmissionColor = new BABYLON.Color3(0.9, 0.7, 0.5);
            mat.transmissionScatter = new BABYLON.Color3(0.08, 0.12, 0.2);
            mat.transmissionScatterTexture = solid(160, 160, 160, 255);
            mat.transmissionScatterAnisotropy = 0.4;
            box.material = mat;

            const glb = await BABYLON.GLTF2Export.GLBAsync(scene, "rt");
            const url = URL.createObjectURL(glb.files["rt.glb"] as Blob);

            const scene2 = new BABYLON.Scene(scene.getEngine());
            let gltfLoader: { useOpenPBR: boolean; whenCompleteAsync: () => Promise<void> } | null = null;
            BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader) => {
                if (loader.name === "gltf") {
                    gltfLoader = loader as unknown as { useOpenPBR: boolean; whenCompleteAsync: () => Promise<void> };
                    gltfLoader.useOpenPBR = true;
                }
            });
            await BABYLON.SceneLoader.AppendAsync("", url, scene2, undefined, ".glb");
            // Material finalization (e.g. the thin-walled scatter weight conversion) runs before the
            // loader's complete state, which is later than when AppendAsync resolves.
            await gltfLoader!.whenCompleteAsync();
            URL.revokeObjectURL(url);

            const reMat = scene2.materials.find((m) => m.getClassName() === "OpenPBRMaterial") as any;
            return reMat
                ? {
                      found: true,
                      thinWalled: !!reMat.geometryThinWalled,
                      transmissionScatterAnisotropy: reMat.transmissionScatterAnisotropy as number,
                      transmissionScatter: reMat.transmissionScatter.asArray() as number[],
                      hasTransmissionScatterTexture: !!reMat.transmissionScatterTexture,
                  }
                : { found: false };
        });

        expect(result.found).toBe(true);
        // KHR_materials_volume presence makes this re-import as volumetric (non-thin-walled).
        expect(result.thinWalled).toBe(false);
        // Anisotropy round-trips exactly for a transmission-only material (no subsurface blend to lose it).
        expect(result.transmissionScatterAnisotropy).toBeCloseTo(0.4, 3);
        // The single-scatter albedo texture round-trips (as the multi-scatter color texture in glTF).
        expect(result.hasTransmissionScatterTexture).toBe(true);
        // Scattering is present (non-black) after the round-trip.
        const maxScatter = Math.max(result.transmissionScatter![0], result.transmissionScatter![1], result.transmissionScatter![2]);
        expect(maxScatter).toBeGreaterThan(0);
    });

    // The importer decodes the multi-scatter color texture before converting it to single-scatter albedo.
    // With hardware sRGB buffers the sampled texture is already linear, so decoding it again would darken
    // the scattering. Both loader settings must reproduce the original per-texel transmission scatter.
    for (const useSRGBBuffers of [false, true]) {
        test(`volumetric scatter texels round-trip (useSRGBBuffers: ${useSRGBBuffers})`, async () => {
            const result = await page.evaluate(async (useSRGBBuffers) => {
                const scene = window.scene!;
                const RGBA = BABYLON.Constants.TEXTUREFORMAT_RGBA;
                const NEAREST = BABYLON.Texture.NEAREST_SAMPLINGMODE;

                const box = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
                const mat = new BABYLON.OpenPBRMaterial("volScatter", scene);
                mat.geometryThinWalled = 0;
                mat.transmissionWeight = 1;
                mat.subsurfaceWeight = 0;
                mat.transmissionDepth = 1.0;
                mat.geometryThickness = 1.0;
                mat.transmissionColor = new BABYLON.Color3(0.9, 0.7, 0.5);
                mat.transmissionScatter = new BABYLON.Color3(0.08, 0.12, 0.2);
                mat.transmissionScatterTexture = new BABYLON.RawTexture(new Uint8Array(16).fill(160), 2, 2, RGBA, scene, false, false, NEAREST);
                box.material = mat;

                const glb = await BABYLON.GLTF2Export.GLBAsync(scene, "rt");
                const url = URL.createObjectURL(glb.files["rt.glb"] as Blob);

                const scene2 = new BABYLON.Scene(scene.getEngine());
                type GLTFFileLoader = { useOpenPBR: boolean; useSRGBBuffers: boolean; whenCompleteAsync: () => Promise<void> };
                let gltfLoader: GLTFFileLoader | null = null;
                BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader) => {
                    if (loader.name === "gltf") {
                        gltfLoader = loader as unknown as GLTFFileLoader;
                        gltfLoader.useOpenPBR = true;
                        gltfLoader.useSRGBBuffers = useSRGBBuffers;
                    }
                });
                await BABYLON.SceneLoader.AppendAsync("", url, scene2, undefined, ".glb");
                await gltfLoader!.whenCompleteAsync();
                URL.revokeObjectURL(url);

                const reMat = scene2.materials.find((m) => m.getClassName() === "OpenPBRMaterial") as any;
                const texture = reMat.transmissionScatterTexture as InstanceType<typeof BABYLON.BaseTexture> | null;
                const pixels = texture ? ((await texture.readPixels()) as Uint8Array) : null;
                return {
                    supportsSRGBBuffers: !!scene.getEngine().getCaps().supportSRGBBuffers,
                    texel: pixels ? Array.from(pixels.slice(0, 3)) : null,
                };
            }, useSRGBBuffers);

            if (useSRGBBuffers) {
                expect(result.supportsSRGBBuffers).toBe(true);
            }
            expect(result.texel).not.toBeNull();
            // The imported texture holds the single-scatter albedo: scatter / extinction, where the
            // extinction is -log(transmissionColor) and the original scatter is the factor times the texel.
            const extinction = [0.9, 0.7, 0.5].map((c) => -Math.log(c));
            const albedo = [0.08, 0.12, 0.2].map((s, i) => (s * 160) / 255 / extinction[i]);
            for (let i = 0; i < 3; i++) {
                expect(Math.abs(result.texel![i] - albedo[i] * 255)).toBeLessThanOrEqual(3);
            }
        });
    }

    // Volumetric cases whose scattering coefficient must survive export/reimport.
    //  - zero attenuation channel: a zero transmission color channel is valid (full attenuation). The exporter
    //    must clamp it to the same positive bound as the renderer and importer before taking -log(), otherwise
    //    the extinction is infinite and a finite scattering coefficient exports as black.
    //  - negative absorption: -log(0.5) - (1, 0.5, 0.5) has a negative red absorption, which the renderer shifts
    //    out of every channel, giving an extinction of (1, 1, 1) and albedo (1, 0.5, 0.5). Dividing by -log(0.5)
    //    alone would recover (1.443, 0.721, 0.721) and inflate the green and blue coefficients by about 44%.
    const volumetricCases = [
        { label: "a zero attenuation channel", color: [0.9, 0, 0.5], scatter: [0.08, 2.0, 0.2], zeroChannel: true },
        { label: "negative absorption", color: [0.5, 0.5, 0.5], scatter: [1.0, 0.5, 0.5], zeroChannel: false },
    ];
    for (const { label, color, scatter, zeroChannel } of volumetricCases) {
        for (const textured of [false, true]) {
            test(`volumetric scatter with ${label} preserves the scattering coefficient (${textured ? "textured" : "constant"})`, async () => {
                const result = await page.evaluate(
                    async ({ textured, color, scatter }) => {
                        const scene = window.scene!;
                        const RGBA = BABYLON.Constants.TEXTUREFORMAT_RGBA;
                        const NEAREST = BABYLON.Texture.NEAREST_SAMPLINGMODE;

                        const box = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
                        const mat = new BABYLON.OpenPBRMaterial("zeroAttenuation", scene);
                        mat.geometryThinWalled = 0;
                        mat.transmissionWeight = 1;
                        mat.subsurfaceWeight = 0;
                        mat.transmissionDepth = 1.0;
                        mat.geometryThickness = 1.0;
                        mat.transmissionColor = BABYLON.Color3.FromArray(color);
                        mat.transmissionScatter = BABYLON.Color3.FromArray(scatter);
                        if (textured) {
                            mat.transmissionScatterTexture = new BABYLON.RawTexture(new Uint8Array(16).fill(255), 2, 2, RGBA, scene, false, false, NEAREST);
                        }
                        box.material = mat;

                        const glb = await BABYLON.GLTF2Export.GLBAsync(scene, "rt");
                        const url = URL.createObjectURL(glb.files["rt.glb"] as Blob);
                        const gltf = await BABYLON.GLTF2Export.GLTFAsync(scene, "rt");
                        const exported = JSON.parse(gltf.files["rt.gltf"] as string).materials[0].extensions;

                        const scene2 = new BABYLON.Scene(scene.getEngine());
                        let gltfLoader: { useOpenPBR: boolean; whenCompleteAsync: () => Promise<void> } | null = null;
                        BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader) => {
                            if (loader.name === "gltf") {
                                gltfLoader = loader as unknown as { useOpenPBR: boolean; whenCompleteAsync: () => Promise<void> };
                                gltfLoader.useOpenPBR = true;
                            }
                        });
                        await BABYLON.SceneLoader.AppendAsync("", url, scene2, undefined, ".glb");
                        await gltfLoader!.whenCompleteAsync();
                        URL.revokeObjectURL(url);

                        const reMat = scene2.materials.find((m) => m.getClassName() === "OpenPBRMaterial") as any;
                        const factor = reMat.transmissionScatter.asArray() as number[];
                        const texture = reMat.transmissionScatterTexture as InstanceType<typeof BABYLON.BaseTexture> | null;
                        let texel = [1, 1, 1];
                        if (texture) {
                            const pixels = await texture.readPixels();
                            texel = pixels instanceof Uint8Array ? Array.from(pixels.slice(0, 3)).map((v) => v / 255) : Array.from((pixels as Float32Array).slice(0, 3));
                        }
                        const depth = reMat.transmissionDepth as number;
                        return {
                            attenuationColor: exported.KHR_materials_volume.attenuationColor as number[],
                            attenuationDistance: exported.KHR_materials_volume.attenuationDistance as number,
                            multiscatterColor: (exported.KHR_materials_scatter.multiscatterColorFactor as number[]) ?? null,
                            hasMultiscatterTexture: !!exported.KHR_materials_scatter.multiscatterColorTexture,
                            transmissionColor: reMat.transmissionColor.asArray() as number[],
                            hasTexture: !!texture,
                            // Scattering coefficient = transmission_scatter / transmission_depth (factor times texel).
                            scatterCoefficient: factor.map((f, i) => (f * texel[i]) / depth),
                        };
                    },
                    { textured, color, scatter }
                );

                // The exported volume is finite.
                expect(result.attenuationDistance).toBeGreaterThan(0);
                expect(result.attenuationColor.every((c) => Number.isFinite(c))).toBe(true);
                expect(result.hasMultiscatterTexture).toBe(textured);
                expect(result.hasTexture).toBe(textured);
                if (zeroChannel) {
                    // The zero channel remains the most strongly attenuated one, and its multi-scatter color is not black.
                    expect(result.transmissionColor[1]).toBeLessThan(Math.min(result.transmissionColor[0], result.transmissionColor[2]));
                    if (!textured) {
                        expect(result.multiscatterColor[1]).toBeGreaterThan(0.01);
                    }
                }
                // The scattering coefficient (scatter / depth, with depth 1 originally) is preserved per channel.
                const tolerance = textured ? 0.06 : 0.02;
                for (let i = 0; i < 3; i++) {
                    expect(Math.abs(result.scatterCoefficient[i] - scatter[i]) / scatter[i], `channel ${i}: ${result.scatterCoefficient[i]}`).toBeLessThanOrEqual(tolerance);
                }
            });
        }
    }

    // The weight fraction T / (1 - (1-T)(1-S)) cancels catastrophically for small weights if its intermediates
    // are quantized: with T = S = 0.001 both inverted weights round to 1 in 8 bits and the fraction saturates.
    // Exporting textured weights must produce the same per-texel values as the constant-only export.
    for (const thinWalled of [true, false]) {
        test(`${thinWalled ? "thin-walled" : "volumetric"} scatter with small textured weights matches the constant export`, async () => {
            const result = await page.evaluate(async (thinWalled) => {
                const scene = window.scene!;
                const RGBA = BABYLON.Constants.TEXTUREFORMAT_RGBA;
                const NEAREST = BABYLON.Texture.NEAREST_SAMPLINGMODE;
                const white = () => new BABYLON.RawTexture(new Uint8Array(16).fill(255), 2, 2, RGBA, scene, false, false, NEAREST);

                const exportAsync = async (textured: boolean) => {
                    const box = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
                    const mat = new BABYLON.OpenPBRMaterial("smallWeights", scene);
                    mat.geometryThinWalled = thinWalled ? 1 : 0;
                    mat.transmissionWeight = 0.001;
                    mat.subsurfaceWeight = 0.001;
                    mat.subsurfaceColor = new BABYLON.Color3(0.8, 0.3, 0.2);
                    if (!thinWalled) {
                        mat.transmissionDepth = 1.0;
                        mat.geometryThickness = 1.0;
                        mat.transmissionColor = new BABYLON.Color3(0.9, 0.7, 0.5);
                        mat.transmissionScatter = new BABYLON.Color3(0.08, 0.12, 0.2);
                    }
                    if (textured) {
                        mat.transmissionWeightTexture = white();
                        mat.subsurfaceWeightTexture = white();
                    }
                    box.material = mat;

                    const gltf = await BABYLON.GLTF2Export.GLTFAsync(scene, "rt");
                    const json = JSON.parse(gltf.files["rt.gltf"] as string);
                    const scatter = json.materials[0].extensions.KHR_materials_scatter;
                    const textureInfo = thinWalled ? scatter.scatterStrengthTexture : scatter.multiscatterColorTexture;
                    let texel: number[] | null = null;
                    if (textureInfo) {
                        const uri = json.images[json.textures[textureInfo.index].source].uri as string;
                        const bitmap = await createImageBitmap(gltf.files[uri] as Blob, { premultiplyAlpha: "none", colorSpaceConversion: "none" });
                        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
                        const context = canvas.getContext("2d")!;
                        context.drawImage(bitmap, 0, 0);
                        texel = Array.from(context.getImageData(0, 0, 1, 1).data);
                    }

                    box.dispose();
                    mat.dispose(true, true);
                    return { strengthFactor: scatter.scatterStrengthFactor as number, colorFactor: scatter.multiscatterColorFactor as number[], texel };
                };

                return { textured: await exportAsync(true), constant: await exportAsync(false) };
            }, thinWalled);

            expect(result.constant.texel).toBeNull();
            expect(result.textured.texel).not.toBeNull();
            const texel = result.textured.texel!;
            if (thinWalled) {
                // The strength is the subsurface fraction 1 - T / (T + S(1 - T)), stored in alpha.
                const expected = 1 - 0.001 / (0.001 + 0.001 * 0.999);
                expect(result.constant.strengthFactor).toBeCloseTo(expected, 5);
                expect(result.textured.strengthFactor).toBe(1);
                expect(Math.abs(texel[3] / 255 - result.constant.strengthFactor)).toBeLessThanOrEqual(1 / 255);
            } else {
                // The baked color texture is sRGB-encoded; compare against the encoded constant color.
                const toSRGB = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
                for (let i = 0; i < 3; i++) {
                    expect(Math.abs(texel[i] - toSRGB(result.constant.colorFactor[i]) * 255), `channel ${i}`).toBeLessThanOrEqual(1.5);
                }
            }
        });
    }
});
