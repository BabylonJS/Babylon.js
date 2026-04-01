import { type DrawWrapper, type FrameGraph, type FrameGraphTextureCreationOptions, type FrameGraphTextureHandle } from "core/index";
import { Constants } from "core/Engines/constants";
import { type FrameGraphIblShadowsVoxelizationTask } from "./iblShadowsVoxelizationTask";
import { Vector4 } from "core/Maths/math.vector";
import { ThinCustomPostProcess } from "core/PostProcesses/thinCustomPostProcess";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { FrameGraphTask } from "../../../frameGraphTask";
import "../../../../Shaders/iblShadowAccumulation.fragment";
import "../../../../ShadersWGSL/iblShadowAccumulation.fragment";

/**
 * Task used to temporally accumulate IBL shadows.
 * @internal
 */
export class FrameGraphIblShadowsAccumulationTask extends FrameGraphTask {
    public sourceTexture?: FrameGraphTextureHandle;
    public velocityTexture?: FrameGraphTextureHandle;
    public positionTexture?: FrameGraphTextureHandle;

    public remanence = 0.75;
    public reset = true;
    public isMoving = false;
    public voxelGridSize = 1;
    /** Voxelization task providing the runtime voxelGridSize used by the accumulation shader. */
    public voxelizationTask?: FrameGraphIblShadowsVoxelizationTask;

    public accumulationHistoryTexture?: FrameGraphTextureHandle;
    public positionHistoryTexture?: FrameGraphTextureHandle;

    public readonly outputTexture: FrameGraphTextureHandle;
    public readonly outputAccumulationHistoryTexture: FrameGraphTextureHandle;
    public readonly outputPositionHistoryTexture: FrameGraphTextureHandle;

    public readonly postProcess: ThinCustomPostProcess;
    protected readonly _postProcessDrawWrapper: DrawWrapper;
    protected readonly _accumulationParams = new Vector4(0, 0, 0, 0);

    constructor(name: string, frameGraph: FrameGraph) {
        super(name, frameGraph);

        this.postProcess = new ThinCustomPostProcess(name, frameGraph.engine, {
            fragmentShader: "iblShadowAccumulation",
            uniforms: ["accumulationParameters"],
            samplers: ["spatialBlurSampler", "oldAccumulationSampler", "prevPositionSampler", "motionSampler", "positionSampler"],
            shaderLanguage: frameGraph.engine.isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
        });
        this._postProcessDrawWrapper = this.postProcess.drawWrapper;

        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.outputAccumulationHistoryTexture = this._frameGraph.textureManager.createDanglingHandle();
        this.outputPositionHistoryTexture = this._frameGraph.textureManager.createDanglingHandle();
    }

    public override getClassName(): string {
        return "FrameGraphIblShadowsAccumulationTask";
    }

    public override isReady(): boolean {
        return this.sourceTexture !== undefined && this.velocityTexture !== undefined && this.positionTexture !== undefined && this.postProcess.isReady();
    }

