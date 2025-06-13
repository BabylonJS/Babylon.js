import { ThinEngine } from "@babylonjs/core/Engines/thinEngine";

export function createThinEngine(canvas: HTMLCanvasElement) {
    const antialias = false;
    return new ThinEngine(
        canvas,
        antialias,
        {
            stencil: false,
            depth: false,
            antialias,
            audioEngine: false,
            // Important to allow skip frame and tiled optimizations
            preserveDrawingBuffer: false,
            // Useful during debug to simulate WebGL1 devices (Safari)
            // disableWebGL2Support: true,
        },
        false
    );
}
