import { type Scene } from "core/scene";
import { WebGPUEngine } from "core/Engines/webgpuEngine";
import "core/Engines/WebGPU/Extensions/engine.computeShader";

import { createScene as createSceneTs } from "./createScene";

/**
 * Main entry point for the default scene for the devhost
 * @param searchParams URL QSPs where the Keys have been lowercased to avoid any casing problems. Values are unmodified.
 */
export async function Main(searchParams: URLSearchParams): Promise<void> {
    // Setup the engine canvas
    const mainDiv = document.getElementById("main-div") as HTMLDivElement;
    const canvas = document.createElement("canvas");
    canvas.id = "babylon-canvas";
    mainDiv.appendChild(canvas);

    // Setup a WebGPU engine (required for the Gaussian Splatting GPU sort/cull compute path)
    const engine = new WebGPUEngine(canvas, { antialias: true });
    await engine.initAsync();

    const scene: Scene = await createSceneTs(engine, canvas);

    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(function () {
        scene && scene.render();
    });

    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
        engine && engine.resize();
    });
}
