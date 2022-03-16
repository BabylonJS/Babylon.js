import { checkPerformanceOfScene, evaluateDefaultScene, getGlobalConfig } from "@tools/test-tools";

// IN TESTS
declare const BABYLON: typeof import("core/index");

// Performance tests require the PROD version of the CDN (babylon-server)

const framesToRender = 5000;
const numberOfPasses = 8;
const acceptedThreshold = 0.075; // 7.5% compensation

describe("Performance - scene", () => {
    jest.setTimeout(60000);

    it("Should have same or better performance with default scene", async () => {
        const preview = await checkPerformanceOfScene(page, getGlobalConfig().baseUrl, "preview", evaluateDefaultScene, numberOfPasses, framesToRender);
        const stable = await checkPerformanceOfScene(page, getGlobalConfig().baseUrl, "stable", evaluateDefaultScene, numberOfPasses, framesToRender);
        const dev = await checkPerformanceOfScene(page, getGlobalConfig().baseUrl, "dev", evaluateDefaultScene, numberOfPasses, framesToRender);
        console.log(`Performance - scene: preview: ${preview}ms, stable: ${stable}ms, dev: ${dev}ms`);
        expect(dev / preview, `Dev: ${dev}ms, Preview: ${preview}ms`).toBeLessThanOrEqual(1 + acceptedThreshold);
        expect(dev / stable, `Dev: ${dev}ms, Preview: ${stable}ms`).toBeLessThanOrEqual(1 + acceptedThreshold);
    }, 30000);

    it("Should have same or better performance with particle system", async () => {
        // this code will run in the browser
        const createScene = async () => {
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

            await new Promise<void>((resolve) => {
                window.scene?.executeWhenReady(() => {
                    resolve();
                });
            });
        };

        // await page.waitForFunction(`window.scene.isReady()`);

        const preview = await checkPerformanceOfScene(page, getGlobalConfig().baseUrl, "preview", createScene, numberOfPasses, framesToRender);
        const stable = await checkPerformanceOfScene(page, getGlobalConfig().baseUrl, "stable", createScene, numberOfPasses, framesToRender);
        const dev = await checkPerformanceOfScene(page, getGlobalConfig().baseUrl, "dev", createScene, numberOfPasses, framesToRender);
        expect(dev / preview, `Dev: ${dev}ms, Preview: ${preview}ms`).toBeLessThanOrEqual(1 + acceptedThreshold);
        expect(dev / stable, `Dev: ${dev}ms, Preview: ${stable}ms`).toBeLessThanOrEqual(1 + acceptedThreshold);
    }, 40000);

    it("Should have same or better performance with follow camera", async () => {
        // this code will run in the browser
        const createScene = async () => {
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

            await new Promise<void>((resolve) => {
                window.scene?.executeWhenReady(() => {
                    resolve();
                });
            });
        };

        const preview = await checkPerformanceOfScene(page, getGlobalConfig().baseUrl, "preview", createScene, numberOfPasses, framesToRender);
        const stable = await checkPerformanceOfScene(page, getGlobalConfig().baseUrl, "stable", createScene, numberOfPasses, framesToRender);
        const dev = await checkPerformanceOfScene(page, getGlobalConfig().baseUrl, "dev", createScene, numberOfPasses, framesToRender);
        expect(dev / preview, `Dev: ${dev}ms, Preview: ${preview}ms`).toBeLessThanOrEqual(1 + acceptedThreshold);
        expect(dev / stable, `Dev: ${dev}ms, Preview: ${stable}ms`).toBeLessThanOrEqual(1 + acceptedThreshold);
    }, 40000);
});
