import { Constants } from "../../Engines/constants";
import { EngineStore } from "../../Engines/engineStore";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import { Matrix, Vector3, Quaternion } from "../../Maths/math.vector";
import { Mesh } from "../../Meshes/mesh";
import type { Scene } from "../../scene";
import type { BaseTexture } from "../../Materials/Textures/baseTexture";
import { Texture } from "../../Materials/Textures/texture";
import type { PrePassEffectConfiguration } from "../prePassEffectConfiguration";
import type { PrePassRenderer } from "../prePassRenderer";
import { Logger } from "../../Misc/logger";
import { IblShadowsVoxelRenderer } from "./iblShadowsVoxelRenderer";
import { IblShadowsVoxelTracingPass } from "./iblShadowsVoxelTracingPass";

import "../../Shaders/postprocess.vertex";
import "../../Shaders/iblShadowGBufferDebug.fragment";
import "../../Shaders/iblShadowsCombine.fragment";
import { PostProcess } from "../../PostProcesses/postProcess";
import type { PostProcessOptions } from "../../PostProcesses/postProcess";
import { IblShadowsImportanceSamplingRenderer } from "./iblShadowsImportanceSamplingRenderer";
import { IblShadowsSpatialBlurPass } from "./iblShadowsSpatialBlurPass";
import { IblShadowsAccumulationPass } from "./iblShadowsAccumulationPass";
import { ArcRotateCamera } from "../../Cameras/arcRotateCamera";
import { FreeCamera } from "../../Cameras/freeCamera";
import { PostProcessRenderPipeline } from "../../PostProcesses/RenderPipeline/postProcessRenderPipeline";
import { PostProcessRenderEffect } from "core/PostProcesses/RenderPipeline/postProcessRenderEffect";
import type { Camera } from "core/Cameras";

class IblShadowsSettings {
    /**
     * The exponent of the resolution of the voxel shadow grid. Higher resolutions will result in sharper
     * shadows but are more expensive to compute and require more memory.
     * The resolution is calculated as 2 to the power of this number.
     */
    public resolutionExp: number = 6;

    /**
     * The number of different directions to sample during the voxel tracing pass. Higher
     * values will result in better quality, more stable shadows but are more expensive to compute.
     */
    public sampleDirections: number = 1;

    /**
     * How dark the shadows are. 1.0 is full opacity, 0.0 is no shadows.
     */
    public shadowOpacity: number = 1.0;

    /**
     * How long the shadows remain in the scene. 0.0 is no persistence, 1.0 is full persistence.
     */
    public shadowRemenance: number = 0.9;

    /**
     * Render the voxel grid from 3 different axis. This will result in better quality shadows with fewer
     * bits of missing geometry.
     */
    public triplanarVoxelization: boolean = true;

    /**
     * Include screen-space shadows in the IBL shadow pipeline. This adds sharp shadows to small details
     * but only applies close to a shadow-casting object.
     */
    public ssShadowsEnabled: boolean = true;
    /**
     * The number of samples used in the screen space shadow pass.
     */
    public ssShadowSampleCount: number = 16;
    public ssShadowStride: number = 8;
    public ssShadowMaxDist: number = 0.05;
    public ssShadowThickness: number = 0.01;
}

class IblShadowsPrepassConfiguration implements PrePassEffectConfiguration {
    /**
     * Is this effect enabled
     */
    public enabled = true;

    /**
     * Name of the configuration
     */
    public name = "iblShadows";

    /**
     * Textures that should be present in the MRT for this effect to work
     */
    public readonly texturesRequired: number[] = [
        Constants.PREPASS_DEPTH_TEXTURE_TYPE,
        Constants.PREPASS_CLIPSPACE_DEPTH_TEXTURE_TYPE,
        Constants.PREPASS_WORLD_NORMAL_TEXTURE_TYPE,
        Constants.PREPASS_NORMAL_TEXTURE_TYPE, // TODO - don't need this for IBL shadows
        Constants.PREPASS_VELOCITY_TEXTURE_TYPE,
        // Local positions used for shadow accumulation pass
        Constants.PREPASS_POSITION_TEXTURE_TYPE,
        Constants.PREPASS_LOCAL_POSITION_TEXTURE_TYPE,
    ];
}

