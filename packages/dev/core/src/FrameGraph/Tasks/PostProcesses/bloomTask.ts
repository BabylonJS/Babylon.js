import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTextureCreationOptions, FrameGraphTextureHandle } from "../../frameGraphTypes";
import { Constants } from "core/Engines/constants";
import { BloomEffect } from "../../../PostProcesses/bloomEffect";
import { FrameGraphPostProcessTask } from "./postProcessTask";
//import { FrameGraphBloomMergeTask } from "./bloomMergeTask";
//import type { BloomMergePostProcess } from "core/PostProcesses/bloomMergePostProcess";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import { FrameGraphTask } from "../../frameGraphTask";

export class FrameGraphBloomTask extends FrameGraphTask {
    public sourceTexture: FrameGraphTextureHandle;

    public sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    public destinationTexture?: FrameGraphTextureHandle;

    public readonly outputTexture: FrameGraphTextureHandle;

    public get bloom() {
        return this._bloomEffect;
    }

    private _bloomEffect: BloomEffect;
    private _downscale: FrameGraphPostProcessTask;
    private _blurX: FrameGraphPostProcessTask;
    private _blurY: FrameGraphPostProcessTask;
    //private _merge: FrameGraphBloomMergeTask;

    constructor(name: string, frameGraph: FrameGraph, engine: AbstractEngine, weight: number, kernel: number, threshold: number, hdr = false, bloomScale = 0.5) {
        super(name, frameGraph);

        let defaultPipelineTextureType = Constants.TEXTURETYPE_UNSIGNED_BYTE;
        if (hdr) {
            const caps = engine.getCaps();
            if (caps.textureHalfFloatRender) {
                defaultPipelineTextureType = Constants.TEXTURETYPE_HALF_FLOAT;
            } else if (caps.textureFloatRender) {
                defaultPipelineTextureType = Constants.TEXTURETYPE_FLOAT;
            }
        }

        this._bloomEffect = new BloomEffect(engine, bloomScale, weight, kernel, defaultPipelineTextureType, false);
        this._bloomEffect.threshold = threshold;

        this._downscale = new FrameGraphPostProcessTask(`${name} Downscale`, this._frameGraph, this._bloomEffect._effects[0]);
        this._blurX = new FrameGraphPostProcessTask(`${name} Blur X`, this._frameGraph, this._bloomEffect._effects[1]);
        this._blurY = new FrameGraphPostProcessTask(`${name} Blur Y`, this._frameGraph, this._bloomEffect._effects[2]);
        //this._merge = new FrameGraphBloomMergeTask(`${name} Merge`, this._frameGraph, this._bloomEffect._effects[3] as BloomMergePostProcess);

        this.outputTexture = this._frameGraph.createDanglingHandle();
    }

    public override isReady() {
        return this._downscale.isReady() && this._blurX.isReady() && this._blurY.isReady(); // && this._merge.isReady();
    }

    public override record(): void {
        if (this.sourceTexture === undefined) {
            throw new Error("FrameGraphBloomTask: sourceTexture is required");
        }

        const sourceTextureDescription = this._frameGraph.getTextureDescription(this.sourceTexture);

        const textureCreationOptions: FrameGraphTextureCreationOptions = {
            size: {
                width: Math.floor(sourceTextureDescription.size.width * this._bloomEffect.bloomScale),
                height: Math.floor(sourceTextureDescription.size.height * this._bloomEffect.bloomScale),
            },
            options: {
                createMipMaps: false,
                generateMipMaps: false,
                types: [this._bloomEffect._pipelineTextureType],
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

        // this._frameGraph.resolveDanglingHandle(this.outputTexture, this.destinationTexture, this._merge.name, sourceTextureCreationOptions);

        // this._merge.sourceTexture = this.sourceTexture;
        // this._merge.sourceSamplingMode = this.sourceSamplingMode;
        // this._merge.blurTexture = blurYTextureHandle;
        // this._merge.destinationTexture = this.outputTexture;
        // this._merge.record(true);

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
        //this._merge.dispose();
        super.dispose();
    }
}
