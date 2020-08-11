import { Nullable } from "../types";
import { Camera } from "../Cameras/camera";
import { PostProcess, PostProcessOptions } from "./postProcess";
import { Engine } from "../Engines/engine";

import "../Shaders/displayPass.fragment";

/**
 * DisplayPassPostProcess which produces an output the same as it's input
 */
export class DisplayPassPostProcess extends PostProcess {
    /**
     * Creates the DisplayPassPostProcess
     * @param name The name of the effect.
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     */
    constructor(name: string, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean) {
        super(name, "displayPass", ["passSampler"], ["passSampler"], options, camera, samplingMode, engine, reusable);
    }
}
