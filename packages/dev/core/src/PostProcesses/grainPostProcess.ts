import type { Nullable } from "../types";
import type { Camera } from "../Cameras/camera";
import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import type { AbstractEngine } from "../Engines/abstractEngine";
import { Constants } from "../Engines/constants";

import { RegisterClass } from "../Misc/typeStore";
import { serialize } from "../Misc/decorators";
import { SerializationHelper } from "../Misc/decorators.serialization";

import type { Scene } from "../scene";
import { ThinGrainPostProcess } from "./thinGrainPostProcess";

/**
 * The GrainPostProcess adds noise to the image at mid luminance levels
 */
export class GrainPostProcess extends PostProcess {
    /**
     * The intensity of the grain added (default: 30)
     */
    @serialize()
    public get intensity() {
        return this._effectWrapper.intensity;
    }

    public set intensity(value: number) {
        this._effectWrapper.intensity = value;
    }

    /**
     * If the grain should be randomized on every frame
     */
    @serialize()
    public get animated() {
        return this._effectWrapper.animated;
    }

    public set animated(value: boolean) {
        this._effectWrapper.animated = value;
    }

    /**
     * Gets a string identifying the name of the class
     * @returns "GrainPostProcess" string
     */
    public override getClassName(): string {
        return "GrainPostProcess";
    }

    protected override _effectWrapper: ThinGrainPostProcess;

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
        textureType: number = Constants.TEXTURETYPE_UNSIGNED_BYTE,
        blockCompilation = false
    ) {
        const localOptions = {
            uniforms: ThinGrainPostProcess.Uniforms,
            size: typeof options === "number" ? options : undefined,
            camera,
            samplingMode,
            engine,
            reusable,
            textureType,
            blockCompilation,
            ...(options as PostProcessOptions),
        };

        super(name, ThinGrainPostProcess.FragmentUrl, {
            effectWrapper: typeof options === "number" || !options.effectWrapper ? new ThinGrainPostProcess(name, engine, localOptions) : undefined,
            ...localOptions,
        });
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
