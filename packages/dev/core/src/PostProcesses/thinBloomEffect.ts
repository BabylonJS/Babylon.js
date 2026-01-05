import type { Nullable, AbstractEngine } from "core/index";
import { ThinBloomMergePostProcess } from "./thinBloomMergePostProcess";
import { Vector2 } from "core/Maths/math.vector";
import { ThinBlurPostProcess } from "./thinBlurPostProcess";
import { ThinExtractHighlightsPostProcess } from "./thinExtractHighlightsPostProcess";

/**
 * The bloom effect spreads bright areas of an image to simulate artifacts seen in cameras
 */
export class ThinBloomEffect {
    /** @internal */
    public _downscale: ThinExtractHighlightsPostProcess;
    /** @internal */
    public _blurX: ThinBlurPostProcess;
    /** @internal */
    public _blurY: ThinBlurPostProcess;
    /** @internal */
    public _merge: ThinBloomMergePostProcess;

    /**
     * The luminance threshold to find bright areas of the image to bloom.
     */
    public get threshold(): number {
        return this._downscale.threshold;
    }
    public set threshold(value: number) {
        this._downscale.threshold = value;
    }

    /**
     * The strength of the bloom.
     */
    public get weight(): number {
        return this._merge.weight;
    }
    public set weight(value: number) {
        this._merge.weight = value;
    }

    /**
     * Specifies the size of the bloom blur kernel, relative to the final output size
     */
    public get kernel(): number {
        return this._blurX.kernel / this.scale;
    }
    public set kernel(value: number) {
        this._blurX.kernel = value * this.scale;
        this._blurY.kernel = value * this.scale;
    }

    /**
     * The ratio of the blur texture to the input texture that should be used to compute the bloom.
     */
    public readonly scale: number;

    /**
     * Creates a new instance of @see ThinBloomEffect
     * @param name The name of the bloom render effect
     * @param engine The engine which the render effect will be applied. (default: current engine)
     * @param scale The ratio of the blur texture to the input texture that should be used to compute the bloom.
     * @param blockCompilation If shaders should not be compiled when the effect is created (default: false)
     */
    constructor(name: string, engine: Nullable<AbstractEngine>, scale: number, blockCompilation = false) {
        this.scale = scale;
        this._downscale = new ThinExtractHighlightsPostProcess(name + "_downscale", engine, { blockCompilation });
        this._blurX = new ThinBlurPostProcess(name + "_blurX", engine, new Vector2(1, 0), 10, { blockCompilation });
        this._blurY = new ThinBlurPostProcess(name + "_blurY", engine, new Vector2(0, 1), 10, { blockCompilation });
        this._merge = new ThinBloomMergePostProcess(name + "_merge", engine, { blockCompilation });
    }

    /**
     * Checks if the effect is ready to be used
     * @returns if the effect is ready
     */
    public isReady() {
        return this._downscale.isReady() && this._blurX.isReady() && this._blurY.isReady() && this._merge.isReady();
    }
}
