import { type TextureSize } from "../../Materials/Textures/textureCreationOptions";
import { RenderTargetWrapper } from "../renderTargetWrapper";
import { WebGPUPerfCounter } from "./webgpuPerfCounter";
import { type ThinWebGPUEngine } from "../thinWebGPUEngine";

/**
 * Specialized class used to store a render target of a WebGPU engine
 */
export class WebGPURenderTargetWrapper extends RenderTargetWrapper {
    /** @internal */
    public _defaultAttachments: number[];

    /**
     * When true, the engine skips its render-target Y-flip when drawing into this target: it binds the
     * non-inverting internals UBO (yFactor = +1) and keeps the main-framebuffer front-face winding, exactly
     * as if rendering to the canvas. This is set for XR projection-layer targets, whose textures are handed
     * directly to the XR compositor (top-left origin, presented as-is, never re-sampled by Babylon) and must
     * therefore be rendered upright. Defaults to false so every other render target keeps the standard flip
     * that keeps a later-sampled RTT consistent with the WebGL texture-space convention.
     * @internal
     */
    public _disableEngineYFlip = false;

    /**
     * Gets the GPU time spent rendering this render target in the last frame (in nanoseconds).
     * You have to enable the "timestamp-query" extension in the engine constructor options and set engine.enableGPUTimingMeasurements = true.
     */
    public readonly gpuTimeInFrame?: WebGPUPerfCounter;

    /**
     * Initializes the render target wrapper
     * @param isMulti true if the wrapper is a multi render target
     * @param isCube true if the wrapper should render to a cube texture
     * @param size size of the render target (width/height/layers)
     * @param engine engine used to create the render target
     * @param label defines the label to use for the wrapper (for debugging purpose only)
     */
    constructor(isMulti: boolean, isCube: boolean, size: TextureSize, engine: ThinWebGPUEngine, label?: string) {
        super(isMulti, isCube, size, engine, label);

        if (engine.enableGPUTimingMeasurements) {
            this.gpuTimeInFrame = new WebGPUPerfCounter();
        }
    }
}
