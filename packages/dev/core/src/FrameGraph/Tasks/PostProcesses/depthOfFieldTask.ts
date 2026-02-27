import type { FrameGraph, FrameGraphTextureCreationOptions, FrameGraphTextureHandle, AbstractEngine, Camera } from "core/index";
import { Constants } from "core/Engines/constants";
import { FrameGraphTask } from "../../frameGraphTask";
import { ThinDepthOfFieldEffectBlurLevel } from "core/PostProcesses/thinDepthOfFieldEffect";
import { FrameGraphDepthOfFieldMergeTask } from "./depthOfFieldMergeTask";
import { FrameGraphCircleOfConfusionTask } from "./circleOfConfusionTask";
import { FrameGraphDepthOfFieldBlurTask } from "./depthOfFieldBlurTask";
import { ThinDepthOfFieldEffect } from "core/PostProcesses/thinDepthOfFieldEffect";

/**
 * Task which applies a depth of field effect.
 */
export class FrameGraphDepthOfFieldTask extends FrameGraphTask {
    /**
     * The source texture to apply the depth of field effect on.
     */
    public sourceTexture: FrameGraphTextureHandle;

    /**
     * The sampling mode to use for the source texture.
     */
    public sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    /**
     * The alpha mode to use when applying the depth of field effect.
     */
    public get alphaMode() {
        return this._merge.alphaMode;
    }

    public set alphaMode(mode: number) {
        this._merge.alphaMode = mode;
    }

    /**
     * The depth texture to use for the depth of field effect.
     * Should store camera space depth (Z coordinate).
     */
    public depthTexture: FrameGraphTextureHandle;

    /**
     * The sampling mode to use for the depth texture.
     */
    public depthSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    /**
     * The camera used to render the scene.
     */
    public camera: Camera;

    /**
     * The target texture to render the depth of field effect to.
     */
    public targetTexture?: FrameGraphTextureHandle;

    /**
     * The output texture of the depth of field effect.
     */
    public readonly outputTexture: FrameGraphTextureHandle;

    /**
     * The depth of field effect.
     */
    public readonly depthOfField: ThinDepthOfFieldEffect;

    /**
     * Whether the depth of field effect is applied on HDR textures.
     * When true, the depth of field effect will use a higher precision texture format (half float or float). Else, it will use unsigned byte.
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
        if (this._circleOfConfusion) {
            this._circleOfConfusion.name = `${name} Circle of Confusion`;
        }

        if (this._blurX) {
            for (let i = 0; i < this._blurX.length; i++) {
                this._blurX[i].name = `${name} Blur X${i}`;
                this._blurY[i].name = `${name} Blur Y${i}`;
            }
        }

        if (this._merge) {
            this._merge.name = `${name} Merge`;
        }
    }

    private readonly _engine: AbstractEngine;
    private readonly _circleOfConfusion: FrameGraphCircleOfConfusionTask;
    private readonly _blurX: FrameGraphDepthOfFieldBlurTask[] = [];
    private readonly _blurY: FrameGraphDepthOfFieldBlurTask[] = [];
    private readonly _merge: FrameGraphDepthOfFieldMergeTask;
    private readonly _defaultPipelineTextureType: number;

    /**
     * Constructs a depth of field task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task belongs to.
     * @param blurLevel The blur level of the depth of field effect (default: ThinDepthOfFieldEffectBlurLevel.Low).
     * @param hdr Whether the depth of field effect is HDR.
     */
    constructor(name: string, frameGraph: FrameGraph, blurLevel: ThinDepthOfFieldEffectBlurLevel = ThinDepthOfFieldEffectBlurLevel.Low, hdr = false) {
        super(name, frameGraph);

        this._engine = frameGraph.engine;
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

        this.depthOfField = new ThinDepthOfFieldEffect(name, frameGraph.engine, blurLevel, true);

        this._circleOfConfusion = new FrameGraphCircleOfConfusionTask(`${name} Circle of Confusion`, this._frameGraph, this.depthOfField._circleOfConfusion);

        const blurCount = this.depthOfField._depthOfFieldBlurX.length;

        for (let i = 0; i < blurCount; i++) {
            this._blurX.push(new FrameGraphDepthOfFieldBlurTask(`${name} Blur X${i}`, this._frameGraph, this.depthOfField._depthOfFieldBlurX[i][0]));
            this._blurY.push(new FrameGraphDepthOfFieldBlurTask(`${name} Blur Y${i}`, this._frameGraph, this.depthOfField._depthOfFieldBlurY[i][0]));
        }

        this._merge = new FrameGraphDepthOfFieldMergeTask(`${name} Merge`, this._frameGraph, this.depthOfField._dofMerge);

        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
    }

