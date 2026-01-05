import type { Nullable } from "../types";
import type { Camera } from "../Cameras/camera";
import type { Effect } from "../Materials/effect";
import { Texture } from "../Materials/Textures/texture";
import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import type { AbstractEngine } from "../Engines/abstractEngine";
import { Constants } from "../Engines/constants";

import { RegisterClass } from "../Misc/typeStore";
import { SerializationHelper } from "../Misc/decorators.serialization";
import { ThinFXAAPostProcess } from "./thinFXAAPostProcess";

import type { Scene } from "../scene";
/**
 * Fxaa post process
 * @see https://doc.babylonjs.com/features/featuresDeepDive/postProcesses/usePostProcesses#fxaa
 */
export class FxaaPostProcess extends PostProcess {
    /**
     * Gets a string identifying the name of the class
     * @returns "FxaaPostProcess" string
     */
    public override getClassName(): string {
        return "FxaaPostProcess";
    }

    protected override _effectWrapper: ThinFXAAPostProcess;

    constructor(
        name: string,
        options: number | PostProcessOptions,
        camera: Nullable<Camera> = null,
        samplingMode?: number,
        engine?: AbstractEngine,
        reusable?: boolean,
        textureType: number = Constants.TEXTURETYPE_UNSIGNED_BYTE
    ) {
        const localOptions = {
            uniforms: ThinFXAAPostProcess.Uniforms,
            size: typeof options === "number" ? options : undefined,
            camera,
            samplingMode: samplingMode || Texture.BILINEAR_SAMPLINGMODE,
            engine,
            reusable,
            textureType,
            ...(options as PostProcessOptions),
        };

        super(name, ThinFXAAPostProcess.FragmentUrl, {
            effectWrapper: typeof options === "number" || !options.effectWrapper ? new ThinFXAAPostProcess(name, engine, localOptions) : undefined,
            ...localOptions,
        });

        this.onApplyObservable.add((_effect: Effect) => {
            this._effectWrapper.texelSize = this.texelSize;
        });
    }

    /**
     * @internal
     */
    public static override _Parse(parsedPostProcess: any, targetCamera: Camera, scene: Scene, rootUrl: string) {
        return SerializationHelper.Parse(
            () => {
                return new FxaaPostProcess(
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

RegisterClass("BABYLON.FxaaPostProcess", FxaaPostProcess);
