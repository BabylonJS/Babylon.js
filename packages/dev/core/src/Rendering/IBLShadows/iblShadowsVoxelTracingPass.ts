import { Constants } from "../../Engines/constants";
import type { AbstractEngine } from "../../Engines/abstractEngine";
import type { Scene } from "../../scene";
import { Matrix, Vector4 } from "../../Maths/math.vector";
import { PostProcess } from "../../PostProcesses/postProcess";
import type { PostProcessOptions } from "../../PostProcesses/postProcess";
import type { IblShadowsRenderPipeline } from "./iblShadowsRenderPipeline";
import type { Camera } from "../../Cameras/camera";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { GeometryBufferRenderer } from "../../Rendering/geometryBufferRenderer";
import { ProceduralTexture } from "core/Materials/Textures/Procedurals/proceduralTexture";
import type { IProceduralTextureCreationOptions } from "core/Materials/Textures/Procedurals/proceduralTexture";
import type { CubeTexture } from "../../Materials/Textures/cubeTexture";
import { Logger } from "../../Misc/logger";
import type { EventState } from "../../Misc/observable";
import type { Nullable } from "../../types";

/**
 * Build cdf maps for IBL importance sampling during IBL shadow computation.
 * This should not be instantiated directly, as it is part of a scene component
 * @internal
 */
export class _IblShadowsVoxelTracingPass {
    private _scene: Scene;
    private _engine: AbstractEngine;
    private _renderPipeline: IblShadowsRenderPipeline;
    private _voxelShadowOpacity: number = 1.0;
    /**
     * The opacity of the shadow cast from the voxel grid
     */
    public get voxelShadowOpacity(): number {
        return this._voxelShadowOpacity;
    }
    /**
     * The opacity of the shadow cast from the voxel grid
     */
    public set voxelShadowOpacity(value: number) {
        this._voxelShadowOpacity = value;
    }
    private _sssSamples: number = 16;
    private _sssStride: number = 8;
    private _sssMaxDist: number = 0.05;
    private _sssThickness: number = 0.5;

    private _ssShadowOpacity: number = 1.0;
    /**
     * The opacity of the screen-space shadow
     */
    public get ssShadowOpacity(): number {
        return this._ssShadowOpacity;
    }
    /**
     * The opacity of the screen-space shadow
     */
    public set ssShadowOpacity(value: number) {
        this._ssShadowOpacity = value;
    }

    /**
     * The number of samples used in the screen space shadow pass.
     */
    public get sssSamples(): number {
        return this._sssSamples;
    }

    /**
     * The number of samples used in the screen space shadow pass.
     */
    public set sssSamples(value: number) {
        this._sssSamples = value;
    }

    /**
     * The stride used in the screen space shadow pass. This controls the distance between samples.
     */
    public get sssStride(): number {
        return this._sssStride;
    }

    /**
     * The stride used in the screen space shadow pass. This controls the distance between samples.
     */
    public set sssStride(value: number) {
        this._sssStride = value;
    }

    /**
     * The maximum distance that the screen-space shadow will be able to occlude.
     */
    public get sssMaxDist(): number {
        return this._sssMaxDist;
    }

    /**
     * The maximum distance that the screen-space shadow will be able to occlude.
     */
    public set sssMaxDist(value: number) {
        this._sssMaxDist = value;
    }

    /**
     * The thickness of the screen-space shadow
     */
    public get sssThickness(): number {
        return this._sssThickness;
    }

    /**
     * The thickness of the screen-space shadow
     */
    public set sssThickness(value: number) {
        this._sssThickness = value;
    }

    private _outputTexture: ProceduralTexture;
    private _cameraInvView: Matrix = Matrix.Identity();
    private _cameraInvProj: Matrix = Matrix.Identity();
    private _invWorldScaleMatrix: Matrix = Matrix.Identity();
    private _frameId: number = 0;
    private _sampleDirections: number = 4;
    private _shadowParameters: Vector4 = new Vector4(0.0, 0.0, 0.0, 0.0);
    private _sssParameters: Vector4 = new Vector4(0.0, 0.0, 0.0, 0.0);
    private _opacityParameters: Vector4 = new Vector4(0.0, 0.0, 0.0, 0.0);
    private _voxelBiasParameters: Vector4 = new Vector4(0.0, 0.0, 0.0, 0.0);
    private _voxelNormalBias: number = 1.4;
    /**
     * The bias to apply to the voxel sampling in the direction of the surface normal of the geometry.
     */
    public get voxelNormalBias(): number {
        return this._voxelNormalBias;
    }
    public set voxelNormalBias(value: number) {
        this._voxelNormalBias = value;
    }

