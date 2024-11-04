import type { Nullable } from "../types";
import type { PostProcessOptions } from "./postProcess";
import { PostProcess } from "./postProcess";
import type { Effect } from "../Materials/effect";
import type { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import type { Camera } from "../Cameras/camera";
import { Logger } from "../Misc/logger";
import { Constants } from "../Engines/constants";

import { RegisterClass } from "../Misc/typeStore";
import { serialize } from "../Misc/decorators";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { ThinCircleOfConfusionPostProcessOptions } from "./thinCircleOfConfusionPostProcess";
import { ThinCircleOfConfusionPostProcess } from "./thinCircleOfConfusionPostProcess";

export type CircleOfConfusionPostProcessOptions = ThinCircleOfConfusionPostProcessOptions & PostProcessOptions;

/**
 * The CircleOfConfusionPostProcess computes the circle of confusion value for each pixel given required lens parameters. See https://en.wikipedia.org/wiki/Circle_of_confusion
 */
export class CircleOfConfusionPostProcess extends PostProcess {
    /**
     * Max lens size in scene units/1000 (eg. millimeter). Standard cameras are 50mm. (default: 50) The diameter of the resulting aperture can be computed by lensSize/fStop.
     */
    @serialize()
    public get lensSize() {
        return this._effectWrapper.lensSize;
    }

    public set lensSize(value: number) {
        this._effectWrapper.lensSize = value;
    }

    /**
     * F-Stop of the effect's camera. The diameter of the resulting aperture can be computed by lensSize/fStop. (default: 1.4)
     */
    @serialize()
    public get fStop() {
        return this._effectWrapper.fStop;
    }

    public set fStop(value: number) {
        this._effectWrapper.fStop = value;
    }

    /**
     * Distance away from the camera to focus on in scene units/1000 (eg. millimeter). (default: 2000)
     */
    @serialize()
    public get focusDistance() {
        return this._effectWrapper.focusDistance;
    }

    public set focusDistance(value: number) {
        this._effectWrapper.focusDistance = value;
    }

    /**
     * Focal length of the effect's camera in scene units/1000 (eg. millimeter). (default: 50)
     */
    @serialize()
    public get focalLength() {
        return this._effectWrapper.focalLength;
    }

    public set focalLength(value: number) {
        this._effectWrapper.focalLength = value;
    }

    /**
     * Gets a string identifying the name of the class
     * @returns "CircleOfConfusionPostProcess" string
     */
    public override getClassName(): string {
        return "CircleOfConfusionPostProcess";
    }

    protected override _effectWrapper: ThinCircleOfConfusionPostProcess;
    private _depthTexture: Nullable<RenderTargetTexture> = null;

    /**
     * Creates a new instance CircleOfConfusionPostProcess
     * @param name The name of the effect.
     * @param depthTexture The depth texture of the scene to compute the circle of confusion. This must be set in order for this to function but may be set after initialization if needed.
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
        depthTexture: Nullable<RenderTargetTexture>,
        options: number | CircleOfConfusionPostProcessOptions,
        camera: Nullable<Camera>,
        samplingMode?: number,
        engine?: AbstractEngine,
        reusable?: boolean,
        textureType = Constants.TEXTURETYPE_UNSIGNED_INT,
        blockCompilation = false
    ) {
        const localOptions = {
            uniforms: ThinCircleOfConfusionPostProcess.Uniforms,
            samplers: ThinCircleOfConfusionPostProcess.Samplers,
            defines: typeof options === "object" && options.depthNotNormalized ? ThinCircleOfConfusionPostProcess.DefinesDepthNotNormalized : undefined,
            size: typeof options === "number" ? options : undefined,
            camera,
            samplingMode,
            engine,
            reusable,
            textureType,
            blockCompilation,
            ...(options as PostProcessOptions),
        };

        super(name, ThinCircleOfConfusionPostProcess.FragmentUrl, {
            effectWrapper: typeof options === "number" || !options.effectWrapper ? new ThinCircleOfConfusionPostProcess(name, engine, localOptions) : undefined,
            ...localOptions,
        });

        this._depthTexture = depthTexture;
        this.onApplyObservable.add((effect: Effect) => {
            if (!this._depthTexture) {
                Logger.Warn("No depth texture set on CircleOfConfusionPostProcess");
                return;
            }

            effect.setTexture("depthSampler", this._depthTexture);

            this._effectWrapper.camera = this._depthTexture.activeCamera!;
        });
    }

    /**
     * Depth texture to be used to compute the circle of confusion. This must be set here or in the constructor in order for the post process to function.
     */
    public set depthTexture(value: RenderTargetTexture) {
        this._depthTexture = value;
    }
}

RegisterClass("BABYLON.CircleOfConfusionPostProcess", CircleOfConfusionPostProcess);
