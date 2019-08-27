import { PostProcessRenderEffect } from "../PostProcesses/RenderPipeline/postProcessRenderEffect";
import { PostProcess } from "./postProcess";
import { ExtractHighlightsPostProcess } from "./extractHighlightsPostProcess";
import { BlurPostProcess } from "./blurPostProcess";
import { BloomMergePostProcess } from "./bloomMergePostProcess";
import { Vector2 } from "../Maths/math.vector";
import { Camera } from "../Cameras/camera";
import { Texture } from "../Materials/Textures/texture";
import { Scene } from "../scene";

/**
 * The bloom effect spreads bright areas of an image to simulate artifacts seen in cameras
 */
export class BloomEffect extends PostProcessRenderEffect {
    /**
     * @hidden Internal
     */
    public _effects: Array<PostProcess> = [];

    /**
     * @hidden Internal
     */
    public _downscale: ExtractHighlightsPostProcess;
    private _blurX: BlurPostProcess;
    private _blurY: BlurPostProcess;
    private _merge: BloomMergePostProcess;

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
        return this._blurX.kernel / this.bloomScale;
    }
    public set kernel(value: number) {
        this._blurX.kernel = value * this.bloomScale;
        this._blurY.kernel = value * this.bloomScale;
    }

    /**
     * Creates a new instance of @see BloomEffect
     * @param scene The scene the effect belongs to.
     * @param bloomScale The ratio of the blur texture to the input texture that should be used to compute the bloom.
     * @param bloomKernel The size of the kernel to be used when applying the blur.
     * @param bloomWeight The the strength of bloom.
     * @param pipelineTextureType The type of texture to be used when performing the post processing.
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     */
    constructor(scene: Scene, private bloomScale: number, bloomWeight: number, bloomKernel: number, pipelineTextureType = 0, blockCompilation = false) {
        super(scene.getEngine(), "bloom", () => {
            return this._effects;
        }, true);
        this._downscale = new ExtractHighlightsPostProcess("highlights", 1.0, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, pipelineTextureType, blockCompilation);

        this._blurX = new BlurPostProcess("horizontal blur", new Vector2(1.0, 0), 10.0, bloomScale, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, pipelineTextureType, undefined, blockCompilation);
        this._blurX.alwaysForcePOT = true;
        this._blurX.autoClear = false;

        this._blurY = new BlurPostProcess("vertical blur", new Vector2(0, 1.0), 10.0, bloomScale, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, pipelineTextureType, undefined, blockCompilation);
        this._blurY.alwaysForcePOT = true;
        this._blurY.autoClear = false;

        this.kernel = bloomKernel;

        this._effects = [this._downscale, this._blurX, this._blurY];

        this._merge = new BloomMergePostProcess("bloomMerge", this._downscale, this._blurY, bloomWeight, bloomScale, null, Texture.BILINEAR_SAMPLINGMODE, scene.getEngine(), false, pipelineTextureType, blockCompilation);
        this._merge.autoClear = false;
        this._effects.push(this._merge);
    }

    /**
     * Disposes each of the internal effects for a given camera.
     * @param camera The camera to dispose the effect on.
     */
    public disposeEffects(camera: Camera) {
        for (var effectIndex = 0; effectIndex < this._effects.length; effectIndex++) {
            this._effects[effectIndex].dispose(camera);
        }
    }

    /**
     * @hidden Internal
     */
    public _updateEffects() {
        for (var effectIndex = 0; effectIndex < this._effects.length; effectIndex++) {
            this._effects[effectIndex].updateEffect();
        }
    }

    /**
     * Internal
     * @returns if all the contained post processes are ready.
     * @hidden
     */
    public _isReady() {
        for (var effectIndex = 0; effectIndex < this._effects.length; effectIndex++) {
            if (!this._effects[effectIndex].isReady()) {
                return false;
            }
        }
        return true;
    }
}
