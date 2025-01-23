import type { Nullable } from "../types";
import { Constants } from "../Engines/constants";
import type { Camera } from "../Cameras/camera";
import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import { AbstractEngine } from "../Engines/abstractEngine";

import { RegisterClass } from "../Misc/typeStore";
import { SerializationHelper } from "../Misc/decorators.serialization";

import type { Scene } from "../scene";
import { ThinPassCubePostProcess, ThinPassPostProcess } from "./thinPassPostProcess";
import { serialize } from "core/Misc/decorators";

/**
 * PassPostProcess which produces an output the same as it's input
 */
export class PassPostProcess extends PostProcess {
    /**
     * Gets a string identifying the name of the class
     * @returns "PassPostProcess" string
     */
    public override getClassName(): string {
        return "PassPostProcess";
    }

    /**
     * Creates the PassPostProcess
     * @param name The name of the effect.
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param textureType The type of texture to be used when performing the post processing.
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     */
    constructor(
        name: string,
        options: number | PostProcessOptions,
        camera: Nullable<Camera> = null,
        samplingMode?: number,
        engine?: AbstractEngine,
        reusable?: boolean,
        textureType: number = Constants.TEXTURETYPE_UNSIGNED_BYTE,
        blockCompilation = false
    ) {
        const localOptions = {
            size: typeof options === "number" ? options : undefined,
            camera,
            samplingMode,
            engine,
            reusable,
            textureType,
            blockCompilation,
            ...(options as PostProcessOptions),
        };

        super(name, ThinPassPostProcess.FragmentUrl, {
            effectWrapper: typeof options === "number" || !options.effectWrapper ? new ThinPassPostProcess(name, engine, localOptions) : undefined,
            ...localOptions,
        });
    }

    /**
     * @internal
     */
    public static override _Parse(parsedPostProcess: any, targetCamera: Camera, scene: Scene, rootUrl: string) {
        return SerializationHelper.Parse(
            () => {
                return new PassPostProcess(
                    parsedPostProcess.name,
                    parsedPostProcess.options,
                    targetCamera,
                    parsedPostProcess.renderTargetSamplingMode,
                    parsedPostProcess._engine,
                    parsedPostProcess.reusable
                );
            },
            parsedPostProcess,
            scene,
            rootUrl
        );
    }
}

RegisterClass("BABYLON.PassPostProcess", PassPostProcess);

/**
 * PassCubePostProcess which produces an output the same as it's input (which must be a cube texture)
 */
export class PassCubePostProcess extends PostProcess {
    /**
     * Gets or sets the cube face to display.
     *  * 0 is +X
     *  * 1 is -X
     *  * 2 is +Y
     *  * 3 is -Y
     *  * 4 is +Z
     *  * 5 is -Z
     */
    @serialize()
    public get face(): number {
        return this._effectWrapper.face;
    }

    public set face(value: number) {
        this._effectWrapper.face = value;
    }

    /**
     * Gets a string identifying the name of the class
     * @returns "PassCubePostProcess" string
     */
    public override getClassName(): string {
        return "PassCubePostProcess";
    }

    protected override _effectWrapper: ThinPassCubePostProcess;

    /**
     * Creates the PassCubePostProcess
     * @param name The name of the effect.
     * @param options The required width/height ratio to downsize to before computing the render pass.
     * @param camera The camera to apply the render pass to.
     * @param samplingMode The sampling mode to be used when computing the pass. (default: 0)
     * @param engine The engine which the post process will be applied. (default: current engine)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     * @param textureType The type of texture to be used when performing the post processing.
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     */
    constructor(
        name: string,
        options: number | PostProcessOptions,
        camera: Nullable<Camera> = null,
        samplingMode?: number,
        engine?: AbstractEngine,
        reusable?: boolean,
        textureType: number = Constants.TEXTURETYPE_UNSIGNED_BYTE,
        blockCompilation = false
    ) {
        const localOptions = {
            size: typeof options === "number" ? options : undefined,
            camera,
            samplingMode,
            engine,
            reusable,
            textureType,
            blockCompilation,
            ...(options as PostProcessOptions),
        };

        super(name, ThinPassPostProcess.FragmentUrl, {
            effectWrapper: typeof options === "number" || !options.effectWrapper ? new ThinPassCubePostProcess(name, engine, localOptions) : undefined,
            ...localOptions,
        });
    }

    /**
     * @internal
     */
    public static override _Parse(parsedPostProcess: any, targetCamera: Camera, scene: Scene, rootUrl: string) {
        return SerializationHelper.Parse(
            () => {
                return new PassCubePostProcess(
                    parsedPostProcess.name,
                    parsedPostProcess.options,
                    targetCamera,
                    parsedPostProcess.renderTargetSamplingMode,
                    parsedPostProcess._engine,
                    parsedPostProcess.reusable
                );
            },
            parsedPostProcess,
            scene,
            rootUrl
        );
    }
}

AbstractEngine._RescalePostProcessFactory = (engine: AbstractEngine) => {
    return new PassPostProcess("rescale", 1, null, Constants.TEXTURE_BILINEAR_SAMPLINGMODE, engine, false, Constants.TEXTURETYPE_UNSIGNED_BYTE);
};
