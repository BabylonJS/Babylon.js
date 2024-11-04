import type { Nullable } from "core/types";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import { ThinBlurPostProcess } from "./thinBlurPostProcess";
import { ThinCircleOfConfusionPostProcess } from "./thinCircleOfConfusionPostProcess";
import { ThinDepthOfFieldMergePostProcess } from "./thinDepthOfFieldMergePostProcess";
import { Vector2 } from "core/Maths/math.vector";

/**
 * Specifies the level of blur that should be applied when using the depth of field effect
 */
export const enum ThinDepthOfFieldEffectBlurLevel {
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

export class ThinDepthOfFieldEffect {
    /** @internal */
    public _circleOfConfusion: ThinCircleOfConfusionPostProcess;
    /** @internal */
    public _depthOfFieldBlurX: Array<[ThinBlurPostProcess, number]> = [];
    /** @internal */
    public _depthOfFieldBlurY: Array<[ThinBlurPostProcess, number]> = [];
    /** @internal */
    public _dofMerge: ThinDepthOfFieldMergePostProcess;

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
     * The quality of the effect.
     */
    public readonly blurLevel: ThinDepthOfFieldEffectBlurLevel;

    /**
     * Creates a new instance of @see ThinDepthOfFieldEffect
     * @param name The name of the depth of field render effect
     * @param engine The engine which the render effect will be applied. (default: current engine)
     * @param blurLevel The quality of the effect. (default: DepthOfFieldEffectBlurLevel.Low)
     * @param depthNotNormalized If the (view) depth used in circle of confusion post-process is normalized (0.0 to 1.0 from near to far) or not (0 to camera max distance) (default: false)
     * @param blockCompilation If shaders should not be compiled when the effect is created (default: false)
     */
    constructor(
        name: string,
        engine: Nullable<AbstractEngine>,
        blurLevel: ThinDepthOfFieldEffectBlurLevel = ThinDepthOfFieldEffectBlurLevel.Low,
        depthNotNormalized = false,
        blockCompilation = false
    ) {
        this._circleOfConfusion = new ThinCircleOfConfusionPostProcess(name, engine, { depthNotNormalized, blockCompilation });
        this.blurLevel = blurLevel;

        let blurCount = 1;
        let kernelSize = 15;
        switch (blurLevel) {
            case ThinDepthOfFieldEffectBlurLevel.High: {
                blurCount = 3;
                kernelSize = 51;
                break;
            }
            case ThinDepthOfFieldEffectBlurLevel.Medium: {
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
            this._depthOfFieldBlurY.push([new ThinBlurPostProcess(name, engine, new Vector2(0, 1), adjustedKernelSize, { blockCompilation }), ratio]);
            ratio = 0.75 / Math.pow(2, i);
            this._depthOfFieldBlurX.push([new ThinBlurPostProcess(name, engine, new Vector2(1, 0), adjustedKernelSize, { blockCompilation }), ratio]);
        }

        this._dofMerge = new ThinDepthOfFieldMergePostProcess(name, engine, { blockCompilation });
    }

    /**
     * Checks if the effect is ready to be used
     * @returns if the effect is ready
     */
    public isReady() {
        let isReady = this._circleOfConfusion.isReady() && this._dofMerge.isReady();
        for (let i = 0; i < this._depthOfFieldBlurX.length; i++) {
            isReady = isReady && this._depthOfFieldBlurX[i][0].isReady() && this._depthOfFieldBlurY[i][0].isReady();
        }
        return isReady;
    }
}
