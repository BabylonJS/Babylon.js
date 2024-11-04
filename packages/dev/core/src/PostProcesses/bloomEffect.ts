import { PostProcessRenderEffect } from "../PostProcesses/RenderPipeline/postProcessRenderEffect";
import type { PostProcess } from "./postProcess";
import { ExtractHighlightsPostProcess } from "./extractHighlightsPostProcess";
import { BlurPostProcess } from "./blurPostProcess";
import { BloomMergePostProcess } from "./bloomMergePostProcess";
import type { Camera } from "../Cameras/camera";
import { Texture } from "../Materials/Textures/texture";
import type { Scene } from "../scene";
import type { AbstractEngine } from "../Engines/abstractEngine";
import { ThinBloomEffect } from "./thinBloomEffect";

/**
 * The bloom effect spreads bright areas of an image to simulate artifacts seen in cameras
 */
export class BloomEffect extends PostProcessRenderEffect {
    /**
     * @internal Internal
     */
    public _effects: Array<PostProcess> = [];

    /**
     * @internal Internal
     */
    public _downscale: ExtractHighlightsPostProcess;
    private _blurX: BlurPostProcess;
    private _blurY: BlurPostProcess;
    private _merge: BloomMergePostProcess;

    /**
     * The luminance threshold to find bright areas of the image to bloom.
     */
    public get threshold(): number {
        return this._thinBloomEffect.threshold;
    }
    public set threshold(value: number) {
        this._thinBloomEffect.threshold = value;
    }

    /**
     * The strength of the bloom.
     */
    public get weight(): number {
        return this._thinBloomEffect.weight;
    }
    public set weight(value: number) {
        this._thinBloomEffect.weight = value;
    }

    /**
     * Specifies the size of the bloom blur kernel, relative to the final output size
     */
    public get kernel(): number {
        return this._thinBloomEffect.kernel;
    }
    public set kernel(value: number) {
        this._thinBloomEffect.kernel = value;
    }

    public get bloomScale() {
        return this._thinBloomEffect.scale;
    }

    private _thinBloomEffect: ThinBloomEffect;

    /**
     * Creates a new instance of @see BloomEffect
     * @param sceneOrEngine The scene or engine the effect belongs to.
     * @param bloomScale The ratio of the blur texture to the input texture that should be used to compute the bloom.
     * @param bloomWeight The strength of bloom.
     * @param bloomKernel The size of the kernel to be used when applying the blur.
     * @param pipelineTextureType The type of texture to be used when performing the post processing.
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     */
    constructor(sceneOrEngine: Scene | AbstractEngine, bloomScale: number, bloomWeight: number, bloomKernel: number, pipelineTextureType = 0, blockCompilation = false) {
        const engine = (sceneOrEngine as Scene)._renderForCamera ? (sceneOrEngine as Scene).getEngine() : (sceneOrEngine as AbstractEngine);
        super(
            engine,
            "bloom",
            () => {
                return this._effects;
            },
            true
        );

        this._thinBloomEffect = new ThinBloomEffect("bloom", engine, bloomScale, blockCompilation);

        this._downscale = new ExtractHighlightsPostProcess("highlights", {
            size: 1.0,
            samplingMode: Texture.BILINEAR_SAMPLINGMODE,
            engine,
            textureType: pipelineTextureType,
            blockCompilation,
            effectWrapper: this._thinBloomEffect._downscale,
        });

        this._blurX = new BlurPostProcess("horizontal blur", this._thinBloomEffect._blurX.direction, this._thinBloomEffect._blurX.kernel, {
            size: bloomScale,
            samplingMode: Texture.BILINEAR_SAMPLINGMODE,
            engine,
            textureType: pipelineTextureType,
            blockCompilation,
            effectWrapper: this._thinBloomEffect._blurX,
        });
        this._blurX.alwaysForcePOT = true;
        this._blurX.autoClear = false;

        this._blurY = new BlurPostProcess("vertical blur", this._thinBloomEffect._blurY.direction, this._thinBloomEffect._blurY.kernel, {
            size: bloomScale,
            samplingMode: Texture.BILINEAR_SAMPLINGMODE,
            engine,
            textureType: pipelineTextureType,
            blockCompilation,
            effectWrapper: this._thinBloomEffect._blurY,
        });
        this._blurY.alwaysForcePOT = true;
        this._blurY.autoClear = false;

        this.kernel = bloomKernel;

        this._effects = [this._downscale, this._blurX, this._blurY];

        this._merge = new BloomMergePostProcess("bloomMerge", this._downscale, this._blurY, bloomWeight, {
            size: bloomScale,
            samplingMode: Texture.BILINEAR_SAMPLINGMODE,
            engine,
            textureType: pipelineTextureType,
            blockCompilation,
            effectWrapper: this._thinBloomEffect._merge,
        });
        this._merge.autoClear = false;
        this._effects.push(this._merge);
    }

    /**
     * Disposes each of the internal effects for a given camera.
     * @param camera The camera to dispose the effect on.
     */
    public disposeEffects(camera?: Camera) {
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
        return this._thinBloomEffect.isReady();
    }
}
