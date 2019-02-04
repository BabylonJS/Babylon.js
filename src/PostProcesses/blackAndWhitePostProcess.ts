import { PostProcess, PostProcessOptions } from "./postProcess";
import { Camera } from "../Cameras/camera";
import { Effect } from "../Materials/effect";
import { Engine } from "../Engines/engine";

import "../Shaders/blackAndWhite.fragment";

/**
 * Post process used to render in black and white
 */
export class BlackAndWhitePostProcess extends PostProcess {
    /**
     * Linear about to convert he result to black and white (default: 1)
     */
    public degree = 1;

    /**
     * Creates a black and white post process
     * @see https://doc.babylonjs.com/how_to/how_to_use_postprocesses#black-and-white
     * @param name The name of the effect.
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     */
    constructor(name: string, options: number | PostProcessOptions, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean) {
        super(name, "blackAndWhite", ["degree"], null, options, camera, samplingMode, engine, reusable);

        this.onApplyObservable.add((effect: Effect) => {
            effect.setFloat("degree", this.degree);
        });
    }
}