    private _voxelDirectionBias: number = 1.75;
    /**
     * The bias to apply to the voxel sampling in the direction of the light.
     */
    public get voxelDirectionBias(): number {
        return this._voxelDirectionBias;
    }
    public set voxelDirectionBias(value: number) {
        this._voxelDirectionBias = value;
    }

    /**
     * Is the effect enabled
     */
    public enabled: boolean = true;

    /**
     * The number of directions to sample for the voxel tracing.
     */
    public get sampleDirections(): number {
        return this._sampleDirections;
    }

    /**
     * The number of directions to sample for the voxel tracing.
     */
    public set sampleDirections(value: number) {
        this._sampleDirections = value;
    }

    /**
     * The current rotation of the environment map, in radians.
     */
    public get envRotation(): number {
        return this._envRotation;
    }

    /**
     * The current rotation of the environment map, in radians.
     */
    public set envRotation(value: number) {
        this._envRotation = value;
    }

    /** Enable the debug view for this pass */
    public debugEnabled: boolean = false;

    /**
     * Returns the output texture of the pass.
     * @returns The output texture.
     */
    public getOutputTexture(): ProceduralTexture {
        return this._outputTexture;
    }

    /**
     * Gets the debug pass post process. This will create the resources for the pass
     * if they don't already exist.
     * @returns The post process
     */
    public getDebugPassPP(): PostProcess {
        if (!this._debugPassPP) {
            this._createDebugPass();
        }
        return this._debugPassPP;
    }

    private _debugPassName: string = "Voxel Tracing Debug Pass";

    /**
     * The name of the debug pass
     */
    public get debugPassName(): string {
        return this._debugPassName;
    }

    /** The default rotation of the environment map will align the shadows with the default lighting orientation */
    private _envRotation: number = 0.0;

    /**
     * Set the matrix to use for scaling the world space to voxel space
     * @param matrix The matrix to use for scaling the world space to voxel space
     */
    public setWorldScaleMatrix(matrix: Matrix) {
        this._invWorldScaleMatrix = matrix;
    }

    /**
     * Render the shadows in color rather than black and white.
     * This is slightly more expensive than black and white shadows but can be much
     * more accurate when the strongest lights in the IBL are non-white.
     */
    public set coloredShadows(value: boolean) {
        this._coloredShadows = value;
    }
    public get coloredShadows(): boolean {
        return this._coloredShadows;
    }
    private _coloredShadows: boolean = false;

    private _debugVoxelMarchEnabled: boolean = false;
    private _debugPassPP: PostProcess;
    private _debugSizeParams: Vector4 = new Vector4(0.0, 0.0, 0.0, 0.0);

    /**
     * Sets params that control the position and scaling of the debug display on the screen.
     * @param x Screen X offset of the debug display (0-1)
     * @param y Screen Y offset of the debug display (0-1)
     * @param widthScale X scale of the debug display (0-1)
     * @param heightScale Y scale of the debug display (0-1)
     */
    public setDebugDisplayParams(x: number, y: number, widthScale: number, heightScale: number) {
        this._debugSizeParams.set(x, y, widthScale, heightScale);
    }

    /**
     * Creates the debug post process effect for this pass
     */
    private _createDebugPass() {
        const isWebGPU = this._engine.isWebGPU;
        if (!this._debugPassPP) {
            const debugOptions: PostProcessOptions = {
                width: this._engine.getRenderWidth(),
                height: this._engine.getRenderHeight(),
                uniforms: ["sizeParams"],
                samplers: ["debugSampler"],
                engine: this._engine,
                reusable: true,
                shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
                extraInitializations: (useWebGPU: boolean, list: Promise<any>[]) => {
                    if (useWebGPU) {
                        list.push(import("../../ShadersWGSL/iblShadowDebug.fragment"));
                    } else {
                        list.push(import("../../Shaders/iblShadowDebug.fragment"));
                    }
                },
            };
            this._debugPassPP = new PostProcess(this.debugPassName, "iblShadowDebug", debugOptions);
            this._debugPassPP.autoClear = false;
            this._debugPassPP.onApplyObservable.add((effect) => {
                // update the caustic texture with what we just rendered.
                effect.setTexture("debugSampler", this._outputTexture);
                effect.setVector4("sizeParams", this._debugSizeParams);
            });
        }
    }

