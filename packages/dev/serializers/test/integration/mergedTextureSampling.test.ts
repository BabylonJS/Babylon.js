import { test, expect, type ConsoleMessage, Page } from "@playwright/test";
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

// The exported base color + opacity texture is a single glTF texture reference, so the merged texture must be
// sampled with the base color's parameterization rather than whichever input the merger visited last.
test.describe("Merged texture sampling", () => {
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

    const exportAsync = async (variant: "uvSet" | "transform") =>
        await page.evaluate(async (variant) => {
            const scene = window.scene!;
            const RGBA = BABYLON.Constants.TEXTUREFORMAT_RGBA;
            const NEAREST = BABYLON.Texture.NEAREST_SAMPLINGMODE;

            // 4x4 base color whose columns are red, green, blue and white.
            const columns = [
                [255, 0, 0],
                [0, 255, 0],
                [0, 0, 255],
                [255, 255, 255],
            ];
            const data = new Uint8Array(4 * 4 * 4);
            for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 4; x++) {
                    data.set([...columns[x], 255], (y * 4 + x) * 4);
                }
            }
            const baseColorTexture = new BABYLON.RawTexture(data, 4, 4, RGBA, scene, false, false, NEAREST);
            baseColorTexture.name = "baseColor";
            const opacityTexture = new BABYLON.RawTexture(new Uint8Array(16).fill(255), 2, 2, RGBA, scene, false, false, NEAREST);
            opacityTexture.name = "opacity";
            if (variant === "uvSet") {
                opacityTexture.coordinatesIndex = 1;
            } else {
                baseColorTexture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
                baseColorTexture.uScale = 2;
            }

            const box = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
            const uvs = box.getVerticesData(BABYLON.VertexBuffer.UVKind)!;
            box.setVerticesData(
                BABYLON.VertexBuffer.UV2Kind,
                uvs.map((v) => 1 - v)
            );
            const mat = new BABYLON.OpenPBRMaterial("mergedSampling", scene);
            mat.baseColor = BABYLON.Color3.White();
            mat.baseColorTexture = baseColorTexture;
            mat.geometryOpacityTexture = opacityTexture;
            mat.transmissionWeight = 0;
            mat.subsurfaceWeight = 0;
            box.material = mat;

            const warnings: string[] = [];
            const previousOnNewCacheEntry = BABYLON.Logger.OnNewCacheEntry;
            BABYLON.Logger.OnNewCacheEntry = (entry: string) => {
                warnings.push(entry);
            };
            try {
                const gltf = await BABYLON.GLTF2Export.GLTFAsync(scene, "merged");
                const json = JSON.parse(gltf.files["merged.gltf"] as string);
                const baseColorInfo = json.materials[0].pbrMetallicRoughness.baseColorTexture;
                const uri = json.images[json.textures[baseColorInfo.index].source].uri as string;
                const bitmap = await createImageBitmap(gltf.files[uri] as Blob, { colorSpaceConversion: "none", premultiplyAlpha: "none" });
                const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
                const context = canvas.getContext("2d")!;
                context.drawImage(bitmap, 0, 0);
                const row = Array.from(context.getImageData(0, 0, bitmap.width, 1).data);
                const texels: number[][] = [];
                for (let x = 0; x < bitmap.width; x++) {
                    texels.push(row.slice(x * 4, x * 4 + 4));
                }
                return {
                    texCoord: (baseColorInfo.texCoord ?? 0) as number,
                    hasTextureTransform: !!baseColorInfo.extensions?.KHR_texture_transform,
                    texels,
                    uvWarning: warnings.some((w) => w.includes("different UV coordinates")),
                };
            } finally {
                BABYLON.Logger.OnNewCacheEntry = previousOnNewCacheEntry;
            }
        }, variant);

    const sameColor = (a: number[], b: number[]) => a.every((value, i) => Math.abs(value - b[i]) <= 2);

    test("base color texture keeps its UV set when the opacity texture uses another one", async () => {
        const result = await exportAsync("uvSet");

        expect(result.texCoord).toBe(0);
        expect(result.uvWarning).toBe(true);
        // The base color texels are preserved and the dropped opacity texture leaves alpha opaque.
        expect(result.texels.length).toBe(4);
        const expected = [
            [255, 0, 0, 255],
            [0, 255, 0, 255],
            [0, 0, 255, 255],
            [255, 255, 255, 255],
        ];
        for (const texel of result.texels) {
            expect(expected.some((color) => sameColor(texel, color))).toBe(true);
        }
        expect(new Set(result.texels.map((t) => t.join(","))).size).toBe(4);
    });

    test("differing base color and opacity transforms are baked into the merged texture", async () => {
        const result = await exportAsync("transform");

        expect(result.texCoord).toBe(0);
        expect(result.hasTextureTransform).toBe(false);
        // uScale = 2 repeats the base color twice across the merged texture, so the columns alternate.
        expect(result.texels.length).toBe(4);
        expect(sameColor(result.texels[0], result.texels[2])).toBe(true);
        expect(sameColor(result.texels[1], result.texels[3])).toBe(true);
        expect(sameColor(result.texels[0], result.texels[1])).toBe(false);
    });

    // Reads the first row of an exported image and the texture references that share it.
    const exportPackedAsync = async (variant: "occlusion" | "scatter") =>
        await page.evaluate(async (variant) => {
            const scene = window.scene!;
            const RGBA = BABYLON.Constants.TEXTUREFORMAT_RGBA;
            const NEAREST = BABYLON.Texture.NEAREST_SAMPLINGMODE;
            const columnTexture = (name: string, columns: number[][]) => {
                const data = new Uint8Array(4 * 4 * 4);
                for (let y = 0; y < 4; y++) {
                    for (let x = 0; x < 4; x++) {
                        data.set(columns[x], (y * 4 + x) * 4);
                    }
                }
                const texture = new BABYLON.RawTexture(data, 4, 4, RGBA, scene, false, false, NEAREST);
                texture.name = name;
                return texture;
            };
            const gray = (values: number[]) => values.map((v) => [v, v, v, 255]);

            const box = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
            const uvs = box.getVerticesData(BABYLON.VertexBuffer.UVKind)!;
            box.setVerticesData(
                BABYLON.VertexBuffer.UV2Kind,
                uvs.map((v) => 1 - v)
            );
            const mat = new BABYLON.OpenPBRMaterial("packed", scene);
            box.material = mat;

            if (variant === "occlusion") {
                mat.baseMetalnessTexture = columnTexture("metalness", gray([255, 170, 85, 0]));
                mat.specularRoughnessTexture = columnTexture("roughness", gray([40, 80, 120, 160]));
                const occlusion = columnTexture("occlusion", gray([0, 85, 170, 255]));
                occlusion.coordinatesIndex = 1;
                occlusion.uOffset = 0.25;
                mat.ambientOcclusionTexture = occlusion;
            } else {
                mat.geometryThinWalled = 1;
                mat.transmissionWeight = 0.5;
                mat.subsurfaceWeight = 1;
                mat.subsurfaceColor = BABYLON.Color3.White();
                mat.subsurfaceColorTexture = columnTexture("scatterColor", [
                    [255, 0, 0, 255],
                    [0, 255, 0, 255],
                    [0, 0, 255, 255],
                    [255, 255, 255, 255],
                ]);
                const weight = columnTexture("subsurfaceWeight", gray([64, 128, 192, 255]));
                weight.coordinatesIndex = 1;
                weight.uOffset = 0.25;
                mat.subsurfaceWeightTexture = weight;
            }

            const gltf = await BABYLON.GLTF2Export.GLTFAsync(scene, "packed");
            const json = JSON.parse(gltf.files["packed.gltf"] as string);
            const material = json.materials[0];
            const [first, second] =
                variant === "occlusion"
                    ? [material.pbrMetallicRoughness.metallicRoughnessTexture, material.occlusionTexture]
                    : [material.extensions.KHR_materials_scatter.multiscatterColorTexture, material.extensions.KHR_materials_scatter.scatterStrengthTexture];
            const firstSource = json.textures[first.index].source as number;
            const secondSource = json.textures[second.index].source as number;
            const uri = json.images[firstSource].uri as string;
            const bitmap = await createImageBitmap(gltf.files[uri] as Blob, { colorSpaceConversion: "none", premultiplyAlpha: "none" });
            const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
            const context = canvas.getContext("2d")!;
            context.drawImage(bitmap, 0, 0);
            const row = Array.from(context.getImageData(0, 0, bitmap.width, 1).data);
            const texels: number[][] = [];
            for (let x = 0; x < bitmap.width; x++) {
                texels.push(row.slice(x * 4, x * 4 + 4));
            }
            return {
                sameImage: firstSource === secondSource,
                first: { texCoord: (first.texCoord ?? 0) as number, transform: first.extensions?.KHR_texture_transform ?? null },
                second: { texCoord: (second.texCoord ?? 0) as number, transform: second.extensions?.KHR_texture_transform ?? null },
                texels,
            };
        }, variant);

    const near = (a: number, b: number) => Math.abs(a - b) <= 2;

    // Occlusion is referenced separately from metallic-roughness, so it is packed raw and keeps its own UV set and
    // transform rather than being dropped or having its transform baked in and then applied again.
    test("occlusion keeps its own UV set and transform when packed with metallic-roughness", async () => {
        const result = await exportPackedAsync("occlusion");

        expect(result.sameImage).toBe(true);
        expect(result.first.texCoord).toBe(0);
        expect(result.first.transform).toBeNull();
        expect(result.second.texCoord).toBe(1);
        expect(result.second.transform).not.toBeNull();
        expect(result.texels.length).toBe(4);
        const expected = [
            [0, 40, 255],
            [85, 80, 170],
            [170, 120, 85],
            [255, 160, 0],
        ];
        result.texels.forEach((texel, x) => {
            expect(texel.slice(0, 3).every((value, i) => near(value, expected[x][i]))).toBe(true);
        });
    });

    // The thin-walled scatter strength lives in the alpha channel of the multiscatter color image, but each
    // reference keeps its own UV set and transform.
    test("scatter strength is packed into the scatter color alpha with independent sampling", async () => {
        const result = await exportPackedAsync("scatter");

        expect(result.sameImage).toBe(true);
        expect(result.first.texCoord).toBe(0);
        expect(result.first.transform).toBeNull();
        expect(result.second.texCoord).toBe(1);
        expect(result.second.transform).not.toBeNull();
        expect(result.texels.length).toBe(4);
        const colors = [
            [255, 0, 0],
            [0, 255, 0],
            [0, 0, 255],
            [255, 255, 255],
        ];
        result.texels.forEach((texel, x) => {
            expect(texel.slice(0, 3).every((value, i) => near(value, colors[x][i]))).toBe(true);
        });
        // The strength grows with the subsurface weight columns and is stored untransformed.
        const alphas = result.texels.map((texel) => texel[3]);
        for (let x = 1; x < 4; x++) {
            expect(alphas[x]).toBeGreaterThan(alphas[x - 1]);
        }
    });

    // Two materials share the same tangent (and strength) images but sample them differently. The merged (coat)
    // anisotropy texture copies or bakes its inputs' sampling, so the second material must not reuse the first
    // material's merged texture. Shader errors are collected because WebGPU reports them asynchronously, after the
    // scene has already reported that it is ready.
    const exportSharedAnisotropyAsync = async (extension: "coat" | "specular", withStrength: boolean) => {
        const shaderErrors: string[] = [];
        const onConsole = (message: ConsoleMessage) => {
            if ((message.type() === "error" || message.type() === "warning") && /shader|WGSL|varying/i.test(message.text())) {
                shaderErrors.push(message.text());
            }
        };
        page.on("console", onConsole);
        try {
            const result = await page.evaluate(
                async ({ extension, withStrength }) => {
                    const scene = window.scene!;
                    const RGBA = BABYLON.Constants.TEXTUREFORMAT_RGBA;
                    const NEAREST = BABYLON.Texture.NEAREST_SAMPLINGMODE;

                    // 4x4 tangent map whose columns all differ.
                    const columns = [
                        [255, 128, 0],
                        [128, 255, 0],
                        [0, 128, 0],
                        [128, 0, 0],
                    ];
                    const data = new Uint8Array(4 * 4 * 4);
                    for (let y = 0; y < 4; y++) {
                        for (let x = 0; x < 4; x++) {
                            data.set([...columns[x], 255], (y * 4 + x) * 4);
                        }
                    }
                    const tangent = new BABYLON.RawTexture(data, 4, 4, RGBA, scene, false, false, NEAREST);
                    const strength = withStrength ? new BABYLON.RawTexture(new Uint8Array(64).fill(200), 4, 4, RGBA, scene, false, false, NEAREST) : null;
                    // A second texture object referencing the same image data.
                    const share = (source: InstanceType<typeof BABYLON.BaseTexture>) => {
                        const texture = new BABYLON.Texture(null, scene, false, false, NEAREST);
                        const internalTexture = source.getInternalTexture()!;
                        internalTexture.incrementReferences();
                        texture._texture = internalTexture;
                        return texture;
                    };
                    const transformedTangent = share(tangent);
                    transformedTangent.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
                    transformedTangent.uScale = 2;

                    const createMaterial = (
                        name: string,
                        tangentTexture: InstanceType<typeof BABYLON.BaseTexture>,
                        strengthTexture: InstanceType<typeof BABYLON.BaseTexture> | null
                    ) => {
                        const mat = new BABYLON.OpenPBRMaterial(name, scene);
                        if (extension === "coat") {
                            mat.coatWeight = 1;
                            mat.coatRoughnessAnisotropy = 0.5;
                            mat.geometryCoatTangentTexture = tangentTexture;
                            mat.coatRoughnessAnisotropyTexture = strengthTexture;
                        } else {
                            mat.specularRoughnessAnisotropy = 0.5;
                            mat.geometryTangentTexture = tangentTexture;
                            mat.specularRoughnessAnisotropyTexture = strengthTexture;
                        }
                        const box = BABYLON.MeshBuilder.CreateBox(name, { size: 1 }, scene);
                        box.material = mat;
                    };
                    createMaterial("identity", tangent, strength);
                    createMaterial("transformed", transformedTangent, strength ? share(strength) : null);

                    const gltf = await BABYLON.GLTF2Export.GLTFAsync(scene, "aniso");
                    const json = JSON.parse(gltf.files["aniso.gltf"] as string);
                    const readAsync = async (name: string) => {
                        const extensions = json.materials.find((m: { name: string }) => m.name === name).extensions;
                        const info = extension === "coat" ? extensions.KHR_materials_coat.coatAnisotropyTexture : extensions.KHR_materials_anisotropy.anisotropyTexture;
                        const uri = json.images[json.textures[info.index].source].uri as string;
                        const bitmap = await createImageBitmap(gltf.files[uri] as Blob, { colorSpaceConversion: "none", premultiplyAlpha: "none" });
                        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
                        const context = canvas.getContext("2d")!;
                        context.drawImage(bitmap, 0, 0);
                        const row = Array.from(context.getImageData(0, 0, bitmap.width, 1).data);
                        const texels: number[][] = [];
                        for (let x = 0; x < bitmap.width; x++) {
                            texels.push(row.slice(x * 4, x * 4 + 3));
                        }
                        return { transform: info.extensions?.KHR_texture_transform ?? null, texels };
                    };
                    const identity = await readAsync("identity");
                    const transformed = await readAsync("transformed");
                    // Give asynchronous (WebGPU) shader errors time to be reported.
                    await new Promise((resolve) => setTimeout(resolve, 100));
                    return { identity, transformed };
                },
                { extension, withStrength }
            );
            return { ...result, shaderErrors };
        } finally {
            page.off("console", onConsole);
        }
    };

    const sameTexel = (a: number[], b: number[]) => a.every((value, i) => near(value, b[i]));

    // Exporting waits for the scene to be ready, so these also check that the tangent textures compile in the GLSL
    // (WebGL2) and WGSL (WebGPU) OpenPBR shaders.
    const initEngineAsync = async (engineName: string) => {
        if (engineName === "webgpu") {
            const hasWebGPU = await page.evaluate(async () => !!(await (navigator as any).gpu?.requestAdapter()));
            test.skip(!hasWebGPU, "WebGPU is not available");
            // The canvas already has a WebGL context, so start over on a fresh page.
            await page.goto(getGlobalConfig().baseUrl + `/empty.html`, { waitUntil: "load", timeout: 0 });
            await page.evaluate(evaluateInitEngine, { engineName });
            await page.evaluate(evaluateCreateScene);
        }
    };

    for (const engineName of ["webgl2", "webgpu"]) {
        for (const extension of ["coat", "specular"] as const) {
            test(`${extension} anisotropy materials sharing a tangent image keep their own transforms (${engineName})`, async () => {
                await initEngineAsync(engineName);
                const result = await exportSharedAnisotropyAsync(extension, false);

                expect(result.shaderErrors).toEqual([]);
                expect(result.identity.transform).toBeNull();
                expect(result.transformed.transform).not.toBeNull();
                expect(result.transformed.transform.scale[0]).toBeCloseTo(2, 5);
                // The transform is propagated, so both materials export the same, untransformed tangent texels.
                expect(result.transformed.texels.length).toBe(4);
                result.transformed.texels.forEach((texel, x) => expect(sameTexel(texel, result.identity.texels[x])).toBe(true));
            });

            test(`${extension} anisotropy materials sharing tangent and strength images bake their own transforms (${engineName})`, async () => {
                await initEngineAsync(engineName);
                const result = await exportSharedAnisotropyAsync(extension, true);

                expect(result.shaderErrors).toEqual([]);
                // Only the tangent is scaled, so its transform is baked into the merged texture rather than propagated.
                expect(result.identity.transform).toBeNull();
                expect(result.transformed.transform).toBeNull();
                expect(result.identity.texels.length).toBe(4);
                expect(new Set(result.identity.texels.map((t) => t.join(","))).size).toBe(4);
                // uScale = 2 repeats the tangent map twice, so the second material's columns alternate.
                const texels = result.transformed.texels;
                expect(texels.length).toBe(4);
                expect(sameTexel(texels[0], texels[2])).toBe(true);
                expect(sameTexel(texels[1], texels[3])).toBe(true);
                expect(sameTexel(texels[0], texels[1])).toBe(false);
            });
        }
    }

    // Two materials share base color, opacity, metalness and roughness images, but the second scales its base color
    // and metalness. Each merge then has inputs with different transforms, so it bakes them, and the second material
    // must not reuse the first material's merged (untransformed) textures.
    test("base color/opacity and metallic/roughness merges of shared images bake each material's transforms", async () => {
        const result = await page.evaluate(async () => {
            const scene = window.scene!;
            const RGBA = BABYLON.Constants.TEXTUREFORMAT_RGBA;
            const NEAREST = BABYLON.Texture.NEAREST_SAMPLINGMODE;
            const createTexture = (texel: (x: number) => number[]) => {
                const data = new Uint8Array(4 * 4 * 4);
                for (let y = 0; y < 4; y++) {
                    for (let x = 0; x < 4; x++) {
                        data.set(texel(x), (y * 4 + x) * 4);
                    }
                }
                return new BABYLON.RawTexture(data, 4, 4, RGBA, scene, false, false, NEAREST);
            };
            // Nonuniform base color and metalness columns; uniform opacity and roughness.
            const baseColor = createTexture((x) =>
                [
                    [255, 0, 0],
                    [0, 255, 0],
                    [0, 0, 255],
                    [255, 255, 0],
                ][x].concat(255)
            );
            const opacity = createTexture(() => [255, 255, 255, 255]);
            const metalness = createTexture((x) => [[0, 85, 170, 255][x], 0, 0, 255]);
            const roughness = createTexture(() => [128, 128, 128, 255]);
            // A second texture object referencing the same image data.
            const share = (source: InstanceType<typeof BABYLON.BaseTexture>, uScale: number) => {
                const texture = new BABYLON.Texture(null, scene, false, false, NEAREST);
                const internalTexture = source.getInternalTexture()!;
                internalTexture.incrementReferences();
                texture._texture = internalTexture;
                texture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
                texture.uScale = uScale;
                return texture;
            };

            const createMaterial = (name: string, uScale: number) => {
                const mat = new BABYLON.OpenPBRMaterial(name, scene);
                mat.baseColorTexture = uScale === 1 ? baseColor : share(baseColor, uScale);
                mat.geometryOpacityTexture = uScale === 1 ? opacity : share(opacity, 1);
                mat.baseMetalnessTexture = uScale === 1 ? metalness : share(metalness, uScale);
                mat.specularRoughnessTexture = uScale === 1 ? roughness : share(roughness, 1);
                const box = BABYLON.MeshBuilder.CreateBox(name, { size: 1 }, scene);
                box.material = mat;
            };
            createMaterial("identity", 1);
            createMaterial("transformed", 2);

            const gltf = await BABYLON.GLTF2Export.GLTFAsync(scene, "shared");
            const json = JSON.parse(gltf.files["shared.gltf"] as string);
            const readAsync = async (name: string, slot: "baseColorTexture" | "metallicRoughnessTexture") => {
                const info = json.materials.find((m: { name: string }) => m.name === name).pbrMetallicRoughness[slot];
                const uri = json.images[json.textures[info.index].source].uri as string;
                const bitmap = await createImageBitmap(gltf.files[uri] as Blob, { colorSpaceConversion: "none", premultiplyAlpha: "none" });
                const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
                const context = canvas.getContext("2d")!;
                context.drawImage(bitmap, 0, 0);
                const row = Array.from(context.getImageData(0, 0, bitmap.width, 1).data);
                const texels: number[][] = [];
                for (let x = 0; x < bitmap.width; x++) {
                    texels.push(row.slice(x * 4, x * 4 + 3));
                }
                return { index: info.index as number, transform: info.extensions?.KHR_texture_transform ?? null, texels };
            };
            return {
                baseColor: { identity: await readAsync("identity", "baseColorTexture"), transformed: await readAsync("transformed", "baseColorTexture") },
                metallicRoughness: {
                    identity: await readAsync("identity", "metallicRoughnessTexture"),
                    transformed: await readAsync("transformed", "metallicRoughnessTexture"),
                },
            };
        });

        for (const slot of [result.baseColor, result.metallicRoughness]) {
            // Each material gets its own merged texture, with the transform baked rather than propagated.
            expect(slot.transformed.index).not.toBe(slot.identity.index);
            expect(slot.identity.transform).toBeNull();
            expect(slot.transformed.transform).toBeNull();
            expect(slot.identity.texels.length).toBe(4);
            expect(new Set(slot.identity.texels.map((t) => t.join(","))).size).toBe(4);
            // uScale = 2 repeats the source twice, so the second material's columns alternate.
            const texels = slot.transformed.texels;
            expect(texels.length).toBe(4);
            const sourceTexels = slot.identity.texels;
            texels.forEach((texel) => expect(sourceTexels.some((source) => sameTexel(texel, source))).toBe(true));
            expect(sameTexel(texels[0], texels[2])).toBe(true);
            expect(sameTexel(texels[1], texels[3])).toBe(true);
            expect(sameTexel(texels[0], texels[1])).toBe(false);
        }
    });
});
