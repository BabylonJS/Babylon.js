import { ThinEngine } from "@babylonjs/core/Engines/thinEngine.js";

export function initializePreview(canvas: HTMLCanvasElement, forceWebGL1: boolean): ThinEngine {
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
