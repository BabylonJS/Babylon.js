import type { Nullable, AbstractEngine, EffectWrapperCreationOptions } from "core/index";
import { EffectWrapper } from "../Materials/effectRenderer";
import { Engine } from "../Engines/engine";

/**
 * Post process used to apply a convolution effect
 */
export class ThinConvolutionPostProcess extends EffectWrapper {
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

    /**
     * The fragment shader url
     */
    public static readonly FragmentUrl = "convolution";

    /**
     * The list of uniforms used by the effect
     */
    public static readonly Uniforms = ["kernel", "screenSize"];

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(import("../ShadersWGSL/convolution.fragment"));
        } else {
            list.push(import("../Shaders/convolution.fragment"));
        }
    }

    /**
     * Constructs a new convolution post process
     * @param name Name of the effect
     * @param engine Engine to use to render the effect. If not provided, the last created engine will be used
     * @param kernel Array of 9 values corresponding to the 3x3 kernel to be applied
     * @param options Options to configure the effect
     */
    constructor(name: string, engine: Nullable<AbstractEngine> = null, kernel: number[], options?: EffectWrapperCreationOptions) {
        super({
            ...options,
            name,
            engine: engine || Engine.LastCreatedEngine!,
            useShaderStore: true,
            useAsPostProcess: true,
            fragmentShader: ThinConvolutionPostProcess.FragmentUrl,
            uniforms: ThinConvolutionPostProcess.Uniforms,
        });

        this.kernel = kernel;
    }

    /** Array of 9 values corresponding to the 3x3 kernel to be applied */
    public kernel: number[];

    /**
     * The width of the source texture
     */
    public textureWidth: number = 0;

    /**
     * The height of the source texture
     */
    public textureHeight: number = 0;

    public override bind(noDefaultBindings = false) {
        super.bind(noDefaultBindings);

        const effect = this._drawWrapper.effect!;

        effect.setFloat2("screenSize", this.textureWidth, this.textureHeight);
        effect.setArray("kernel", this.kernel);
    }
}
