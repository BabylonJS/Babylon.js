import { expect, test } from "@playwright/test";
import { getGlobalConfig } from "@tools/test-tools";

declare const BABYLON: typeof import("core/index");

type HtmlInteractionTestWindow = Window &
    typeof globalThis & {
        htmlInteractionTest: {
            engine: import("core/Engines/engine").Engine;
            scene: import("core/scene").Scene;
            plane: import("core/Meshes/mesh").Mesh;
            manager: import("core/Materials/Textures/HTML/htmlInteractionManager").HtmlInteractionManager;
        };
    };

test.use({ browserName: "chromium", viewport: { width: 800, height: 600 } });

for (const hardwareScalingLevel of [1, 2]) {
    test(`HTML drawable geometry receives native pointer input at hardware scaling ${hardwareScalingLevel}`, async ({ page }) => {
        const { baseUrl } = getGlobalConfig();
        await page.goto(baseUrl + "/empty.html");
        const supported = await page.evaluate(() => {
            const canvas = document.createElement("canvas");
            return typeof canvas.content === "string" && typeof canvas.updateElementGeometry === "function";
        });
        test.skip(!supported, "This browser does not expose the current HTML-in-Canvas geometry API.");
        await page.addScriptTag({ url: baseUrl + "/babylon.js" });
        await page.evaluate((hardwareScalingLevel) => {
            document.body.innerHTML = "";
            document.body.style.margin = "0";
            const canvas = document.createElement("canvas");
            canvas.id = "html-interaction-canvas";
            canvas.style.width = "640px";
            canvas.style.height = "480px";
            canvas.dataset.clicks = "0";
            canvas.dataset.pointerDowns = "0";
            document.body.appendChild(canvas);
            const engine = new BABYLON.Engine(canvas, false);
            engine.setHardwareScalingLevel(hardwareScalingLevel);
            const scene = new BABYLON.Scene(engine);
            const camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 0, -5), scene);
            camera.setTarget(BABYLON.Vector3.Zero());
            const plane = BABYLON.MeshBuilder.CreatePlane("html", { width: 2, height: 1 }, scene);
            const button = document.createElement("button");
            button.style.cssText = "width:200px;height:100px;background:green";
            button.textContent = "Native HTML button";
            button.addEventListener("pointerdown", () => {
                canvas.dataset.pointerDowns = String(Number(canvas.dataset.pointerDowns) + 1);
            });
            button.addEventListener("click", () => {
                canvas.dataset.clicks = String(Number(canvas.dataset.clicks) + 1);
            });
            const texture = new BABYLON.HtmlTexture("html", button, { scene, width: 200, height: 100 });
            const material = new BABYLON.StandardMaterial("html", scene);
            material.disableLighting = true;
            material.diffuseColor = BABYLON.Color3.Black();
            material.emissiveTexture = texture;
            plane.material = material;
            const manager = new BABYLON.HtmlInteractionManager(scene, texture, plane);
            (window as HtmlInteractionTestWindow).htmlInteractionTest = { engine, scene, plane, manager };
            scene.onAfterRenderObservable.add(() => {
                if (texture.isReady()) {
                    canvas.dataset.ready = "true";
                }
            });
            engine.runRenderLoop(() => scene.render());
        }, hardwareScalingLevel);

        try {
            const canvas = page.locator("#html-interaction-canvas");
            await expect(canvas).toHaveAttribute("data-ready", "true");
            let point = { x: 0, y: 0 };
            for (const x of [0, 1]) {
                point = await page.evaluate(async (x) => {
                    const { engine, scene, plane } = (window as HtmlInteractionTestWindow).htmlInteractionTest;
                    plane.position.x = x;
                    await new Promise<void>((resolve) => scene.onAfterRenderObservable.addOnce(() => resolve()));
                    const canvas = engine.getRenderingCanvas()!;
                    const projected = BABYLON.Vector3.Project(
                        plane.getBoundingInfo().boundingBox.centerWorld,
                        BABYLON.Matrix.IdentityReadOnly,
                        scene.getTransformMatrix(),
                        new BABYLON.Viewport(0, 0, engine.getRenderWidth(), engine.getRenderHeight())
                    );
                    const rect = canvas.getBoundingClientRect();
                    return { x: rect.left + (projected.x * rect.width) / canvas.width, y: rect.top + (projected.y * rect.height) / canvas.height };
                }, x);
                await page.mouse.click(point.x, point.y);
                await expect(canvas).toHaveAttribute("data-clicks", String(x + 1));
                await expect(canvas).toHaveAttribute("data-pointer-downs", String(x + 1));
            }
            expect(await page.locator("canvas button").evaluate((button) => button.style.transform)).toBe("");
            await page.evaluate(() => (window as HtmlInteractionTestWindow).htmlInteractionTest.manager.dispose());
            await page.mouse.click(point.x, point.y);
            await expect(canvas).toHaveAttribute("data-clicks", "2");
        } finally {
            await page.evaluate(() => {
                const { engine, scene, manager } = (window as HtmlInteractionTestWindow).htmlInteractionTest;
                manager.dispose();
                scene.dispose();
                engine.dispose();
            });
        }
    });
}
