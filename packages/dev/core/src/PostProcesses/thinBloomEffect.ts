// eslint-disable-next-line import/no-internal-modules
import type { Nullable, AbstractEngine } from "core/index";
import { ThinBloomMergePostProcess } from "./thinBloomMergePostProcess";
import { Vector2 } from "core/Maths/math.vector";
import { ThinBlurPostProcess } from "./thinBlurPostProcess";
import { ThinExtractHighlightsPostProcess } from "./thinExtractHighlightsPostProcess";

export class ThinBloomEffect {
    public downscale: ThinExtractHighlightsPostProcess;
    public blurX: ThinBlurPostProcess;
    public blurY: ThinBlurPostProcess;
    public merge: ThinBloomMergePostProcess;

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
     * Creates a new instance of @see ThinBloomEffect
     * @param name The name of the bloom render effect
     * @param engine The engine which the render effect will be applied. (default: current engine)
     * @param _scale The ratio of the blur texture to the input texture that should be used to compute the bloom.
     */
    constructor(
        name: string,
        engine: Nullable<AbstractEngine>,
        private _scale: number
    ) {
        this.downscale = new ThinExtractHighlightsPostProcess(name + "_downscale", engine);
        this.blurX = new ThinBlurPostProcess(name + "_blurX", engine, new Vector2(1, 0), 10);
        this.blurY = new ThinBlurPostProcess(name + "_blurY", engine, new Vector2(0, 1), 10);
        this.merge = new ThinBloomMergePostProcess(name + "_merge", engine);
    }

    public isReady() {
        return this.downscale.isReady() && this.blurX.isReady() && this.blurY.isReady() && this.merge.isReady();
    }
}
