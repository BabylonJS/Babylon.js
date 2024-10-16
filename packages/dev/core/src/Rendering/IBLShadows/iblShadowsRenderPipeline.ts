import { Constants } from "../../Engines/constants";
import { EngineStore } from "../../Engines/engineStore";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import { Matrix, Vector3, Vector4, Quaternion } from "../../Maths/math.vector";
import { Mesh } from "../../Meshes/mesh";
import type { Scene } from "../../scene";
import type { BaseTexture } from "../../Materials/Textures/baseTexture";
import { Texture } from "../../Materials/Textures/texture";
import { Logger } from "../../Misc/logger";
import { _IblShadowsVoxelRenderer } from "./iblShadowsVoxelRenderer";
import { _IblShadowsVoxelTracingPass } from "./iblShadowsVoxelTracingPass";

import { PostProcess } from "../../PostProcesses/postProcess";
import type { PostProcessOptions } from "../../PostProcesses/postProcess";
import { _IblShadowsImportanceSamplingRenderer } from "./iblShadowsImportanceSamplingRenderer";
import { _IblShadowsSpatialBlurPass } from "./iblShadowsSpatialBlurPass";
import { _IblShadowsAccumulationPass } from "./iblShadowsAccumulationPass";
import { ArcRotateCamera } from "../../Cameras/arcRotateCamera";
import { FreeCamera } from "../../Cameras/freeCamera";
import { PostProcessRenderPipeline } from "../../PostProcesses/RenderPipeline/postProcessRenderPipeline";
import { PostProcessRenderEffect } from "core/PostProcesses/RenderPipeline/postProcessRenderEffect";
import type { Camera } from "core/Cameras/camera";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { GeometryBufferRenderer } from "core/Rendering/geometryBufferRenderer";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { RawTexture3D } from "core/Materials/Textures/rawTexture3D";
import { Engine } from "core/Engines/engine";
import { IBLShadowsPluginMaterial } from "./iblShadowsPluginMaterial";
import { Material } from "core/Materials/material";

interface IblShadowsSettings {
    /**
     * The exponent of the resolution of the voxel shadow grid. Higher resolutions will result in sharper
     * shadows but are more expensive to compute and require more memory.
     * The resolution is calculated as 2 to the power of this number.
     */
    resolutionExp: number;

    /**
     * The number of different directions to sample during the voxel tracing pass. Higher
     * values will result in better quality, more stable shadows but are more expensive to compute.
     */
    sampleDirections: number;

    /**
     * How dark the shadows are. 1.0 is full opacity, 0.0 is no shadows.
     */
    shadowOpacity: number;

    /**
     * How long the shadows remain in the scene. 0.0 is no persistence, 1.0 is full persistence.
     */
    shadowRemenance: number;

    /**
     * Render the voxel grid from 3 different axis. This will result in better quality shadows with fewer
     * bits of missing geometry.
     */
    triPlanarVoxelization: boolean;

    /**
     * A multiplier for the render size of the shadows. Used for rendering lower-resolution shadows
     * to increase performance. Should be a value between 0 and 1.
     */
    shadowRenderSizeFactor: number;

    /**
     * Separate control for the opacity of the voxel shadows.
     */
    voxelShadowOpacity: number;

    /**
     * Include screen-space shadows in the IBL shadow pipeline. This adds sharp shadows to small details
     * but only applies close to a shadow-casting object.
     */
    ssShadowsEnabled: boolean;

    /**
     * The number of samples used in the screen space shadow pass.
     */
    ssShadowSampleCount: number;

    /**
     * The stride of the screen-space shadow pass. This controls the distance between samples.
     */
    ssShadowStride: number;

    /**
     * The maximum distance a shadow can be cast in screen space. This should usually be kept small
     * as screenspace shadows are mostly useful for small details.
     */
    ssShadowDistanceScale: number;

    /**
     * Screen-space shadow thickness. This value controls the perceived thickness of the SS shadows.
     */
    ssShadowThickness: number;
}

/**
 * Voxel-based shadow rendering for IBL's.
 * This should not be instanciated directly, as it is part of a scene component
 */
export class IblShadowsRenderPipeline extends PostProcessRenderPipeline {
    /**
     * The scene that this pipeline is attached to
     */
    public scene: Scene;

    private _allowDebugPasses: boolean = false;
    private _debugPasses: { pass: PostProcess; enabled: boolean }[] = [];

    private _geometryBufferRenderer: GeometryBufferRenderer;

    private _excludedMeshes: number[] = [];

    private _voxelRenderer: _IblShadowsVoxelRenderer;
    private _importanceSamplingRenderer: _IblShadowsImportanceSamplingRenderer;
    private _voxelTracingPass: _IblShadowsVoxelTracingPass;
    private _spatialBlurPass: _IblShadowsSpatialBlurPass;
    private _accumulationPass: _IblShadowsAccumulationPass;
    private _noiseTexture: Texture;
    private _dummyTexture2d: RawTexture;
    private _dummyTexture3d: RawTexture3D;
    private _shadowOpacity: number = 0.75;
    private _enabled: boolean = true;
    private _materialsWithRenderPlugin: Material[] = [];

