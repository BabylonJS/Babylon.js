import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";

test("normal bias is independent of double-sided shadow caster winding", async ({ page }) => {
    await page.goto(getGlobalConfig().baseUrl + "/empty.html");
    await page.waitForFunction(() => window.BABYLON?.ShadowGenerator);
    const { unbiased, forward, reversed } = await page.evaluate(async () => {
        const B = window.BABYLON;
        const engine = new B.Engine(document.getElementById("babylon-canvas") as HTMLCanvasElement);
        const scene = new B.Scene(engine);
        try {
            const camera = new B.FreeCamera("camera", new B.Vector3(0, 0, -4), scene);
            camera.setTarget(B.Vector3.Zero());
            const light = new B.DirectionalLight("light", new B.Vector3(0.5, 0, 1).normalize(), scene);
            light.position.copyFrom(light.direction.scale(-4));
            light.shadowFrustumSize = 5;
            light.shadowMinZ = 0.1;
            light.shadowMaxZ = 10;

            const caster = B.MeshBuilder.CreatePlane("caster", { size: 2 }, scene);
            const material = new B.StandardMaterial("two-sided", scene);
            material.backFaceCulling = false;
            caster.material = material;
            const generator = new B.ShadowGenerator(64, light, true);
            generator.addShadowCaster(caster);

            const sampleDepth = async (normalBias: number): Promise<number> => {
                generator.normalBias = normalBias;
                await scene.whenReadyAsync(true);
                engine.beginFrame();
                scene.render();
                engine.endFrame();
                const pixel = (await generator.getShadowMap()!.readPixels(0, 0, null, true, false, 32, 32, 1, 1)) as Float32Array | Uint8Array;
                // The shadow map packs depth into RGBA when float textures are unavailable.
                return pixel instanceof Uint8Array ? (((pixel[0] / 255 + pixel[1]) / 255 + pixel[2]) / 255 + pixel[3]) / 255 : pixel[0];
            };
            const unbiased = await sampleDepth(0);
            const forward = await sampleDepth(0.35);
            caster.flipFaces(true);
            return { unbiased, forward, reversed: await sampleDepth(0.35) };
        } finally {
            engine.dispose();
        }
    });
    expect(Math.abs(forward - unbiased)).toBeGreaterThan(0.01);
    expect(reversed).toBeCloseTo(forward, 4);
});
