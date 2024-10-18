import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTextureCreationOptions, FrameGraphTextureHandle } from "../../frameGraphTypes";
import { Constants } from "core/Engines/constants";
import { FrameGraphBloomMergeTask } from "./bloomMergeTask";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import { FrameGraphTask } from "../../frameGraphTask";
import { ThinBloomEffect } from "core/PostProcesses/thinBloomEffect";
import { FrameGraphExtractHighlightsTask } from "./extractHighlightsTask";
import { FrameGraphBlurTask } from "./blurTask";

export class FrameGraphBloomTask extends FrameGraphTask {
    public sourceTexture: FrameGraphTextureHandle;

    public sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    public destinationTexture?: FrameGraphTextureHandle;

    public readonly outputTexture: FrameGraphTextureHandle;

    public readonly bloom: ThinBloomEffect;

    private _downscale: FrameGraphExtractHighlightsTask;
    private _blurX: FrameGraphBlurTask;
    private _blurY: FrameGraphBlurTask;
    private _merge: FrameGraphBloomMergeTask;
    private _defaultPipelineTextureType: number;

    constructor(name: string, frameGraph: FrameGraph, engine: AbstractEngine, weight: number, kernel: number, threshold: number, hdr = false, bloomScale = 0.5) {
        super(name, frameGraph);

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

        this._downscale = new FrameGraphExtractHighlightsTask(`${name} Downscale`, this._frameGraph, this.bloom.downscale);
        this._blurX = new FrameGraphBlurTask(`${name} Blur X`, this._frameGraph, this.bloom.blurX);
        this._blurY = new FrameGraphBlurTask(`${name} Blur Y`, this._frameGraph, this.bloom.blurY);
        this._merge = new FrameGraphBloomMergeTask(`${name} Merge`, this._frameGraph, this.bloom.merge);

        this._downscale.postProcess.threshold = threshold;
        this._blurX.postProcess.kernel = kernel;
        this._blurY.postProcess.kernel = kernel;
        this._merge.postProcess.weight = weight;

        this.outputTexture = this._frameGraph.createDanglingHandle();
    }

    public override isReady() {
        return this.bloom.isReady();
    }

    public override record(): void {
        if (this.sourceTexture === undefined) {
            throw new Error("FrameGraphBloomTask: sourceTexture is required");
        }

        const sourceTextureDescription = this._frameGraph.getTextureDescription(this.sourceTexture);

        const textureCreationOptions: FrameGraphTextureCreationOptions = {
            size: {
                width: Math.floor(sourceTextureDescription.size.width * this.bloom.bloomScale),
                height: Math.floor(sourceTextureDescription.size.height * this.bloom.bloomScale),
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
