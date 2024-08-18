import type { Nullable } from "../types";
import type { Camera } from "../Cameras/camera";
import type { Effect } from "../Materials/effect";
import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import type { AbstractEngine } from "../Engines/abstractEngine";
import { Constants } from "../Engines/constants";

import { RegisterClass } from "../Misc/typeStore";
import { serialize } from "../Misc/decorators";
import { SerializationHelper } from "../Misc/decorators.serialization";

import type { Scene } from "../scene";

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
    public override getClassName(): string {
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
    constructor(
        name: string,
        options: number | PostProcessOptions,
        camera: Nullable<Camera>,
        samplingMode?: number,
        engine?: AbstractEngine,
        reusable?: boolean,
        textureType: number = Constants.TEXTURETYPE_UNSIGNED_INT,
        blockCompilation = false
    ) {
        super(name, "grain", ["intensity", "animatedSeed"], [], options, camera, samplingMode, engine, reusable, null, textureType, undefined, null, blockCompilation);
        this.onApplyObservable.add((effect: Effect) => {
            effect.setFloat("intensity", this.intensity);
            effect.setFloat("animatedSeed", this.animated ? Math.random() + 1 : 1);
        });
    }

    protected override _gatherImports(useWebGPU: boolean, list: Promise<any>[]) {
        if (useWebGPU) {
            this._webGPUReady = true;
            list.push(Promise.all([import("../ShadersWGSL/grain.fragment")]));
        } else {
            list.push(Promise.all([import("../Shaders/grain.fragment")]));
        }

        super._gatherImports(useWebGPU, list);
    }

    /**
     * @internal
     */
    public static override _Parse(parsedPostProcess: any, targetCamera: Camera, scene: Scene, rootUrl: string) {
        return SerializationHelper.Parse(
            () => {
                return new GrainPostProcess(
                    parsedPostProcess.name,
                    parsedPostProcess.options,
                    targetCamera,
                    parsedPostProcess.renderTargetSamplingMode,
                    scene.getEngine(),
                    parsedPostProcess.reusable
                );
            },
            parsedPostProcess,
            scene,
            rootUrl
        );
    }
}

RegisterClass("BABYLON.GrainPostProcess", GrainPostProcess);
