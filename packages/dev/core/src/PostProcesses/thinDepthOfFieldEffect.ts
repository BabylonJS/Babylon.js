import type { Nullable } from "core/types";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import { ThinBlurPostProcess } from "./thinBlurPostProcess";
import { ThinCircleOfConfusionPostProcess } from "./thinCircleOfConfusionPostProcess";
import { ThinDepthOfFieldMergePostProcess } from "./thinDepthOfFieldMergePostProcess";
import { Vector2 } from "core/Maths/math.vector";

/**
 * Specifies the level of max blur that should be applied when using the depth of field effect
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
    public circleOfConfusion: ThinCircleOfConfusionPostProcess;
    public depthOfFieldBlurX: Array<[ThinBlurPostProcess, number]> = [];
    public depthOfFieldBlurY: Array<[ThinBlurPostProcess, number]> = [];
    public dofMerge: ThinDepthOfFieldMergePostProcess;

    /**
     * The focal the length of the camera used in the effect in scene units/1000 (eg. millimeter)
     */
    public set focalLength(value: number) {
        this.circleOfConfusion.focalLength = value;
    }
    public get focalLength() {
        return this.circleOfConfusion.focalLength;
    }
    /**
     * F-Stop of the effect's camera. The diameter of the resulting aperture can be computed by lensSize/fStop. (default: 1.4)
     */
    public set fStop(value: number) {
        this.circleOfConfusion.fStop = value;
    }
    public get fStop() {
        return this.circleOfConfusion.fStop;
    }
    /**
     * Distance away from the camera to focus on in scene units/1000 (eg. millimeter). (default: 2000)
     */
    public set focusDistance(value: number) {
        this.circleOfConfusion.focusDistance = value;
    }
    public get focusDistance() {
        return this.circleOfConfusion.focusDistance;
    }
    /**
     * Max lens size in scene units/1000 (eg. millimeter). Standard cameras are 50mm. (default: 50) The diameter of the resulting aperture can be computed by lensSize/fStop.
     */
    public set lensSize(value: number) {
        this.circleOfConfusion.lensSize = value;
    }
    public get lensSize() {
        return this.circleOfConfusion.lensSize;
    }

    public readonly blurLevel: ThinDepthOfFieldEffectBlurLevel;

    /**
     * Creates a new instance of @see ThinDepthOfFieldEffect
     * @param name The name of the depth of field render effect
     * @param engine The engine which the render effect will be applied. (default: current engine)
     * @param blurLevel The quality of the effect. (default: DepthOfFieldEffectBlurLevel.Low)
     * @param depthNotNormalized If the (view) depth used in circle of confusion post-process is normalized (0.0 to 1.0 from near to far) or not (0 to camera max distance) (default: false)
     */
    constructor(name: string, engine: Nullable<AbstractEngine>, blurLevel: ThinDepthOfFieldEffectBlurLevel = ThinDepthOfFieldEffectBlurLevel.Low, depthNotNormalized = false) {
        this.circleOfConfusion = new ThinCircleOfConfusionPostProcess(name, engine, { depthNotNormalized });
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
            this.depthOfFieldBlurY.push([new ThinBlurPostProcess(name, engine, new Vector2(0, 1), adjustedKernelSize), ratio]);
            ratio = 0.75 / Math.pow(2, i);
            this.depthOfFieldBlurX.push([new ThinBlurPostProcess(name, engine, new Vector2(1, 0), adjustedKernelSize), ratio]);
        }

        this.dofMerge = new ThinDepthOfFieldMergePostProcess(name, engine);
    }

    public isReady() {
        let isReady = this.circleOfConfusion.isReady() && this.dofMerge.isReady();
        for (let i = 0; i < this.depthOfFieldBlurX.length; i++) {
            isReady = isReady && this.depthOfFieldBlurX[i][0].isReady() && this.depthOfFieldBlurY[i][0].isReady();
        }
        return isReady;
    }
}