    /**
     * The current world-space size of that the voxel grid covers in the scene.
     */
    public voxelGridSize: number = 1.0;

    /**
     * How dark the shadows appear. 1.0 is full opacity, 0.0 is no shadows.
     */
    public get shadowOpacity(): number {
        return this._shadowOpacity;
    }

    public set shadowOpacity(value: number) {
        this._shadowOpacity = value;
        this._setPluginParameters();
    }

    private _renderSizeFactor: number = 1.0;

    /**
     * A multiplier for the render size of the shadows. Used for rendering lower-resolution shadows.
     */
    public get shadowRenderSizeFactor(): number {
        return this._renderSizeFactor;
    }

    public set shadowRenderSizeFactor(value: number) {
        this._renderSizeFactor = Math.max(Math.min(value, 1.0), 0.0);
        this._voxelTracingPass?.resize(value);
        this._spatialBlurPass?.resize(value);
        this._accumulationPass?.resize(value);
        this._setPluginParameters();
    }

    /**
     * How dark the voxel shadows appear. 1.0 is full opacity, 0.0 is no shadows.
     */
    public get voxelShadowOpacity() {
        return this._voxelTracingPass?.voxelShadowOpacity;
    }

    public set voxelShadowOpacity(value: number) {
        if (!this._voxelTracingPass) return;
        this._voxelTracingPass.voxelShadowOpacity = value;
    }

    /**
     * How dark the screen-space shadows appear. 1.0 is full opacity, 0.0 is no shadows.
     */
    public get ssShadowOpacity(): number {
        return this._voxelTracingPass?.ssShadowOpacity;
    }

    public set ssShadowOpacity(value: number) {
        if (!this._voxelTracingPass) return;
        this._voxelTracingPass.ssShadowOpacity = value;
    }

    /**
     * The number of samples used in the screen space shadow pass.
     */
    public get ssShadowSamples(): number {
        return this._voxelTracingPass?.sssSamples;
    }

    public set ssShadowSamples(value: number) {
        if (!this._voxelTracingPass) return;
        this._voxelTracingPass.sssSamples = value;
    }

    /**
     * The stride of the screen-space shadow pass. This controls the distance between samples.
     */
    public get ssShadowStride(): number {
        return this._voxelTracingPass?.sssStride;
    }

    public set ssShadowStride(value: number) {
        if (!this._voxelTracingPass) return;
        this._voxelTracingPass.sssStride = value;
    }

    private _sssMaxDistScale: number;

    /**
     * A scale for the maximum distance a shadow can be cast in screen space.
     * The absolute distance for SS shadows is derived from the voxel size and this scalar.
     */
    public get ssShadowDistanceScale(): number {
        return this._sssMaxDistScale;
    }

    public set ssShadowDistanceScale(value: number) {
        if (!this._voxelTracingPass) return;
        this._sssMaxDistScale = value;
        this._updateShadowMaxDist();
    }

    /**
     * Screen-space shadow thickness. This value controls the perceived thickness of the SS shadows.
     */
    public get ssShadowThickness(): number {
        return this._voxelTracingPass?.sssThickness;
    }

    public set ssShadowThickness(value: number) {
        if (!this._voxelTracingPass) return;
        this._voxelTracingPass.sssThickness = value;
    }

    /**
     * Set the IBL image to be used for shadowing. It can be either a cubemap
     * or a 2D equirectangular texture.
     * @param iblSource The texture to use for IBL shadowing
     */
    public setIblTexture(iblSource: BaseTexture) {
        if (!this._importanceSamplingRenderer) return;
        this._importanceSamplingRenderer.iblSource = iblSource;
    }

    /**
     * Returns the texture containing the voxel grid data
     * @returns The texture containing the voxel grid data
     * @internal
     */
    public getVoxelGridTexture(): Texture {
        // return this._voxelRenderer?.getVoxelGrid();
        const tex = this._voxelRenderer?.getVoxelGrid();
        if (tex && tex.isReady()) {
            return tex;
        }
        return this._dummyTexture3d;
    }

    /**
     * Returns the texture containing the importance sampling CDF data for the IBL shadow pipeline
     * @returns The texture containing the importance sampling CDF data for the IBL shadow pipeline
     * @internal
     */
    public getIcdfyTexture(): Texture {
        const tex = this._importanceSamplingRenderer!.getIcdfyTexture();
        if (tex && tex.isReady()) {
            return tex;
        }
        return this._dummyTexture2d;
    }

    /**
     * Returns the texture containing the importance sampling CDF data for the IBL shadow pipeline
     * @returns The texture containing the importance sampling CDF data for the IBL shadow pipeline
     * @internal
     */
    public getIcdfxTexture(): Texture {
        const tex = this._importanceSamplingRenderer!.getIcdfxTexture();
        if (tex && tex.isReady()) {
            return tex;
        }
        return this._dummyTexture2d;
    }

    /**
     * Returns the noise texture.
     * @returns The noise texture.
     * @internal
     */
    public getNoiseTexture(): Texture {
        const tex = this._noiseTexture;
        if (tex && tex.isReady()) {
            return tex;
        }
        return this._dummyTexture2d;
    }

