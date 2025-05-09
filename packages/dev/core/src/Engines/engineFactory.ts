import type { AbstractEngine } from "./abstractEngine";
import { Engine } from "./engine";
import { NullEngine } from "./nullEngine";
import { WebGPUEngine } from "./webgpuEngine";

/**
 * Helper class to create the best engine depending on the current hardware
 */
export class EngineFactory {
    /**
     * Creates an engine based on the capabilities of the underlying hardware
     * @param canvas Defines the canvas to use to display the result
     * @param options Defines the options passed to the engine to create the context dependencies
     * @returns a promise that resolves with the created engine
     */
    public static async CreateAsync(canvas: HTMLCanvasElement, options: any): Promise<AbstractEngine> {
        const supported = await WebGPUEngine.IsSupportedAsync;
        if (supported) {
            return await WebGPUEngine.CreateAsync(canvas, options);
        }
        if (Engine.IsSupported) {
            return new Engine(canvas, undefined, options);
        }
        return new NullEngine(options);
    }
}
