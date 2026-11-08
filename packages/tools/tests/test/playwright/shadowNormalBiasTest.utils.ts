import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { evaluateInitEngineForVisualization } from "./visualizationPlaywright.utils";

export function testShadowNormalBias(engineName: "webgl2" | "webgpu"): void {
    test("double-sided shadow normal bias on " + engineName, async ({ page }) => {
        const { baseUrl } = getGlobalConfig();
        await page.goto(baseUrl + "/empty.html");
        await page.waitForFunction(() => window.BABYLON?.ShadowGenerator);
        await page.evaluate(evaluateInitEngineForVisualization, {
            engineName,
            useLargeWorldRendering: false,
            useReverseDepthBuffer: "false",
            useNonCompatibilityMode: "false",
            baseUrl,
        });
        const result = await page.evaluate(async (engineName) => {
            const B = window.BABYLON;
            const engine = window.engine!;
            const scene = new B.Scene(engine);
            try {
                const camera = new B.FreeCamera("camera", new B.Vector3(0, 0, -4), scene);
                camera.setTarget(B.Vector3.Zero());
                const light = new B.DirectionalLight("light", new B.Vector3(0.5, 0, 1).normalize(), scene);
                light.position.copyFrom(light.direction.scale(-4));
                light.shadowFrustumSize = 5;
                light.shadowMinZ = 0.1;
                light.shadowMaxZ = 10;

                const material = new B.StandardMaterial("two-sided", scene);
                material.backFaceCulling = false;
                const size = 64;
                const generator = new B.ShadowGenerator(size, light, true);

                const renderShadow = async (normalBias: number): Promise<Float32Array | Uint8Array> => {
                    generator.normalBias = normalBias;
                    await scene.whenReadyAsync(true);
                    engine.beginFrame();
                    scene.render();
                    engine.endFrame();
                    return (await generator.getShadowMap()!.readPixels()) as Float32Array | Uint8Array;
                };
                const depthAt = (pixels: Float32Array | Uint8Array, index: number): number => {
                    // The shadow map packs depth into RGBA when float textures are unavailable.
                    return pixels instanceof Uint8Array ? (((pixels[index] / 255 + pixels[index + 1]) / 255 + pixels[index + 2]) / 255 + pixels[index + 3]) / 255 : pixels[index];
                };
                const footprint = (pixels: Float32Array | Uint8Array): number => {
                    let covered = 0;
                    for (let index = 0; index < pixels.length; index += 4) {
                        if (depthAt(pixels, index) < 0.999) {
                            covered++;
                        }
                    }
                    return covered;
                };

                const sphere = B.MeshBuilder.CreateSphere("closed caster", { diameter: 2 }, scene);
                sphere.material = material;
                generator.addShadowCaster(sphere);
                const sphereUnbiased = footprint(await renderShadow(0));
                const sphereBiased = footprint(await renderShadow(0.35));
                sphere.dispose();

                const plane = B.MeshBuilder.CreatePlane("sheet caster", { size: 2 }, scene);
                plane.material = material;
                generator.addShadowCaster(plane);
                generator.useLightFacingNormalBias = true;
                const center = ((size / 2) * size + size / 2) * 4;
                const planeUnbiased = depthAt(await renderShadow(0), center);
                const planeForward = depthAt(await renderShadow(0.35), center);
                // Reverse the winding and authored normals together to model the same sheet facing the other way.
                plane.flipFaces(true);
                const planeReversed = depthAt(await renderShadow(0.35), center);
                generator.useLightFacingNormalBias = false;
                const planeReversedWithoutOptIn = depthAt(await renderShadow(0.35), center);

                return {
                    sphereUnbiased,
                    sphereBiased,
                    planeUnbiased,
                    planeForward,
                    planeReversed,
                    planeReversedWithoutOptIn,
                    usesExpectedShaderLanguage: generator.shaderLanguage === (engineName === "webgpu" ? B.ShaderLanguage.WGSL : B.ShaderLanguage.GLSL),
                };
            } finally {
                engine.dispose();
            }
        }, engineName);

        expect(result.usesExpectedShaderLanguage).toBe(true);
        // The default bias should keep the closed caster's shadow inside its unbiased footprint.
        expect(result.sphereBiased).toBeGreaterThan(0);
        expect(result.sphereBiased).toBeLessThan(result.sphereUnbiased);
        expect(result.planeForward - result.planeUnbiased).toBeGreaterThan(0.01);
        expect(result.planeReversed).toBeCloseTo(result.planeForward, 4);
        expect(result.planeUnbiased - result.planeReversedWithoutOptIn).toBeGreaterThan(0.01);
    });
}