    /**
     * Returns the voxel-tracing texture.
     * @returns The voxel-tracing texture.
     * @internal
     */
    public getVoxelTracingTexture(): Texture {
        const tex = this._voxelTracingPass?.getOutputTexture();
        if (tex && tex.isReady()) {
            return tex;
        }
        return this._dummyTexture2d;
    }

    /**
     * Returns the spatial blur texture.
     * @returns The spatial blur texture.
     * @internal
     */
    public getSpatialBlurTexture(): Texture {
        const tex = this._spatialBlurPass?.getOutputTexture();
        if (tex && tex.isReady()) {
            return tex;
        }
        return this._dummyTexture2d;
    }

    private _gbufferDebugPass: PostProcess;
    private _gbufferDebugEnabled: boolean = false;
    private _gBufferDebugSizeParams: Vector4 = new Vector4(0.0, 0.0, 0.0, 0.0);

    /**
     * Is the debug view of the G-Buffer enabled?
     */
    public get gbufferDebugEnabled(): boolean {
        return this._gbufferDebugEnabled;
    }

    /**
     * Turn on or off the debug view of the G-Buffer
     */
    public set gbufferDebugEnabled(enabled: boolean) {
        if (enabled && !this.allowDebugPasses) {
            Logger.Warn("Can't enable G-Buffer debug view without setting allowDebugPasses to true.");
            return;
        }
        this._gbufferDebugEnabled = enabled;
        if (enabled) {
            this._enableEffect(this._getGBufferDebugPass().name, this.cameras);
        } else {
            this._disableEffect(this._getGBufferDebugPass().name, this.cameras);
        }
    }

    /**
     * Turn on or off the debug view of the CDF importance sampling data
     */
    public get importanceSamplingDebugEnabled(): boolean {
        return this._importanceSamplingRenderer?.debugEnabled;
    }

    /**
     * Turn on or off the debug view of the CDF importance sampling data
     */
    public set importanceSamplingDebugEnabled(enabled: boolean) {
        if (!this._importanceSamplingRenderer) return;
        if (enabled && !this.allowDebugPasses) {
            Logger.Warn("Can't enable importance sampling debug view without setting allowDebugPasses to true.");
            return;
        }
        if (enabled === this._importanceSamplingRenderer.debugEnabled) return;
        this._importanceSamplingRenderer.debugEnabled = enabled;
        if (enabled) {
            this._enableEffect(this._importanceSamplingRenderer.debugPassName, this.cameras);
        } else {
            this._disableEffect(this._importanceSamplingRenderer.debugPassName, this.cameras);
        }
    }

    /**
     * Turn on or off the debug view of the voxel grid
     */
    public get voxelDebugEnabled(): boolean {
        return this._voxelRenderer?.voxelDebugEnabled;
    }

    /**
     * Turn on or off the debug view of the voxel grid
     */
    public set voxelDebugEnabled(enabled: boolean) {
        if (!this._voxelRenderer) return;
        if (enabled && !this.allowDebugPasses) {
            Logger.Warn("Can't enable voxel debug view without setting allowDebugPasses to true.");
            return;
        }
        this._voxelRenderer.voxelDebugEnabled = enabled;
        if (enabled) {
            this._enableEffect(this._voxelRenderer.debugPassName, this.cameras);
        } else {
            this._disableEffect(this._voxelRenderer.debugPassName, this.cameras);
        }
    }

    /**
     * Set the axis to display for the voxel grid debug view
     * When using tri-axis voxelization, this will display the voxel grid for the specified axis
     */
    public get voxelDebugAxis(): number {
        return this._voxelRenderer?.voxelDebugAxis;
    }

    /**
     * Set the axis to display for the voxel grid debug view
     * When using tri-axis voxelization, this will display the voxel grid for the specified axis
     */
    public set voxelDebugAxis(axisNum: number) {
        if (!this._voxelRenderer) return;
        this._voxelRenderer.voxelDebugAxis = axisNum;
    }

    /**
     * Set the mip level to display for the voxel grid debug view
     */
    public set voxelDebugDisplayMip(mipNum: number) {
        if (!this._voxelRenderer) return;
        this._voxelRenderer.setDebugMipNumber(mipNum);
    }

    /**
     * Display the debug view for the voxel tracing pass
     */
    public get voxelTracingDebugEnabled(): boolean {
        return this._voxelTracingPass?.debugEnabled;
    }

    /**
     * Display the debug view for the voxel tracing pass
     */
    public set voxelTracingDebugEnabled(enabled: boolean) {
        if (!this._voxelTracingPass) return;
        if (enabled && !this.allowDebugPasses) {
            Logger.Warn("Can't enable voxel tracing debug view without setting allowDebugPasses to true.");
            return;
        }
        if (enabled === this._voxelTracingPass.debugEnabled) return;
        this._voxelTracingPass.debugEnabled = enabled;
        if (enabled) {
            this._enableEffect(this._voxelTracingPass.debugPassName, this.cameras);
        } else {
            this._disableEffect(this._voxelTracingPass.debugPassName, this.cameras);
        }
    }

    /**
     * Display the debug view for the spatial blur pass
     */
    public get spatialBlurPassDebugEnabled(): boolean {
        return this._spatialBlurPass?.debugEnabled;
    }

