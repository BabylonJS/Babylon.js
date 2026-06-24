import { type DrawWrapper, type FrameGraph, type FrameGraphTextureCreationOptions, type FrameGraphTextureHandle } from "core/index";
import { Constants } from "core/Engines/constants";
import { type FrameGraphIblShadowsVoxelizationTask } from "./iblShadowsVoxelizationTask";
import { Vector4 } from "core/Maths/math.vector.pure";
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

    protected _previousAccumulationTexture?: FrameGraphTextureHandle;
    protected _previousPositionTexture?: FrameGraphTextureHandle;

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

        const sharedTextureOptions = {
            createMipMaps: false,
            samples: 1,
            formats: [Constants.TEXTUREFORMAT_RGBA],
            useSRGBBuffers: [false],
            creationFlags: [0],
        };

        const outputCreationOptions: FrameGraphTextureCreationOptions = {
            size: outputSize,
            sizeIsPercentage: false,
            isHistoryTexture: false,
            options: { ...sharedTextureOptions, types: [Constants.TEXTURETYPE_HALF_FLOAT], labels: [`${this.name} Output`] },
        };

        const previousAccumulationCreationOptions: FrameGraphTextureCreationOptions = {
            size: outputSize,
            sizeIsPercentage: false,
            isHistoryTexture: false,
            options: { ...sharedTextureOptions, types: [Constants.TEXTURETYPE_HALF_FLOAT], labels: [`${this.name} Previous Accumulation`] },
        };

        const previousPositionCreationOptions: FrameGraphTextureCreationOptions = {
            size: positionSize,
            sizeIsPercentage: false,
            isHistoryTexture: false,
            options: { ...sharedTextureOptions, types: [Constants.TEXTURETYPE_HALF_FLOAT], labels: [`${this.name} Previous Position`] },
        };

        textureManager.resolveDanglingHandle(this.outputTexture, undefined, `${this.name} Output`, outputCreationOptions);

        this._previousAccumulationTexture = textureManager.createRenderTargetTexture(
            `${this.name} Previous Accumulation`,
            previousAccumulationCreationOptions,
            this._previousAccumulationTexture
        );
        this._previousPositionTexture = textureManager.createRenderTargetTexture(`${this.name} Previous Position`, previousPositionCreationOptions, this._previousPositionTexture);

        // Pass 1: Accumulate into outputTexture, sampling last frame's accumulation and position.
        const pass = this._frameGraph.addRenderPass(this.name);

        pass.addDependencies(this.sourceTexture);
        pass.addDependencies(this.velocityTexture);
        pass.addDependencies(this.positionTexture);
        pass.addDependencies(this._previousAccumulationTexture);
        pass.addDependencies(this._previousPositionTexture);
        pass.setRenderTarget(this.outputTexture);
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
                    context.bindTextureHandle(effect, "oldAccumulationSampler", this._previousAccumulationTexture!);
                    context.bindTextureHandle(effect, "prevPositionSampler", this._previousPositionTexture!);
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

        // Pass 2: Copy the current frame's world-position into previousPositionTexture so the
        // next frame's accumulation pass can use it as "previous frame positions".
        const copyPositionToPreviousPass = this._frameGraph.addRenderPass(`${this.name} CopyPositionToPrevious`);

        copyPositionToPreviousPass.addDependencies(this.positionTexture);
        copyPositionToPreviousPass.setRenderTarget(this._previousPositionTexture);
        copyPositionToPreviousPass.setExecuteFunc((context) => {
            context.copyTexture(this.positionTexture!);
        });

        // Pass 3: Copy the current frame's accumulation result into previousAccumulationTexture
        // so the next frame's accumulation pass can use it as oldAccumulationSampler.
        const copyAccumulationToPreviousPass = this._frameGraph.addRenderPass(`${this.name} CopyAccumulationToPrevious`);

        copyAccumulationToPreviousPass.addDependencies(this.outputTexture);
        copyAccumulationToPreviousPass.setRenderTarget(this._previousAccumulationTexture);
        copyAccumulationToPreviousPass.setExecuteFunc((context) => {
            context.copyTexture(this.outputTexture);
        });

        // Pass 4 (marker): empty execute, render target = outputTexture.
        // Ensures _checkTask sees outputTexture as the task's last enabled-pass output,
        // matching the disabled path. No render pass encoder is opened because the
        // execute function never calls _applyRenderTarget.
        const outputMarkerPass = this._frameGraph.addRenderPass(`${this.name} Output`);

        outputMarkerPass.setRenderTarget(this.outputTexture);
        outputMarkerPass.setExecuteFunc((_context) => {});
    }

    public override dispose(): void {
        this.postProcess.dispose();
        super.dispose();
    }
}