    public override record() {
        if (this.sourceTexture === undefined || this.velocityTexture === undefined || this.positionTexture === undefined) {
            throw new Error(`FrameGraphIblShadowsAccumulationTask ${this.name}: sourceTexture, velocityTexture and positionTexture are required`);
        }

        if (this.remanence < 0 || this.remanence > 1) {
            throw new Error(`FrameGraphIblShadowsAccumulationTask ${this.name}: remanence must be in the [0, 1] range`);
        }

        const textureManager = this._frameGraph.textureManager;
        const outputSize = textureManager.getTextureAbsoluteDimensions(this.sourceTexture);
        const positionSize = textureManager.getTextureAbsoluteDimensions(this.positionTexture);

        const outputCreationOptions: FrameGraphTextureCreationOptions = {
            size: outputSize,
            sizeIsPercentage: false,
            isHistoryTexture: false,
            options: {
                createMipMaps: false,
                samples: 1,
                types: [Constants.TEXTURETYPE_HALF_FLOAT],
                formats: [Constants.TEXTUREFORMAT_RGBA],
                useSRGBBuffers: [false],
                creationFlags: [0],
                labels: [`${this.name} Output`],
            },
        };

        textureManager.resolveDanglingHandle(this.outputTexture, undefined, `${this.name} Output`, outputCreationOptions);

        const accumulationHistoryCreationOptions: FrameGraphTextureCreationOptions = {
            size: outputSize,
            sizeIsPercentage: false,
            isHistoryTexture: true,
            options: {
                createMipMaps: false,
                samples: 1,
                types: [Constants.TEXTURETYPE_HALF_FLOAT],
                formats: [Constants.TEXTUREFORMAT_RGBA],
                useSRGBBuffers: [false],
                creationFlags: [0],
                labels: [`${this.name} History`],
            },
        };

        const positionHistoryCreationOptions: FrameGraphTextureCreationOptions = {
            size: positionSize,
            sizeIsPercentage: false,
            isHistoryTexture: false,
            options: {
                createMipMaps: false,
                samples: 1,
                types: [Constants.TEXTURETYPE_HALF_FLOAT],
                formats: [Constants.TEXTUREFORMAT_RGBA],
                useSRGBBuffers: [false],
                creationFlags: [0],
                labels: [`${this.name} Position History`],
            },
        };

        this.accumulationHistoryTexture = textureManager.createRenderTargetTexture(
            `${this.name} Accumulation History`,
            accumulationHistoryCreationOptions,
            this.accumulationHistoryTexture
        );
        this.positionHistoryTexture = textureManager.createRenderTargetTexture(`${this.name} Position History`, positionHistoryCreationOptions, this.positionHistoryTexture);

        textureManager.resolveDanglingHandle(this.outputAccumulationHistoryTexture, this.accumulationHistoryTexture);
        textureManager.resolveDanglingHandle(this.outputPositionHistoryTexture, this.positionHistoryTexture);

        const pass = this._frameGraph.addRenderPass(this.name);

        pass.addDependencies(this.sourceTexture);
        pass.addDependencies(this.velocityTexture);
        pass.addDependencies(this.positionTexture);
        pass.addDependencies(this.accumulationHistoryTexture);
        pass.addDependencies(this.positionHistoryTexture);
        // Accumulation writes directly to the history handle (current frame write side)
        // so oldAccumulationSampler reads previous-frame data automatically.
        // A dedicated copy pass then exposes a stable current-frame outputTexture.
        pass.setRenderTarget(this.accumulationHistoryTexture);
        pass.setExecuteFunc((context) => {
            context.setTextureSamplingMode(this.sourceTexture!, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
            context.setTextureSamplingMode(this.velocityTexture!, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
            context.setTextureSamplingMode(this.positionTexture!, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
            context.setTextureSamplingMode(this.accumulationHistoryTexture!, Constants.TEXTURE_BILINEAR_SAMPLINGMODE);
            context.setTextureSamplingMode(this.positionHistoryTexture!, Constants.TEXTURE_BILINEAR_SAMPLINGMODE);

            const remanence = this.isMoving ? this.remanence : 0.99;
            this._accumulationParams.set(remanence, this.reset ? 1.0 : 0.0, this.voxelizationTask?.voxelGridSize ?? this.voxelGridSize, 0.0);

            context.applyFullScreenEffect(
                this._postProcessDrawWrapper,
                () => {
                    const effect = this._postProcessDrawWrapper.effect!;

                    context.bindTextureHandle(effect, "spatialBlurSampler", this.sourceTexture!);
                    context.bindTextureHandle(effect, "oldAccumulationSampler", this.accumulationHistoryTexture!);
                    context.bindTextureHandle(effect, "prevPositionSampler", this.positionHistoryTexture!);
                    context.bindTextureHandle(effect, "motionSampler", this.velocityTexture!);
                    context.bindTextureHandle(effect, "positionSampler", this.positionTexture!);

                    effect.setVector4("accumulationParameters", this._accumulationParams);
                    this.postProcess.bind();
                },
                undefined,
                false,
                false,
                true
            );

            this.reset = false;
            this.isMoving = false;
        });

        const copyAccumulationToOutputPass = this._frameGraph.addRenderPass(`${this.name} CopyAccumulationToOutput`);

        copyAccumulationToOutputPass.addDependencies(this.accumulationHistoryTexture);
        copyAccumulationToOutputPass.setRenderTarget(this.outputTexture);
        copyAccumulationToOutputPass.setExecuteFunc((context) => {
            context.copyTexture(this.accumulationHistoryTexture!);
        });

        const copyPositionToHistoryPass = this._frameGraph.addRenderPass(`${this.name} CopyPositionToHistory`);

        copyPositionToHistoryPass.addDependencies(this.positionTexture);
        copyPositionToHistoryPass.setRenderTarget(this.positionHistoryTexture);
        copyPositionToHistoryPass.setExecuteFunc((context) => {
            context.copyTexture(this.positionTexture!);
        });

        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.addDependencies(this.sourceTexture);
        passDisabled.setRenderTarget(this.outputTexture);
        passDisabled.setExecuteFunc((context) => {
            context.copyTexture(this.sourceTexture!);
        });

        const copyPositionToHistoryPassDisabled = this._frameGraph.addRenderPass(`${this.name} CopyPositionToHistory_disabled`, true);

        copyPositionToHistoryPassDisabled.addDependencies(this.positionTexture);
        copyPositionToHistoryPassDisabled.setRenderTarget(this.positionHistoryTexture);
        copyPositionToHistoryPassDisabled.setExecuteFunc((context) => {
            context.copyTexture(this.positionTexture!);
        });
    }

    public override dispose(): void {
        this.postProcess.dispose();
        super.dispose();
    }
}