    /**
     * Instantiates the shadow voxel-tracing pass
     * @param scene Scene to attach to
     * @param iblShadowsRenderPipeline The IBL shadows render pipeline
     * @returns The shadow voxel-tracing pass
     */
    constructor(scene: Scene, iblShadowsRenderPipeline: IblShadowsRenderPipeline) {
        this._scene = scene;
        this._engine = scene.getEngine();
        this._renderPipeline = iblShadowsRenderPipeline;
        this._createTextures();
    }

    private _createTextures() {
        const defines = this._createDefines();
        const isWebGPU = this._engine.isWebGPU;
        const textureOptions: IProceduralTextureCreationOptions = {
            type: Constants.TEXTURETYPE_UNSIGNED_BYTE,
            format: Constants.TEXTUREFORMAT_RGBA,
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            generateDepthBuffer: false,
            shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            extraInitializationsAsync: async () => {
                if (isWebGPU) {
                    await Promise.all([import("../../ShadersWGSL/iblShadowVoxelTracing.fragment")]);
                } else {
                    await Promise.all([import("../../Shaders/iblShadowVoxelTracing.fragment")]);
                }
            },
        };
        this._outputTexture = new ProceduralTexture(
            "voxelTracingPass",
            {
                width: this._engine.getRenderWidth(),
                height: this._engine.getRenderHeight(),
            },
            "iblShadowVoxelTracing",
            this._scene,
            textureOptions
        );
        this._outputTexture.refreshRate = -1;
        this._outputTexture.autoClear = false;
        this._outputTexture.defines = defines;
        // Need to set all the textures first so that the effect gets created with the proper uniforms.
        this._setBindings(this._scene.activeCamera!);
        this._renderWhenGBufferReady = this._render.bind(this);
        // Don't start rendering until the first vozelization is done.
        this._renderPipeline.onVoxelizationCompleteObservable.addOnce(() => {
            if (this._scene.geometryBufferRenderer) {
                this._scene.geometryBufferRenderer.getGBuffer().onAfterRenderObservable.add(this._renderWhenGBufferReady);
            }
        });
    }

    private _createDefines(): string {
        let defines = "";
        if (this._scene.useRightHandedSystem) {
            defines += "#define RIGHT_HANDED\n";
        }
        if (this._debugVoxelMarchEnabled) {
            defines += "#define VOXEL_MARCH_DIAGNOSTIC_INFO_OPTION 1u\n";
        }
        if (this._coloredShadows) {
            defines += "#define COLOR_SHADOWS 1u\n";
        }
        return defines;
    }

