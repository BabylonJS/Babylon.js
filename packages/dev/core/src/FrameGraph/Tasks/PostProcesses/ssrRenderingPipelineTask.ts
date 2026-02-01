import type { FrameGraph, FrameGraphTextureHandle, Camera, FrameGraphTextureCreationOptions } from "core/index";
import { Constants } from "core/Engines/constants";
import { FrameGraphTask } from "../../frameGraphTask";
import { ThinSSRRenderingPipeline } from "core/PostProcesses/RenderPipeline/Pipelines/thinSSRRenderingPipeline";
import { FrameGraphSSRTask } from "./ssrTask";
import { FrameGraphSSRBlurTask } from "./ssrBlurTask";
import { FrameGraphPostProcessTask } from "./postProcessTask";

/**
 * Task which applies a SSR post process.
 */
export class FrameGraphSSRRenderingPipelineTask extends FrameGraphTask {
    /**
     * The source texture to apply the SSR effect on.
     */
    public sourceTexture: FrameGraphTextureHandle;

    /**
     * The sampling mode to use for the source texture.
     */
    public sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;

    /**
     * The alpha mode to use when applying the SSR effect.
     */
    public get alphaMode() {
        return this._ssrBlurCombiner.alphaMode;
    }

    public set alphaMode(mode: number) {
        this._ssrBlurCombiner.alphaMode = mode;
    }

    /**
     * The normal texture used by the SSR effect.
     */
    public normalTexture: FrameGraphTextureHandle;

    /**
     * The depth texture used by the SSR effect.
     */
    public depthTexture: FrameGraphTextureHandle;

    /**
     * The back depth texture used by the SSR effect (optional).
     * This is used when automatic thickness computation is enabled.
     * The back depth texture is the depth texture of the scene rendered for the back side of the objects (that is, front faces are culled).
     */
    public backDepthTexture?: FrameGraphTextureHandle;

    /**
     * The reflectivity texture used by the SSR effect
     */
    public reflectivityTexture: FrameGraphTextureHandle;

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

