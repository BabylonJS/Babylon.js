import { Constants } from "../../Engines/constants";
import { EngineStore } from "../../Engines/engineStore";
import { Matrix, Vector3, Vector4, Quaternion } from "../../Maths/math.vector";
import type { Mesh } from "../../Meshes/mesh";
import type { Scene } from "../../scene";
import { Texture } from "../../Materials/Textures/texture";
import { Logger } from "../../Misc/logger";
import { _IblShadowsVoxelRenderer } from "./iblShadowsVoxelRenderer";
import { _IblShadowsVoxelTracingPass } from "./iblShadowsVoxelTracingPass";

import { PostProcess } from "../../PostProcesses/postProcess";
import type { PostProcessOptions } from "../../PostProcesses/postProcess";
import { _IblShadowsSpatialBlurPass } from "./iblShadowsSpatialBlurPass";
import { _IblShadowsAccumulationPass } from "./iblShadowsAccumulationPass";
import { PostProcessRenderPipeline } from "../../PostProcesses/RenderPipeline/postProcessRenderPipeline";
import { PostProcessRenderEffect } from "core/PostProcesses/RenderPipeline/postProcessRenderEffect";
import type { Camera } from "core/Cameras/camera";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { GeometryBufferRenderer } from "core/Rendering/geometryBufferRenderer";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { RawTexture3D } from "core/Materials/Textures/rawTexture3D";
import { Engine } from "core/Engines/engine";
import { IBLShadowsPluginMaterial } from "./iblShadowsPluginMaterial";
import { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";
import { StandardMaterial } from "core/Materials/standardMaterial";
import type { Material } from "core/Materials/material";
import { Observable } from "core/Misc/observable";
import "../geometryBufferRendererSceneComponent";
import "../iblCdfGeneratorSceneComponent";

interface IblShadowsSettings {
    /**
     * The exponent of the resolution of the voxel shadow grid. Higher resolutions will result in sharper
     * shadows but are more expensive to compute and require more memory.
     * The resolution is calculated as 2 to the power of this number.
     */
    resolutionExp?: number;

    /**
     * The number of different directions to sample during the voxel tracing pass. Higher
     * values will result in better quality, more stable shadows but are more expensive to compute.
     */
    sampleDirections?: number;

    /**
     * How dark the shadows are. 1.0 is full opacity, 0.0 is no shadows.
     */
    shadowOpacity?: number;

    /**
     * The global Y-axis rotation of the IBL for shadows. This should match the Y-rotation of the environment map applied to materials, skybox, etc.
     */
    envRotation?: number;

    /**
     * A factor that controls how long the shadows remain in the scene.
     * 0.0 is no persistence, 1.0 is full persistence.
     * This value applies only while the camera is moving. Once stationary, the pipeline
     * increases remanence automatically to help the shadows converge.
     */
    shadowRemanence?: number;

    /**
     * Render the voxel grid from 3 different axis. This will result in better quality shadows with fewer
     * bits of missing geometry.
     */
    triPlanarVoxelization?: boolean;

    /**
     * A size multiplier for the internal shadow render targets (default 1.0). A value of 1.0 represents full-resolution.
     * Scaling this below 1.0 will result in blurry shadows and potentially more artifacts but
     * could help increase performance on less powerful GPU's.
     */
    shadowRenderSizeFactor?: number;

    /**
     * Separate control for the opacity of the voxel shadows.
     */
    voxelShadowOpacity?: number;

    /**
     * Include screen-space shadows in the IBL shadow pipeline. This adds sharp shadows to small details
     * but only applies close to a shadow-casting object.
     */
    ssShadowsEnabled?: boolean;

    /**
     * The number of samples used in the screen space shadow pass.
     */
    ssShadowSampleCount?: number;

    /**
     * The stride of the screen-space shadow pass. This controls the distance between samples
     * in pixels.
     */
    ssShadowStride?: number;

    /**
     * A scale for the maximum distance a screen-space shadow can be cast in world-space.
     * The maximum distance that screen-space shadows cast is derived from the voxel size
     * and this value so shouldn't need to change if you scale your scene.
     */
    ssShadowDistanceScale?: number;

    /**
     * Screen-space shadow thickness scale. This value controls the assumed thickness of
     * on-screen surfaces in world-space. It scales with the size of the shadow-casting
     * region so shouldn't need to change if you scale your scene.
     */
    ssShadowThicknessScale?: number;
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

    private _shadowCastingMeshes: Mesh[] = [];

    private _voxelRenderer: _IblShadowsVoxelRenderer;
    private _voxelTracingPass: _IblShadowsVoxelTracingPass;
    private _spatialBlurPass: _IblShadowsSpatialBlurPass;
    private _accumulationPass: _IblShadowsAccumulationPass;
    private _noiseTexture: Texture;
    /**
     * Raw texture to be used before final data is available.
     * @internal
     */
    public _dummyTexture2d: RawTexture;
    private _dummyTexture3d: RawTexture3D;
    private _shadowOpacity: number = 0.8;
    private _enabled: boolean = true;
    private _coloredShadows: boolean = false;
    private _materialsWithRenderPlugin: Material[] = [];

    /**
     * Observable that triggers when the shadow renderer is ready
     */
    public onShadowTextureReadyObservable: Observable<void> = new Observable<void>();

    /**
     * Observable that triggers when a new IBL is set and the importance sampling is ready
     */
    public onNewIblReadyObservable: Observable<void> = new Observable<void>();

    /**
     * Observable that triggers when the voxelization is complete
     */
    public onVoxelizationCompleteObservable: Observable<void> = new Observable<void>();

    /**
     * The current world-space size of that the voxel grid covers in the scene.
     */
    public voxelGridSize: number = 1.0;

    /**
     * Reset the shadow accumulation. This has a similar affect to lowering the remanence for a single frame.
     * This is useful when making a sudden change to the IBL.
     */
    public resetAccumulation(): void {
        this._accumulationPass.reset = true;
    }

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

    /**
     * Render the shadows in color rather than black and white.
     * This is slightly more expensive than black and white shadows but can be much
     * more accurate when the strongest lights in the IBL are non-white.
     */
    public get coloredShadows(): boolean {
        return this._coloredShadows;
    }

    public set coloredShadows(value: boolean) {
        this._coloredShadows = value;
        this._voxelTracingPass.coloredShadows = value;
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
        this._voxelTracingPass.resize(value);
        this._spatialBlurPass.resize(value);
        this._accumulationPass.resize(value);
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
    public get ssShadowSampleCount(): number {
        return this._voxelTracingPass?.sssSamples;
    }

    public set ssShadowSampleCount(value: number) {
        if (!this._voxelTracingPass) return;
        this._voxelTracingPass.sssSamples = value;
    }

    /**
     * The stride of the screen-space shadow pass. This controls the distance between samples
     * in pixels.
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
     * A scale for the maximum distance a screen-space shadow can be cast in world-space.
     * The maximum distance that screen-space shadows cast is derived from the voxel size
     * and this value so shouldn't need to change if you scale your scene
     */
    public get ssShadowDistanceScale(): number {
        return this._sssMaxDistScale;
    }

    public set ssShadowDistanceScale(value: number) {
        this._sssMaxDistScale = value;
        this._updateSSShadowParams();
    }

    private _sssThicknessScale: number;

    /**
     * Screen-space shadow thickness scale. This value controls the assumed thickness of
     * on-screen surfaces in world-space. It scales with the size of the shadow-casting
     * region so shouldn't need to change if you scale your scene.
     */
    public get ssShadowThicknessScale(): number {
        return this._sssThicknessScale;
    }

    public set ssShadowThicknessScale(value: number) {
        this._sssThicknessScale = value;
        this._updateSSShadowParams();
    }

    /**
     * Returns the texture containing the voxel grid data
     * @returns The texture containing the voxel grid data
     * @internal
     */
    public _getVoxelGridTexture(): Texture {
        const tex = this._voxelRenderer?.getVoxelGrid();
        if (tex && tex.isReady()) {
            return tex;
        }
        return this._dummyTexture3d;
    }

    /**
     * Returns the noise texture.
     * @returns The noise texture.
     * @internal
     */
    public _getNoiseTexture(): Texture {
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
    public _getVoxelTracingTexture(): Texture {
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
    public _getSpatialBlurTexture(): Texture {
        const tex = this._spatialBlurPass.getOutputTexture();
        if (tex && tex.isReady()) {
            return tex;
        }
        return this._dummyTexture2d;
    }

    /**
     * Returns the accumulated shadow texture.
     * @returns The accumulated shadow texture.
     * @internal
     */
    public _getAccumulatedTexture(): Texture {
        const tex = this._accumulationPass?.getOutputTexture();
        if (tex && tex.isReady()) {
            return tex;
        }
        return this._dummyTexture2d;
    }

    private _gbufferDebugPass: PostProcess;
    private _gbufferDebugEnabled: boolean = false;
    private _gBufferDebugSizeParams: Vector4 = new Vector4(0.0, 0.0, 0.0, 0.0);

    /**
     * Turn on or off the debug view of the G-Buffer. This will display only the targets
     * of the g-buffer that are used by the shadow pipeline.
     */
    public get gbufferDebugEnabled(): boolean {
        return this._gbufferDebugEnabled;
    }

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
    public get cdfDebugEnabled(): boolean {
        return this.scene.iblCdfGenerator ? this.scene.iblCdfGenerator.debugEnabled : false;
    }

    /**
     * Turn on or off the debug view of the CDF importance sampling data
     */
    public set cdfDebugEnabled(enabled: boolean) {
        if (!this.scene.iblCdfGenerator) return;
        if (enabled && !this.allowDebugPasses) {
            Logger.Warn("Can't enable importance sampling debug view without setting allowDebugPasses to true.");
            return;
        }
        if (enabled === this.scene.iblCdfGenerator.debugEnabled) return;
        this.scene.iblCdfGenerator.debugEnabled = enabled;
        if (enabled) {
            this._enableEffect(this.scene.iblCdfGenerator.debugPassName, this.cameras);
        } else {
            this._disableEffect(this.scene.iblCdfGenerator.debugPassName, this.cameras);
        }
    }

    /**
     * This displays the voxel grid in slices spread across the screen.
     * It also displays what slices of the model are stored in each layer
     * of the voxel grid. Each red stripe represents one layer while each gradient
     * (from bright red to black) represents the layers rendered in a single draw call.
     */
    public get voxelDebugEnabled(): boolean {
        return this._voxelRenderer?.voxelDebugEnabled;
    }

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
     * When using tri-planar voxelization (the default), this value can be used to
     * display only the voxelization result for that axis. z-axis = 0, y-axis = 1, x-axis = 2
     */
    public get voxelDebugAxis(): number {
        return this._voxelRenderer?.voxelDebugAxis;
    }

    public set voxelDebugAxis(axisNum: number) {
        if (!this._voxelRenderer) return;
        this._voxelRenderer.voxelDebugAxis = axisNum;
    }

    /**
     * Displays a given mip of the voxel grid. `voxelDebugAxis` must be undefined in this
     * case because we only generate mips for the combined voxel grid.
     */
    public set voxelDebugDisplayMip(mipNum: number) {
        if (!this._voxelRenderer) return;
        this._voxelRenderer.setDebugMipNumber(mipNum);
    }

    /**
     * Display the debug view for just the shadow samples taken this frame.
     */
    public get voxelTracingDebugEnabled(): boolean {
        return this._voxelTracingPass?.debugEnabled;
    }

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
        return this._spatialBlurPass.debugEnabled;
    }

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
     * Display the debug view for the shadows accumulated over time.
     */
    public get accumulationPassDebugEnabled(): boolean {
        return this._accumulationPass?.debugEnabled;
    }

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
     * Add a mesh to be used for shadow-casting in the IBL shadow pipeline.
     * These meshes will be written to the voxel grid.
     * @param mesh A mesh or list of meshes that you want to cast shadows
     */
    public addShadowCastingMesh(mesh: Mesh | Mesh[]): void {
        if (Array.isArray(mesh)) {
            for (const m of mesh) {
                if (m && this._shadowCastingMeshes.indexOf(m) === -1) {
                    this._shadowCastingMeshes.push(m);
                }
            }
        } else {
            if (mesh && this._shadowCastingMeshes.indexOf(mesh) === -1) {
                this._shadowCastingMeshes.push(mesh);
            }
        }
    }

    /**
     * Remove a mesh from the shadow-casting list. The mesh will no longer be written
     * to the voxel grid and will not cast shadows.
     * @param mesh The mesh or list of meshes that you don't want to cast shadows.
     */
    public removeShadowCastingMesh(mesh: Mesh | Mesh[]): void {
        if (Array.isArray(mesh)) {
            for (const m of mesh) {
                const index = this._shadowCastingMeshes.indexOf(m);
                if (index !== -1) {
                    this._shadowCastingMeshes.splice(index, 1);
                }
            }
        } else {
            const index = this._shadowCastingMeshes.indexOf(mesh);
            if (index !== -1) {
                this._shadowCastingMeshes.splice(index, 1);
            }
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

    public set resolutionExp(newResolution: number) {
        if (newResolution === this._voxelRenderer.voxelResolutionExp) return;
        if (this._voxelRenderer.isVoxelizationInProgress()) {
            Logger.Warn("Can't change the resolution of the voxel grid while voxelization is in progress.");
            return;
        }
        this._voxelRenderer.voxelResolutionExp = Math.max(1, Math.min(newResolution, 8));
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
    public get shadowRemanence(): number {
        return this._accumulationPass?.remanence;
    }

    /**
     * The decree to which the shadows persist between frames. 0.0 is no persistence, 1.0 is full persistence.
     **/
    public set shadowRemanence(value: number) {
        if (!this._accumulationPass) return;
        this._accumulationPass.remanence = value;
    }

    /**
     * The global Y-axis rotation of the IBL for shadows. This should match the Y-rotation of the environment map applied to materials, skybox, etc.
     */
    public get envRotation() {
        return this._voxelTracingPass?.envRotation;
    }

    /**
     * The global Y-axis rotation of the IBL for shadows. This should match the Y-rotation of the environment map applied to materials, skybox, etc.
     */
    public set envRotation(value: number) {
        if (!this._voxelTracingPass) return;
        this._voxelTracingPass.envRotation = value;
        this._accumulationPass.reset = true;
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
        if (value && this.scene.iblCdfGenerator) {
            if (this.scene.iblCdfGenerator.isReady()) {
                this._createDebugPasses();
            } else {
                this.scene.iblCdfGenerator.onGeneratedObservable.addOnce(() => {
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
     * Toggle the shadow tracing on or off
     * @param enabled Toggle the shadow tracing on or off
     */
    public toggleShadow(enabled: boolean) {
        this._enabled = enabled;
        this._voxelTracingPass.enabled = enabled;
        this._spatialBlurPass.enabled = enabled;
        this._accumulationPass.enabled = enabled;
        for (const mat of this._materialsWithRenderPlugin) {
            if (mat.pluginManager) {
                const plugin = mat.pluginManager.getPlugin(IBLShadowsPluginMaterial.Name) as IBLShadowsPluginMaterial;
                plugin.isEnabled = enabled;
            }
        }
        this._setPluginParameters();
    }

    /**
     * Trigger the scene to be re-voxelized. This should be run when any shadow-casters have been added, removed or moved.
     */
    public updateVoxelization() {
        if (this._shadowCastingMeshes.length === 0) {
            Logger.Warn("IBL Shadows: updateVoxelization called with no shadow-casting meshes to voxelize.");
            return;
        }
        this._voxelRenderer.updateVoxelGrid(this._shadowCastingMeshes);
        this._voxelRenderer.onVoxelizationCompleteObservable.addOnce(() => {
            this.onVoxelizationCompleteObservable.notifyObservers();
        });
        this._updateSSShadowParams();
    }

    /**
     * Trigger the scene bounds of shadow-casters to be calculated. This is the world size that the voxel grid will cover and will always be a cube.
     */
    public updateSceneBounds() {
        const bounds: { min: Vector3; max: Vector3 } = {
            min: new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE),
            max: new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE),
        };
        for (const mesh of this._shadowCastingMeshes) {
            const localBounds = mesh.getHierarchyBoundingVectors(true);
            bounds.min = Vector3.Minimize(bounds.min, localBounds.min);
            bounds.max = Vector3.Maximize(bounds.max, localBounds.max);
        }

        const size = bounds.max.subtract(bounds.min);
        this.voxelGridSize = Math.max(size.x, size.y, size.z);
        if (this._shadowCastingMeshes.length === 0 || !isFinite(this.voxelGridSize) || this.voxelGridSize === 0) {
            Logger.Warn("IBL Shadows: Scene size is invalid. Can't update bounds.");
            this.voxelGridSize = 1.0;
            return;
        }
        const halfSize = this.voxelGridSize / 2.0;
        const centre = bounds.max.add(bounds.min).multiplyByFloats(-0.5, -0.5, -0.5);
        const invWorldScaleMatrix = Matrix.Compose(new Vector3(1.0 / halfSize, 1.0 / halfSize, 1.0 / halfSize), new Quaternion(), new Vector3(0, 0, 0));
        const invTranslationMatrix = Matrix.Compose(new Vector3(1.0, 1.0, 1.0), new Quaternion(), centre);
        invTranslationMatrix.multiplyToRef(invWorldScaleMatrix, invWorldScaleMatrix);
        this._voxelTracingPass.setWorldScaleMatrix(invWorldScaleMatrix);
        this._voxelRenderer.setWorldScaleMatrix(invWorldScaleMatrix);
        // Set world scale for spatial blur.
        this._spatialBlurPass.setWorldScale(halfSize * 2.0);
        this._updateSSShadowParams();
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
        textureTypesAndFormats[GeometryBufferRenderer.SCREENSPACE_DEPTH_TEXTURE_TYPE] = { textureFormat: Constants.TEXTUREFORMAT_R, textureType: Constants.TEXTURETYPE_FLOAT };
        textureTypesAndFormats[GeometryBufferRenderer.VELOCITY_LINEAR_TEXTURE_TYPE] = { textureFormat: Constants.TEXTUREFORMAT_RG, textureType: Constants.TEXTURETYPE_HALF_FLOAT };
        textureTypesAndFormats[GeometryBufferRenderer.POSITION_TEXTURE_TYPE] = { textureFormat: Constants.TEXTUREFORMAT_RGBA, textureType: Constants.TEXTURETYPE_HALF_FLOAT };
        textureTypesAndFormats[GeometryBufferRenderer.NORMAL_TEXTURE_TYPE] = { textureFormat: Constants.TEXTUREFORMAT_RGBA, textureType: Constants.TEXTURETYPE_HALF_FLOAT };
        const geometryBufferRenderer = scene.enableGeometryBufferRenderer(undefined, Constants.TEXTUREFORMAT_DEPTH32_FLOAT, textureTypesAndFormats);
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
        this.scene.enableIblCdfGenerator();
        this.shadowOpacity = options.shadowOpacity || 0.8;
        this._voxelRenderer = new _IblShadowsVoxelRenderer(
            this.scene,
            this,
            options ? options.resolutionExp : 6,
            options.triPlanarVoxelization !== undefined ? options.triPlanarVoxelization : true
        );
        this._voxelTracingPass = new _IblShadowsVoxelTracingPass(this.scene, this);
        this._spatialBlurPass = new _IblShadowsSpatialBlurPass(this.scene, this);
        this._accumulationPass = new _IblShadowsAccumulationPass(this.scene, this);
        this._accumulationPass.onReadyObservable.addOnce(() => {
            this.onShadowTextureReadyObservable.notifyObservers();
        });
        this.sampleDirections = options.sampleDirections || 2;
        this.voxelShadowOpacity = options.voxelShadowOpacity ?? 1.0;
        this.envRotation = options.envRotation ?? 0.0;
        this.shadowRenderSizeFactor = options.shadowRenderSizeFactor || 1.0;
        this.ssShadowOpacity = options.ssShadowsEnabled === undefined || options.ssShadowsEnabled ? 1.0 : 0.0;
        this.ssShadowDistanceScale = options.ssShadowDistanceScale || 1.25;
        this.ssShadowSampleCount = options.ssShadowSampleCount || 16;
        this.ssShadowStride = options.ssShadowStride || 8;
        this.ssShadowThicknessScale = options.ssShadowThicknessScale || 1.0;
        this.shadowRemanence = options.shadowRemanence ?? 0.75;
        this._noiseTexture = new Texture("https://assets.babylonjs.com/textures/blue_noise/blue_noise_rgb.png", this.scene, false, true, Constants.TEXTURE_NEAREST_SAMPLINGMODE);

        scene.postProcessRenderPipelineManager.addPipeline(this);

        this.scene.onActiveCameraChanged.add(this._listenForCameraChanges.bind(this));
        this.scene.onBeforeRenderObservable.add(this._updateBeforeRender.bind(this));

        this._listenForCameraChanges();
        this.scene.getEngine().onResizeObservable.add(this._handleResize.bind(this));

        // Assigning the shadow texture to the materials needs to be done after the RT's are created.
        if (this.scene.iblCdfGenerator) {
            this.scene.iblCdfGenerator.onGeneratedObservable.add(() => {
                this._setPluginParameters();
                this.onNewIblReadyObservable.notifyObservers();
            });
        }
    }

    private _handleResize() {
        this._voxelRenderer.resize();
        this._voxelTracingPass.resize(this.shadowRenderSizeFactor);
        this._spatialBlurPass.resize(this.shadowRenderSizeFactor);
        this._accumulationPass.resize(this.shadowRenderSizeFactor);
        this._setPluginParameters();
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
            textureType: Constants.TEXTURETYPE_UNSIGNED_BYTE,
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
        if (this.scene.iblCdfGenerator) {
            this._debugPasses = [{ pass: this.scene.iblCdfGenerator.getDebugPassPP(), enabled: this.cdfDebugEnabled }];
        } else {
            this._debugPasses = [];
        }

        this._debugPasses.push(
            { pass: this._voxelRenderer.getDebugPassPP(), enabled: this.voxelDebugEnabled },
            { pass: this._voxelTracingPass.getDebugPassPP(), enabled: this.voxelTracingDebugEnabled },
            { pass: this._spatialBlurPass.getDebugPassPP(), enabled: this.spatialBlurPassDebugEnabled },
            { pass: this._accumulationPass.getDebugPassPP(), enabled: this.accumulationPassDebugEnabled },
            { pass: this._getGBufferDebugPass(), enabled: this.gbufferDebugEnabled }
        );
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
        if (this.cdfDebugEnabled) count++;
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

        if (this.cdfDebugEnabled && this.scene.iblCdfGenerator) {
            this.scene.iblCdfGenerator.setDebugDisplayParams(x, y, cols, rows);
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
     * Update the SS shadow max distance and thickness based on the voxel grid size and resolution.
     * The max distance should be just a little larger than the world size of a single voxel.
     */
    private _updateSSShadowParams(): void {
        this._voxelTracingPass.sssMaxDist = (this._sssMaxDistScale * this.voxelGridSize) / (1 << this.resolutionExp);
        this._voxelTracingPass.sssThickness = this._sssThicknessScale * 0.005 * this.voxelGridSize;
    }

    /**
     * Apply the shadows to a material or array of materials. If no material is provided, all
     * materials in the scene will be added.
     * @param material Material that will be affected by the shadows. If not provided, all materials of the scene will be affected.
     */
    public addShadowReceivingMaterial(material?: Material | Material[]) {
        if (material) {
            if (Array.isArray(material)) {
                for (const m of material) {
                    this._addShadowSupportToMaterial(m);
                }
            } else {
                this._addShadowSupportToMaterial(material);
            }
        } else {
            for (const mat of this.scene.materials) {
                this._addShadowSupportToMaterial(mat);
            }
        }
    }

    /**
     * Remove a material from the list of materials that receive shadows. If no material
     * is provided, all materials in the scene will be removed.
     * @param material The material or array of materials that will no longer receive shadows
     */
    public removeShadowReceivingMaterial(material: Material | Material[]) {
        if (Array.isArray(material)) {
            for (const m of material) {
                const matIndex = this._materialsWithRenderPlugin.indexOf(m);
                if (matIndex !== -1) {
                    this._materialsWithRenderPlugin.splice(matIndex, 1);
                    const plugin = m.pluginManager?.getPlugin<IBLShadowsPluginMaterial>(IBLShadowsPluginMaterial.Name)!;
                    plugin.isEnabled = false;
                }
            }
        } else {
            const matIndex = this._materialsWithRenderPlugin.indexOf(material);
            if (matIndex !== -1) {
                this._materialsWithRenderPlugin.splice(matIndex, 1);
                const plugin = material.pluginManager!.getPlugin<IBLShadowsPluginMaterial>(IBLShadowsPluginMaterial.Name)!;
                plugin.isEnabled = false;
            }
        }
    }

    protected _addShadowSupportToMaterial(material: Material) {
        if (!(material instanceof PBRBaseMaterial) && !(material instanceof StandardMaterial)) {
            return;
        }
        let plugin = material.pluginManager?.getPlugin<IBLShadowsPluginMaterial>(IBLShadowsPluginMaterial.Name);
        if (!plugin) {
            plugin = new IBLShadowsPluginMaterial(material);
        }
        if (this._materialsWithRenderPlugin.indexOf(material) !== -1) {
            return;
        }

        if (this._enabled) {
            plugin.iblShadowsTexture = this._getAccumulatedTexture().getInternalTexture()!;
            plugin.shadowOpacity = this.shadowOpacity;
        }

        plugin.isEnabled = this._enabled;
        plugin.isColored = this._coloredShadows;

        this._materialsWithRenderPlugin.push(material);
    }

    protected _setPluginParameters() {
        if (!this._enabled) {
            return;
        }

        for (const mat of this._materialsWithRenderPlugin) {
            if (mat.pluginManager) {
                const plugin = mat.pluginManager.getPlugin<IBLShadowsPluginMaterial>(IBLShadowsPluginMaterial.Name)!;
                plugin.iblShadowsTexture = this._getAccumulatedTexture().getInternalTexture()!;
                plugin.shadowOpacity = this.shadowOpacity;
                plugin.isColored = this._coloredShadows;
            }
        }
    }

    private _updateBeforeRender() {
        this._updateDebugPasses();
    }

    private _listenForCameraChanges() {
        // We want to listen for camera changes and change settings while the camera is moving.
        this.scene.activeCamera?.onViewMatrixChangedObservable.add(() => {
            this._accumulationPass.isMoving = true;
        });
    }

    /**
     * Checks if the IBL shadow pipeline is ready to render shadows
     * @returns true if the IBL shadow pipeline is ready to render the shadows
     */
    public isReady() {
        return (
            this._noiseTexture.isReady() &&
            this._voxelRenderer.isReady() &&
            this.scene.iblCdfGenerator &&
            this.scene.iblCdfGenerator.isReady() &&
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
        const materials = this._materialsWithRenderPlugin.splice(0);
        for (const mat of materials) {
            this.removeShadowReceivingMaterial(mat);
        }
        this._disposeEffectPasses();
        this._noiseTexture.dispose();
        this._voxelRenderer.dispose();
        this._voxelTracingPass.dispose();
        this._spatialBlurPass.dispose();
        this._accumulationPass.dispose();
        this._dummyTexture2d.dispose();
        this._dummyTexture3d.dispose();
        this.onNewIblReadyObservable.clear();
        this.onShadowTextureReadyObservable.clear();
        super.dispose();
    }
}
