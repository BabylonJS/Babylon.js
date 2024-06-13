import { Constants } from "../../Engines/constants";
import { EngineStore } from "../../Engines/engineStore";
import type { AbstractMesh } from "../../Meshes/abstractMesh";
import { Matrix, Vector3, Quaternion } from "../../Maths/math.vector";
import { Mesh } from "../../Meshes/mesh";
import type { Scene } from "../../scene";
import { Texture } from "../../Materials/Textures/texture";
import type { PrePassEffectConfiguration } from "../prePassEffectConfiguration";
import { PrePassRenderer } from "../prePassRenderer";
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
     * The resolution of the voxel shadow grid. Higher resolutions will result in sharper
     * shadows but are more expensive to compute and require more memory.
     */
    public resolution: number = 64;

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
    private _scene: Scene;

    private _voxelizationDirty: boolean = true;
    private _boundsNeedUpdate: boolean = true;

    private _gbufferDebugEnabled: boolean = false;
    private _debugPass: PostProcess;

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

    public configureScreenSpaceShadow(samples: number, stride: number, maxDist: number, thickness: number) {
        if (this._voxelTracingPass === undefined) return;
        this._voxelTracingPass.sssSamples = samples !== undefined ? samples : this._voxelTracingPass.sssSamples;
        this._voxelTracingPass.sssStride = stride !== undefined ? stride : this._voxelTracingPass.sssStride;
        this._voxelTracingPass.sssMaxDist = maxDist !== undefined ? maxDist : this._voxelTracingPass.sssMaxDist;
        this._voxelTracingPass.sssThickness = thickness !== undefined ? thickness : this._voxelTracingPass.sssThickness;
    }

    /**
     * The decree to which the shadows persist between frames. 0.0 is no persistence, 1.0 is full persistence.
     **/
    public get remenance(): number {
        return this._accumulationPass.remenance;
    }

    /**
     * The decree to which the shadows persist between frames. 0.0 is no persistence, 1.0 is full persistence.
     **/
    public set remenance(value: number) {
        this._accumulationPass.remenance = value;
    }

    public setIblTexture(iblSource: Texture) {
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
        this._importanceSamplingRenderer.debugEnabled = enabled;
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
        this._voxelRenderer.voxelDebugEnabled = enabled;
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
        if (this._voxelTracingPass) this._voxelTracingPass.debugEnabled = enabled;
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
        if (this._spatialBlurPass) this._spatialBlurPass.debugEnabled = enabled;
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
        if (this._accumulationPass) this._accumulationPass.debugEnabled = enabled;
    }

    /**
     * Display the debug view for the G-Buffer used by IBL shadows
     */
    public get gbufferDebugEnabled(): boolean {
        return this._gbufferDebugEnabled;
    }

    /**
     * Display the debug view for the G-Buffer used by IBL shadows
     */
    public set gbufferDebugEnabled(enabled: boolean) {
        if (this._gbufferDebugEnabled === enabled) {
            return;
        }
        this._gbufferDebugEnabled = enabled;
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
     * Get the resolution of the voxel shadow grid
     */
    public get resolution() {
        return this._voxelRenderer.voxelResolution;
    }

    /**
     * Set the resolution of the voxel shadow grid. Note that changing this will result
     * in recreating the voxel grid and can be expensive.
     */
    public set resolution(newResolution: number) {
        if (newResolution === this._voxelRenderer.voxelResolution) return;
        this._voxelRenderer.voxelResolution = newResolution;
        this._voxelizationDirty = true;
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

    public get shadowRemenance(): number {
        return this._accumulationPass.remenance;
    }

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
        this._scene = scene;

        //  We need a depth texture for opaque
        if (!scene.enablePrePassRenderer()) {
            Logger.Warn("IBL Shadows Render Pipeline could not enable PrePass, aborting.");
            return;
        }
        this.shadowOpacity = options.shadowOpacity || 1.0;
        this._prePassEffectConfiguration = new IblShadowsPrepassConfiguration();
        this._voxelRenderer = new IblShadowsVoxelRenderer(this._scene, this, options ? options.resolution : 64, options.triplanarVoxelization || true);
        this._importanceSamplingRenderer = new IblShadowsImportanceSamplingRenderer(this._scene);
        this._voxelTracingPass = new IblShadowsVoxelTracingPass(this._scene, this);
        this._voxelTracingPass.sampleDirections = options.sampleDirections || 1;
        this.ssShadowOpacity = options.ssShadowsEnabled ? 1.0 : 0.0;
        this._voxelTracingPass.sssMaxDist = options.ssShadowMaxDist || 0.05;
        this._voxelTracingPass.sssSamples = options.ssShadowSampleCount || 16;
        this._voxelTracingPass.sssStride = options.ssShadowStride || 8;
        this._voxelTracingPass.sssThickness = options.ssShadowThickness || 0.01;
        this._spatialBlurPass = new IblShadowsSpatialBlurPass(this._scene);
        this._accumulationPass = new IblShadowsAccumulationPass(this._scene);
        this._accumulationPass.remenance = options.shadowRemenance || 0.9;
        this._noiseTexture = new Texture("https://assets.babylonjs.com/textures/blue_noise/blue_noise_rgb.png", this._scene, false, true, Constants.TEXTURE_NEAREST_SAMPLINGMODE);

        // Create post process that applies the shadows to the scene
        this._createShadowCombinePostProcess();

        this.addEffect(
            new PostProcessRenderEffect(
                scene.getEngine(),
                "IBLShadowVoxelTracingPass",
                () => {
                    return this._voxelTracingPass.getPassPP();
                },
                true
            )
        );
        this.addEffect(
            new PostProcessRenderEffect(
                scene.getEngine(),
                "IBLShadowSpatialBlurPass",
                () => {
                    return this._spatialBlurPass.getPassPP();
                },
                true
            )
        );
        this.addEffect(
            new PostProcessRenderEffect(
                scene.getEngine(),
                "IBLShadowAccumulationBlurPass",
                () => {
                    return this._accumulationPass.getPassPP();
                },
                true
            )
        );
        this.addEffect(
            new PostProcessRenderEffect(
                scene.getEngine(),
                "IBLShadowCompositePass",
                () => {
                    return this._shadowCompositePP;
                },
                true
            )
        );
        const debugPPs = [this._voxelTracingPass.getDebugPassPP(), this._spatialBlurPass.getDebugPassPP(), this._accumulationPass.getDebugPassPP()];
        if (debugPPs.find((pp) => pp !== undefined) !== undefined) {
            this.addEffect(
                new PostProcessRenderEffect(
                    scene.getEngine(),
                    "IBLShadowDebugPPs",
                    () => {
                        return debugPPs.filter((pp) => pp !== undefined);
                    },
                    true
                )
            );
        }
        scene.postProcessRenderPipelineManager.addPipeline(this);
        if (cameras) {
            scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline(name, cameras);
        }

        this._scene.onNewMeshAddedObservable.add(this.updateSceneBounds.bind(this));
        this._scene.onMeshRemovedObservable.add(this.updateSceneBounds.bind(this));
        this._scene.onActiveCameraChanged.add(this._listenForCameraChanges.bind(this));
        this._scene.onBeforeRenderObservable.add(this._updateBeforeRender.bind(this));

        this._listenForCameraChanges();
        this._scene.getEngine().onResizeObservable.add(this._handleResize.bind(this));
    }

    private _handleResize() {
        this._voxelRenderer.resize();
        this._voxelTracingPass?.resize();
        this._spatialBlurPass?.resize();
        this._accumulationPass?.resize();
    }

    private _createShadowCombinePostProcess() {
        const compositeOptions: PostProcessOptions = {
            width: this._scene.getEngine().getRenderWidth(),
            height: this._scene.getEngine().getRenderHeight(),
            uniforms: ["shadowOpacity"],
            samplers: ["sceneTexture"],
            samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
            engine: this._scene.getEngine(),
            textureType: Constants.TEXTURETYPE_FLOAT,
            reusable: true,
        };
        this._shadowCompositePP = new PostProcess("iblShadowsCombine", "iblShadowsCombine", compositeOptions);
        this._shadowCompositePP.autoClear = false;
        this._shadowCompositePP.onApply = (effect) => {
            effect.setTextureFromPostProcess("sceneTexture", this._voxelTracingPass.getPassPP());
            // const shadowPassRT = this.getAccumulatedShadowTexture();

            // effect.setTexture("shadowTexture", shadowPassRT);
            effect.setFloat("shadowOpacity", this._shadowOpacity);
            this.update();
        };
        if (this._scene.postProcessManager) {
            // this._scene.postProcessManager.onBeforeRenderObservable.add(() => {
            //     if (this.isReady()) {
            //         const shadowPT = this.getRawShadowTexture();
            //         shadowPT.render();
            //         const blurPT = this.getBlurShadowTexture();
            //         if (blurPT) blurPT.render();
            //         const accumPT = this.getAccumulatedShadowTexture();
            //         if (accumPT) accumPT.render();
            //     }
            // });
        }
        this._shadowCompositePP._prePassEffectConfiguration = this._prePassEffectConfiguration;
    }

    private _updateDebugPasses() {
        let count = 0;
        if (this._gbufferDebugEnabled) count++;
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
        if (this.gbufferDebugEnabled) {
            const prePassRenderer = this._scene!.prePassRenderer;
            if (!prePassRenderer) {
                Logger.Error("Can't enable G-Buffer debug rendering since prepassRenderer doesn't exist.");
                return;
            }
            if (!this._debugPass) {
                let samplerNames = new Array(this._prePassEffectConfiguration.texturesRequired.length).fill("");
                samplerNames = samplerNames.map((_, i) => PrePassRenderer.TextureFormats[this._prePassEffectConfiguration.texturesRequired[i]].name);
                this._debugPass = new PostProcess(
                    "iblShadows_GBuffer_Debug",
                    "iblShadowGBufferDebug",
                    ["sizeParams", "maxDepth"], // attributes
                    samplerNames,
                    1.0, // options
                    this._scene._activeCamera, // camera
                    Texture.BILINEAR_SAMPLINGMODE, // sampling
                    this._scene.getEngine()
                );
            }
            const xOffset = x;
            const yOffset = y;
            this._debugPass.onApply = (effect) => {
                this._prePassEffectConfiguration.texturesRequired.forEach((type) => {
                    const index = prePassRenderer.getIndex(type);
                    if (index >= 0) effect.setTexture(PrePassRenderer.TextureFormats[type].name, prePassRenderer.getRenderTarget().textures[index]);
                });
                effect.setFloat4("sizeParams", xOffset, yOffset, cols, rows);
                if (this._scene.activeCamera) {
                    effect.setFloat("maxDepth", this._scene.activeCamera.maxZ);
                }
            };
            x -= width;
            if (x <= -1) {
                x = 0;
                y -= height;
            }
        } else {
            this._debugPass?.dispose();
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
        if (this._scene.activeCamera instanceof ArcRotateCamera) {
            this._scene.onBeforeCameraRenderObservable.add((camera) => {
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
                        this._accumulationPass.reset = true;
                        this._accumulationPass.remenance = 1.0;
                    } else {
                        this._accumulationPass.reset = false;
                        this._accumulationPass.remenance = 0.9;
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
            const bounds = this._scene.getWorldExtends((mesh) => {
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
     * @returns "IBLShadowsRenderingPipeline"
     */
    public override getClassName(): string {
        return "IBLShadowsRenderingPipeline";
    }

    /**
     * Disposes the IBL shadow pipeline and associated resources
     */
    public override dispose() {
        this._noiseTexture.dispose();
        this._voxelRenderer.dispose();
        this._importanceSamplingRenderer.dispose();
        this._voxelTracingPass?.dispose();
        this._spatialBlurPass?.dispose();
        this._accumulationPass?.dispose();
        super.dispose();
    }
}
