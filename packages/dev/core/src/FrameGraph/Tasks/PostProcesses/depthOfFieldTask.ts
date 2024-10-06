import type { FrameGraph } from "../../frameGraph";
import type { FrameGraphTextureCreationOptions, FrameGraphTextureHandle } from "../../frameGraphTypes";
import { Constants } from "core/Engines/constants";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import { FrameGraphTask } from "../../frameGraphTask";
import { DepthOfFieldEffect, DepthOfFieldEffectBlurLevel } from "core/PostProcesses/depthOfFieldEffect";
import { FrameGraphDepthOfFieldMergeTask } from "./depthOfFieldMergeTask";
import type { DepthOfFieldMergePostProcess } from "core/PostProcesses/depthOfFieldMergePostProcess";
import { FrameGraphCircleOfConfusionTask } from "./circleOfConfusionTask";
import type { CircleOfConfusionPostProcess } from "core/PostProcesses/circleOfConfusionPostProcess";
import { FrameGraphDepthOfFieldBlurTask } from "./depthOfFieldBlurTask";
import type { DepthOfFieldBlurPostProcess } from "core/PostProcesses";
import type { Camera } from "core/Cameras/camera";

export class FrameGraphDepthOfFieldTask extends FrameGraphTask {
    public sourceTexture: FrameGraphTextureHandle;

    public sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    public depthTexture: FrameGraphTextureHandle; // should store camera space depth (Z coordinate)

    public depthSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    public camera: Camera;

    public destinationTexture?: FrameGraphTextureHandle;

    public readonly outputTexture: FrameGraphTextureHandle;

    public get depthOfField() {
        return this._dofEffect;
    }

    private _engine: AbstractEngine;
    private _dofEffect: DepthOfFieldEffect;
    private _circleOfConfusion: FrameGraphCircleOfConfusionTask;
    private _blurX: FrameGraphDepthOfFieldBlurTask[] = [];
    private _blurY: FrameGraphDepthOfFieldBlurTask[] = [];
    private _merge: FrameGraphDepthOfFieldMergeTask;

    constructor(name: string, frameGraph: FrameGraph, engine: AbstractEngine, blurLevel: DepthOfFieldEffectBlurLevel = DepthOfFieldEffectBlurLevel.Low, hdr = false) {
        super(name, frameGraph);

        this._engine = engine;

        let defaultPipelineTextureType = Constants.TEXTURETYPE_UNSIGNED_BYTE;
        if (hdr) {
            const caps = engine.getCaps();
            if (caps.textureHalfFloatRender) {
                defaultPipelineTextureType = Constants.TEXTURETYPE_HALF_FLOAT;
            } else if (caps.textureFloatRender) {
                defaultPipelineTextureType = Constants.TEXTURETYPE_FLOAT;
            }
        }

        this._dofEffect = new DepthOfFieldEffect(engine, null, blurLevel, defaultPipelineTextureType, false, true, true);

        this._circleOfConfusion = new FrameGraphCircleOfConfusionTask(
            `${name} Circle of Confusion`,
            this._frameGraph,
            engine,
            this._dofEffect._effects[0] as CircleOfConfusionPostProcess
        );

        for (let i = 0; i < (this._dofEffect._effects.length - 2) / 2; i++) {
            this._blurX.push(new FrameGraphDepthOfFieldBlurTask(`${name} Blur X`, this._frameGraph, this._dofEffect._effects[1 + i * 2 + 1] as DepthOfFieldBlurPostProcess));
            this._blurY.push(new FrameGraphDepthOfFieldBlurTask(`${name} Blur Y`, this._frameGraph, this._dofEffect._effects[1 + i * 2] as DepthOfFieldBlurPostProcess));
        }

        this._merge = new FrameGraphDepthOfFieldMergeTask(
            `${name} Merge`,
            this._frameGraph,
            this._dofEffect._effects[this._dofEffect._effects.length - 1] as DepthOfFieldMergePostProcess
        );

        this.outputTexture = this._frameGraph.createDanglingHandle();
    }

    public override isReady() {
        let isReady = this._circleOfConfusion.isReady();

        for (let i = 0; i < this._blurX.length; i++) {
            isReady = this._blurX[i].isReady() && isReady;
            isReady = this._blurY[i].isReady() && isReady;
        }

        isReady = this._merge.isReady() && isReady;

        return isReady;
    }

