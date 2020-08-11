import { Nullable } from "../types";
import { Matrix } from "../Maths/math.vector";
import { Camera } from "../Cameras/camera";
import { Effect } from "../Materials/effect";
import { PostProcess, PostProcessOptions } from "./postProcess";
import { Engine } from "../Engines/engine";

import "../Shaders/filter.fragment";

/**
 * Applies a kernel filter to the image
 */
export class FilterPostProcess extends PostProcess {
    /**
     *
     * @param name The name of the effect.
     * @param kernelMatrix The matrix to be applied to the image
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     */
    constructor(name: string,
        /** The matrix to be applied to the image */
        public kernelMatrix: Matrix,
        options: number | PostProcessOptions,
        camera: Nullable<Camera>,
        samplingMode?: number,
        engine?: Engine,
        reusable?: boolean
    ) {
        super(name, "filter", ["kernelMatrix"], null, options, camera, samplingMode, engine, reusable);

        this.onApply = (effect: Effect) => {
            effect.setMatrix("kernelMatrix", this.kernelMatrix);
        };
    }
}
