import type { TextureSize } from "../../Materials/Textures/textureCreationOptions";
import type { WebGPUEngine } from "../webgpuEngine";
import { RenderTargetWrapper } from "../renderTargetWrapper";
import { WebGPUPerfCounter } from "./webgpuPerfCounter";

/**
 * Specialized class used to store a render target of a WebGPU engine
 */
export class WebGPURenderTargetWrapper extends RenderTargetWrapper {
    /** @internal */
    public _defaultAttachments: number[];

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
    constructor(isMulti: boolean, isCube: boolean, size: TextureSize, engine: WebGPUEngine, label?: string) {
        super(isMulti, isCube, size, engine, label);

        if (engine.enableGPUTimingMeasurements) {
            this.gpuTimeInFrame = new WebGPUPerfCounter();
        }
    }
}
