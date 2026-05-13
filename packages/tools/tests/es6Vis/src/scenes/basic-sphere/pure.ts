/**
 * basic-sphere — pure import style.
 */
import { Engine, Scene, FreeCamera, HemisphericLight, CreateSphere, StandardMaterial, Color3, Vector3, RegisterCoreEngineExtensions } from "@babylonjs/core/pure";

RegisterCoreEngineExtensions();

export function run(canvas: HTMLCanvasElement): void {
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    const scene = new Scene(engine);

    const camera = new FreeCamera("camera", new Vector3(0, 5, -10), scene);
    camera.setTarget(Vector3.Zero());

    new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    const material = new StandardMaterial("sphereMat", scene);
    material.diffuseColor = new Color3(0.4, 0.6, 0.9);

    const sphere = CreateSphere("sphere", { diameter: 2, segments: 32 }, scene);
    sphere.material = material;

    engine.runRenderLoop(() => {
        scene.render();
    });
    scene.executeWhenReady(() => {
        (window as any).__ready = true;
    });
}