    public override isReady() {
        return this.depthOfField.isReady();
    }

    public override getClassName(): string {
        return "FrameGraphDepthOfFieldTask";
    }

    public record(): void {
        if (this.sourceTexture === undefined || this.depthTexture === undefined || this.camera === undefined) {
            throw new Error("FrameGraphDepthOfFieldTask: sourceTexture, depthTexture and camera are required");
        }

        const sourceTextureDescription = this._frameGraph.textureManager.getTextureDescription(this.sourceTexture);

        const textureSize = {
            width: sourceTextureDescription.size.width,
            height: sourceTextureDescription.size.height,
        };
        const circleOfConfusionTextureFormat = this._engine.isWebGPU || this._engine.version > 1 ? Constants.TEXTUREFORMAT_RED : Constants.TEXTUREFORMAT_RGBA;
        const textureCreationOptions: FrameGraphTextureCreationOptions = {
            size: textureSize,
            options: {
                createMipMaps: false,
                types: [this._defaultPipelineTextureType],
                formats: [circleOfConfusionTextureFormat],
                samples: 1,
                useSRGBBuffers: [false],
                labels: [""],
            },
            sizeIsPercentage: false,
        };

        const circleOfConfusionTextureHandle = this._frameGraph.textureManager.createRenderTargetTexture(this._circleOfConfusion.name, textureCreationOptions);

        this._circleOfConfusion.sourceTexture = this.sourceTexture; // texture not used by the CoC shader
        this._circleOfConfusion.depthTexture = this.depthTexture;
        this._circleOfConfusion.depthSamplingMode = this.depthSamplingMode;
        this._circleOfConfusion.camera = this.camera;
        this._circleOfConfusion.targetTexture = circleOfConfusionTextureHandle;
        this._circleOfConfusion.record(true);

        textureCreationOptions.options.formats = [Constants.TEXTUREFORMAT_RGBA];

        const blurSteps: FrameGraphTextureHandle[] = [];

        for (let i = 0; i < this._blurX.length; i++) {
            const ratio = this.depthOfField._depthOfFieldBlurX[i][1];

            textureSize.width = Math.floor(sourceTextureDescription.size.width * ratio) || 1;
            textureSize.height = Math.floor(sourceTextureDescription.size.height * ratio) || 1;

            textureCreationOptions.options.labels![0] = "step " + (i + 1);

            const blurYTextureHandle = this._frameGraph.textureManager.createRenderTargetTexture(this._blurY[i].name, textureCreationOptions);

            this._blurY[i].sourceTexture = i === 0 ? this.sourceTexture : this._blurX[i - 1].outputTexture;
            this._blurY[i].sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
            this._blurY[i].circleOfConfusionTexture = circleOfConfusionTextureHandle;
            this._blurY[i].targetTexture = blurYTextureHandle;
            this._blurY[i].record(true);

            const blurXTextureHandle = this._frameGraph.textureManager.createRenderTargetTexture(this._blurX[i].name, textureCreationOptions);

            this._blurX[i].sourceTexture = this._blurY[i].outputTexture;
            this._blurX[i].sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
            this._blurX[i].circleOfConfusionTexture = circleOfConfusionTextureHandle;
            this._blurX[i].targetTexture = blurXTextureHandle;
            this._blurX[i].record(true);

            blurSteps.push(blurXTextureHandle);
        }

        const sourceTextureCreationOptions = this._frameGraph.textureManager.getTextureCreationOptions(this.sourceTexture);

        this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.targetTexture, this._merge.name, sourceTextureCreationOptions);

        this._merge.sourceTexture = this.sourceTexture;
        this._merge.sourceSamplingMode = this.sourceSamplingMode;
        this._merge.circleOfConfusionTexture = circleOfConfusionTextureHandle;
        this._merge.blurSteps = blurSteps;
        this._merge.targetTexture = this.outputTexture;
        this._merge.record(true);

        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.addDependencies(this.sourceTexture);

        passDisabled.setRenderTarget(this.outputTexture);
        passDisabled.setExecuteFunc((context) => {
            if (this.alphaMode === Constants.ALPHA_DISABLE) {
                context.copyTexture(this.sourceTexture);
            }
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
