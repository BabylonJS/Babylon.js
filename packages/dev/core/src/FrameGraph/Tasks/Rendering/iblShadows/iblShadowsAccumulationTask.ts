import { type DrawWrapper, type FrameGraph, type FrameGraphTextureCreationOptions, type FrameGraphTextureHandle } from "core/index";
import { Constants } from "core/Engines/constants";
import { type FrameGraphIblShadowsVoxelizationTask } from "./iblShadowsVoxelizationTask";
import { Vector4 } from "core/Maths/math.vector";
import { ThinCustomPostProcess } from "core/PostProcesses/thinCustomPostProcess";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { FrameGraphTask } from "../../../frameGraphTask";

/**
 * Task used to temporally accumulate IBL shadows.
 * @internal
 */
export class FrameGraphIblShadowsAccumulationTask extends FrameGraphTask {
    public sourceTexture?: FrameGraphTextureHandle;
    public velocityTexture?: FrameGraphTextureHandle;
    public positionTexture?: FrameGraphTextureHandle;

    private _remanence = 0.75;

    public get remanence(): number {
        return this._remanence;
    }

    public set remanence(value: number) {
        this._remanence = Math.max(0, Math.min(value, 1));
    }
    public reset = true;
    public isMoving = false;
    public voxelGridSize = 1;
    /** Voxelization task providing the runtime voxelGridSize used by the accumulation shader. */
    public voxelizationTask?: FrameGraphIblShadowsVoxelizationTask;

    protected _accumulationHistoryTexture?: FrameGraphTextureHandle;
    protected _positionHistoryTexture?: FrameGraphTextureHandle;

    public readonly outputTexture: FrameGraphTextureHandle;

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
    }

    public override getClassName(): string {
        return "FrameGraphIblShadowsAccumulationTask";
    }

    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    public override initAsync(): Promise<unknown> {
        if (this._frameGraph.engine.isWebGPU) {
            return import("../../../../ShadersWGSL/iblShadowAccumulation.fragment");
        }

        return import("../../../../Shaders/iblShadowAccumulation.fragment");
    }

    public override isReady(): boolean {
        return this.postProcess.isReady();
    }

    public override record() {
        if (this.sourceTexture === undefined || this.velocityTexture === undefined || this.positionTexture === undefined) {
            throw new Error(`FrameGraphIblShadowsAccumulationTask ${this.name}: sourceTexture, velocityTexture and positionTexture are required`);
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
            isHistoryTexture: true,
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

        this._accumulationHistoryTexture = textureManager.createRenderTargetTexture(
            `${this.name} Accumulation History`,
            accumulationHistoryCreationOptions,
            this._accumulationHistoryTexture
        );
        this._positionHistoryTexture = textureManager.createRenderTargetTexture(`${this.name} Position History`, positionHistoryCreationOptions, this._positionHistoryTexture);

        const pass = this._frameGraph.addRenderPass(this.name);

        pass.addDependencies(this.sourceTexture);
        pass.addDependencies(this.velocityTexture);
        pass.addDependencies(this.positionTexture);
        pass.addDependencies(this._accumulationHistoryTexture);
        pass.addDependencies(this._positionHistoryTexture);
        // Accumulation writes directly to the history handle (current frame write side)
        // so oldAccumulationSampler reads previous-frame data automatically.
        // A dedicated copy pass then exposes a stable current-frame outputTexture.
        pass.setRenderTarget(this._accumulationHistoryTexture);
        pass.setExecuteFunc((context) => {
            context.setTextureSamplingMode(this.sourceTexture!, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
            context.setTextureSamplingMode(this.velocityTexture!, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
            context.setTextureSamplingMode(this.positionTexture!, Constants.TEXTURE_NEAREST_SAMPLINGMODE);

            const remanence = this.isMoving ? this.remanence : 0.99;
            this._accumulationParams.set(remanence, this.reset ? 1.0 : 0.0, this.voxelizationTask?.voxelGridSize ?? this.voxelGridSize, 0.0);

            context.applyFullScreenEffect(
                this._postProcessDrawWrapper,
                () => {
                    const effect = this._postProcessDrawWrapper.effect!;

                    context.bindTextureHandle(effect, "spatialBlurSampler", this.sourceTexture!);
                    context.bindTextureHandle(effect, "oldAccumulationSampler", this._accumulationHistoryTexture!);
                    context.bindTextureHandle(effect, "prevPositionSampler", this._positionHistoryTexture!);
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

        const copyPositionToHistoryPass = this._frameGraph.addRenderPass(`${this.name} CopyPositionToHistory`);

        copyPositionToHistoryPass.addDependencies(this.positionTexture);
        copyPositionToHistoryPass.setRenderTarget(this._positionHistoryTexture);
        copyPositionToHistoryPass.setExecuteFunc((context) => {
            context.copyTexture(this.positionTexture!);
        });

        const copyAccumulationToOutputPass = this._frameGraph.addRenderPass(`${this.name} CopyAccumulationToOutput`);

        copyAccumulationToOutputPass.addDependencies(this._accumulationHistoryTexture);
        copyAccumulationToOutputPass.setRenderTarget(this.outputTexture);
        copyAccumulationToOutputPass.setExecuteFunc((context) => {
            context.copyTexture(this._accumulationHistoryTexture!);
        });
    }

    public override dispose(): void {
        this.postProcess.dispose();
        super.dispose();
    }
}
