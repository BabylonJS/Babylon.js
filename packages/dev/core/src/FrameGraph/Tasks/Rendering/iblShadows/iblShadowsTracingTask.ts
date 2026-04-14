import { type Camera, type DrawWrapper, type FrameGraph, type FrameGraphTextureCreationOptions, type FrameGraphTextureHandle } from "core/index";
import { Constants } from "core/Engines/constants";
import { type FrameGraphIblShadowsVoxelizationTask } from "./iblShadowsVoxelizationTask";
import { Matrix, Vector4 } from "core/Maths/math.vector";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { ThinCustomPostProcess } from "core/PostProcesses/thinCustomPostProcess";
import { FrameGraphTask } from "../../../frameGraphTask";
import { Color4 } from "core/Maths/math.color";
import { type CubeTexture } from "core/Materials/Textures/cubeTexture";

/**
 * Task used to trace IBL shadows from a voxel grid.
 * @internal
 */
export class FrameGraphIblShadowsTracingTask extends FrameGraphTask {
    public camera?: Camera;
    public voxelGridTexture?: FrameGraphTextureHandle;
    public depthTexture?: FrameGraphTextureHandle;
    public normalTexture?: FrameGraphTextureHandle;
    public icdfTexture?: FrameGraphTextureHandle;
    public environmentTexture?: FrameGraphTextureHandle;
    public blueNoiseTexture?: FrameGraphTextureHandle;

    private _sampleDirections = 2;

    public get sampleDirections(): number {
        return this._sampleDirections;
    }

    public set sampleDirections(value: number) {
        this._sampleDirections = Math.max(1, Math.round(value));
    }

    public voxelShadowOpacity = 1;
    public ssShadowOpacity = 1;

    private _ssShadowSampleCount = 16;

    public get ssShadowSampleCount(): number {
        return this._ssShadowSampleCount;
    }

    public set ssShadowSampleCount(value: number) {
        this._ssShadowSampleCount = Math.max(1, Math.round(value));
    }

    private _ssShadowStride = 8;

    public get ssShadowStride(): number {
        return this._ssShadowStride;
    }

    public set ssShadowStride(value: number) {
        this._ssShadowStride = Math.max(1, Math.round(value));
    }
    /** Scale factor applied to voxelGridSize / 2^resolutionExp to get the max SSS ray distance. */
    public ssShadowDistanceScale = 1.25;
    /** Scale factor applied to voxelGridSize to get the SSS surface thickness. */
    public ssShadowThicknessScale = 1.0;
    /** Voxelization task providing dynamic voxelGridSize and resolutionExp for SSS parameter derivation. */
    public voxelizationTask?: FrameGraphIblShadowsVoxelizationTask;
    public envRotation = 0;
    public voxelNormalBias = 1.4;
    public voxelDirectionBias = 1.75;
    public worldScaleMatrix = Matrix.Identity();

    public readonly outputTexture: FrameGraphTextureHandle;

    public readonly postProcess: ThinCustomPostProcess;
    protected readonly _postProcessDrawWrapper: DrawWrapper;
    protected readonly _shadowParameters = new Vector4(0, 0, 0, 0);
    protected readonly _sssParameters = new Vector4(0, 0, 0, 0);
    protected readonly _opacityParameters = new Vector4(0, 0, 0, 0);
    protected readonly _voxelBiasParameters = new Vector4(0, 0, 0, 0);
    protected readonly _cameraInvView = Matrix.Identity();
    protected readonly _cameraInvProj = Matrix.Identity();
    protected readonly _cameraInvViewProjection = Matrix.Identity();
    protected _frameId = 0;
    protected _coloredShadows = false;
    protected _currentDefines = "";

    constructor(name: string, frameGraph: FrameGraph) {
        super(name, frameGraph);

        this.postProcess = new ThinCustomPostProcess(name, frameGraph.engine, {
            fragmentShader: "iblShadowVoxelTracing",
            uniforms: [
                "viewMtx",
                "projMtx",
                "invProjMtx",
                "invViewMtx",
                "invVPMtx",
                "wsNormalizationMtx",
                "shadowParameters",
                "voxelBiasParameters",
                "sssParameters",
                "shadowOpacity",
            ],
            samplers: ["depthSampler", "worldNormalSampler", "blueNoiseSampler", "icdfSampler", "voxelGridSampler", "iblSampler"],
            shaderLanguage: frameGraph.engine.isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
        });
        this._postProcessDrawWrapper = this.postProcess.drawWrapper;

        this.outputTexture = this._frameGraph.textureManager.createDanglingHandle();
    }

    public override getClassName(): string {
        return "FrameGraphIblShadowsTracingTask";
    }

    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    public override initAsync(): Promise<unknown> {
        if (this._frameGraph.engine.isWebGPU) {
            return import("../../../../ShadersWGSL/iblShadowVoxelTracing.fragment");
        }

        return import("../../../../Shaders/iblShadowVoxelTracing.fragment");
    }

    public get coloredShadows(): boolean {
        return this._coloredShadows;
    }

    public set coloredShadows(value: boolean) {
        if (this._coloredShadows === value) {
            return;
        }

        this._coloredShadows = value;
        this._updateDefines();
    }

    public override isReady(): boolean {
        return this.postProcess.isReady();
    }

