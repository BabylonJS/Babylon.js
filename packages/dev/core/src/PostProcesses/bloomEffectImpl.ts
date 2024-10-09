import { BloomMergePostProcessImpl } from "./bloomMergePostProcessImpl";
import { BlurPostProcessImpl } from "./blurPostProcessImpl";
import { ExtractHighlightsPostProcessImpl } from "./extractHighlightsPostProcessImpl";

/**
 * @internal
 */
export class BloomEffectImpl {
    public downscale: ExtractHighlightsPostProcessImpl;
    public blurX: BlurPostProcessImpl;
    public blurY: BlurPostProcessImpl;
    public merge: BloomMergePostProcessImpl;

    /**
     * The luminance threshold to find bright areas of the image to bloom.
     */
    public get threshold(): number {
        return this.downscale.threshold;
    }
    public set threshold(value: number) {
        this.downscale.threshold = value;
    }

    /**
     * The strength of the bloom.
     */
    public get weight(): number {
        return this.merge.weight;
    }
    public set weight(value: number) {
        this.merge.weight = value;
    }

    /**
     * Specifies the size of the bloom blur kernel, relative to the final output size
     */
    public get kernel(): number {
        return this.blurX.kernel / this._scale;
    }
    public set kernel(value: number) {
        this.blurX.kernel = value * this._scale;
        this.blurY.kernel = value * this._scale;
    }

    public get bloomScale() {
        return this._scale;
    }

    /**
     * Creates a new instance of @see BloomEffectImpl
     * @param _scale The ratio of the blur texture to the input texture that should be used to compute the bloom.
     */
    constructor(private _scale: number) {
        this.downscale = new ExtractHighlightsPostProcessImpl();
        this.blurX = new BlurPostProcessImpl();
        this.blurY = new BlurPostProcessImpl();
        this.merge = new BloomMergePostProcessImpl();
    }

    public isReady() {
        return this.downscale.isReady() && this.blurX.isReady() && this.blurY.isReady() && this.merge.isReady();
    }
}
