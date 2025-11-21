import { Camera } from "../Cameras/camera";
import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import { Constants } from "../Engines/constants";

import { RegisterClass } from "../Misc/typeStore";
import { serialize } from "../Misc/decorators";
import { SerializationHelper } from "../Misc/decorators.serialization";
import type { Nullable } from "../types";

import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { ThinTonemapPostProcessOptions, TonemappingOperator } from "./thinTonemapPostProcess";
import { ThinTonemapPostProcess } from "./thinTonemapPostProcess";
import type { Scene } from "../scene";

export type ToneMapPostProcessOptions = ThinTonemapPostProcessOptions & PostProcessOptions;

/**
 * Defines a post process to apply tone mapping
 */
export class TonemapPostProcess extends PostProcess {
    /**
     * Defines the required exposure adjustment
     */
    @serialize()
    public get exposureAdjustment() {
        return this._effectWrapper.exposureAdjustment;
    }

    public set exposureAdjustment(value: number) {
        this._effectWrapper.exposureAdjustment = value;
    }

    /**
     * Gets the operator used for tonemapping
     */
    @serialize()
    public get operator() {
        return this._effectWrapper.operator;
    }

    /**
     * Gets a string identifying the name of the class
     * @returns "TonemapPostProcess" string
     */
    public override getClassName(): string {
        return "TonemapPostProcess";
    }

    protected override _effectWrapper: ThinTonemapPostProcess;

    /**
     * Creates a new TonemapPostProcess
     * @param name defines the name of the postprocess
     * @param operator defines the operator to use
     * @param exposureAdjustment defines the required exposure adjustment
     * @param camera defines the camera to use (can be null)
     * @param samplingMode defines the required sampling mode (BABYLON.Texture.BILINEAR_SAMPLINGMODE by default)
     * @param engine defines the hosting engine (can be ignore if camera is set)
     * @param textureType defines the texture format to use (BABYLON.Engine.TEXTURETYPE_UNSIGNED_BYTE by default)
     * @param reusable If the post process can be reused on the same frame. (default: false)
     */
    constructor(
        name: string,
        operator: TonemappingOperator,
        exposureAdjustment: number,
        camera: Nullable<Camera> | ToneMapPostProcessOptions,
        samplingMode: number = Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
        engine?: AbstractEngine,
        textureType = Constants.TEXTURETYPE_UNSIGNED_BYTE,
        reusable?: boolean
    ) {
        const cameraIsCamera = camera === null || camera instanceof Camera;

        const localOptions = {
            operator,
            exposureAdjustment,
            uniforms: ThinTonemapPostProcess.Uniforms,
            camera: cameraIsCamera ? camera : undefined,
            samplingMode,
            engine,
            reusable,
            textureType,
        };

        if (!cameraIsCamera) {
            Object.assign(localOptions, camera);
        }

        super(name, ThinTonemapPostProcess.FragmentUrl, {
            effectWrapper: cameraIsCamera || !camera.effectWrapper ? new ThinTonemapPostProcess(name, engine, localOptions) : undefined,
            ...localOptions,
        });
    }

    /**
     * @internal
     */
    public static override _Parse(parsedPostProcess: any, targetCamera: Camera, scene: Scene, rootUrl: string): Nullable<TonemapPostProcess> {
        return SerializationHelper.Parse(
            () => {
                return new TonemapPostProcess(
                    parsedPostProcess.name,
                    parsedPostProcess.operator,
                    parsedPostProcess.exposureAdjustment,
                    targetCamera,
                    parsedPostProcess.renderTargetSamplingMode,
                    scene.getEngine(),
                    parsedPostProcess.textureType,
                    parsedPostProcess.reusable
                );
            },
            parsedPostProcess,
            scene,
            rootUrl
        );
    }
}

RegisterClass("BABYLON.TonemapPostProcess", TonemapPostProcess);
