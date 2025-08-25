import { Engine } from "core/Engines/engine"; // can also be @lts/core

import { createScene } from "./createScene";
//import { createScene } from "./createSceneJS.js";

/** Main entry point for the default scene of the devhost */
export async function Main(): Promise<void> {
    // Setup the engine canvas
    const mainDiv = document.getElementById("main-div") as HTMLDivElement;
    const canvas = document.createElement("canvas");
    mainDiv.appendChild(canvas);

    // Setup the engine and create the scene
    const engine = new Engine(canvas, true);
    const scene = await createScene(engine, canvas);

    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(function () {
        scene && scene.render();
    });

    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
        engine && engine.resize();
    });
}
