import { PostProcess, PostProcessOptions } from "./postProcess";
import { Nullable } from "../types";
import { Engine } from "../Engines/engine";
import { Effect } from "../Materials/effect";
import { Camera } from "../Cameras/camera";
import { Constants } from "../Engines/constants";

import "../Shaders/bloomMerge.fragment";
import { _TypeStore } from '../Misc/typeStore';
import { serialize } from '../Misc/decorators';

/**
 * The BloomMergePostProcess merges blurred images with the original based on the values of the circle of confusion.
 */
export class BloomMergePostProcess extends PostProcess {
    /** Weight of the bloom to be added to the original input. */
    @serialize()
    public weight = 1;

    /**
     * Gets a string identifying the name of the class
     * @returns "BloomMergePostProcess" string
     */
    public getClassName(): string {
        return "BloomMergePostProcess";
    }

    /**
     * Creates a new instance of @see BloomMergePostProcess
     * @param name The name of the effect.
     * @param originalFromInput Post process which's input will be used for the merge.
     * @param blurred Blurred highlights post process which's output will be used.
     * @param weight Weight of the bloom to be added to the original input.
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param textureType Type of textures used when performing the post process. (default: 0)
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     */
    constructor(name: string, originalFromInput: PostProcess, blurred: PostProcess,
        /** Weight of the bloom to be added to the original input. */
        weight: number,
        options: number | PostProcessOptions,
        camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT, blockCompilation = false) {
        super(name, "bloomMerge", ["bloomWeight"], ["circleOfConfusionSampler", "blurStep0", "blurStep1", "blurStep2", "bloomBlur"], options, camera, samplingMode, engine, reusable, null, textureType, undefined, null, true);
        this.weight = weight;
        this.onApplyObservable.add((effect: Effect) => {
            effect.setTextureFromPostProcess("textureSampler", originalFromInput);
            effect.setTextureFromPostProcessOutput("bloomBlur", blurred);
            effect.setFloat("bloomWeight", this.weight);
        });

        if (!blockCompilation) {
            this.updateEffect();
        }
    }
}

_TypeStore.RegisteredTypes["BABYLON.BloomMergePostProcess"] = BloomMergePostProcess;