    /**
     * Display the debug view for the spatial blur pass
     */
    public set spatialBlurPassDebugEnabled(enabled: boolean) {
        if (!this._spatialBlurPass) return;
        if (enabled && !this.allowDebugPasses) {
            Logger.Warn("Can't enable spatial blur debug view without setting allowDebugPasses to true.");
            return;
        }
        if (enabled === this._spatialBlurPass.debugEnabled) return;
        this._spatialBlurPass.debugEnabled = enabled;
        if (enabled) {
            this._enableEffect(this._spatialBlurPass.debugPassName, this.cameras);
        } else {
            this._disableEffect(this._spatialBlurPass.debugPassName, this.cameras);
        }
    }

    /**
     * Display the debug view for the accumulation pass
     */
    public get accumulationPassDebugEnabled(): boolean {
        return this._accumulationPass?.debugEnabled;
    }

    /**
     * Display the debug view for the accumulation pass
     */
    public set accumulationPassDebugEnabled(enabled: boolean) {
        if (!this._accumulationPass) return;
        if (enabled && !this.allowDebugPasses) {
            Logger.Warn("Can't enable accumulation pass debug view without setting allowDebugPasses to true.");
            return;
        }
        if (enabled === this._accumulationPass.debugEnabled) return;
        this._accumulationPass.debugEnabled = enabled;
        if (enabled) {
            this._enableEffect(this._accumulationPass.debugPassName, this.cameras);
        } else {
            this._disableEffect(this._accumulationPass.debugPassName, this.cameras);
        }
    }

    /**
     * Add a mesh in the exclusion list to prevent it to be handled by the IBL shadow pipeline
     * @param mesh The mesh to exclude from the IBL shadow pipeline
     */
    public addExcludedMesh(mesh: AbstractMesh): void {
        if (this._excludedMeshes.indexOf(mesh.uniqueId) === -1) {
            this._excludedMeshes.push(mesh.uniqueId);
        }
    }

    /**
     * Remove a mesh from the exclusion list of the IBL shadow pipeline
     * @param mesh The mesh to remove
     */
    public removeExcludedMesh(mesh: AbstractMesh): void {
        const index = this._excludedMeshes.indexOf(mesh.uniqueId);
        if (index !== -1) {
            this._excludedMeshes.splice(index, 1);
        }
    }

    /**
     * The exponent of the resolution of the voxel shadow grid. Higher resolutions will result in sharper
     * shadows but are more expensive to compute and require more memory.
     * The resolution is calculated as 2 to the power of this number.
     */
    public get resolutionExp() {
        return this._voxelRenderer.voxelResolutionExp;
    }

    /**
     * The exponent of the resolution of the voxel shadow grid. Higher resolutions will result in sharper
     * shadows but are more expensive to compute and require more memory.
     * The resolution is calculated as 2 to the power of this number.
     */
    public set resolutionExp(newResolution: number) {
        if (newResolution === this._voxelRenderer.voxelResolutionExp) return;
        if (this._voxelRenderer.isVoxelizationInProgress()) {
            Logger.Warn("Can't change the resolution of the voxel grid while voxelization is in progress.");
            return;
        }
        this._voxelRenderer.voxelResolutionExp = newResolution;
        this.updateVoxelization();
        this._accumulationPass.reset = true;
    }

    /**
     * The number of different directions to sample during the voxel tracing pass
     */
    public get sampleDirections() {
        return this._voxelTracingPass?.sampleDirections;
    }

    /**
     * The number of different directions to sample during the voxel tracing pass
     */
    public set sampleDirections(value: number) {
        if (!this._voxelTracingPass) return;
        this._voxelTracingPass.sampleDirections = value;
    }

    /**
     * The decree to which the shadows persist between frames. 0.0 is no persistence, 1.0 is full persistence.
     **/
    public get shadowRemenance(): number {
        return this._accumulationPass?.remenance;
    }

    /**
     * The decree to which the shadows persist between frames. 0.0 is no persistence, 1.0 is full persistence.
     **/
    public set shadowRemenance(value: number) {
        if (!this._accumulationPass) return;
        this._accumulationPass.remenance = value;
    }

    /**
     * The global rotation of the IBL for shadows
     */
    public get envRotation() {
        return this._voxelTracingPass?.envRotation;
    }

    /**
     * The global rotation of the IBL for shadows
     */
    public set envRotation(value: number) {
        if (!this._voxelTracingPass) return;
        this._voxelTracingPass.envRotation = value;
    }

    /**
     * Allow debug passes to be enabled. Default is false.
     */
    public get allowDebugPasses(): boolean {
        return this._allowDebugPasses;
    }

    /**
     * Allow debug passes to be enabled. Default is false.
     */
    public set allowDebugPasses(value: boolean) {
        if (this._allowDebugPasses === value) return;
        this._allowDebugPasses = value;
        if (value) {
            if (this._importanceSamplingRenderer.isReady()) {
                this._createDebugPasses();
            } else {
                this._importanceSamplingRenderer.onReadyObservable.addOnce(() => {
                    this._createDebugPasses();
                });
            }
        } else {
            this._disposeDebugPasses();
        }
    }

