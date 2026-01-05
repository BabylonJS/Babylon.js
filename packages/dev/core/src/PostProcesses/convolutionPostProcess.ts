import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import type { Nullable } from "../types";
import type { Camera } from "../Cameras/camera";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { Effect } from "../Materials/effect";
import { Constants } from "../Engines/constants";

import { RegisterClass } from "../Misc/typeStore";
import { serialize } from "../Misc/decorators";
import { SerializationHelper } from "../Misc/decorators.serialization";

import type { Scene } from "../scene";
import { ThinConvolutionPostProcess } from "./thinConvolutionPostProcess";

/**
 * The ConvolutionPostProcess applies a 3x3 kernel to every pixel of the
 * input texture to perform effects such as edge detection or sharpening
 * See http://en.wikipedia.org/wiki/Kernel_(image_processing)
 */
export class ConvolutionPostProcess extends PostProcess {
    /** Array of 9 values corresponding to the 3x3 kernel to be applied */
    @serialize()
    public get kernel() {
        return this._effectWrapper.kernel;
    }

    public set kernel(value: number[]) {
        this._effectWrapper.kernel = value;
    }

    /**
     * Gets a string identifying the name of the class
     * @returns "ConvolutionPostProcess" string
     */
    public override getClassName(): string {
        return "ConvolutionPostProcess";
    }

    protected override _effectWrapper: ThinConvolutionPostProcess;

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
    constructor(
        name: string,
        kernel: number[],
        options: number | PostProcessOptions,
        camera: Nullable<Camera>,
        samplingMode?: number,
        engine?: AbstractEngine,
        reusable?: boolean,
        textureType: number = Constants.TEXTURETYPE_UNSIGNED_BYTE
    ) {
        const localOptions = {
            uniforms: ThinConvolutionPostProcess.Uniforms,
            size: typeof options === "number" ? options : undefined,
            camera,
            samplingMode,
            engine,
            reusable,
            textureType,
            ...(options as PostProcessOptions),
        };

        super(name, ThinConvolutionPostProcess.FragmentUrl, {
            effectWrapper: typeof options === "number" || !options.effectWrapper ? new ThinConvolutionPostProcess(name, engine, kernel, localOptions) : undefined,
            ...localOptions,
        });

        this.onApply = (_effect: Effect) => {
            this._effectWrapper.textureWidth = this.width;
            this._effectWrapper.textureHeight = this.height;
        };
    }

    /**
     * @internal
     */
    public static override _Parse(parsedPostProcess: any, targetCamera: Camera, scene: Scene, rootUrl: string): Nullable<ConvolutionPostProcess> {
        return SerializationHelper.Parse(
            () => {
                return new ConvolutionPostProcess(
                    parsedPostProcess.name,
                    parsedPostProcess.kernel,
                    parsedPostProcess.options,
                    targetCamera,
                    parsedPostProcess.renderTargetSamplingMode,
                    scene.getEngine(),
                    parsedPostProcess.reusable,
                    parsedPostProcess.textureType
                );
            },
            parsedPostProcess,
            scene,
            rootUrl
        );
    }

    // Statics
    /**
     * Edge detection 0 see https://en.wikipedia.org/wiki/Kernel_(image_processing)
     */
    public static EdgeDetect0Kernel = ThinConvolutionPostProcess.EdgeDetect0Kernel;
    /**
     * Edge detection 1 see https://en.wikipedia.org/wiki/Kernel_(image_processing)
     */
    public static EdgeDetect1Kernel = ThinConvolutionPostProcess.EdgeDetect1Kernel;
    /**
     * Edge detection 2 see https://en.wikipedia.org/wiki/Kernel_(image_processing)
     */
    public static EdgeDetect2Kernel = ThinConvolutionPostProcess.EdgeDetect2Kernel;
    /**
     * Kernel to sharpen an image see https://en.wikipedia.org/wiki/Kernel_(image_processing)
     */
    public static SharpenKernel = ThinConvolutionPostProcess.SharpenKernel;
    /**
     * Kernel to emboss an image see https://en.wikipedia.org/wiki/Kernel_(image_processing)
     */
    public static EmbossKernel = ThinConvolutionPostProcess.EmbossKernel;
    /**
     * Kernel to blur an image see https://en.wikipedia.org/wiki/Kernel_(image_processing)
     */
    public static GaussianKernel = ThinConvolutionPostProcess.GaussianKernel;
}

RegisterClass("BABYLON.ConvolutionPostProcess", ConvolutionPostProcess);
