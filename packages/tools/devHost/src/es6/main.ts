import { Engine } from "core/Engines/engine"; // can also be @lts/core

import { createScene as createSceneTS } from "./createScene";
// import { createScene as createSceneJS } from "./createSceneJS.js";

/** Main entry point for the default scene of the devhost */
export async function Main(): Promise<void> {
    const canvas = document.getElementById("babylon-canvas") as HTMLCanvasElement; // Get the canvas element
    const engine = new Engine(canvas, true); // Generate the BABYLON 3D engine

    const createScene = createSceneTS;
    const scene = await createScene(engine, canvas);

    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(function () {
        scene && scene.render();
        //engine.clear({ r: 0, g: 0, b: 0, a: 1.0 }, true, true);
    });

    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
        engine && engine.resize();
    });
}
