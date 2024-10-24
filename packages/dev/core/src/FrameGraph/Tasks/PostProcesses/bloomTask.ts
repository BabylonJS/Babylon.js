// eslint-disable-next-line import/no-internal-modules
import type { FrameGraph, FrameGraphTextureCreationOptions, FrameGraphTextureHandle, AbstractEngine } from "core/index";
import { Constants } from "core/Engines/constants";
import { FrameGraphBloomMergeTask } from "./bloomMergeTask";
import { FrameGraphTask } from "../../frameGraphTask";
import { ThinBloomEffect } from "core/PostProcesses/thinBloomEffect";
import { FrameGraphExtractHighlightsTask } from "./extractHighlightsTask";
import { FrameGraphBlurTask } from "./blurTask";

/**
 * Task which applies a bloom render effect.
 */
export class FrameGraphBloomTask extends FrameGraphTask {
    /**
     * The source texture to apply the bloom effect on.
     */
    public sourceTexture: FrameGraphTextureHandle;

    /**
     * The sampling mode to use for the source texture.
     */
    public sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    /**
     * The destination texture to render the bloom effect to.
     * If not supplied, a texture with the same configuration as the source texture will be created.
     */
    public destinationTexture?: FrameGraphTextureHandle;

    /**
     * The output texture of the bloom effect.
     */
    public readonly outputTexture: FrameGraphTextureHandle;

    /**
     * The bloom effect to apply.
     */
    public readonly bloom: ThinBloomEffect;

    /**
     * Whether the bloom effect is HDR.
     * When true, the bloom effect will use a higher precision texture format (half float or float). Else, it will use unsigned byte.
     */
    public readonly hdr: boolean;

    private _downscale: FrameGraphExtractHighlightsTask;
    private _blurX: FrameGraphBlurTask;
    private _blurY: FrameGraphBlurTask;
    private _merge: FrameGraphBloomMergeTask;
    private _defaultPipelineTextureType: number;

    /**
     * Constructs a new bloom task.
     * @param name Name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param engine The engine to use for the bloom effect.
     * @param weight Weight of the bloom effect.
     * @param kernel Kernel size of the bloom effect.
     * @param threshold Threshold of the bloom effect.
     * @param hdr Whether the bloom effect is HDR.
     * @param bloomScale The scale of the bloom effect. This value is multiplied by the source texture size to determine the bloom texture size.
     */
    constructor(name: string, frameGraph: FrameGraph, engine: AbstractEngine, weight: number, kernel: number, threshold: number, hdr = false, bloomScale = 0.5) {
        super(name, frameGraph);

        this.hdr = hdr;

        this._defaultPipelineTextureType = Constants.TEXTURETYPE_UNSIGNED_BYTE;
        if (hdr) {
            const caps = engine.getCaps();
            if (caps.textureHalfFloatRender) {
                this._defaultPipelineTextureType = Constants.TEXTURETYPE_HALF_FLOAT;
            } else if (caps.textureFloatRender) {
                this._defaultPipelineTextureType = Constants.TEXTURETYPE_FLOAT;
            }
        }

        this.bloom = new ThinBloomEffect(name, engine, bloomScale);
        this.bloom.threshold = threshold;
        this.bloom.kernel = kernel;
        this.bloom.weight = weight;

        this._downscale = new FrameGraphExtractHighlightsTask(`${name} Downscale`, this._frameGraph, this.bloom._downscale);
        this._blurX = new FrameGraphBlurTask(`${name} Blur X`, this._frameGraph, this.bloom._blurX);
        this._blurY = new FrameGraphBlurTask(`${name} Blur Y`, this._frameGraph, this.bloom._blurY);
        this._merge = new FrameGraphBloomMergeTask(`${name} Merge`, this._frameGraph, this.bloom._merge);

        this.outputTexture = this._frameGraph.createDanglingHandle();
    }

    public override isReady() {
        return this.bloom.isReady();
    }

    public record(): void {
        if (this.sourceTexture === undefined) {
            throw new Error("FrameGraphBloomTask: sourceTexture is required");
        }

        const sourceTextureDescription = this._frameGraph.getTextureDescription(this.sourceTexture);

        const textureCreationOptions: FrameGraphTextureCreationOptions = {
            size: {
                width: Math.floor(sourceTextureDescription.size.width * this.bloom.scale),
                height: Math.floor(sourceTextureDescription.size.height * this.bloom.scale),
            },
            options: {
                createMipMaps: false,
                generateMipMaps: false,
                types: [this._defaultPipelineTextureType],
                samplingModes: [Constants.TEXTURE_BILINEAR_SAMPLINGMODE],
                formats: [Constants.TEXTUREFORMAT_RGBA],
                samples: 1,
                useSRGBBuffers: [false],
                generateDepthBuffer: false,
                generateStencilBuffer: false,
                label: "",
            },
            sizeIsPercentage: false,
        };

        const downscaleTextureHandle = this._frameGraph.createRenderTargetTexture(this._downscale.name, textureCreationOptions);

        this._downscale.sourceTexture = this.sourceTexture;
        this._downscale.sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
        this._downscale.destinationTexture = downscaleTextureHandle;
        this._downscale.record(true);

        const blurXTextureHandle = this._frameGraph.createRenderTargetTexture(this._blurX.name, textureCreationOptions);

        this._blurX.sourceTexture = downscaleTextureHandle;
        this._blurX.sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
        this._blurX.destinationTexture = blurXTextureHandle;
        this._blurX.record(true);

        const blurYTextureHandle = this._frameGraph.createRenderTargetTexture(this._blurY.name, textureCreationOptions);

        this._blurY.sourceTexture = blurXTextureHandle;
        this._blurY.sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
        this._blurY.destinationTexture = blurYTextureHandle;
        this._blurY.record(true);

        const sourceTextureCreationOptions = this._frameGraph.getTextureCreationOptions(this.sourceTexture, true);
        sourceTextureCreationOptions.options.generateDepthBuffer = false;
        sourceTextureCreationOptions.options.generateStencilBuffer = false;
        sourceTextureCreationOptions.options.samples = 1;

        this._frameGraph.resolveDanglingHandle(this.outputTexture, this.destinationTexture, this._merge.name, sourceTextureCreationOptions);

        this._merge.sourceTexture = this.sourceTexture;
        this._merge.sourceSamplingMode = this.sourceSamplingMode;
        this._merge.blurTexture = blurYTextureHandle;
        this._merge.destinationTexture = this.outputTexture;
        this._merge.record(true);

        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(this.outputTexture);
        passDisabled.setExecuteFunc((context) => {
            context.copyTexture(this.sourceTexture);
        });
    }

    public override dispose(): void {
        this._downscale.dispose();
        this._blurX.dispose();
        this._blurY.dispose();
        this._merge.dispose();
        super.dispose();
    }
}
