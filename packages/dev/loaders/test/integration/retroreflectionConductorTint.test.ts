import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";

declare const BABYLON: typeof import("core/index");

for (const backend of ["webgl2", "webgpu"] as const) {
    test(`anisotropic conductor tint is independent of retroreflection at normal incidence on ${backend}`, async ({ page }) => {
        await page.goto(`${getGlobalConfig().baseUrl}/empty.html`);
        const samples = await page.evaluate(async (backend) => {
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 65;
            canvas.style.width = canvas.style.height = "65px";
            document.body.appendChild(canvas);
            const engine = backend === "webgpu" ? new BABYLON.WebGPUEngine(canvas, { antialias: false }) : new BABYLON.Engine(canvas, false, { preserveDrawingBuffer: true });
            try {
                if (engine instanceof BABYLON.WebGPUEngine) {
                    await engine.initAsync();
                }
                const scene = new BABYLON.Scene(engine);
                try {
                    scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);
                    scene.imageProcessingConfiguration.toneMappingEnabled = false;
                    const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 0, -4), scene);
                    camera.setTarget(BABYLON.Vector3.Zero());
                    camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
                    camera.orthoLeft = camera.orthoBottom = -1;
                    camera.orthoRight = camera.orthoTop = 1;
                    new BABYLON.DirectionalLight("light", new BABYLON.Vector3(0, 0, 1), scene).intensity = 0.002;
                    const plane = BABYLON.MeshBuilder.CreatePlane("plane", { size: 1.5 }, scene);
                    const material = new BABYLON.OpenPBRMaterial("colored conductor", scene);
                    material.baseMetalness = 1;
                    material.baseColor.set(0.7, 0.2, 0.05);
                    material.specularRoughness = 0.4;
                    material.specularRoughnessAnisotropy = 0.7;
                    plane.material = material;
                    const samples = [];
                    for (const factor of [0, 0.5, 1]) {
                        material.specularRetroreflectivity = factor;
                        await material.forceCompilationAsync(plane);
                        await scene.whenReadyAsync();
                        engine.beginFrame();
                        scene.render();
                        engine.endFrame();
                        const pixels = await engine.readPixels(0, 0, 65, 65);
                        if (!(pixels instanceof Uint8Array) || pixels.length !== 65 * 65 * 4) {
                            throw new Error("Expected a complete conductor rendering");
                        }
                        samples.push(Array.from(pixels).filter((_, index) => index % 4 !== 3));
                    }
                    return samples;
                } finally {
                    scene.dispose();
                }
            } finally {
                engine.dispose();
                canvas.remove();
            }
        }, backend);
        expect(samples).toHaveLength(3);
        expect(Math.max(...samples[2])).toBeGreaterThan(20);
        for (const sample of samples.slice(0, 2)) {
            expect(Math.max(...sample.map((value, index) => Math.abs(value - samples[2][index])))).toBeLessThanOrEqual(1);
        }
    });
}
