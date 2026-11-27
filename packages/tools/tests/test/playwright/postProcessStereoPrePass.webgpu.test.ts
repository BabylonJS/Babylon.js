import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";
import { type Color3 } from "core/Maths/math.color";

test("a shared pre-pass does not carry left-eye geometry into the right-eye output", async ({ page }) => {
    await page.goto(getGlobalConfig().baseUrl + "/empty.html", { waitUntil: "load" });
    await page.waitForFunction(() => !!window.BABYLON?.WebGPUEngine);
    const eyes = await page.evaluate(async () => {
        const B = window.BABYLON;
        const engine = new B.WebGPUEngine(document.createElement("canvas"), { antialias: false, enableAllFeatures: false });
        try {
            await engine.initAsync();
            engine.setSize(128, 64);
            const scene = new B.Scene(engine);
            scene.clearColor = new B.Color4(0, 0, 0, 0);
            const parent = new B.FreeCamera("rig", new B.Vector3(0, 0, -6), scene);
            parent.setCameraRigMode(B.Camera.RIG_MODE_CUSTOM, {});
            scene.activeCamera = parent;
            const targets = parent.rigCameras.map((eye, index) => {
                eye.layerMask = 1 << index;
                return (eye.outputRenderTarget = new B.RenderTargetTexture(eye.name, { width: 128, height: 64 }, scene, false));
            });
            const addMarker = (name: string, x: number, mask: number, color: Color3) => {
                const mesh = B.MeshBuilder.CreateBox(name, { size: 1.4 }, scene);
                mesh.layerMask = mask;
                mesh.position.x = x;
                const material = new B.PBRMaterial(name, scene);
                material.unlit = true;
                material.albedoColor = color;
                mesh.material = material;
            };
            addMarker("left", -1.7, 1, B.Color3.Red());
            addMarker("right", 1.7, 2, B.Color3.Green());
            scene.enablePrePassRenderer();
            const pass = new B.PassPostProcess("copy", 1, parent);
            pass._prePassEffectConfiguration = { name: "eye normals", enabled: false, texturesRequired: [B.Constants.PREPASS_NORMAL_TEXTURE_TYPE] };
            const render = () => {
                engine.beginFrame();
                scene.render();
                engine.endFrame();
            };
            render();
            await scene.whenReadyAsync();
            await pass.getEffect().whenCompiledAsync();
            render();
            return await Promise.all(
                targets.map(async (target) => {
                    const bytes = (await target.readPixels()) as Uint8Array;
                    let red = 0;
                    let green = 0;
                    for (let i = 0; i < bytes.length; i += 4) {
                        red += Number(bytes[i] > 160 && bytes[i + 1] < 80);
                        green += Number(bytes[i + 1] > 160 && bytes[i] < 80);
                    }
                    return { red, green };
                })
            );
        } finally {
            engine.dispose();
        }
    });
    expect(eyes).toHaveLength(2);
    expect(eyes[0].red).toBeGreaterThan(0);
    expect(eyes[0].green).toBe(0);
    expect(eyes[1].green).toBeGreaterThan(0);
    expect(eyes[1].red).toBe(0);
});
