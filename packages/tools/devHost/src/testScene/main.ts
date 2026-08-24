import { type Scene } from "core/scene";
import { type AbstractEngine } from "core/Engines/abstractEngine";
import { Engine } from "core/Engines/engine";
import { WebGPUEngine } from "core/Engines/webgpuEngine";

import { createScene as createSceneTs } from "./createScene";
import { CreateWebGPUXRSceneAsync } from "./createWebGPUXRScene";

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

    // Whether to use the TS or JS scene files, default to TS
    const useTsParam = searchParams.get("usets");
    const useTs = useTsParam !== "false"; // Default to true if not specified

    const useWebGPUXR = searchParams.get("webgpuxr") === "true";
    let engine: AbstractEngine;
    let scene: Scene | undefined = undefined;
    if (useWebGPUXR) {
        const webGPUEngine = new WebGPUEngine(canvas, { xrCompatible: true });
        await webGPUEngine.initAsync();
        engine = webGPUEngine;
        scene = await CreateWebGPUXRSceneAsync(webGPUEngine, canvas);
    } else {
        const webGLEngine = new Engine(canvas, true);
        engine = webGLEngine;
        if (useTs) {
            scene = await createSceneTs(webGLEngine, canvas);
        } else {
            const { createScene: createSceneJs } = await import("./createSceneJS.js");
            scene = await createSceneJs(webGLEngine, canvas);
        }
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