    public override record() {
        if (
            this.camera === undefined ||
            this.voxelGridTexture === undefined ||
            this.depthTexture === undefined ||
            this.normalTexture === undefined ||
            this.icdfTexture === undefined
        ) {
            throw new Error(`FrameGraphIblShadowsTracingTask ${this.name}: camera, voxelGridTexture, depthTexture, normalTexture and icdfTexture are required`);
        }

        const textureManager = this._frameGraph.textureManager;
        const size = textureManager.getTextureAbsoluteDimensions(this.depthTexture);
        const creationOptions: FrameGraphTextureCreationOptions = {
            size,
            sizeIsPercentage: false,
            isHistoryTexture: false,
            options: {
                createMipMaps: false,
                samples: 1,
                types: [Constants.TEXTURETYPE_UNSIGNED_BYTE],
                formats: [Constants.TEXTUREFORMAT_RGBA],
                useSRGBBuffers: [false],
                creationFlags: [0],
                labels: [`${this.name} Output`],
            },
        };

        textureManager.resolveDanglingHandle(this.outputTexture, undefined, `${this.name} Output`, creationOptions);

        this._updateDefines();

        const pass = this._frameGraph.addRenderPass(this.name);

        const dependencies: FrameGraphTextureHandle[] = [this.voxelGridTexture, this.depthTexture, this.normalTexture, this.icdfTexture];
        if (this.environmentTexture !== undefined) {
            dependencies.push(this.environmentTexture);
        }
        if (this.blueNoiseTexture !== undefined) {
            dependencies.push(this.blueNoiseTexture);
        }
        pass.addDependencies(dependencies);
        pass.setRenderTarget(this.outputTexture);
        pass.setExecuteFunc((context) => {
            if (this.icdfTexture === undefined || this.blueNoiseTexture === undefined || (this.coloredShadows && this.environmentTexture === undefined)) {
                context.clear(new Color4(1, 1, 1, 1), true, false, false);
                return;
            }

            context.setTextureSamplingMode(this.depthTexture!, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
            context.setTextureSamplingMode(this.normalTexture!, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
            context.setTextureSamplingMode(this.icdfTexture!, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
            context.setTextureSamplingMode(this.blueNoiseTexture, Constants.TEXTURE_NEAREST_SAMPLINGMODE);

            const view = this.camera!.getViewMatrix();
            const projection = this.camera!.getProjectionMatrix();
            projection.invertToRef(this._cameraInvProj);
            view.invertToRef(this._cameraInvView);
            this.camera!.getTransformationMatrix().invertToRef(this._cameraInvViewProjection);

            const voxelGridSize = textureManager.getTextureAbsoluteDimensions(this.voxelGridTexture!);
            const highestMip = Math.floor(Math.log2(Math.max(1, voxelGridSize.width)));

            this._frameId++;
            let rotation = 0.0;
            if (this.environmentTexture) {
                rotation = (this._frameGraph.scene.environmentTexture as CubeTexture).rotationY ?? 0;
            }
            rotation = this._frameGraph.scene.useRightHandedSystem ? -(rotation + 0.5 * Math.PI) : rotation - 0.5 * Math.PI;
            rotation = rotation % (2.0 * Math.PI);
            this._shadowParameters.set(this.sampleDirections, this._frameId, 1.0, rotation);
            this._voxelBiasParameters.set(this.voxelNormalBias, this.voxelDirectionBias, highestMip, 0.0);
            const gridSize = this.voxelizationTask?.voxelGridSize ?? 1.0;
            const resExp = this.voxelizationTask?.resolutionExp ?? 6;
            const sssMaxDist = (this.ssShadowDistanceScale * gridSize) / (1 << resExp);
            const sssThickness = this.ssShadowThicknessScale * 0.005 * gridSize;
            this._sssParameters.set(this.ssShadowSampleCount, this.ssShadowStride, sssMaxDist, sssThickness);
            this._opacityParameters.set(this.voxelShadowOpacity, this.ssShadowOpacity, 0.0, 0.0);

            context.applyFullScreenEffect(
                this._postProcessDrawWrapper,
                () => {
                    const effect = this._postProcessDrawWrapper.effect!;

                    context.bindTextureHandle(effect, "voxelGridSampler", this.voxelGridTexture!);
                    context.bindTextureHandle(effect, "depthSampler", this.depthTexture!);
                    context.bindTextureHandle(effect, "worldNormalSampler", this.normalTexture!);
                    context.bindTextureHandle(effect, "icdfSampler", this.icdfTexture!);
                    context.bindTextureHandle(effect, "blueNoiseSampler", this.blueNoiseTexture!);
                    if (this.coloredShadows && this.environmentTexture !== undefined) {
                        context.bindTextureHandle(effect, "iblSampler", this.environmentTexture);
                    }

                    effect.setMatrix("viewMtx", view);
                    effect.setMatrix("projMtx", projection);
                    effect.setMatrix("invProjMtx", this._cameraInvProj);
                    effect.setMatrix("invViewMtx", this._cameraInvView);
                    effect.setMatrix("invVPMtx", this._cameraInvViewProjection);
                    effect.setMatrix("wsNormalizationMtx", this.worldScaleMatrix);
                    effect.setVector4("shadowParameters", this._shadowParameters);
                    effect.setVector4("voxelBiasParameters", this._voxelBiasParameters);
                    effect.setVector4("sssParameters", this._sssParameters);
                    effect.setVector4("shadowOpacity", this._opacityParameters);

                    this.postProcess.bind();
                },
                undefined,
                false,
                false,
                true
            );
        });
    }

    public override dispose(): void {
        this.postProcess.dispose();
        super.dispose();
    }

    protected _updateDefines(): void {
        const defines: string[] = ["#define WORLD_NORMAL_UNSIGNED"];

        if (this._frameGraph.scene.useRightHandedSystem) {
            defines.push("#define RIGHT_HANDED");
        }
        if (this.coloredShadows) {
            defines.push("#define COLOR_SHADOWS 1u");
        }

        const defineString = defines.join("\n");
        if (defineString !== this._currentDefines) {
            this._currentDefines = defineString;
            this.postProcess.updateEffect(this._currentDefines);
        }
    }
}