    /**
     *  Support test.
     */
    public static get IsSupported(): boolean {
        const engine = EngineStore.LastCreatedEngine;
        if (!engine) {
            return false;
        }
        return engine._features.supportIBLShadows;
    }

    /**
     * @param name The rendering pipeline name
     * @param scene The scene linked to this pipeline
     * @param options Options to configure the pipeline
     * @param cameras Cameras to apply the pipeline to.
     */
    constructor(name: string, scene: Scene, options: Partial<IblShadowsSettings> = {}, cameras?: Camera[]) {
        super(scene.getEngine(), name);
        this.scene = scene;
        this._cameras = cameras || [scene.activeCamera!];
        // Create the dummy textures to be used when the pipeline is not ready
        const blackPixels = new Uint8Array([0, 0, 0, 255]);
        this._dummyTexture2d = new RawTexture(blackPixels, 1, 1, Engine.TEXTUREFORMAT_RGBA, scene, false);
        this._dummyTexture3d = new RawTexture3D(blackPixels, 1, 1, 1, Engine.TEXTUREFORMAT_RGBA, scene, false);

        // Setup the geometry buffer target formats
        const textureTypesAndFormats: { [key: number]: { textureType: number; textureFormat: number } } = {};
        textureTypesAndFormats[GeometryBufferRenderer.SCREENSPACE_DEPTH_TEXTURE_TYPE] = {
            textureFormat: Constants.TEXTUREFORMAT_DEPTH32_FLOAT,
            textureType: Constants.TEXTURETYPE_FLOAT,
        };
        textureTypesAndFormats[GeometryBufferRenderer.VELOCITY_LINEAR_TEXTURE_TYPE] = {
            textureFormat: Constants.TEXTUREFORMAT_RG,
            textureType: Constants.TEXTURETYPE_HALF_FLOAT,
        };
        textureTypesAndFormats[GeometryBufferRenderer.POSITION_TEXTURE_TYPE] = {
            textureFormat: Constants.TEXTUREFORMAT_RGBA,
            textureType: Constants.TEXTURETYPE_HALF_FLOAT,
        };
        textureTypesAndFormats[GeometryBufferRenderer.NORMAL_TEXTURE_TYPE] = {
            textureFormat: Constants.TEXTUREFORMAT_RGBA,
            textureType: Constants.TEXTURETYPE_HALF_FLOAT,
        };
        const geometryBufferRenderer = scene.enableGeometryBufferRenderer(undefined, undefined, textureTypesAndFormats);
        if (!geometryBufferRenderer) {
            Logger.Error("Geometry buffer renderer is required for IBL shadows to work.");
            return;
        }
        this._geometryBufferRenderer = geometryBufferRenderer;
        this._geometryBufferRenderer.enableScreenspaceDepth = true;
        this._geometryBufferRenderer.enableVelocityLinear = true;
        this._geometryBufferRenderer.enablePosition = true;
        this._geometryBufferRenderer.enableNormal = true;
        this._geometryBufferRenderer.generateNormalsInWorldSpace = true;

        this.shadowOpacity = options.shadowOpacity || 0.75;
        this._voxelRenderer = new _IblShadowsVoxelRenderer(
            this.scene,
            this,
            options ? options.resolutionExp : 6,
            options.triPlanarVoxelization !== undefined ? options.triPlanarVoxelization : true
        );
        this._importanceSamplingRenderer = new _IblShadowsImportanceSamplingRenderer(this.scene);
        this._voxelTracingPass = new _IblShadowsVoxelTracingPass(this.scene, this);
        this.sampleDirections = options.sampleDirections || 2;
        this.voxelShadowOpacity = options.voxelShadowOpacity || 1.0;
        this.shadowRenderSizeFactor = options.shadowRenderSizeFactor || 1.0;
        this.ssShadowOpacity = options.ssShadowsEnabled === undefined || options.ssShadowsEnabled ? 1.0 : 0.0;
        this.ssShadowDistanceScale = options.ssShadowDistanceScale || 2.5;
        this.ssShadowSamples = options.ssShadowSampleCount || 16;
        this.ssShadowStride = options.ssShadowStride || 8;
        this.ssShadowThickness = options.ssShadowThickness || 0.02;
        this._spatialBlurPass = new _IblShadowsSpatialBlurPass(this.scene, this);
        this._accumulationPass = new _IblShadowsAccumulationPass(this.scene, this);
        this.shadowRemenance = options.shadowRemenance || 0.75;
        this._noiseTexture = new Texture("https://assets.babylonjs.com/textures/blue_noise/blue_noise_rgb.png", this.scene, false, true, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
        if (this.scene.environmentTexture) {
            this._importanceSamplingRenderer.iblSource = this.scene.environmentTexture;
        }

        scene.postProcessRenderPipelineManager.addPipeline(this);

        // this.scene.onNewMeshAddedObservable.add(this.updateSceneBounds.bind(this));
        // this.scene.onMeshRemovedObservable.add(this.updateSceneBounds.bind(this));
        this.scene.onActiveCameraChanged.add(this._listenForCameraChanges.bind(this));
        this.scene.onBeforeRenderObservable.add(this._updateBeforeRender.bind(this));

        this._listenForCameraChanges();
        this.scene.getEngine().onResizeObservable.add(this._handleResize.bind(this));

        // Only turn on the pipeline when the importance sampling RT's are ready
        this._importanceSamplingRenderer.onReadyObservable.addOnce(() => {
            this.updateVoxelization();
            this.toggleShadow(this._enabled);
        });
    }

    /**
     * Toggle the shadow tracing on or off
     * @param enabled Toggle the shadow tracing on or off
     */
    public toggleShadow(enabled: boolean) {
        this._enabled = enabled;
        this._voxelTracingPass.enabled = enabled;
        this._spatialBlurPass.enabled = enabled;
        this._accumulationPass.enabled = enabled;
        this._materialsWithRenderPlugin.forEach((mat) => {
            if (mat.pluginManager) {
                const plugin = mat.pluginManager.getPlugin(IBLShadowsPluginMaterial.Name) as IBLShadowsPluginMaterial;
                plugin.isEnabled = enabled;
            }
        });
        this._setPluginParameters();
    }

    private _handleResize() {
        this._voxelRenderer.resize();
        this._voxelTracingPass?.resize(this.shadowRenderSizeFactor);
        this._spatialBlurPass?.resize(this.shadowRenderSizeFactor);
        this._accumulationPass?.resize(this.shadowRenderSizeFactor);
    }

    private _getGBufferDebugPass(): PostProcess {
        if (this._gbufferDebugPass) {
            return this._gbufferDebugPass;
        }
        const isWebGPU = this.engine.isWebGPU;
        const textureNames: string[] = ["depthSampler", "normalSampler", "positionSampler", "velocitySampler"];

        const options: PostProcessOptions = {
            width: this.scene.getEngine().getRenderWidth(),
            height: this.scene.getEngine().getRenderHeight(),
            samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            engine: this.scene.getEngine(),
            textureType: Constants.TEXTURETYPE_UNSIGNED_INT,
            textureFormat: Constants.TEXTUREFORMAT_RGBA,
            uniforms: ["sizeParams"],
            samplers: textureNames,
            reusable: false,
            shaderLanguage: isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            extraInitializations: (useWebGPU: boolean, list: Promise<any>[]) => {
                if (useWebGPU) {
                    list.push(import("../../ShadersWGSL/iblShadowGBufferDebug.fragment"));
                } else {
                    list.push(import("../../Shaders/iblShadowGBufferDebug.fragment"));
                }
            },
        };
        this._gbufferDebugPass = new PostProcess("iblShadowGBufferDebug", "iblShadowGBufferDebug", options);
        this._gbufferDebugPass.autoClear = false;
        this._gbufferDebugPass.onApplyObservable.add((effect) => {
            const depthIndex = this._geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.SCREENSPACE_DEPTH_TEXTURE_TYPE);
            effect.setTexture("depthSampler", this._geometryBufferRenderer.getGBuffer().textures[depthIndex]);
            const normalIndex = this._geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.NORMAL_TEXTURE_TYPE);
            effect.setTexture("normalSampler", this._geometryBufferRenderer.getGBuffer().textures[normalIndex]);
            const positionIndex = this._geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.POSITION_TEXTURE_TYPE);
            effect.setTexture("positionSampler", this._geometryBufferRenderer.getGBuffer().textures[positionIndex]);
            const velocityIndex = this._geometryBufferRenderer.getTextureIndex(GeometryBufferRenderer.VELOCITY_LINEAR_TEXTURE_TYPE);
            effect.setTexture("velocitySampler", this._geometryBufferRenderer.getGBuffer().textures[velocityIndex]);
            effect.setVector4("sizeParams", this._gBufferDebugSizeParams);
            if (this.scene.activeCamera) {
                effect.setFloat("maxDepth", this.scene.activeCamera.maxZ);
            }
        });
        return this._gbufferDebugPass;
    }

    private _createDebugPasses() {
        this._debugPasses = [
            { pass: this._importanceSamplingRenderer?.getDebugPassPP(), enabled: this.importanceSamplingDebugEnabled },
            { pass: this._voxelRenderer?.getDebugPassPP(), enabled: this.voxelDebugEnabled },
            { pass: this._voxelTracingPass?.getDebugPassPP(), enabled: this.voxelTracingDebugEnabled },
            { pass: this._spatialBlurPass?.getDebugPassPP(), enabled: this.spatialBlurPassDebugEnabled },
            { pass: this._accumulationPass?.getDebugPassPP(), enabled: this.accumulationPassDebugEnabled },
            { pass: this._getGBufferDebugPass(), enabled: this.gbufferDebugEnabled },
        ];
        for (let i = 0; i < this._debugPasses.length; i++) {
            if (!this._debugPasses[i].pass) continue;
            this.addEffect(
                new PostProcessRenderEffect(
                    this.scene.getEngine(),
                    this._debugPasses[i].pass.name,
                    () => {
                        return this._debugPasses[i].pass;
                    },
                    true
                )
            );
        }
        const cameras = this.cameras.slice();
        this.scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this.name, this.cameras);
        this.scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(this.name, cameras);
        for (let i = 0; i < this._debugPasses.length; i++) {
            if (!this._debugPasses[i].pass) continue;
            if (this._debugPasses[i].enabled) {
                this._enableEffect(this._debugPasses[i].pass.name, this.cameras);
            } else {
                this._disableEffect(this._debugPasses[i].pass.name, this.cameras);
            }
        }
    }

    private _disposeEffectPasses() {
        this.scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this.name, this.cameras);
        this._disableEffect("IBLShadowVoxelTracingPass", this.cameras);
        this._disableEffect("IBLShadowSpatialBlurPass", this.cameras);
        this._disableEffect("IBLShadowAccumulationBlurPass", this.cameras);
        this._disableEffect("IBLShadowCompositePass", this.cameras);
        this._disposeDebugPasses();
        this._reset();
    }

    private _disposeDebugPasses() {
        for (let i = 0; i < this._debugPasses.length; i++) {
            this._disableEffect(this._debugPasses[i].pass.name, this.cameras);
            this._debugPasses[i].pass.dispose();
        }
        this._debugPasses = [];
    }

    private _updateDebugPasses() {
        let count = 0;
        if (this._gbufferDebugEnabled) count++;
        if (this.importanceSamplingDebugEnabled) count++;
        if (this.voxelDebugEnabled) count++;
        if (this.voxelTracingDebugEnabled) count++;
        if (this.spatialBlurPassDebugEnabled) count++;
        if (this.accumulationPassDebugEnabled) count++;

        const rows = Math.ceil(Math.sqrt(count));
        const cols = Math.ceil(count / rows);
        const width = 1.0 / cols;
        const height = 1.0 / rows;
        let x = 0;
        let y = 0;
        if (this.gbufferDebugEnabled) {
            this._gBufferDebugSizeParams.set(x, y, cols, rows);
            x -= width;
            if (x <= -1) {
                x = 0;
                y -= height;
            }
        }

        if (this.importanceSamplingDebugEnabled) {
            this._importanceSamplingRenderer.setDebugDisplayParams(x, y, cols, rows);
            x -= width;
            if (x <= -1) {
                x = 0;
                y -= height;
            }
        }
        if (this.voxelDebugEnabled) {
            this._voxelRenderer.setDebugDisplayParams(x, y, cols, rows);
            x -= width;
            if (x <= -1) {
                x = 0;
                y -= height;
            }
        }
        if (this.voxelTracingDebugEnabled) {
            this._voxelTracingPass.setDebugDisplayParams(x, y, cols, rows);
            x -= width;
            if (x <= -1) {
                x = 0;
                y -= height;
            }
        }
        if (this.spatialBlurPassDebugEnabled) {
            this._spatialBlurPass.setDebugDisplayParams(x, y, cols, rows);
            x -= width;
            if (x <= -1) {
                x = 0;
                y -= height;
            }
        }
        if (this.accumulationPassDebugEnabled) {
            this._accumulationPass.setDebugDisplayParams(x, y, cols, rows);
            x -= width;
            if (x <= -1) {
                x = 0;
                y -= height;
            }
        }
    }

    /**
     * Trigger the scene to be re-voxelized. This is useful when the scene has changed and the voxel grid needs to be updated.
     */
    public updateVoxelization() {
        this._voxelRenderer.updateVoxelGrid(this._excludedMeshes);
        // Update the SS shadow max distance based on the voxel grid size and resolution.
        // The max distance should be just a little larger than the world size of a single voxel.
        this._updateShadowMaxDist();
    }

    /**
     * Trigger the scene bounds of shadow-casters to be updated. This is useful when the scene has changed and the bounds need
     * to be recalculated. This will also trigger a re-voxelization.
     */
    public updateSceneBounds() {
        const bounds = this.scene.getWorldExtends((mesh) => {
            return mesh instanceof Mesh && this._excludedMeshes.indexOf(mesh.uniqueId) === -1;
        });
        const size = bounds.max.subtract(bounds.min);
        this.voxelGridSize = Math.max(size.x, Math.max(size.y, size.z));
        if (!isFinite(this.voxelGridSize) || this.voxelGridSize === 0) {
            Logger.Warn("IBL Shadows: Scene size is invalid. Can't update bounds.");
            this.voxelGridSize = 1.0;
            return;
        }
        const halfSize = this.voxelGridSize / 2.0;
        const centre = bounds.max.add(bounds.min).multiplyByFloats(-0.5, -0.5, -0.5);
        const invWorldScaleMatrix = Matrix.Compose(new Vector3(1.0 / halfSize, 1.0 / halfSize, 1.0 / halfSize), new Quaternion(), new Vector3(0, 0, 0));
        const invTranslationMatrix = Matrix.Compose(new Vector3(1.0, 1.0, 1.0), new Quaternion(), centre);
        invTranslationMatrix.multiplyToRef(invWorldScaleMatrix, invWorldScaleMatrix);
        this._voxelTracingPass?.setWorldScaleMatrix(invWorldScaleMatrix);
        this._voxelRenderer.setWorldScaleMatrix(invWorldScaleMatrix);
        // Set world scale for spatial blur.
        this._spatialBlurPass?.setWorldScale(halfSize * 2.0);
        // Logger.Log("IBL Shadows: Scene size: " + size);
        // Logger.Log("Half size: " + halfSize);
        // Logger.Log("Centre translation: " + centre);

        // Update the SS shadow max distance based on the voxel grid size and resolution.
        // The max distance should be just a little larger than the world size of a single voxel.
        this._updateShadowMaxDist();
    }

    private _updateShadowMaxDist(): void {
        this._voxelTracingPass.sssMaxDist = (this._sssMaxDistScale * this.voxelGridSize) / (1 << this.resolutionExp);
    }

    /**
     * Apply the shadows to a material.
     * @param material Material that will be affected by the shadows. If not provided, all materials of the scene will be affected.
     */
    public addMaterial(material?: Material) {
        if (material) {
            this._addShadowSupportToMaterial(material);
        } else {
            this.scene.meshes.forEach((mesh) => {
                if (mesh.getTotalVertices() > 0 && mesh.isEnabled() && mesh.material instanceof Material) {
                    this._addShadowSupportToMaterial(mesh.material);
                }
            });
        }
    }

    protected _addShadowSupportToMaterial(material: Material) {
        if (material.pluginManager?.getPlugin(IBLShadowsPluginMaterial.Name)) {
            return;
        }

        const plugin = new IBLShadowsPluginMaterial(material);

        if (this._enabled) {
            const shadowTexture = this._accumulationPass.getOutputTexture();
            plugin.iblShadowsTexture = shadowTexture.getInternalTexture() ?? this._dummyTexture3d.getInternalTexture()!;
            plugin.outputTextureWidth = shadowTexture.getSize().width;
            plugin.outputTextureHeight = shadowTexture.getSize().height;
            plugin.shadowOpacity = this.shadowOpacity;
        }

        plugin.isEnabled = this._enabled;

        this._materialsWithRenderPlugin.push(material);
    }

    protected _setPluginParameters() {
        if (!this._enabled) {
            return;
        }

        this._materialsWithRenderPlugin.forEach((mat) => {
            if (mat.pluginManager) {
                const plugin = mat.pluginManager.getPlugin<IBLShadowsPluginMaterial>(IBLShadowsPluginMaterial.Name)!;
                const shadowTexture = this._accumulationPass.getOutputTexture().getInternalTexture() ?? this._dummyTexture3d.getInternalTexture()!;
                plugin.iblShadowsTexture = shadowTexture;
                plugin.outputTextureWidth = this.engine.getRenderWidth();
                plugin.outputTextureHeight = this.engine.getRenderHeight();
                plugin.shadowOpacity = this.shadowOpacity;
            }
        });
    }

    private _updateBeforeRender() {
        this._updateDebugPasses();
    }

    private _listenForCameraChanges() {
        // We want to listen for camera changes and change settings while the camera is moving.
        if (this.scene.activeCamera instanceof ArcRotateCamera) {
            this.scene.onBeforeCameraRenderObservable.add((camera) => {
                let isMoving: boolean = false;
                if (camera instanceof ArcRotateCamera) {
                    isMoving =
                        camera.inertialAlphaOffset !== 0 ||
                        camera.inertialBetaOffset !== 0 ||
                        camera.inertialRadiusOffset !== 0 ||
                        camera.inertialPanningX !== 0 ||
                        camera.inertialPanningY !== 0;
                } else if (camera instanceof FreeCamera) {
                    isMoving =
                        camera.cameraDirection.x !== 0 ||
                        camera.cameraDirection.y !== 0 ||
                        camera.cameraDirection.z !== 0 ||
                        camera.cameraRotation.x !== 0 ||
                        camera.cameraRotation.y !== 0;
                }
                if (this._accumulationPass) {
                    if (isMoving) {
                        // this._accumulationPass.reset = true;
                        // this._accumulationPass.remenance = 1.0;
                    } else {
                        // this._accumulationPass.reset = false;
                        // this._accumulationPass.remenance = 0.9;
                    }
                }
            });
        }
    }

    /**
     * Checks if the IBL shadow pipeline is ready to render shadows
     * @returns true if the IBL shadow pipeline is ready to render the shadows
     */
    public isReady() {
        return (
            this._noiseTexture.isReady() &&
            this._voxelRenderer.isReady() &&
            this._importanceSamplingRenderer.isReady() &&
            (!this._voxelTracingPass || this._voxelTracingPass.isReady()) &&
            (!this._spatialBlurPass || this._spatialBlurPass.isReady()) &&
            (!this._accumulationPass || this._accumulationPass.isReady())
        );
    }

    /**
     * Get the class name
     * @returns "IBLShadowsRenderPipeline"
     */
    public override getClassName(): string {
        return "IBLShadowsRenderPipeline";
    }

    /**
     * Disposes the IBL shadow pipeline and associated resources
     */
    public override dispose() {
        this._disposeEffectPasses();
        this._noiseTexture.dispose();
        this._voxelRenderer.dispose();
        this._importanceSamplingRenderer.dispose();
        this._voxelTracingPass?.dispose();
        this._spatialBlurPass?.dispose();
        this._accumulationPass?.dispose();
        super.dispose();
    }
}
