import { EngineInstance } from "./engine";
import { Vector3 } from "core/Maths/math.vector";
import { Scene } from "core/scene";
import { FreeCamera } from "core/Cameras";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { MeshBuilder } from "core/Meshes/meshBuilder";

// eslint-disable-next-line @typescript-eslint/naming-convention, no-restricted-syntax
export const createScene = async function () {
    const scene = new Scene(EngineInstance);

    // This creates and positions a free camera (non-mesh)
    const camera = new FreeCamera("camera1", new Vector3(0, 5, -10), scene);

    // This targets the camera to scene origin
    camera.setTarget(Vector3.Zero());

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    // Our built-in 'sphere' shape.
    const sphere = MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32}, scene);

    // Move the sphere upward 1/2 its height
    sphere.position.y = 1;

    // Our built-in 'ground' shape.
    MeshBuilder.CreateGround("ground", {width: 6, height: 6}, scene);

    return scene;
};
