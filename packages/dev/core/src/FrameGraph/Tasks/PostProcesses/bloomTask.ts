import type { FrameGraph, FrameGraphTextureCreationOptions, FrameGraphTextureHandle } from "core/index";
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
     * The alpha mode to use when applying the bloom effect.
     */
    public get alphaMode() {
        return this._merge.alphaMode;
    }

    public set alphaMode(mode: number) {
        this._merge.alphaMode = mode;
    }

    /**
     * The target texture to render the bloom effect to.
     * If not supplied, a texture with the same configuration as the source texture will be created.
     */
    public targetTexture?: FrameGraphTextureHandle;

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

    /**
     * The name of the task.
     */
    public override get name() {
        return this._name;
    }

    public override set name(name: string) {
        this._name = name;
        if (this._downscale) {
            this._downscale.name = `${name} Downscale`;
        }

        if (this._blurX) {
            this._blurX.name = `${name} Blur X`;
        }

        if (this._blurY) {
            this._blurY.name = `${name} Blur Y`;
        }

        if (this._merge) {
            this._merge.name = `${name} Merge`;
        }
    }

    private readonly _downscale: FrameGraphExtractHighlightsTask;
    private readonly _blurX: FrameGraphBlurTask;
    private readonly _blurY: FrameGraphBlurTask;
    private readonly _merge: FrameGraphBloomMergeTask;
    private readonly _defaultPipelineTextureType: number;

    /**
     * Constructs a new bloom task.
     * @param name Name of the task.
     * @param frameGraph The frame graph this task is associated with.
     * @param weight Weight of the bloom effect.
     * @param kernel Kernel size of the bloom effect.
     * @param threshold Threshold of the bloom effect.
     * @param hdr Whether the bloom effect is HDR.
     * @param bloomScale The scale of the bloom effect. This value is multiplied by the source texture size to determine the bloom texture size.
     */
    constructor(name: string, frameGraph: FrameGraph, weight = 0.25, kernel = 64, threshold = 0.2, hdr = false, bloomScale = 0.5) {
        super(name, frameGraph);

        this.hdr = hdr;

        this._defaultPipelineTextureType = Constants.TEXTURETYPE_UNSIGNED_BYTE;
        if (hdr) {
            const caps = frameGraph.engine.getCaps();
            if (caps.textureHalfFloatRender) {
                this._defaultPipelineTextureType = Constants.TEXTURETYPE_HALF_FLOAT;
            } else if (caps.textureFloatRender) {
                this._defaultPipelineTextureType = Constants.TEXTURETYPE_FLOAT;
            }
        }

        this.bloom = new ThinBloomEffect(name, frameGraph.engine, bloomScale);
        this.bloom.threshold = threshold;
        this.bloom.kernel = kernel;
        this.bloom.weight = weight;

        this._downscale = new FrameGraphExtractHighlightsTask(`${name} Downscale`, this._frameGraph, this.bloom._downscale);
        this._blurX = new FrameGraphBlurTask(`${name} Blur X`, this._frameGraph, this.bloom._blurX);
        this._blurY = new FrameGraphBlurTask(`${name} Blur Y`, this._frameGraph, this.bloom._blurY);
        this._merge = new FrameGraphBloomMergeTask(`${name} Merge`, this._frameGraph, this.bloom._merge);

        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
    }

    public override isReady() {
        return this.bloom.isReady();
    }

    public override getClassName(): string {
        return "FrameGraphBloomTask";
    }

    public record(): void {
        if (this.sourceTexture === undefined) {
            throw new Error("FrameGraphBloomTask: sourceTexture is required");
        }

        const sourceTextureDescription = this._frameGraph.textureManager.getTextureDescription(this.sourceTexture);

        const textureCreationOptions: FrameGraphTextureCreationOptions = {
            size: {
                width: Math.floor(sourceTextureDescription.size.width * this.bloom.scale) || 1,
                height: Math.floor(sourceTextureDescription.size.height * this.bloom.scale) || 1,
            },
            options: {
                createMipMaps: false,
                types: [this._defaultPipelineTextureType],
                formats: [Constants.TEXTUREFORMAT_RGBA],
                samples: 1,
                useSRGBBuffers: [false],
                labels: [""],
            },
            sizeIsPercentage: false,
        };

        const downscaleTextureHandle = this._frameGraph.textureManager.createRenderTargetTexture(this._downscale.name, textureCreationOptions);

        this._downscale.sourceTexture = this.sourceTexture;
        this._downscale.sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
        this._downscale.targetTexture = downscaleTextureHandle;
        this._downscale.record(true);

        const blurXTextureHandle = this._frameGraph.textureManager.createRenderTargetTexture(this._blurX.name, textureCreationOptions);

        this._blurX.sourceTexture = downscaleTextureHandle;
        this._blurX.sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
        this._blurX.targetTexture = blurXTextureHandle;
        this._blurX.record(true);

        const blurYTextureHandle = this._frameGraph.textureManager.createRenderTargetTexture(this._blurY.name, textureCreationOptions);

        this._blurY.sourceTexture = blurXTextureHandle;
        this._blurY.sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
        this._blurY.targetTexture = blurYTextureHandle;
        this._blurY.record(true);

        const sourceTextureCreationOptions = this._frameGraph.textureManager.getTextureCreationOptions(this.sourceTexture);

        this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.targetTexture, this._merge.name, sourceTextureCreationOptions);

        this._merge.sourceTexture = this.sourceTexture;
        this._merge.sourceSamplingMode = this.sourceSamplingMode;
        this._merge.blurTexture = blurYTextureHandle;
        this._merge.targetTexture = this.outputTexture;
        this._merge.record(true);

        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.addDependencies(this.sourceTexture);

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