        this.ssr.camera = camera;
    }

    /**
     * The target texture to render the SSR effect to.
     */
    public targetTexture?: FrameGraphTextureHandle;

    /**
     * The output texture of the SSR effect.
     */
    public readonly outputTexture: FrameGraphTextureHandle;

    /**
     * The SSR Rendering pipeline.
     */
    public readonly ssr: ThinSSRRenderingPipeline;

    /**
     * The name of the task.
     */
    public override get name() {
        return this._name;
    }

    public override set name(name: string) {
        this._name = name;
        if (this._ssr) {
            this._ssr.name = `${name} SSR main`;
        }
        if (this._ssrBlurX) {
            this._ssrBlurX.name = `${name} SSR Blur X`;
        }
        if (this._ssrBlurY) {
            this._ssrBlurY.name = `${name} SSR Blur Y`;
        }
        if (this._ssrBlurCombiner) {
            this._ssrBlurCombiner.name = `${name} SSR Blur Combiner`;
        }
    }

    /**
     * The texture type used by the different post processes created by SSR.
     * It's a read-only property. If you want to change it, you must recreate the task and pass the appropriate texture type to the constructor.
     */
    public readonly textureType: number;

    private readonly _ssr: FrameGraphSSRTask;
    private readonly _ssrBlurX: FrameGraphSSRBlurTask;
    private readonly _ssrBlurY: FrameGraphSSRBlurTask;
    private readonly _ssrBlurCombiner: FrameGraphPostProcessTask;

    /**
     * Constructs a SSR rendering pipeline task.
     * @param name The name of the task.
     * @param frameGraph The frame graph this task belongs to.
     * @param textureType The texture type used by the different post processes created by SSR (default: Constants.TEXTURETYPE_UNSIGNED_BYTE)
     */
    constructor(name: string, frameGraph: FrameGraph, textureType = Constants.TEXTURETYPE_UNSIGNED_BYTE) {
        super(name, frameGraph);

        this.textureType = textureType;

        this.ssr = new ThinSSRRenderingPipeline(name, frameGraph.scene);

        this._ssr = new FrameGraphSSRTask(`${name} SSR main`, this._frameGraph, this.ssr._ssrPostProcess);
        this._ssrBlurX = new FrameGraphSSRBlurTask(`${name} SSR Blur X`, this._frameGraph, this.ssr._ssrBlurXPostProcess);
        this._ssrBlurY = new FrameGraphSSRBlurTask(`${name} SSR Blur Y`, this._frameGraph, this.ssr._ssrBlurYPostProcess);
        this._ssrBlurCombiner = new FrameGraphPostProcessTask(`${name} SSR Blur Combiner`, this._frameGraph, this.ssr._ssrBlurCombinerPostProcess);

        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
    }

    public override isReady() {
        return this.ssr.isReady();
    }

    public override getClassName(): string {
        return "FrameGraphSSRRenderingPipelineTask";
    }

    public record(): void {
        if (
            this.sourceTexture === undefined ||
            this.normalTexture === undefined ||
            this.depthTexture === undefined ||
            this.reflectivityTexture === undefined ||
            this.camera === undefined
        ) {
            throw new Error(`FrameGraphSSRRenderingPipelineTask "${this.name}": sourceTexture, normalTexture, depthTexture, reflectivityTexture and camera are required`);
        }

        const sourceTextureDescription = this._frameGraph.textureManager.getTextureDescription(this.sourceTexture);

        this._ssr.sourceTexture = this.sourceTexture;
        this._ssr.sourceSamplingMode = this.sourceSamplingMode;
        this._ssr.camera = this.camera;
        this._ssr.normalTexture = this.normalTexture;
        this._ssr.depthTexture = this.depthTexture;
        this._ssr.backDepthTexture = this.backDepthTexture;
        this._ssr.reflectivityTexture = this.reflectivityTexture;

        let ssrTextureHandle: FrameGraphTextureHandle | undefined;

        const textureSize = {
            width: Math.floor(sourceTextureDescription.size.width / (this.ssr.ssrDownsample + 1)) || 1,
            height: Math.floor(sourceTextureDescription.size.height / (this.ssr.ssrDownsample + 1)) || 1,
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

        if (this.ssr.blurDispersionStrength > 0 || !this.targetTexture) {
            ssrTextureHandle = this._frameGraph.textureManager.createRenderTargetTexture(this._ssr.name, textureCreationOptions);
        }

        if (this.ssr.blurDispersionStrength === 0) {
            this._ssr.targetTexture = this.outputTexture;

            if (ssrTextureHandle !== undefined) {
                this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, ssrTextureHandle);
            } else {
                this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.targetTexture);
            }

            this._ssr.record(true);
        } else {
            this._ssr.targetTexture = ssrTextureHandle;
            this._ssr.record(true);

            textureSize.width = Math.floor(sourceTextureDescription.size.width / (this.ssr.blurDownsample + 1)) || 1;
            textureSize.height = Math.floor(sourceTextureDescription.size.height / (this.ssr.blurDownsample + 1)) || 1;

            const sourceTextureCreationOptions = this._frameGraph.textureManager.getTextureCreationOptions(this.sourceTexture);

            this._frameGraph.textureManager.resolveDanglingHandle(this.outputTexture, this.targetTexture, this.name + " Output", sourceTextureCreationOptions);

            const blurXTextureHandle = this._frameGraph.textureManager.createRenderTargetTexture(this._ssrBlurX.name, textureCreationOptions);

            this._ssrBlurX.sourceTexture = ssrTextureHandle!;
            this._ssrBlurX.sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
            this._ssrBlurX.targetTexture = blurXTextureHandle;
            this._ssrBlurX.record(true);

            const blurYTextureHandle = this._frameGraph.textureManager.createRenderTargetTexture(this._ssrBlurY.name, textureCreationOptions);

            this._ssrBlurY.sourceTexture = blurXTextureHandle;
            this._ssrBlurY.sourceSamplingMode = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
            this._ssrBlurY.targetTexture = blurYTextureHandle;
            this._ssrBlurY.record(true);

            this._ssrBlurCombiner.sourceTexture = this.sourceTexture;
            this._ssrBlurCombiner.sourceSamplingMode = this.sourceSamplingMode;
            this._ssrBlurCombiner.targetTexture = this.outputTexture;
            const combinerPass = this._ssrBlurCombiner.record(true, undefined, (context) => {
                context.bindTextureHandle(this._ssrBlurCombiner.drawWrapper.effect!, "mainSampler", this.sourceTexture);
                context.bindTextureHandle(this._ssrBlurCombiner.drawWrapper.effect!, "textureSampler", blurYTextureHandle);
                context.bindTextureHandle(this._ssrBlurCombiner.drawWrapper.effect!, "reflectivitySampler", this.reflectivityTexture);
                if (this.ssr.useFresnel) {
                    context.bindTextureHandle(this._ssrBlurCombiner.drawWrapper.effect!, "normalSampler", this.normalTexture);
                    context.bindTextureHandle(this._ssrBlurCombiner.drawWrapper.effect!, "depthSampler", this.depthTexture);
                }
            });

            combinerPass.addDependencies(blurYTextureHandle);
        }

        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.addDependencies(this.sourceTexture);

        passDisabled.setRenderTarget(this.outputTexture);
        passDisabled.setExecuteFunc((context) => {
            context.copyTexture(this.sourceTexture);
        });
    }

    public override dispose(): void {
        this._ssr.dispose();
        this._ssrBlurX.dispose();
        this._ssrBlurY.dispose();
        this._ssrBlurCombiner.dispose();
        this.ssr.dispose();
        super.dispose();
    }
}
