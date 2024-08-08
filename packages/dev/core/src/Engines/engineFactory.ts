import type { AbstractEngine } from "./abstractEngine";
import { Engine } from "./engine";
import { NullEngine } from "./nullEngine";
import { WebGPUEngine } from "./webgpuEngine";

/**
 * Creates an engine based on the capabilities of the underlying hardware
 * @param canvas Defines the canvas to use to display the result
 * @param options Defines the options passed to the engine to create the context dependencies
 * @returns a promise that resolves with the created engine
 */
export async function CreateEngineAsync(canvas: HTMLCanvasElement, options: any): Promise<AbstractEngine> {
    const supported = await WebGPUEngine.IsSupportedAsync;
    if (supported) {
        return WebGPUEngine.CreateAsync(canvas, options);
    }
    if (Engine.IsSupported) {
        return new Engine(canvas, undefined, options);
    }
    return new NullEngine(options);
}

/**
 * Helper to create the best engine depending on the current hardware
 * @deprecated use `CreateEngineAsync`
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const EngineFactory = { CreateAsync: CreateEngineAsync };
