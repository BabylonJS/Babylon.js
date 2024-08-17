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
import type { FrameGraphTaskTexture, IFrameGraphTask } from "../FrameGraph/Tasks/IFrameGraphTask";
import type { FrameGraph } from "../FrameGraph/frameGraph";
import type { TextureHandle } from "../FrameGraph/frameGraphTextureManager";
import { Constants } from "../Engines/constants";

/**
 * Interface for the bloom effect build data
 */
export type FrameGraphBloomEffectParameters = {
    /**
     * The source texture for the bloom effect
     */
    sourceTexture?: FrameGraphTaskTexture | TextureHandle;
    sourceSamplingMode?: number;
    outputTexture?: FrameGraphTaskTexture | TextureHandle;
};

/**
 * The bloom effect spreads bright areas of an image to simulate artifacts seen in cameras
 */
export class BloomEffect extends PostProcessRenderEffect implements IFrameGraphTask {
    protected _useAsFrameGraphTask = false;

    public name = "Bloom";

    public disabled = false;

    public sourceTexture?: FrameGraphTaskTexture | TextureHandle;

    public sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    public outputTexture?: FrameGraphTaskTexture | TextureHandle;

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
     * @param useAsFrameGraphTask If the effect should be used as a frame graph task
     */
    constructor(
        sceneOrEngine: Scene | AbstractEngine,
        private _bloomScale: number,
        bloomWeight: number,
        bloomKernel: number,
        pipelineTextureType = 0,
        blockCompilation = false,
        useAsFrameGraphTask = false
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
        this._useAsFrameGraphTask = useAsFrameGraphTask;

        this._downscale = new ExtractHighlightsPostProcess("highlights", {
            size: 1.0,
            samplingMode: Texture.BILINEAR_SAMPLINGMODE,
            engine,
            textureType: pipelineTextureType,
            blockCompilation,
            useAsFrameGraphTask: this._useAsFrameGraphTask,
        });
        this._downscale.skipCreationOfDisabledPasses = true;

        this._blurX = new BlurPostProcess("horizontal blur", new Vector2(1.0, 0), 10.0, {
            size: _bloomScale,
            samplingMode: Texture.BILINEAR_SAMPLINGMODE,
            engine,
            textureType: pipelineTextureType,
            blockCompilation,
            useAsFrameGraphTask: this._useAsFrameGraphTask,
        });
        this._blurX.alwaysForcePOT = true;
        this._blurX.autoClear = false;
        this._blurX.skipCreationOfDisabledPasses = true;

        this._blurY = new BlurPostProcess("vertical blur", new Vector2(0, 1.0), 10.0, {
            size: _bloomScale,
            samplingMode: Texture.BILINEAR_SAMPLINGMODE,
            engine,
            textureType: pipelineTextureType,
            blockCompilation,
            useAsFrameGraphTask: this._useAsFrameGraphTask,
        });
        this._blurY.alwaysForcePOT = true;
        this._blurY.autoClear = false;
        this._blurY.skipCreationOfDisabledPasses = true;

        this.kernel = bloomKernel;

        this._effects = [this._downscale, this._blurX, this._blurY];

        this._merge = new BloomMergePostProcess("bloomMerge", this._downscale, this._blurY, bloomWeight, {
            size: _bloomScale,
            samplingMode: Texture.BILINEAR_SAMPLINGMODE,
            engine,
            textureType: pipelineTextureType,
            blockCompilation,
            useAsFrameGraphTask: this._useAsFrameGraphTask,
        });
        this._merge.autoClear = false;
        this._merge.skipCreationOfDisabledPasses = true;
        this._effects.push(this._merge);
    }

    public isReadyFrameGraph() {
        return this._downscale.isReady() && this._blurX.isReady() && this._blurY.isReady() && this._merge.isReady();
    }

    public recordFrameGraph(frameGraph: FrameGraph): void {
        if (this.sourceTexture === undefined) {
            throw new Error("sourceTexture is required");
        }

        const sourceTextureDescription = frameGraph.getTextureDescription(this.sourceTexture);

        const textureCreationOptions = {
            size: { width: Math.floor(sourceTextureDescription.size.width * this._bloomScale), height: Math.floor(sourceTextureDescription.size.height * this._bloomScale) },
            options: {
                createMipMaps: false,
                generateMipMaps: false,
                type: this._pipelineTextureType,
                samplingMode: Texture.BILINEAR_SAMPLINGMODE,
                format: sourceTextureDescription.options.format,
                samples: 1,
                useSRGBBuffer: false,
                label: "",
            },
            sizeIsPercentage: false,
        };

        // We need to set the texture size so that texel size is calculated correctly
        this._blurX.width = textureCreationOptions.size.width;
        this._blurX.height = textureCreationOptions.size.height;
        this._blurY.width = textureCreationOptions.size.width;
        this._blurY.height = textureCreationOptions.size.height;

        textureCreationOptions.options.label = `${this.name} Downscale`;
        const downscaleTextureHandle = frameGraph.createRenderTargetTexture(textureCreationOptions.options.label, textureCreationOptions);

        this._downscale.sourceTexture = this.sourceTexture;
        this._downscale.outputTexture = downscaleTextureHandle;
        this._downscale.recordFrameGraph(frameGraph);

        textureCreationOptions.options.label = `${this.name} Blur X`;
        const blurXTextureHandle = frameGraph.createRenderTargetTexture(textureCreationOptions.options.label, textureCreationOptions);

        this._blurX.sourceTexture = downscaleTextureHandle;
        this._blurX.outputTexture = blurXTextureHandle;
        this._blurX.recordFrameGraph(frameGraph);

        textureCreationOptions.options.label = `${this.name} Blur Y`;
        const blurYTextureHandle = frameGraph.createRenderTargetTexture(textureCreationOptions.options.label, textureCreationOptions);

        this._blurY.sourceTexture = blurXTextureHandle;
        this._blurY.outputTexture = blurYTextureHandle;
        this._blurY.recordFrameGraph(frameGraph);

        const sourceTextureHandle = frameGraph.getTextureHandle(this.sourceTexture);
        const outputTextureHandle = frameGraph.getTextureHandleOrCreateTexture(this.outputTexture, `${this.name} Output`, frameGraph.getTextureCreationOptions(this.sourceTexture));

        this._merge.sourceTexture = this.sourceTexture;
        this._merge.sourceSamplingMode = this.sourceSamplingMode;
        this._merge.sourceBlurTexture = blurYTextureHandle;
        this._merge.outputTexture = outputTextureHandle;
        this._merge.recordFrameGraph(frameGraph);

        const passDisabled = frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(sourceTextureHandle);
        passDisabled.setExecuteFunc((_context) => {
            if (_context.isBackbufferColor(outputTextureHandle)) {
                _context.copyTexture(_context.getTextureFromHandle(sourceTextureHandle)!.texture!, true);
            }
        });
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
