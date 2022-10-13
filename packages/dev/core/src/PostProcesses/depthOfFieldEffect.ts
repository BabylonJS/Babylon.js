import type { Nullable } from "../types";
import { Vector2 } from "../Maths/math.vector";
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

/**
 * Specifies the level of max blur that should be applied when using the depth of field effect
 */
export enum DepthOfFieldEffectBlurLevel {
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
        this._circleOfConfusion.focalLength = value;
    }
    public get focalLength() {
        return this._circleOfConfusion.focalLength;
    }
    /**
     * F-Stop of the effect's camera. The diameter of the resulting aperture can be computed by lensSize/fStop. (default: 1.4)
     */
    public set fStop(value: number) {
        this._circleOfConfusion.fStop = value;
    }
    public get fStop() {
        return this._circleOfConfusion.fStop;
    }
    /**
     * Distance away from the camera to focus on in scene units/1000 (eg. millimeter). (default: 2000)
     */
    public set focusDistance(value: number) {
        this._circleOfConfusion.focusDistance = value;
    }
    public get focusDistance() {
        return this._circleOfConfusion.focusDistance;
    }
    /**
     * Max lens size in scene units/1000 (eg. millimeter). Standard cameras are 50mm. (default: 50) The diameter of the resulting aperture can be computed by lensSize/fStop.
     */
    public set lensSize(value: number) {
        this._circleOfConfusion.lensSize = value;
    }
    public get lensSize() {
        return this._circleOfConfusion.lensSize;
    }

    /**
     * Creates a new instance DepthOfFieldEffect
     * @param scene The scene the effect belongs to.
     * @param depthTexture The depth texture of the scene to compute the circle of confusion.This must be set in order for this to function but may be set after initialization if needed.
     * @param blurLevel
     * @param pipelineTextureType The type of texture to be used when performing the post processing.
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     */
    constructor(
        scene: Scene,
        depthTexture: Nullable<RenderTargetTexture>,
        blurLevel: DepthOfFieldEffectBlurLevel = DepthOfFieldEffectBlurLevel.Low,
        pipelineTextureType = 0,
        blockCompilation = false
    ) {
        super(
            scene.getEngine(),
            "depth of field",
            () => {
                return this._effects;
            },
            true
        );

        // Use R-only formats if supported to store the circle of confusion values.
        // This should be more space and bandwidth efficient than using RGBA.
        const engine = scene.getEngine();
        const circleOfConfusionTextureFormat = engine.isWebGPU || engine.webGLVersion > 1 ? Constants.TEXTUREFORMAT_RED : Constants.TEXTUREFORMAT_RGBA;

        // Circle of confusion value for each pixel is used to determine how much to blur that pixel
        this._circleOfConfusion = new CircleOfConfusionPostProcess(
            "circleOfConfusion",
            depthTexture,
            1,
            null,
            Texture.BILINEAR_SAMPLINGMODE,
            engine,
            false,
            pipelineTextureType,
            blockCompilation
        );

        // Create a pyramid of blurred images (eg. fullSize 1/4 blur, half size 1/2 blur, quarter size 3/4 blur, eith size 4/4 blur)
        // Blur the image but do not blur on sharp far to near distance changes to avoid bleeding artifacts
        // See section 2.6.2 http://fileadmin.cs.lth.se/cs/education/edan35/lectures/12dof.pdf
        this._depthOfFieldBlurY = [];
        this._depthOfFieldBlurX = [];
        let blurCount = 1;
        let kernelSize = 15;
        switch (blurLevel) {
            case DepthOfFieldEffectBlurLevel.High: {
                blurCount = 3;
                kernelSize = 51;
                break;
            }
            case DepthOfFieldEffectBlurLevel.Medium: {
                blurCount = 2;
                kernelSize = 31;
                break;
            }
            default: {
                kernelSize = 15;
                blurCount = 1;
                break;
            }
        }
        const adjustedKernelSize = kernelSize / Math.pow(2, blurCount - 1);
        let ratio = 1.0;
        for (let i = 0; i < blurCount; i++) {
            const blurY = new DepthOfFieldBlurPostProcess(
                "vertical blur",
                scene,
                new Vector2(0, 1.0),
                adjustedKernelSize,
                ratio,
                null,
                this._circleOfConfusion,
                i == 0 ? this._circleOfConfusion : null,
                Texture.BILINEAR_SAMPLINGMODE,
                engine,
                false,
                pipelineTextureType,
                blockCompilation,
                i == 0 ? circleOfConfusionTextureFormat : Constants.TEXTUREFORMAT_RGBA
            );
            blurY.autoClear = false;
            ratio = 0.75 / Math.pow(2, i);
            const blurX = new DepthOfFieldBlurPostProcess(
                "horizontal blur",
                scene,
                new Vector2(1.0, 0),
                adjustedKernelSize,
                ratio,
                null,
                this._circleOfConfusion,
                null,
                Texture.BILINEAR_SAMPLINGMODE,
                engine,
                false,
                pipelineTextureType,
                blockCompilation
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
            ratio,
            null,
            Texture.BILINEAR_SAMPLINGMODE,
            engine,
            false,
            pipelineTextureType,
            blockCompilation
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
        for (let effectIndex = 0; effectIndex < this._effects.length; effectIndex++) {
            if (!this._effects[effectIndex].isReady()) {
                return false;
            }
        }
        return true;
    }
}
