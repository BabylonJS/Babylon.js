import { PostProcess, PostProcessOptions } from "./postProcess";
import { Nullable } from "../types";
import { Camera } from "../Cameras/camera";
import { Engine } from "../Engines/engine";
import { Effect } from "../Materials/effect";
import { Constants } from "../Engines/constants";

import "../Shaders/convolution.fragment";

/**
 * The ConvolutionPostProcess applies a 3x3 kernel to every pixel of the
 * input texture to perform effects such as edge detection or sharpening
 * See http://en.wikipedia.org/wiki/Kernel_(image_processing)
 */
export class ConvolutionPostProcess extends PostProcess {
    /**
     * Creates a new instance ConvolutionPostProcess
     * @param name The name of the effect.
     * @param kernel Array of 9 values corresponding to the 3x3 kernel to be applied
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param textureType Type of textures used when performing the post process. (default: 0)
     */
    constructor(name: string,
        /** Array of 9 values corresponding to the 3x3 kernel to be applied */
        public kernel: number[],
        options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT) {
        super(name, "convolution", ["kernel", "screenSize"], null, options, camera, samplingMode, engine, reusable, null, textureType);

        this.onApply = (effect: Effect) => {
            effect.setFloat2("screenSize", this.width, this.height);
            effect.setArray("kernel", this.kernel);
        };
    }

    // Statics
    /**
     * Edge detection 0 see https://en.wikipedia.org/wiki/Kernel_(image_processing)
     */
    public static EdgeDetect0Kernel = [1, 0, -1, 0, 0, 0, -1, 0, 1];
    /**
     * Edge detection 1 see https://en.wikipedia.org/wiki/Kernel_(image_processing)
     */
    public static EdgeDetect1Kernel = [0, 1, 0, 1, -4, 1, 0, 1, 0];
    /**
     * Edge detection 2 see https://en.wikipedia.org/wiki/Kernel_(image_processing)
     */
    public static EdgeDetect2Kernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];
    /**
     * Kernel to sharpen an image see https://en.wikipedia.org/wiki/Kernel_(image_processing)
     */
    public static SharpenKernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
    /**
     * Kernel to emboss an image see https://en.wikipedia.org/wiki/Kernel_(image_processing)
     */
    public static EmbossKernel = [-2, -1, 0, -1, 1, 1, 0, 1, 2];
    /**
     * Kernel to blur an image see https://en.wikipedia.org/wiki/Kernel_(image_processing)
     */
    public static GaussianKernel = [0, 1, 0, 1, 1, 1, 0, 1, 0];
}
