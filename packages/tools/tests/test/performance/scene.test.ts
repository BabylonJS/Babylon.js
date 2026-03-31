import { test, expect, Page } from "@playwright/test";
import { comparePerformance, evaluateDefaultScene, getGlobalConfig } from "@tools/test-tools";

// IN TESTS
declare const BABYLON: typeof import("core/index");

// Performance tests require the PROD version of the CDN (babylon-server)

const perfOptions = {
    framesToRender: 2500,
    numberOfPasses: 10,
    warmupPasses: 2,
    trimCount: 2,
    cdnVersion: process.env.CDN_VERSION || "",
    cdnVersionB: process.env.CDN_VERSION_B || "",
};

test.describe("Performance - scene", () => {
    let page: Page;

    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
    });

    test.afterAll(async () => {
        await page?.close();
    });

    test("Should have same or better performance with default scene", async () => {
        test.setTimeout(120000);
        const result = await comparePerformance(page, getGlobalConfig().baseUrl, evaluateDefaultScene, perfOptions);
        console.log(`[PERF] Default scene: ${result.summary}`);
        expect(result.passed, result.summary).toBe(true);
    });

    test("Should have same or better performance with particle system", async () => {
        test.setTimeout(120000);
        // this code will run in the browser
        const createScene = () => {
            if (!window.scene) {
                window.scene = new BABYLON.Scene(window.engine!);
            }
            const camera = new BABYLON.ArcRotateCamera("ArcRotateCamera", -Math.PI / 2, Math.PI / 2.2, 10, new BABYLON.Vector3(0, 0, 0), window.scene);
            camera.attachControl(window.scene.getEngine().getRenderingCanvas(), true);
            new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), window.scene);
            BABYLON.MeshBuilder.CreateGround("ground", { width: 25, height: 25 }, window.scene);
            const particleSystem = new BABYLON.ParticleSystem("particles", 2000, window.scene);
            particleSystem.particleTexture = new BABYLON.Texture("/textures/flare.png");
            particleSystem.emitter = new BABYLON.Vector3(0, 0.5, 0);

            particleSystem.start();

            return new Promise<void>((resolve) => {
                window.scene?.executeWhenReady(() => {
                    resolve();
                });
            });
        };

        const result = await comparePerformance(page, getGlobalConfig().baseUrl, createScene, perfOptions);
        console.log(`[PERF] Particle system: ${result.summary}`);
        expect(result.passed, result.summary).toBe(true);
    });

    test("Should have same or better performance with follow camera", async () => {
        test.setTimeout(120000);
        // this code will run in the browser
        const createScene = () => {
            const scene = new BABYLON.Scene(window.engine!);
            const camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 10, -10), scene);
            camera.radius = 30;
            camera.heightOffset = 10;
            camera.rotationOffset = 0;
            camera.cameraAcceleration = 0.005;
            camera.maxCameraSpeed = 10;
            camera.attachControl(true);
            new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
            const mat = new BABYLON.StandardMaterial("mat1", scene);
            mat.alpha = 1.0;
            mat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 1.0);
            const texture = new BABYLON.Texture("https://i.imgur.com/vxH5bCg.jpg", scene);
            mat.diffuseTexture = texture;
            const hSpriteNb = 3; // 3 sprites per row
            const vSpriteNb = 2; // 2 sprite rows

            const faceUV = new Array(6);

            for (let i = 0; i < 6; i++) {
                faceUV[i] = new BABYLON.Vector4(i / hSpriteNb, 0, (i + 1) / hSpriteNb, 1 / vSpriteNb);
            }

            // Shape to follow
            const box = BABYLON.MeshBuilder.CreateBox("box", { size: 2, faceUV: faceUV }, scene);
            box.position = new BABYLON.Vector3(20, 0, 10);
            box.material = mat;
            const boxesSPS = new BABYLON.SolidParticleSystem("boxes", scene, { updatable: false });
            const set_boxes = function (particle: any) {
                particle.position = new BABYLON.Vector3(-50 + Math.random() * 100, -50 + Math.random() * 100, -50 + Math.random() * 100);
            };
            boxesSPS.addShape(box, 400, { positionFunction: set_boxes });
            boxesSPS.buildMesh();
            camera.lockedTarget = box;
            let alpha = 0;
            const orbit_radius = 20;
            scene.registerBeforeRender(function () {
                alpha += 0.01;
                box.position.x = orbit_radius * Math.cos(alpha);
                box.position.y = orbit_radius * Math.sin(alpha);
                box.position.z = 10 * Math.sin(2 * alpha);
                camera.rotationOffset = (18 * alpha) % 360;
            });

            window.scene = scene;

            return new Promise<void>((resolve) => {
                window.scene?.executeWhenReady(() => {
                    resolve();
                });
            });
        };

        const result = await comparePerformance(page, getGlobalConfig().baseUrl, createScene, perfOptions);
        console.log(`[PERF] Follow camera: ${result.summary}`);
        expect(result.passed, result.summary).toBe(true);
    });
});
