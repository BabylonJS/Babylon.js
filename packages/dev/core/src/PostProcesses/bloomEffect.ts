import { PostProcessRenderEffect } from "../PostProcesses/RenderPipeline/postProcessRenderEffect";
import type { PostProcess } from "./postProcess";
import { ExtractHighlightsPostProcess } from "./extractHighlightsPostProcess";
import { BlurPostProcess } from "./blurPostProcess";
import { BloomMergePostProcess } from "./bloomMergePostProcess";
import { Vector2 } from "../Maths/math.vector";
import type { Camera } from "../Cameras/camera";
import { Texture } from "../Materials/Textures/texture";
import type { Scene } from "../scene";
import type { AbstractEngine } from "../Engines/abstractEngine";
import type { IFrameGraphSupport } from "../FrameGraph/IFrameGraphSupport";
import type { FrameGraphBuilder } from "../FrameGraph/frameGraphBuilder";
import type { Observer } from "../Misc/observable";
import type { Effect } from "../Materials/effect";
import type { InternalTexture } from "../Materials/Textures/internalTexture";
import type { Nullable } from "../types";
import type { RenderTargetWrapper } from "../Engines/renderTargetWrapper";

/**
 * Interface for the bloom effect build data
 */
export interface IBloomEffectFrameGraphBuildData {
    /**
     * The source texture for the bloom effect
     */
    sourceTexture: InternalTexture;
}

/**
 * The bloom effect spreads bright areas of an image to simulate artifacts seen in cameras
 */
export class BloomEffect extends PostProcessRenderEffect implements IFrameGraphSupport {
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

