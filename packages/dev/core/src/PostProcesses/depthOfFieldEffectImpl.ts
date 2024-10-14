import { BlurPostProcessImpl } from "./blurPostProcessImpl";
import { CircleOfConfusionPostProcessImpl } from "./circleOfConfusionPostProcessImpl";
import { DepthOfFieldMergePostProcessImpl } from "./depthOfFieldMergePostProcessImpl";

/**
 * @internal
 */
export class DepthOfFieldEffectImpl {
    public circleOfConfusion: CircleOfConfusionPostProcessImpl;
    public depthOfFieldBlurX: Array<BlurPostProcessImpl> = [];
    public depthOfFieldBlurY: Array<BlurPostProcessImpl> = [];
    public dofMerge: DepthOfFieldMergePostProcessImpl;

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

    /**
     * Creates a new instance of @see DepthOfFieldEffectImpl
     * @param blurCount The quality of the effect. (default: DepthOfFieldEffectBlurLevel.Low)
     */
    constructor(blurCount: number) {
        this.circleOfConfusion = new CircleOfConfusionPostProcessImpl();

        for (let i = 0; i < blurCount; i++) {
            this.depthOfFieldBlurX.push(new BlurPostProcessImpl());
            this.depthOfFieldBlurY.push(new BlurPostProcessImpl());
        }

        this.dofMerge = new DepthOfFieldMergePostProcessImpl();
    }

    public isReady() {
        let isReady = this.circleOfConfusion.isReady() && this.dofMerge.isReady();
        for (let i = 0; i < this.depthOfFieldBlurX.length; i++) {
            isReady = isReady && this.depthOfFieldBlurX[i].isReady() && this.depthOfFieldBlurY[i].isReady();
        }
        return isReady;
    }
}
