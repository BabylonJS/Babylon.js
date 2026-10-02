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
});