    private _setBindings(camera: Camera): boolean {
        this._outputTexture.defines = this._createDefines();
        this._outputTexture.setMatrix("viewMtx", camera.getViewMatrix());
        this._outputTexture.setMatrix("projMtx", camera.getProjectionMatrix());
        camera.getProjectionMatrix().invertToRef(this._cameraInvProj);
        camera.getViewMatrix().invertToRef(this._cameraInvView);
        this._outputTexture.setMatrix("invProjMtx", this._cameraInvProj);
        this._outputTexture.setMatrix("invViewMtx", this._cameraInvView);
        this._outputTexture.setMatrix("wsNormalizationMtx", this._invWorldScaleMatrix);

        this._frameId++;

        let rotation = 0.0;
        if (this._scene.environmentTexture) {
            rotation = (this._scene.environmentTexture as CubeTexture).rotationY ?? 0;
        }
        rotation = this._scene.useRightHandedSystem ? -(rotation + 0.5 * Math.PI) : rotation - 0.5 * Math.PI;
        rotation = rotation % (2.0 * Math.PI);
        this._shadowParameters.set(this._sampleDirections, this._frameId, 1.0, rotation);
        this._outputTexture.setVector4("shadowParameters", this._shadowParameters);
        const voxelGrid = this._renderPipeline._getVoxelGridTexture();
        const highestMip = Math.floor(Math.log2(voxelGrid.getSize().width));
        this._voxelBiasParameters.set(this._voxelNormalBias, this._voxelDirectionBias, highestMip, 0.0);
        this._outputTexture.setVector4("voxelBiasParameters", this._voxelBiasParameters);

        // SSS Options.
        this._sssParameters.set(this._sssSamples, this._sssStride, this._sssMaxDist, this._sssThickness);
        this._outputTexture.setVector4("sssParameters", this._sssParameters);
        this._opacityParameters.set(this._voxelShadowOpacity, this._ssShadowOpacity, 0.0, 0.0);
        this._outputTexture.setVector4("shadowOpacity", this._opacityParameters);
        this._outputTexture.setTexture("voxelGridSampler", voxelGrid);
        this._outputTexture.setTexture("blueNoiseSampler", this._renderPipeline._getNoiseTexture());
        const cdfGenerator = this._scene.iblCdfGenerator;
        if (!cdfGenerator) {
            Logger.Warn("IBLShadowsVoxelTracingPass: Can't bind for render because iblCdfGenerator is not enabled.");
            return false;
        }
        this._outputTexture.setTexture("icdfSampler", cdfGenerator.getIcdfTexture());
        if (this._coloredShadows && this._scene.environmentTexture) {
            this._outputTexture.setTexture("iblSampler", this._scene.environmentTexture);
        }

        const geometryBufferRenderer = this._scene.geometryBufferRenderer;
        if (!geometryBufferRenderer) {
            Logger.Warn("IBLShadowsVoxelTracingPass: Can't bind for render because GeometryBufferRenderer is not enabled.");
            return false;
        }
        const depthIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.SCREENSPACE_DEPTH_TEXTURE_TYPE);
        this._outputTexture.setTexture("depthSampler", geometryBufferRenderer.getGBuffer().textures[depthIndex]);
        const wnormalIndex = geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.NORMAL_TEXTURE_TYPE);
        this._outputTexture.setTexture("worldNormalSampler", geometryBufferRenderer.getGBuffer().textures[wnormalIndex]);
        return true;
    }

    private _render() {
        if (this.enabled && this._outputTexture.isReady() && this._outputTexture.getEffect()?.isReady()) {
            if (this._setBindings(this._scene.activeCamera!)) {
                this._outputTexture.render();
            }
        }
    }

    private _renderWhenGBufferReady: Nullable<(eventData: number, eventState: EventState) => void> = null;

    /**
     * Called by render pipeline when canvas resized.
     * @param scaleFactor The factor by which to scale the canvas size.
     */
    public resize(scaleFactor: number = 1.0) {
        const newSize = {
            width: Math.max(1.0, Math.floor(this._engine.getRenderWidth() * scaleFactor)),
            height: Math.max(1.0, Math.floor(this._engine.getRenderHeight() * scaleFactor)),
        };
        // Don't resize if the size is the same as the current size.
        if (this._outputTexture.getSize().width === newSize.width && this._outputTexture.getSize().height === newSize.height) {
            return;
        }
        this._outputTexture.resize(newSize, false);
    }

    /**
     * Checks if the pass is ready
     * @returns true if the pass is ready
     */
    public isReady() {
        return (
            this._outputTexture.isReady() &&
            !(this._debugPassPP && !this._debugPassPP.isReady()) &&
            this._scene.iblCdfGenerator &&
            this._scene.iblCdfGenerator.getIcdfTexture().isReady() &&
            this._renderPipeline._getVoxelGridTexture().isReady()
        );
    }

    /**
     * Disposes the associated resources
     */
    public dispose() {
        if (this._scene.geometryBufferRenderer && this._renderWhenGBufferReady) {
            const gBuffer = this._scene.geometryBufferRenderer.getGBuffer();
            gBuffer.onAfterRenderObservable.removeCallback(this._renderWhenGBufferReady);
        }
        this._outputTexture.dispose();
        if (this._debugPassPP) {
            this._debugPassPP.dispose();
        }
    }
}
