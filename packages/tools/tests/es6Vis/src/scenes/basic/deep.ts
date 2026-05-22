/**
 * Basic scene — deep import style.
 * Imports each symbol from its specific sub-path inside "@babylonjs/core".
 */

import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3 } from "@babylonjs/core/Maths/math.color";

export function run(canvas: HTMLCanvasElement): void {
    const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    const scene = new Scene(engine);

    const camera = new FreeCamera("camera", new Vector3(0, 2, -5), scene);
    camera.setTarget(Vector3.Zero());

    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 0.8;

    const box = MeshBuilder.CreateBox("box", { size: 1.5 }, scene);
    box.position = new Vector3(-1.5, 0.75, 0);
    const boxMat = new StandardMaterial("boxMat", scene);
    boxMat.diffuseColor = new Color3(0.8, 0.2, 0.2);
    box.material = boxMat;

    const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 1.5, segments: 16 }, scene);
    sphere.position = new Vector3(1.5, 0.75, 0);
    const sphereMat = new StandardMaterial("sphereMat", scene);
    sphereMat.diffuseColor = new Color3(0.2, 0.4, 0.8);
    sphere.material = sphereMat;

    const ground = MeshBuilder.CreateGround("ground", { width: 6, height: 4 }, scene);
    const groundMat = new StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new Color3(0.4, 0.6, 0.3);
    ground.material = groundMat;

    engine.runRenderLoop(() => {
        scene.render();
    });
    scene.executeWhenReady(() => {
        (window as any).__ready = true;
    });
}
