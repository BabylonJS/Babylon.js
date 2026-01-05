import type { Nullable } from "../types";
import type { Camera } from "../Cameras/camera";
import type { Effect } from "../Materials/effect";
import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import { Constants } from "../Engines/constants";

import type { AbstractEngine } from "core/Engines/abstractEngine";
import { ThinDepthOfFieldMergePostProcess } from "./thinDepthOfFieldMergePostProcess";

/**
 * The DepthOfFieldMergePostProcess merges blurred images with the original based on the values of the circle of confusion.
 */
export class DepthOfFieldMergePostProcess extends PostProcess {
    /**
     * Gets a string identifying the name of the class
     * @returns "DepthOfFieldMergePostProcess" string
     */
    public override getClassName(): string {
        return "DepthOfFieldMergePostProcess";
    }

    /**
     * Creates a new instance of DepthOfFieldMergePostProcess
     * @param name The name of the effect.
     * @param originalFromInput Post process which's input will be used for the merge.
     * @param circleOfConfusion Circle of confusion post process which's output will be used to blur each pixel.
     * @param _blurSteps Blur post processes from low to high which will be mixed with the original image.
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param textureType Type of textures used when performing the post process. (default: 0)
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     */
    constructor(
        name: string,
        originalFromInput: PostProcess,
        circleOfConfusion: PostProcess,
        private _blurSteps: Array<PostProcess>,
        options: number | PostProcessOptions,
        camera: Nullable<Camera>,
        samplingMode?: number,
        engine?: AbstractEngine,
        reusable?: boolean,
        textureType = Constants.TEXTURETYPE_UNSIGNED_BYTE,
        blockCompilation = false
    ) {
        const blockCompilationFinal = typeof options === "number" ? blockCompilation : !!options.blockCompilation;
        const localOptions = {
            samplers: ThinDepthOfFieldMergePostProcess.Samplers,
            size: typeof options === "number" ? options : undefined,
            camera,
            samplingMode,
            engine,
            reusable,
            textureType,
            ...(options as PostProcessOptions),
            blockCompilation: true,
        };

        super(name, ThinDepthOfFieldMergePostProcess.FragmentUrl, {
            effectWrapper: typeof options === "number" || !options.effectWrapper ? new ThinDepthOfFieldMergePostProcess(name, engine, localOptions) : undefined,
            ...localOptions,
        });

        this.externalTextureSamplerBinding = true;
        this.onApplyObservable.add((effect: Effect) => {
            effect.setTextureFromPostProcess("textureSampler", originalFromInput);
            effect.setTextureFromPostProcessOutput("circleOfConfusionSampler", circleOfConfusion);
            for (let i = 0; i < _blurSteps.length; i++) {
                const step = _blurSteps[i];
                effect.setTextureFromPostProcessOutput("blurStep" + (_blurSteps.length - i - 1), step);
            }
        });

        if (!blockCompilationFinal) {
            this.updateEffect();
        }
    }

    /**
     * Updates the effect with the current post process compile time values and recompiles the shader.
     * @param defines Define statements that should be added at the beginning of the shader. (default: null)
     * @param uniforms Set of uniform variables that will be passed to the shader. (default: null)
     * @param samplers Set of Texture2D variables that will be passed to the shader. (default: null)
     * @param indexParameters The index parameters to be used for babylons include syntax "#include<kernelBlurVaryingDeclaration>[0..varyingCount]". (default: undefined) See usage in babylon.blurPostProcess.ts and kernelBlur.vertex.fx
     * @param onCompiled Called when the shader has been compiled.
     * @param onError Called if there is an error when compiling a shader.
     */
    public override updateEffect(
        defines: Nullable<string> = null,
        uniforms: Nullable<string[]> = null,
        samplers: Nullable<string[]> = null,
        indexParameters?: any,
        onCompiled?: (effect: Effect) => void,
        onError?: (effect: Effect, errors: string) => void
    ) {
        if (!defines) {
            defines = "";
            defines += "#define BLUR_LEVEL " + (this._blurSteps.length - 1) + "\n";
        }
        super.updateEffect(defines, uniforms, samplers, indexParameters, onCompiled, onError);
    }
}
