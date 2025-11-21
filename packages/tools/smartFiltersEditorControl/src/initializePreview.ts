import { ThinEngine } from "core/Engines/thinEngine.js";

/**
 * Initializes a ThinEngine for the preview canvas.
 * @param canvas - The HTML canvas element to initialize the engine on.
 * @param forceWebGL1 - Whether to force the use of WebGL1
 * @returns The initialized ThinEngine.
 */
export function InitializePreview(canvas: HTMLCanvasElement, forceWebGL1: boolean): ThinEngine {
    const antialias = false;
    const engine = new ThinEngine(
        canvas,
        antialias,
        {
            stencil: false,
            depth: false,
            antialias,
            audioEngine: false,
            // Important to allow skip frame and tiled optimizations
            preserveDrawingBuffer: false,
            premultipliedAlpha: false,
            disableWebGL2Support: forceWebGL1,
        },
        false
    );
    engine.getCaps().parallelShaderCompile = undefined;
    return engine;
}