/**
 * Voxel-based shadow rendering for IBL's.
 * This should not be instanciated directly, as it is part of a scene component
 */
export class IblShadowsRenderPipeline extends PostProcessRenderPipeline {
    public scene: Scene;

    private _voxelizationDirty: boolean = true;
    private _boundsNeedUpdate: boolean = true;

    private _allowDebugPasses: boolean = false;
    private _debugPasses: PostProcess[] = [];

    private _shadowCompositePP: PostProcess;
    private _prePassEffectConfiguration: IblShadowsPrepassConfiguration;

    private _excludedMeshes: number[] = [];

    private _voxelRenderer: IblShadowsVoxelRenderer;
    private _importanceSamplingRenderer: IblShadowsImportanceSamplingRenderer;
    private _voxelTracingPass: IblShadowsVoxelTracingPass;
    private _spatialBlurPass: IblShadowsSpatialBlurPass;
    private _accumulationPass: IblShadowsAccumulationPass;
    private _noiseTexture: Texture;
    private _shadowOpacity: number = 1.0;

    /**
     * How dark the shadows appear. 1.0 is full opacity, 0.0 is no shadows.
     */
    public get shadowOpacity(): number {
        return this._shadowOpacity;
    }

    /**
     * How dark the shadows appear. 1.0 is full opacity, 0.0 is no shadows.
     */
    public set shadowOpacity(value: number) {
        this._shadowOpacity = value;
    }

    /**
     * How dark the voxel shadows appear. 1.0 is full opacity, 0.0 is no shadows.
     */
    public get voxelShadowOpacity() {
        return this._voxelTracingPass.voxelShadowOpacity;
    }

    /**
     * How dark the voxel shadows appear. 1.0 is full opacity, 0.0 is no shadows.
     */
    public set voxelShadowOpacity(value: number) {
        this._voxelTracingPass.voxelShadowOpacity = value;
    }

    /**
     * How dark the screen-space shadows appear. 1.0 is full opacity, 0.0 is no shadows.
     */
    public get ssShadowOpacity(): number {
        return this._voxelTracingPass.ssShadowOpacity;
    }

    public set ssShadowOpacity(value: number) {
        this._voxelTracingPass.ssShadowOpacity = value;
    }

    public get ssShadowSamples(): number {
        return this._voxelTracingPass.sssSamples;
    }

    public set ssShadowSamples(value: number) {
        this._voxelTracingPass.sssSamples = value;
    }

    public get ssShadowStride(): number {
        return this._voxelTracingPass.sssStride;
    }

    public set ssShadowStride(value: number) {
        this._voxelTracingPass.sssStride = value;
    }

    public get ssShadowMaxDist(): number {
        return this._voxelTracingPass.sssMaxDist;
    }

    public set ssShadowMaxDist(value: number) {
        this._voxelTracingPass.sssMaxDist = value;
    }

    public get ssShadowThickness(): number {
        return this._voxelTracingPass.sssThickness;
    }

    public set ssShadowThickness(value: number) {
        this._voxelTracingPass.sssThickness = value;
    }

    public setIblTexture(iblSource: BaseTexture) {
        this._importanceSamplingRenderer.iblSource = iblSource;
    }

    /**
     * Returns the texture containing the voxel grid data
     * @returns The texture containing the voxel grid data
     */
    public getVoxelGridTexture(): Texture {
        return this._voxelRenderer.getVoxelGrid();
    }

    /**
     * Returns the texture containing the importance sampling CDF data for the IBL shadow pipeline
     * @returns The texture containing the importance sampling CDF data for the IBL shadow pipeline
     */
    public getIcdfyTexture(): Texture {
        return this._importanceSamplingRenderer!.getIcdfyTexture();
    }

    /**
     * Returns the texture containing the importance sampling CDF data for the IBL shadow pipeline
     * @returns The texture containing the importance sampling CDF data for the IBL shadow pipeline
     */
    public getIcdfxTexture(): Texture {
        return this._importanceSamplingRenderer!.getIcdfxTexture();
    }

