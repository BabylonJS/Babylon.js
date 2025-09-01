import type { Scene } from "core/scene";
import { Engine } from "core/Engines/engine"; // can also be @lts/core

import { createScene as createSceneTs } from "./createScene";
import { createScene as createSceneJs } from "./createSceneJS.js";

/** Main entry point for the default scene of the devhost */
export async function Main(): Promise<void> {
    // Setup the engine canvas
    const mainDiv = document.getElementById("main-div") as HTMLDivElement;
    const canvas = document.createElement("canvas");
    mainDiv.appendChild(canvas);

    // Whether to use the TS or JS scene files, default to TS
    const searchParams = new URLSearchParams(window.location.search.toLowerCase());
    const useTsParam = searchParams.get("usets");
    const useTs = useTsParam !== "false"; // Default to true if not specified

    // Setup the engine and create the scene
    const engine = new Engine(canvas, true);

    let scene: Scene | undefined = undefined;
    if (useTs) {
        scene = await createSceneTs(engine, canvas);
    } else {
        scene = await createSceneJs(engine, canvas);
    }

    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(function () {
        scene && scene.render();
    });

    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
        engine && engine.resize();
    });
}
