import type { Nullable } from "../types";
import type { Camera } from "../Cameras/camera";
import { Texture } from "../Materials/Textures/texture";
import type { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import type { PostProcess } from "./postProcess";
import { PostProcessRenderEffect } from "../PostProcesses/RenderPipeline/postProcessRenderEffect";
import { CircleOfConfusionPostProcess } from "./circleOfConfusionPostProcess";
import { DepthOfFieldBlurPostProcess } from "./depthOfFieldBlurPostProcess";
import { DepthOfFieldMergePostProcess } from "./depthOfFieldMergePostProcess";
import type { Scene } from "../scene";
import { Constants } from "../Engines/constants";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { ThinDepthOfFieldEffectBlurLevel } from "./thinDepthOfFieldEffect";
import { ThinDepthOfFieldEffect } from "./thinDepthOfFieldEffect";

/**
 * Specifies the level of max blur that should be applied when using the depth of field effect
 */
export const enum DepthOfFieldEffectBlurLevel {
    /**
     * Subtle blur
     */
    Low,
    /**
     * Medium blur
     */
    Medium,
    /**
     * Large blur
     */
    High,
}

/**
 * The depth of field effect applies a blur to objects that are closer or further from where the camera is focusing.
 */
export class DepthOfFieldEffect extends PostProcessRenderEffect {
    private _circleOfConfusion: CircleOfConfusionPostProcess;
    /**
     * @internal Internal, blurs from high to low
     */
    public _depthOfFieldBlurX: Array<DepthOfFieldBlurPostProcess>;
    private _depthOfFieldBlurY: Array<DepthOfFieldBlurPostProcess>;
    private _dofMerge: Nullable<DepthOfFieldMergePostProcess>;

    /**
     * @internal Internal post processes in depth of field effect
     */
    public _effects: Array<PostProcess> = [];

    /**
     * The focal the length of the camera used in the effect in scene units/1000 (eg. millimeter)
     */
    public set focalLength(value: number) {
        this._thinDepthOfFieldEffect.focalLength = value;
    }
    public get focalLength() {
        return this._thinDepthOfFieldEffect.focalLength;
    }
    /**
     * F-Stop of the effect's camera. The diameter of the resulting aperture can be computed by lensSize/fStop. (default: 1.4)
     */
    public set fStop(value: number) {
        this._thinDepthOfFieldEffect.fStop = value;
    }
    public get fStop() {
        return this._thinDepthOfFieldEffect.fStop;
    }
    /**
     * Distance away from the camera to focus on in scene units/1000 (eg. millimeter). (default: 2000)
     */
    public set focusDistance(value: number) {
        this._thinDepthOfFieldEffect.focusDistance = value;
    }
    public get focusDistance() {
        return this._thinDepthOfFieldEffect.focusDistance;
    }
    /**
     * Max lens size in scene units/1000 (eg. millimeter). Standard cameras are 50mm. (default: 50) The diameter of the resulting aperture can be computed by lensSize/fStop.
     */
    public set lensSize(value: number) {
        this._thinDepthOfFieldEffect.lensSize = value;
    }
    public get lensSize() {
        return this._thinDepthOfFieldEffect.lensSize;
    }

    private _thinDepthOfFieldEffect: ThinDepthOfFieldEffect;

    /**
     * Creates a new instance DepthOfFieldEffect
     * @param sceneOrEngine The scene or engine the effect belongs to.
     * @param depthTexture The depth texture of the scene to compute the circle of confusion.This must be set in order for this to function but may be set after initialization if needed.
     * @param blurLevel
     * @param pipelineTextureType The type of texture to be used when performing the post processing.
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     * @param depthNotNormalized If the depth from the depth texture is already normalized or if the normalization should be done at runtime in the shader (default: false)
     */
    constructor(
        sceneOrEngine: Scene | AbstractEngine,
        depthTexture: Nullable<RenderTargetTexture>,
        blurLevel: DepthOfFieldEffectBlurLevel = DepthOfFieldEffectBlurLevel.Low,
        pipelineTextureType = 0,
        blockCompilation = false,
        depthNotNormalized = false
    ) {
        const engine = (sceneOrEngine as Scene)._renderForCamera ? (sceneOrEngine as Scene).getEngine() : (sceneOrEngine as AbstractEngine);
        super(
            engine,
            "depth of field",
            () => {
                return this._effects;
            },
            true
        );

        this._thinDepthOfFieldEffect = new ThinDepthOfFieldEffect("Depth of Field", engine, blurLevel as unknown as ThinDepthOfFieldEffectBlurLevel, false, blockCompilation);

        // Use R-only formats if supported to store the circle of confusion values.
        // This should be more space and bandwidth efficient than using RGBA.
        const circleOfConfusionTextureFormat = engine.isWebGPU || engine.version > 1 ? Constants.TEXTUREFORMAT_RED : Constants.TEXTUREFORMAT_RGBA;

        // Circle of confusion value for each pixel is used to determine how much to blur that pixel
        this._circleOfConfusion = new CircleOfConfusionPostProcess(
            "circleOfConfusion",
            depthTexture,
            {
                size: 1,
                samplingMode: Texture.BILINEAR_SAMPLINGMODE,
                engine,
                textureType: pipelineTextureType,
                blockCompilation,
                depthNotNormalized,
                effectWrapper: this._thinDepthOfFieldEffect._circleOfConfusion,
            },
            null
        );

        // Create a pyramid of blurred images (eg. fullSize 1/4 blur, half size 1/2 blur, quarter size 3/4 blur, eith size 4/4 blur)
        // Blur the image but do not blur on sharp far to near distance changes to avoid bleeding artifacts
        // See section 2.6.2 http://fileadmin.cs.lth.se/cs/education/edan35/lectures/12dof.pdf
        this._depthOfFieldBlurY = [];
        this._depthOfFieldBlurX = [];

        const blurCount = this._thinDepthOfFieldEffect._depthOfFieldBlurX.length;

        for (let i = 0; i < blurCount; i++) {
            const [thinBlurY, ratioY] = this._thinDepthOfFieldEffect._depthOfFieldBlurY[i];
            const blurY = new DepthOfFieldBlurPostProcess(
                "vertical blur",
                null,
                thinBlurY.direction,
                thinBlurY.kernel,
                {
                    size: ratioY,
                    samplingMode: Texture.BILINEAR_SAMPLINGMODE,
                    engine,
                    textureType: pipelineTextureType,
                    blockCompilation,
                    textureFormat: i == 0 ? circleOfConfusionTextureFormat : Constants.TEXTUREFORMAT_RGBA,
                    effectWrapper: thinBlurY,
                },
                null,
                this._circleOfConfusion,
                i == 0 ? this._circleOfConfusion : null
            );
            blurY.autoClear = false;

            const [thinBlurX, ratioX] = this._thinDepthOfFieldEffect._depthOfFieldBlurX[i];
            const blurX = new DepthOfFieldBlurPostProcess(
                "horizontal blur",
                null,
                thinBlurX.direction,
                thinBlurX.kernel,
                {
                    size: ratioX,
                    samplingMode: Texture.BILINEAR_SAMPLINGMODE,
                    engine,
                    textureType: pipelineTextureType,
                    blockCompilation,
                    effectWrapper: thinBlurX,
                },
                null,
                this._circleOfConfusion,
                null
            );
            blurX.autoClear = false;
            this._depthOfFieldBlurY.push(blurY);
            this._depthOfFieldBlurX.push(blurX);
        }

        // Set all post processes on the effect.
        this._effects = [this._circleOfConfusion];
        for (let i = 0; i < this._depthOfFieldBlurX.length; i++) {
            this._effects.push(this._depthOfFieldBlurY[i]);
            this._effects.push(this._depthOfFieldBlurX[i]);
        }

        // Merge blurred images with original image based on circleOfConfusion
        this._dofMerge = new DepthOfFieldMergePostProcess(
            "dofMerge",
            this._circleOfConfusion,
            this._circleOfConfusion,
            this._depthOfFieldBlurX,
            {
                size: this._thinDepthOfFieldEffect._depthOfFieldBlurX[blurCount - 1][1],
                samplingMode: Texture.BILINEAR_SAMPLINGMODE,
                engine,
                textureType: pipelineTextureType,
                blockCompilation,
                effectWrapper: this._thinDepthOfFieldEffect._dofMerge,
            },
            null
        );
        this._dofMerge.autoClear = false;
        this._effects.push(this._dofMerge);
    }

    /**
     * Get the current class name of the current effect
     * @returns "DepthOfFieldEffect"
     */
    public getClassName(): string {
        return "DepthOfFieldEffect";
    }

    /**
     * Depth texture to be used to compute the circle of confusion. This must be set here or in the constructor in order for the post process to function.
     */
    public set depthTexture(value: RenderTargetTexture) {
        this._circleOfConfusion.depthTexture = value;
    }

    /**
     * Disposes each of the internal effects for a given camera.
     * @param camera The camera to dispose the effect on.
     */
    public disposeEffects(camera: Camera) {
        for (let effectIndex = 0; effectIndex < this._effects.length; effectIndex++) {
            this._effects[effectIndex].dispose(camera);
        }
    }

    /**
     * @internal Internal
     */
    public _updateEffects() {
        for (let effectIndex = 0; effectIndex < this._effects.length; effectIndex++) {
            this._effects[effectIndex].updateEffect();
        }
    }

    /**
     * Internal
     * @returns if all the contained post processes are ready.
     * @internal
     */
    public _isReady() {
        return this._thinDepthOfFieldEffect.isReady();
    }
}
