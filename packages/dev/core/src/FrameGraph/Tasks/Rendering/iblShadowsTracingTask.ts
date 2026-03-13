import type { Camera, DrawWrapper, FrameGraph, FrameGraphTextureCreationOptions, FrameGraphTextureHandle } from "core/index";
import { Constants } from "core/Engines/constants";
import { Matrix, Vector4 } from "core/Maths/math.vector";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { ThinCustomPostProcess } from "core/PostProcesses/thinCustomPostProcess";
import { FrameGraphTask } from "../../frameGraphTask";
import "../../../Shaders/iblShadowVoxelTracing.fragment";
import "../../../ShadersWGSL/iblShadowVoxelTracing.fragment";

/**
 * Task used to trace IBL shadows from a voxel grid.
 */
export class FrameGraphIblShadowsTracingTask extends FrameGraphTask {
    public camera?: Camera;
    public voxelGridTexture?: FrameGraphTextureHandle;
    public depthTexture?: FrameGraphTextureHandle;
    public normalTexture?: FrameGraphTextureHandle;
    public icdfTexture?: FrameGraphTextureHandle;
    public environmentTexture?: FrameGraphTextureHandle;
    public blueNoiseTexture?: FrameGraphTextureHandle;

    public sampleDirections = 2;
    public voxelShadowOpacity = 1;
    public ssShadowOpacity = 1;
    public ssShadowSampleCount = 16;
    public ssShadowStride = 8;
    public ssShadowDistanceScale = 1.25;
    public ssShadowThicknessScale = 1;
    public envRotation = 0;
    public coloredShadows = false;
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

    public override isReady(): boolean {
        return (
            this.camera !== undefined &&
            this.voxelGridTexture !== undefined &&
            this.depthTexture !== undefined &&
            this.normalTexture !== undefined &&
            this.icdfTexture !== undefined
        );
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

        if (this.sampleDirections < 1) {
            throw new Error(`FrameGraphIblShadowsTracingTask ${this.name}: sampleDirections must be >= 1`);
        }

        if (this.ssShadowSampleCount < 1) {
            throw new Error(`FrameGraphIblShadowsTracingTask ${this.name}: ssShadowSampleCount must be >= 1`);
        }

        if (this.ssShadowStride < 1) {
            throw new Error(`FrameGraphIblShadowsTracingTask ${this.name}: ssShadowStride must be >= 1`);
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

        const pass = this._frameGraph.addRenderPass(this.name);

        pass.addDependencies(this.voxelGridTexture);
        pass.addDependencies(this.depthTexture);
        pass.addDependencies(this.normalTexture);
        pass.addDependencies(this.icdfTexture);
        pass.addDependencies(this.environmentTexture);
        pass.addDependencies(this.blueNoiseTexture);
        pass.setRenderTarget(this.outputTexture);
        pass.setExecuteFunc((context) => {
            context.setTextureSamplingMode(this.voxelGridTexture!, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
            context.setTextureSamplingMode(this.depthTexture!, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
            context.setTextureSamplingMode(this.normalTexture!, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
            context.setTextureSamplingMode(this.icdfTexture!, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
            if (this.blueNoiseTexture !== undefined) {
                context.setTextureSamplingMode(this.blueNoiseTexture, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
            }
            if (this.environmentTexture !== undefined) {
                context.setTextureSamplingMode(this.environmentTexture, Constants.TEXTURE_TRILINEAR_SAMPLINGMODE);
            }

            this._updateDefines();

            const view = this.camera!.getViewMatrix();
            const projection = this.camera!.getProjectionMatrix();
            projection.invertToRef(this._cameraInvProj);
            view.invertToRef(this._cameraInvView);
            this.camera!.getTransformationMatrix().invertToRef(this._cameraInvViewProjection);

            const voxelGridSize = textureManager.getTextureAbsoluteDimensions(this.voxelGridTexture!);
            const highestMip = Math.floor(Math.log2(Math.max(1, voxelGridSize.width)));

            this._frameId++;
            this._shadowParameters.set(this.sampleDirections, this._frameId, 1.0, this.envRotation);
            this._voxelBiasParameters.set(this.voxelNormalBias, this.voxelDirectionBias, highestMip, 0.0);
            this._sssParameters.set(this.ssShadowSampleCount, this.ssShadowStride, 0.05 * this.ssShadowDistanceScale, 0.5 * this.ssShadowThicknessScale);
            this._opacityParameters.set(this.voxelShadowOpacity, this.ssShadowOpacity, 0.0, 0.0);

            context.applyFullScreenEffect(
                this._postProcessDrawWrapper,
                () => {
                    const effect = this._postProcessDrawWrapper.effect!;

                    context.bindTextureHandle(effect, "voxelGridSampler", this.voxelGridTexture!);
                    context.bindTextureHandle(effect, "depthSampler", this.depthTexture!);
                    context.bindTextureHandle(effect, "worldNormalSampler", this.normalTexture!);
                    context.bindTextureHandle(effect, "icdfSampler", this.icdfTexture!);
                    if (this.blueNoiseTexture !== undefined) {
                        context.bindTextureHandle(effect, "blueNoiseSampler", this.blueNoiseTexture);
                    }
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

        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);

        passDisabled.addDependencies(this.depthTexture);
        passDisabled.setRenderTarget(this.outputTexture);
        passDisabled.setExecuteFunc((context) => {
            context.clear(null, true, false, false);
        });
    }

    public override dispose(): void {
        this.postProcess.dispose();
        super.dispose();
    }

    protected _updateDefines(): void {
        const defines: string[] = [];

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