    private _pipelineTextureType: number;
    private _downscaleObserver: Nullable<Observer<Effect>> = null;
    private _blurXObserver: Nullable<Observer<Effect>> = null;
    private _blurYObserver: Nullable<Observer<Effect>> = null;
    private _mergeObserver: Nullable<Observer<Effect>> = null;
    private _downscaleOutput: RenderTargetWrapper;
    private _blurXOutput: RenderTargetWrapper;
    private _blurYOutput: RenderTargetWrapper;

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
        return this._blurX.kernel / this._bloomScale;
    }
    public set kernel(value: number) {
        this._blurX.kernel = value * this._bloomScale;
        this._blurY.kernel = value * this._bloomScale;
    }

    /**
     * Creates a new instance of @see BloomEffect
     * @param sceneOrEngine The scene or engine the effect belongs to.
     * @param _bloomScale The ratio of the blur texture to the input texture that should be used to compute the bloom.
     * @param bloomWeight The strength of bloom.
     * @param bloomKernel The size of the kernel to be used when applying the blur.
     * @param pipelineTextureType The type of texture to be used when performing the post processing.
     * @param blockCompilation If compilation of the shader should not be done in the constructor. The updateEffect method can be used to compile the shader at a later time. (default: false)
     */
    constructor(
        sceneOrEngine: Scene | AbstractEngine,
        private _bloomScale: number,
        bloomWeight: number,
        bloomKernel: number,
        pipelineTextureType = 0,
        blockCompilation = false
    ) {
        const engine = (sceneOrEngine as Scene)._renderForCamera ? (sceneOrEngine as Scene).getEngine() : (sceneOrEngine as AbstractEngine);
        super(
            engine,
            "bloom",
            () => {
                return this._effects;
            },
            true
        );

        this._pipelineTextureType = pipelineTextureType;

        this._downscale = new ExtractHighlightsPostProcess("highlights", 1.0, null, Texture.BILINEAR_SAMPLINGMODE, engine, false, pipelineTextureType, blockCompilation);

        this._blurX = new BlurPostProcess(
            "horizontal blur",
            new Vector2(1.0, 0),
            10.0,
            _bloomScale,
            null,
            Texture.BILINEAR_SAMPLINGMODE,
            engine,
            false,
            pipelineTextureType,
            undefined,
            blockCompilation
        );
        this._blurX.alwaysForcePOT = true;
        this._blurX.autoClear = false;

        this._blurY = new BlurPostProcess(
            "vertical blur",
            new Vector2(0, 1.0),
            10.0,
            _bloomScale,
            null,
            Texture.BILINEAR_SAMPLINGMODE,
            engine,
            false,
            pipelineTextureType,
            undefined,
            blockCompilation
        );
        this._blurY.alwaysForcePOT = true;
        this._blurY.autoClear = false;

        this.kernel = bloomKernel;

        this._effects = [this._downscale, this._blurX, this._blurY];

        this._merge = new BloomMergePostProcess(
            "bloomMerge",
            this._downscale,
            this._blurY,
            bloomWeight,
            _bloomScale,
            null,
            Texture.BILINEAR_SAMPLINGMODE,
            engine,
            false,
            pipelineTextureType,
            blockCompilation
        );
        this._merge.autoClear = false;
        this._effects.push(this._merge);
    }

    public frameGraphBuild(builder: FrameGraphBuilder, buildData: IBloomEffectFrameGraphBuildData) {
        const sourceTexture = buildData.sourceTexture;

        this._downscale.onApplyObservable.remove(this._downscaleObserver);
        this._downscaleObserver = this._downscale.onApplyObservable.add((effect) => {
            effect._bindTexture("textureSampler", sourceTexture);
        });

        const textureSize = { width: Math.floor(sourceTexture.width * this._bloomScale), height: Math.floor(sourceTexture.height * this._bloomScale) };

        this._downscale.width = textureSize.width;
        this._downscale.height = textureSize.height;
        this._blurX.width = textureSize.width;
        this._blurX.height = textureSize.height;
        this._blurY.width = textureSize.width;
        this._blurY.height = textureSize.height;

        const textureCreationOptions = {
            createMipMaps: false,
            generateMipMaps: false,
            type: this._pipelineTextureType,
            samplingMode: Texture.BILINEAR_SAMPLINGMODE,
            format: sourceTexture.format,
            samples: 1,
            useSRGBBuffer: false,
            label: "Bloom Downscale",
        };
        this._downscaleOutput = builder.createRenderTargetTexture(textureCreationOptions.label, textureSize, textureCreationOptions);

        textureCreationOptions.label = "Bloom Blur X";
        this._blurXOutput = builder.createRenderTargetTexture(textureCreationOptions.label, textureSize, textureCreationOptions);

        this._blurX.onApplyObservable.remove(this._blurXObserver);
        this._blurXObserver = this._blurX.onApplyObservable.add((effect) => {
            effect._bindTexture("textureSampler", this._downscaleOutput.texture);
        });

        textureCreationOptions.label = "Bloom Blur Y";
        this._blurYOutput = builder.createRenderTargetTexture(textureCreationOptions.label, textureSize, textureCreationOptions);

        this._blurY.onApplyObservable.remove(this._blurYObserver);
        this._blurYObserver = this._blurY.onApplyObservable.add((effect) => {
            effect._bindTexture("textureSampler", this._blurXOutput.texture);
        });

        this._merge.onApplyObservable.remove(this._mergeObserver);
        this._mergeObserver = this._merge.onApplyObservable.add((effect) => {
            effect._bindTexture("textureSampler", sourceTexture);
            effect._bindTexture("bloomBlur", this._blurYOutput.texture);
        });
    }

    public frameGraphRender(builder: FrameGraphBuilder) {
        const finalRenderTarget = builder.currentRenderTarget;

        builder.bindRenderTarget(this._downscaleOutput);
        this._downscale.frameGraphRender(builder);

        builder.bindRenderTarget(this._blurXOutput);
        this._blurX.frameGraphRender(builder);

        builder.bindRenderTarget(this._blurYOutput);
        this._blurY.frameGraphRender(builder);

        builder.bindRenderTarget(finalRenderTarget);
        this._merge.frameGraphRender(builder);
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
        for (let effectIndex = 0; effectIndex < this._effects.length; effectIndex++) {
            if (!this._effects[effectIndex].isReady()) {
                return false;
            }
        }
        return true;
    }
}
