import { Nullable } from "../types";
import { Camera } from "../Cameras/camera";
import { Effect } from "../Materials/effect";
import { PostProcess, PostProcessOptions } from "./postProcess";
import { Engine } from "../Engines/engine";
import { Constants } from "../Engines/constants";

import "../Shaders/grain.fragment";
import { _TypeStore } from '../Misc/typeStore';
import { serialize } from '../Misc/decorators';

/**
 * The GrainPostProcess adds noise to the image at mid luminance levels
 */
export class GrainPostProcess extends PostProcess {
    /**
     * The intensity of the grain added (default: 30)
     */
    @serialize()
    public intensity: number = 30;
    /**
     * If the grain should be randomized on every frame
     */
    @serialize()
    public animated: boolean = false;

    /**
     * Gets a string identifying the name of the class
     * @returns "GrainPostProcess" string
     */
    public getClassName(): string {
        return "GrainPostProcess";
    }      

    /**
     * Creates a new instance of @see GrainPostProcess
     * @param name The name of the effect.
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param textureType Type of textures used when performing the post process. (default: 0)
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     */
    constructor(name: string, options: number | PostProcessOptions, camera: Nullable<Camera>, samplingMode?: number, engine?: Engine, reusable?: boolean, textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT, blockCompilation = false) {
        super(name, "grain", ["intensity", "animatedSeed"], [], options, camera, samplingMode, engine, reusable, null, textureType, undefined, null, blockCompilation);
        this.onApplyObservable.add((effect: Effect) => {
            effect.setFloat('intensity', this.intensity);
            effect.setFloat('animatedSeed', this.animated ? Math.random() + 1 : 1);
        });
    }
}

_TypeStore.RegisteredTypes["BABYLON.GrainPostProcess"] = GrainPostProcess;

