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
});
