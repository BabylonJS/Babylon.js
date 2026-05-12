/**
 * basic-sphere — barrel import style.
 */
import { Engine, Scene, FreeCamera, HemisphericLight, MeshBuilder, StandardMaterial, Color3, Vector3 } from "@babylonjs/core";

export function run(canvas: HTMLCanvasElement): void {
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    const scene = new Scene(engine);

    const camera = new FreeCamera("camera", new Vector3(0, 5, -10), scene);
    camera.setTarget(Vector3.Zero());

    new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    const material = new StandardMaterial("sphereMat", scene);
    material.diffuseColor = new Color3(0.4, 0.6, 0.9);

    const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 2, segments: 32 }, scene);
    sphere.material = material;

    let frameCount = 0;
    engine.runRenderLoop(() => {
        scene.render();
        if (++frameCount >= 10) {
            (window as any).__ready = true;
        }
    });
}
