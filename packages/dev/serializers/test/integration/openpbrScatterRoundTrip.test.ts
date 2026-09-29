import { test, expect, Page } from "@playwright/test";
import { evaluateDisposeEngine, evaluateCreateScene, evaluateInitEngine, getGlobalConfig, logPageErrors } from "@tools/test-tools";

// The page (empty.html) exposes the full Babylon bundle, so both the glTF serializer (GLTF2Export)
// and the glTF loader (SceneLoader + gltf plugin) are available for an export -> re-import round-trip.
declare const BABYLON: typeof import("core/index") & typeof import("serializers/index") & typeof import("loaders/index");

interface Window {
    BABYLON: typeof BABYLON;
    scene: typeof BABYLON.Scene | null;
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
        await page.evaluate(evaluateInitEngine);
        await page.evaluate(evaluateCreateScene);
    });

    test.afterEach(async () => {
        await page.evaluate(evaluateDisposeEngine);
    });

    test.afterAll(async () => {
        await page.close();
    });

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
            BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader) => {
                if (loader.name === "gltf") {
                    (loader as unknown as { useOpenPBR: boolean }).useOpenPBR = true;
                }
            });
            await BABYLON.SceneLoader.AppendAsync("", url, scene2, undefined, ".glb");
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
            BABYLON.SceneLoader.OnPluginActivatedObservable.addOnce((loader) => {
                if (loader.name === "gltf") {
                    (loader as unknown as { useOpenPBR: boolean }).useOpenPBR = true;
                }
            });
            await BABYLON.SceneLoader.AppendAsync("", url, scene2, undefined, ".glb");
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
});