    /**
     * Turn on or off the debug view of the CDF importance sampling data
     */
    public get importanceSamplingDebugEnabled(): boolean {
        return this._importanceSamplingRenderer.debugEnabled;
    }

    /**
     * Turn on or off the debug view of the CDF importance sampling data
     */
    public set importanceSamplingDebugEnabled(enabled: boolean) {
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
        return this._voxelRenderer.voxelDebugEnabled;
    }

    /**
     * Turn on or off the debug view of the voxel grid
     */
    public set voxelDebugEnabled(enabled: boolean) {
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
        return this._voxelRenderer.voxelDebugAxis;
    }

    /**
     * Set the axis to display for the voxel grid debug view
     * When using tri-axis voxelization, this will display the voxel grid for the specified axis
     */
    public set voxelDebugAxis(axisNum: number) {
        this._voxelRenderer.voxelDebugAxis = axisNum;
    }

    /**
     * Set the mip level to display for the voxel grid debug view
     */
    public set voxelDebugDisplayMip(mipNum: number) {
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

    /**
     * Display the debug view for the spatial blur pass
     */
    public set spatialBlurPassDebugEnabled(enabled: boolean) {
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
        return this._accumulationPass.debugEnabled;
    }

    /**
     * Display the debug view for the accumulation pass
     */
    public set accumulationPassDebugEnabled(enabled: boolean) {
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
        this._voxelTracingPass.sampleDirections = value;
    }

    /**
     * The decree to which the shadows persist between frames. 0.0 is no persistence, 1.0 is full persistence.
     **/
    public get shadowRemenance(): number {
        return this._accumulationPass.remenance;
    }

    /**
     * The decree to which the shadows persist between frames. 0.0 is no persistence, 1.0 is full persistence.
     **/
    public set shadowRemenance(value: number) {
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
        this._voxelTracingPass.envRotation = value;
    }

    public get allowDebugPasses(): boolean {
        return this._allowDebugPasses;
    }

    public set allowDebugPasses(value: boolean) {
        if (this._allowDebugPasses === value) return;
        this._allowDebugPasses = value;
        if (value) {
            this._createDebugPasses();
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
        //  We need a depth texture for opaque
        if (!scene.enablePrePassRenderer()) {
            Logger.Warn("IBL Shadows Render Pipeline could not enable PrePass, aborting.");
            return;
        }
        this.shadowOpacity = options.shadowOpacity || 1.0;
        this._prePassEffectConfiguration = new IblShadowsPrepassConfiguration();
        this._voxelRenderer = new IblShadowsVoxelRenderer(this.scene, this, options ? options.resolutionExp : 6, options.triplanarVoxelization || true);
        this._importanceSamplingRenderer = new IblShadowsImportanceSamplingRenderer(this.scene);
        this._voxelTracingPass = new IblShadowsVoxelTracingPass(this.scene, this);
        this.sampleDirections = options.sampleDirections || 1;
        this.ssShadowOpacity = options.ssShadowsEnabled === undefined || options.ssShadowsEnabled ? 1.0 : 0.0;
        this.ssShadowMaxDist = options.ssShadowMaxDist || 0.05;
        this.ssShadowSamples = options.ssShadowSampleCount || 16;
        this.ssShadowStride = options.ssShadowStride || 8;
        this.ssShadowThickness = options.ssShadowThickness || 0.01;
        this._spatialBlurPass = new IblShadowsSpatialBlurPass(this.scene);
        this._accumulationPass = new IblShadowsAccumulationPass(this.scene);
        this.shadowRemenance = options.shadowRemenance || 0.9;
        this._noiseTexture = new Texture("https://assets.babylonjs.com/textures/blue_noise/blue_noise_rgb.png", this.scene, false, true, Constants.TEXTURE_NEAREST_SAMPLINGMODE);
        if (this.scene.environmentTexture) {
            this._importanceSamplingRenderer.iblSource = this.scene.environmentTexture;
        }

        // Create post process that applies the shadows to the scene
        this._createShadowCombinePostProcess();

        scene.postProcessRenderPipelineManager.addPipeline(this);

        this._createEffectPasses(cameras);

        this.scene.onNewMeshAddedObservable.add(this.updateSceneBounds.bind(this));
        this.scene.onMeshRemovedObservable.add(this.updateSceneBounds.bind(this));
        this.scene.onActiveCameraChanged.add(this._listenForCameraChanges.bind(this));
        this.scene.onBeforeRenderObservable.add(this._updateBeforeRender.bind(this));

        this._listenForCameraChanges();
        this.scene.getEngine().onResizeObservable.add(this._handleResize.bind(this));
    }

    private _handleResize() {
        this._voxelRenderer.resize();
        this._accumulationPass?.resize();
    }

    private _createShadowCombinePostProcess() {
        const compositeOptions: PostProcessOptions = {
            width: this.scene.getEngine().getRenderWidth(),
            height: this.scene.getEngine().getRenderHeight(),
            uniforms: ["shadowOpacity"],
            samplers: ["sceneTexture"],
            samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
            engine: this.scene.getEngine(),
            textureType: Constants.TEXTURETYPE_FLOAT,
            reusable: false,
        };
        this._shadowCompositePP = new PostProcess("iblShadowsCombine", "iblShadowsCombine", compositeOptions);
        this._shadowCompositePP.autoClear = false;
        this._shadowCompositePP.onApply = (effect) => {
            effect.setTextureFromPostProcess("sceneTexture", this._voxelTracingPass.getPassPP());
            effect.setFloat("shadowOpacity", this._shadowOpacity);
            this.update();
        };
        this._shadowCompositePP._prePassEffectConfiguration = this._prePassEffectConfiguration;
    }

    private _createEffectPasses(cameras: Camera[] | undefined) {
        this.addEffect(
            new PostProcessRenderEffect(
                this.scene.getEngine(),
                "IBLShadowVoxelTracingPass",
                () => {
                    return this._voxelTracingPass.getPassPP();
                },
                true
            )
        );
        this.addEffect(
            new PostProcessRenderEffect(
                this.scene.getEngine(),
                "IBLShadowSpatialBlurPass",
                () => {
                    return this._spatialBlurPass.getPassPP();
                },
                true
            )
        );
        this.addEffect(
            new PostProcessRenderEffect(
                this.scene.getEngine(),
                "IBLShadowAccumulationBlurPass",
                () => {
                    return this._accumulationPass.getPassPP();
                },
                true
            )
        );
        this.addEffect(
            new PostProcessRenderEffect(
                this.scene.getEngine(),
                "IBLShadowCompositePass",
                () => {
                    return this._shadowCompositePP;
                },
                true
            )
        );

        if (cameras) {
            this.scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(this.name, cameras);
        }

        if (this.allowDebugPasses) {
            this._createDebugPasses();
        }
    }

    private _createDebugPasses() {
        this._debugPasses = [
            this._importanceSamplingRenderer.getDebugPassPP(),
            this._voxelRenderer.getDebugPassPP(),
            this._voxelTracingPass.getDebugPassPP(),
            this._spatialBlurPass.getDebugPassPP(),
            this._accumulationPass.getDebugPassPP(),
        ];
        for (let i = 0; i < this._debugPasses.length; i++) {
            this.addEffect(
                new PostProcessRenderEffect(
                    this.scene.getEngine(),
                    this._debugPasses[i].name,
                    () => {
                        return this._debugPasses[i];
                    },
                    true
                )
            );
        }
        const cameras = this.cameras.slice();
        this.scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline(this.name, this.cameras);
        this.scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(this.name, cameras);
        for (let i = 0; i < this._debugPasses.length; i++) {
            this._disableEffect(this._debugPasses[i].name, this.cameras);
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
            this._disableEffect(this._debugPasses[i].name, this.cameras);
            this._debugPasses[i].dispose();
        }
        this._debugPasses = [];
    }

    private _updateDebugPasses() {
        let count = 0;
        // if (this._gbufferDebugEnabled) count++;
        if (this.importanceSamplingDebugEnabled) count++;
        if (this.voxelDebugEnabled) count++;
        if (this.voxelTracingDebugEnabled) count++;
        if (this.spatialBlurPassDebugEnabled) count++;
        if (this.accumulationPassDebugEnabled) count++;

        // count = 4;
        const rows = Math.ceil(Math.sqrt(count));
        const cols = Math.ceil(count / rows);
        const width = 1.0 / cols;
        const height = 1.0 / rows;
        let x = 0;
        let y = 0;
        // if (this.gbufferDebugEnabled) {
        //     const prePassRenderer = this._scene!.prePassRenderer;
        //     if (!prePassRenderer) {
        //         Logger.Error("Can't enable G-Buffer debug rendering since prepassRenderer doesn't exist.");
        //         return;
        //     }

        //     const xOffset = x;
        //     const yOffset = y;
        //     this._debugPass.onApply = (effect) => {
        //         this._prePassEffectConfiguration.texturesRequired.forEach((type) => {
        //             const index = prePassRenderer.getIndex(type);
        //             if (index >= 0) effect.setTexture(PrePassRenderer.TextureFormats[type].name, prePassRenderer.getRenderTarget().textures[index]);
        //         });
        //         effect.setFloat4("sizeParams", xOffset, yOffset, cols, rows);
        //         if (this._scene.activeCamera) {
        //             effect.setFloat("maxDepth", this._scene.activeCamera.maxZ);
        //         }
        //     };
        //     x -= width;
        //     if (x <= -1) {
        //         x = 0;
        //         y -= height;
        //     }
        // } else {
        //     this._debugPass?.dispose();
        // }

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

    public updateVoxelization() {
        this._voxelizationDirty = true;
    }

    public updateSceneBounds() {
        this._voxelizationDirty = true;
        this._boundsNeedUpdate = true;
    }

    private _updateBeforeRender() {
        this._updateDebugPasses();
        // this._voxelTracingPass?.update();
        // this._spatialBlurPass?.update();
        // this._accumulationPass?.update();
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
     * Links to the prepass renderer
     * @param prePassRenderer The scene PrePassRenderer
     * @returns true if the pre pass is setup
     */
    public override setPrePassRenderer(prePassRenderer: PrePassRenderer): boolean {
        return !!prePassRenderer.addEffectConfiguration(this._prePassEffectConfiguration);
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
     * Renders accumulated shadows for IBL
     */
    public update() {
        // This is called for every MRT in the customRenderTargets structure during voxelization. That doesn't make
        // sense. We only want this to run after voxelization so we should put in some state logic here to return
        // if voxelization is happening.
        if (this._voxelRenderer.isVoxelizationInProgress()) {
            return;
        }

        if (this._boundsNeedUpdate) {
            const bounds = this.scene.getWorldExtends((mesh) => {
                return mesh instanceof Mesh && this._excludedMeshes.indexOf(mesh.uniqueId) === -1;
            });
            const size = bounds.max.subtract(bounds.min);
            const halfSize = Math.max(size.x, Math.max(size.y, size.z)) * 0.5;
            const centre = bounds.max.add(bounds.min).multiplyByFloats(-0.5, -0.5, -0.5);
            const invWorldScaleMatrix = Matrix.Compose(new Vector3(1.0 / halfSize, 1.0 / halfSize, 1.0 / halfSize), new Quaternion(), new Vector3(0, 0, 0));
            const invTranslationMatrix = Matrix.Compose(new Vector3(1.0, 1.0, 1.0), new Quaternion(), centre);
            invTranslationMatrix.multiplyToRef(invWorldScaleMatrix, invWorldScaleMatrix);
            this._voxelTracingPass?.setWorldScaleMatrix(invWorldScaleMatrix);
            this._voxelRenderer.setWorldScaleMatrix(invWorldScaleMatrix);
            // Set world scale for spatial blur.
            this._spatialBlurPass?.setWorldScale(halfSize * 2.0);
            this._boundsNeedUpdate = false;
            Logger.Log("IBL Shadows: Scene size: " + size);
            Logger.Log("Half size: " + halfSize);
            Logger.Log("Centre translation: " + centre);
        }

        // If update is needed, render voxels
        if (this._voxelizationDirty) {
            this._voxelRenderer.updateVoxelGrid(this._excludedMeshes);
            this._voxelizationDirty = false;
        }
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