    public override record(): void {
        if (this.sourceTexture === undefined || this.depthTexture === undefined || this.camera === undefined) {
            throw new Error("FrameGraphDepthOfFieldTask: sourceTexture, depthTexture and camera are required");
        }

        const sourceTextureDescription = this._frameGraph.getTextureDescription(this.sourceTexture);

        const textureSize = {
            width: sourceTextureDescription.size.width,
            height: sourceTextureDescription.size.height,
        };
        const circleOfConfusionTextureFormat = this._engine.isWebGPU || this._engine.version > 1 ? Constants.TEXTUREFORMAT_RED : Constants.TEXTUREFORMAT_RGBA;
        const textureCreationOptions: FrameGraphTextureCreationOptions = {
            size: textureSize,
            options: {
                createMipMaps: false,
                generateMipMaps: false,
                types: [this._dofEffect._pipelineTextureType],
                formats: [circleOfConfusionTextureFormat],
                samples: 1,
                useSRGBBuffers: [false],
                generateDepthBuffer: false,
                generateStencilBuffer: false,
                label: "",
            },
            sizeIsPercentage: false,
        };

        const circleOfConfusionTextureHandle = this._frameGraph.createRenderTargetTexture(this._circleOfConfusion.name, textureCreationOptions);

        this._circleOfConfusion.sourceTexture = this.sourceTexture; // texture not used by the CoC shader
        this._circleOfConfusion.depthTexture = this.depthTexture;
        this._circleOfConfusion.depthSamplingMode = this.depthSamplingMode;
        this._circleOfConfusion.camera = this.camera;
        this._circleOfConfusion.destinationTexture = circleOfConfusionTextureHandle;
        this._circleOfConfusion.record(true);

        textureCreationOptions.options.formats = [Constants.TEXTUREFORMAT_RGBA];

        const blurSteps: FrameGraphTextureHandle[] = [];

        for (let i = 0; i < this._blurX.length; i++) {
            const ratio = 0.75 / (1 << i);

            textureSize.width = Math.floor(sourceTextureDescription.size.width * ratio);
            textureSize.height = Math.floor(sourceTextureDescription.size.height * ratio);

            const blurYTextureHandle = this._frameGraph.createRenderTargetTexture(this._blurY[i].name, textureCreationOptions);

            this._blurY[i].sourceTexture = i === 0 ? this.sourceTexture : this._blurX[i - 1].outputTexture;
            this._blurY[i].sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
            this._blurY[i].circleOfConfusionTexture = circleOfConfusionTextureHandle;
            this._blurY[i].destinationTexture = blurYTextureHandle;
            this._blurY[i].record(true);

            const blurXTextureHandle = this._frameGraph.createRenderTargetTexture(this._blurX[i].name, textureCreationOptions);

            this._blurX[i].sourceTexture = this._blurY[i].outputTexture;
            this._blurX[i].sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
            this._blurX[i].circleOfConfusionTexture = circleOfConfusionTextureHandle;
            this._blurX[i].destinationTexture = blurXTextureHandle;
            this._blurX[i].record(true);

            blurSteps.push(blurXTextureHandle);
        }

        const sourceTextureCreationOptions = this._frameGraph.getTextureCreationOptions(this.sourceTexture, true);
        sourceTextureCreationOptions.options.generateDepthBuffer = false;
        sourceTextureCreationOptions.options.generateStencilBuffer = false;
        sourceTextureCreationOptions.options.samples = 1;

        this._frameGraph.resolveDanglingHandle(this.outputTexture, this.destinationTexture, this._merge.name, sourceTextureCreationOptions);

        this._merge.sourceTexture = this.sourceTexture;
        this._merge.sourceSamplingMode = this.sourceSamplingMode;
        this._merge.circleOfConfusionTexture = circleOfConfusionTextureHandle;
        this._merge.blurSteps = blurSteps;
        this._merge.destinationTexture = this.outputTexture;
        this._merge.record(true);

        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.setRenderTarget(this.outputTexture);
        passDisabled.setExecuteFunc((context) => {
            context.copyTexture(this.sourceTexture);
        });
    }

    public override dispose(): void {
        this._circleOfConfusion.dispose();
        for (let i = 0; i < this._blurX.length; i++) {
            this._blurX[i].dispose();
            this._blurY[i].dispose();
        }
        this._merge.dispose();
        super.dispose();
    }
}
