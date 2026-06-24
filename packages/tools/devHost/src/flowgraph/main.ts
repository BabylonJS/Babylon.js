import { type Scene } from "core/scene";
import { Engine } from "core/Engines/engine";

import { createScene } from "./createScene";

/**
 * Entry point for the "flowgraph" devhost experience: a physics-driven,
 * Flow-Graph-powered "Babylon Bros." platformer showcase.
 * @param _searchParams URL QSPs where the keys have been lowercased.
 */
export async function Main(_searchParams: URLSearchParams): Promise<void> {
    // Setup the engine canvas
    const mainDiv = document.getElementById("main-div") as HTMLDivElement;
    const canvas = document.createElement("canvas");
    canvas.id = "babylon-canvas";
    mainDiv.appendChild(canvas);

    // Setup the engine and create the scene
    const engine = new Engine(canvas, true);
    const scene: Scene = await createScene(engine, canvas);

    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(function () {
        scene.render();
    });

    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
        engine.resize();
    });
}
