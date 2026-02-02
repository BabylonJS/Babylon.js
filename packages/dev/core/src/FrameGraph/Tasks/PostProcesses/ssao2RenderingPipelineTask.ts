import type { FrameGraph, FrameGraphTextureHandle, Camera, FrameGraphTextureCreationOptions } from "core/index";
import { Constants } from "core/Engines/constants";
import { FrameGraphTask } from "../../frameGraphTask";
import { ThinSSAO2RenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/thinSSAO2RenderingPipeline";
import { FrameGraphSSAO2Task } from "./ssao2Task";
import { FrameGraphSSAO2BlurTask } from "./ssao2BlurTask";
import { FrameGraphPostProcessTask } from "./postProcessTask";

/**
 * Task which applies a SSAO2 post process.
 */
export class FrameGraphSSAO2RenderingPipelineTask extends FrameGraphTask {
    /**
     * The source texture to apply the SSAO2 effect on.
     */
    public sourceTexture: FrameGraphTextureHandle;

    /**
     * The sampling mode to use for the source texture.
     */
    public sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    /**
     * The alpha mode to use when applying the SSAO2 effect.
     */
    public get alphaMode() {
        return this._ssaoCombine.alphaMode;
    }

    public set alphaMode(mode: number) {
        this._ssaoCombine.alphaMode = mode;
    }

    /**
     * The depth texture used by the SSAO2 effect (Z coordinate in camera view space).
     */
    public depthTexture: FrameGraphTextureHandle;

    /**
     * The normal texture used by the SSAO2 effect (normal vector in camera view space).
     */
    public normalTexture: FrameGraphTextureHandle;

    private _camera: Camera;

    /**
     * The camera used to render the scene.
     */
    public get camera() {
        return this._camera;
    }

    public set camera(camera: Camera) {
        if (camera === this._camera) {
            return;
        }

        this._camera = camera;

        this.ssao.camera = camera;
    }

    /**
     * The target texture to render the SSAO2 effect to.
     */
    public targetTexture?: FrameGraphTextureHandle;

    /**
     * The output texture of the SSAO2 effect.
     */
    public readonly outputTexture: FrameGraphTextureHandle;

    /**
     * The SSAO2 Rendering pipeline.
     */
    public readonly ssao: ThinSSAO2RenderingPipeline;

    /**
     * The name of the task.
     */
    public override get name() {
        return this._name;
    }

    public override set name(name: string) {
        this._name = name;
        if (this._ssao) {
            this._ssao.name = `${name} SSAO2 main`;
        }
        if (this._ssaoBlurX) {
            this._ssaoBlurX.name = `${name} SSAO2 Blur X`;
        }
        if (this._ssaoBlurY) {
            this._ssaoBlurY.name = `${name} SSAO2 Blur Y`;
        }
        if (this._ssaoCombine) {
            this._ssaoCombine.name = `${name} SSAO2 Combine`;
        }
    }

    /**
     * The ratio between the SSAO texture size and the source texture size
     */
    public readonly ratioSSAO: number;

    /**
     * The ratio between the SSAO blur texture size and the source texture size
     */
    public readonly ratioBlur: number;

    /**
     * The texture type used by the different post processes created by SSAO2.
     * It's a read-only property. If you want to change it, you must recreate the task and pass the appropriate texture type to the constructor.
     */
    public readonly textureType: number;

    private readonly _ssao: FrameGraphSSAO2Task;
    private readonly _ssaoBlurX: FrameGraphSSAO2BlurTask;
    private readonly _ssaoBlurY: FrameGraphSSAO2BlurTask;
    private readonly _ssaoCombine: FrameGraphPostProcessTask;

    /**
     * Constructs a SSAO2 rendering pipeline task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task belongs to.
     * @param ratioSSAO The ratio between the SSAO texture size and the source texture size
     * @param ratioBlur The ratio between the SSAO blur texture size and the source texture size
     * @param textureType The texture type used by the different post processes created by SSAO2 (default: Constants.TEXTURETYPE_UNSIGNED_BYTE)
     */
    constructor(name: string, frameGraph: FrameGraph, ratioSSAO: number, ratioBlur: number, textureType = Constants.TEXTURETYPE_UNSIGNED_BYTE) {
        super(name, frameGraph);

        this.ratioSSAO = ratioSSAO;
        this.ratioBlur = ratioBlur;
        this.textureType = textureType;

        this.ssao = new ThinSSAO2RenderingPipeline(name, frameGraph.scene);

        this._ssao = new FrameGraphSSAO2Task(`${name} SSAO2 main`, this._frameGraph, this.ssao._ssaoPostProcess);
        this._ssaoBlurX = new FrameGraphSSAO2BlurTask(`${name} SSAO2 Blur X`, this._frameGraph, true, this.ssao._ssaoBlurXPostProcess);
        this._ssaoBlurY = new FrameGraphSSAO2BlurTask(`${name} SSAO2 Blur Y`, this._frameGraph, false, this.ssao._ssaoBlurYPostProcess);
        this._ssaoCombine = new FrameGraphPostProcessTask(`${name} SSAO2 Combine`, this._frameGraph, this.ssao._ssaoCombinePostProcess);

        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
    }

    public override isReady() {
        return this.ssao.isReady();
    }

    public override getClassName(): string {
        return "FrameGraphSSAO2RenderingPipelineTask";
    }

    public record(): void {
        if (this.sourceTexture === undefined || this.depthTexture === undefined || this.normalTexture === undefined || this.camera === undefined) {
            throw new Error(`FrameGraphSSAO2RenderingPipelineTask "${this.name}": sourceTexture, depthTexture, normalTexture and camera are required`);
        }

        const sourceTextureDescription = this._frameGraph.textureManager.getTextureDescription(this.sourceTexture);

        this._ssao.sourceTexture = this.sourceTexture;
        this._ssao.sourceSamplingMode = this.sourceSamplingMode;
        this._ssao.camera = this.camera;
        this._ssao.depthTexture = this.depthTexture;
        this._ssao.normalTexture = this.normalTexture;

        const textureSize = {
            width: Math.floor(sourceTextureDescription.size.width * this.ratioSSAO) || 1,
            height: Math.floor(sourceTextureDescription.size.height * this.ratioSSAO) || 1,
        };
        const textureCreationOptions: FrameGraphTextureCreationOptions = {
            size: textureSize,
            options: {
                createMipMaps: false,
                types: [this.textureType],
                formats: [Constants.TEXTUREFORMAT_RGBA],
                samples: 1,
                useSRGBBuffers: [false],
                labels: [""],
            },
            sizeIsPercentage: false,
        };

        const ssaoTextureHandle = this._frameGraph.textureManager.createRenderTargetTexture(this._ssao.name, textureCreationOptions);

        // SSAO main post process
        this._ssao.targetTexture = ssaoTextureHandle;
        this._ssao.record(true);

        // SSAO Blur X & Y
        textureSize.width = Math.floor(sourceTextureDescription.size.width * this.ratioBlur) || 1;
        textureSize.height = Math.floor(sourceTextureDescription.size.height * this.ratioBlur) || 1;

        const sourceTextureCreationOptions = this._frameGraph.textureManager.getTextureCreationOptions(this.sourceTexture);

        this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.targetTexture, this.name + " Output", sourceTextureCreationOptions);

        const blurXTextureHandle = this._frameGraph.textureManager.createRenderTargetTexture(this._ssaoBlurX.name, textureCreationOptions);

        this._ssaoBlurX.sourceTexture = ssaoTextureHandle!;
        this._ssaoBlurX.depthTexture = this.depthTexture;
        this._ssaoBlurX.sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
        this._ssaoBlurX.targetTexture = blurXTextureHandle;
        this._ssaoBlurX.record(true);

        const blurYTextureHandle = this._frameGraph.textureManager.createRenderTargetTexture(this._ssaoBlurY.name, textureCreationOptions);

        this._ssaoBlurY.sourceTexture = blurXTextureHandle;
        this._ssaoBlurY.depthTexture = this.depthTexture;
        this._ssaoBlurY.sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
        this._ssaoBlurY.targetTexture = blurYTextureHandle;
        this._ssaoBlurY.record(true);

        // SSAO Combine
        this._ssaoCombine.sourceTexture = this.sourceTexture;
        this._ssaoCombine.sourceSamplingMode = this.sourceSamplingMode;
        this._ssaoCombine.targetTexture = this.outputTexture;
        const combinerPass = this._ssaoCombine.record(
            true,
            (context) => {
                context.setTextureSamplingMode(this.sourceTexture, this.sourceSamplingMode);
                context.setTextureSamplingMode(blurYTextureHandle, Constants.TEXTURE_BILINEAR_SAMPLINGMODE);
            },
            (context) => {
                context.bindTextureHandle(this._ssaoCombine.drawWrapper.effect!, "textureSampler", blurYTextureHandle);
                context.bindTextureHandle(this._ssaoCombine.drawWrapper.effect!, "originalColor", this.sourceTexture);
            }
        );

        combinerPass.addDependencies(blurYTextureHandle);

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
        this._ssao.dispose();
        this._ssaoBlurX.dispose();
        this._ssaoBlurY.dispose();
        this._ssaoCombine.dispose();
        this.ssao.dispose();
        super.dispose();
    }
}
