import { type Camera, type FrameGraph, type FrameGraphObjectList, type FrameGraphTextureHandle, type InternalTexture, type Mesh, type Nullable, type Observer } from "core/index";
import { Constants } from "core/Engines/constants";
import { type Material } from "core/Materials/material";
import { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { IBLShadowsPluginMaterial } from "core/Rendering/IBLShadows/iblShadowsPluginMaterial";
import { FrameGraphIblShadowsAccumulationTask } from "./iblShadows/iblShadowsAccumulationTask";
import { FrameGraphIblShadowsSpatialBlurTask } from "./iblShadows/iblShadowsSpatialBlurTask";
import { FrameGraphIblShadowsTracingTask } from "./iblShadows/iblShadowsTracingTask";
import { FrameGraphIblShadowsVoxelizationTask } from "./iblShadows/iblShadowsVoxelizationTask";
import { Texture } from "core/Materials/Textures/texture";
import { CubeTexture } from "core/Materials/Textures/cubeTexture";
import { Tools } from "core/Misc/tools";
import { Observable } from "core/Misc/observable";
import { FrameGraphTask } from "../../frameGraphTask";
import { _RetryWithInterval } from "../../../Misc/timingTools";
import "../../../Rendering/iblCdfGeneratorSceneComponent";

/**
 * Composite task that owns the individual IBL shadows frame graph tasks.
 * The frame graph remains flat internally, but this task groups the pipeline
 * and owns the child task implementation details.
 */
export class FrameGraphIblShadowsRendererTask extends FrameGraphTask {
    /** Final frame-graph texture handle produced by the task. */
    public readonly outputTexture: FrameGraphTextureHandle;

    private readonly _voxelizationTask: FrameGraphIblShadowsVoxelizationTask;
    private readonly _tracingTask: FrameGraphIblShadowsTracingTask;
    private readonly _spatialBlurTask: FrameGraphIblShadowsSpatialBlurTask;
    private readonly _accumulationTask: FrameGraphIblShadowsAccumulationTask;
    private _dependenciesResolved = false;
    private _shadowOpacity = 1.0;
    private readonly _materialsWithRenderPlugin: Material[] = [];
    private readonly _outputTextureReadyObservable = new Observable<InternalTexture>();
    private _lastNotifiedOutputTexture: Nullable<InternalTexture> = null;
    private _observedEnvironmentTexture: Nullable<Texture | CubeTexture> = null;
    private _observedEnvironmentTextureUnsubscribe: Nullable<() => void> = null;
    private _lastImportedIcdfTexture: Nullable<InternalTexture> = null;
    private _lastImportedEnvironmentTexture: Nullable<InternalTexture> = null;
    private _lastImportedBlueNoiseTexture: Nullable<InternalTexture> = null;
    private readonly _blueNoiseTexture: Texture;
    private _cameraViewChangedObserver: Nullable<Observer<any>> = null;
    private _cdfTextureChangedObserver: Nullable<Observer<any>> = null;
    private _cdfGeneratedObserver: Nullable<Observer<any>> = null;
    private _environmentTextureChangedObserver: Nullable<Observer<any>> = null;
    private _beforeRenderDependencyObserver: Nullable<Observer<any>> = null;
    private _beforeRenderOutputReadyObserver: Nullable<Observer<any>> = null;
    private _blueNoiseLoadObserver: Nullable<Observer<any>> = null;
    private _texturesAllocatedObserver: Nullable<Observer<any>> = null;
    private _voxelizationCompleteObserver: Nullable<Observer<any>> = null;

    /**
     * Gets the class name.
     * @returns The class name.
     */
    public override getClassName(): string {
        return "FrameGraphIblShadowsRendererTask";
    }

    public override get name() {
        return this._name;
    }

    public override set name(value: string) {
        this._name = value;
        if (this._voxelizationTask) {
            this._voxelizationTask.name = `${value} Voxelization`;
        }
        if (this._tracingTask) {
            this._tracingTask.name = `${value} Tracing`;
        }
        if (this._spatialBlurTask) {
            this._spatialBlurTask.name = `${value} Blur`;
        }
        if (this._accumulationTask) {
            this._accumulationTask.name = `${value} Accumulation`;
        }
    }

    /**
     * Whether the task is disabled.
     */

    public override get disabled(): boolean {
        return this._disabled;
    }

    public override set disabled(value: boolean) {
        this._disabled = value;
        if (!this._disabled && this._dependenciesResolved) {
            this._accumulationTask.reset = true;
        }
        this._applyMaterialPluginParameters();
    }

    // ------ Common properties ------

    /** Camera used by the tracing stage. */
    public get camera(): Camera {
        return this._tracingTask.camera!;
    }

    /** Camera used by the tracing stage. */
    public set camera(value: Camera) {
        this._setCamera(value);
    }

    /** Object list used by voxelization. */
    public get objectList(): FrameGraphObjectList {
        return this._voxelizationTask.objectList;
    }

    /** Object list used by voxelization. */
    public set objectList(value: FrameGraphObjectList) {
        if (this._voxelizationTask.objectList === value) {
            return;
        }

        this._voxelizationTask.objectList = value;
        this._voxelizationTask.updateSceneBounds();
        this._voxelizationTask.requestVoxelizationUpdate();
        this._accumulationTask.reset = true;
    }

    /**
     * Depth texture handle used by tracing and blur.
     * This should be the screen-space depth of all objects in the scene
     * that will receive shadows.
     * It is important that this texture stores 32-bit depth values to avoid artifacts.
     */
    public depthTexture: FrameGraphTextureHandle;

    /**
     * World-space normal texture handle used by tracing and blur.
     * This should store the world-space normals of all objects in the scene
     * that will receive shadows. Each component should be normalized to [0, 1] rather than [-1, 1].
     * Recommended to be 16-bit floating point though 8-bit unsigned byte can be used with minimal
     * loss in quality.
     */
    public normalTexture: FrameGraphTextureHandle;

    /**
     * Position texture handle used by accumulation.
     * This should store the world-space position of all objects in the scene
     * that will receive shadows.
     * Should be stored as 16-bit floating point.
     */
    public positionTexture: FrameGraphTextureHandle;

    /**
     * Velocity texture handle used by accumulation.
     * This should store the linear velocity per pixel of all objects in the scene
     * that will receive shadows.
     * Should be stored as 16-bit floating point.
     */
    public velocityTexture: FrameGraphTextureHandle;

    // ------ Tracing properties ------

    /** Number of tracing sample directions. */
    public get sampleDirections(): number {
        return this._tracingTask.sampleDirections;
    }

    /** Number of tracing sample directions. */
    public set sampleDirections(value: number) {
        this._tracingTask.sampleDirections = value;
        this.resetAccumulation();
    }

    /** Whether traced shadows preserve environment color. */
    public get coloredShadows(): boolean {
        return this._tracingTask.coloredShadows;
    }

    /** Whether traced shadows preserve environment color. */
    public set coloredShadows(value: boolean) {
        if (this._tracingTask.coloredShadows === value) {
            return;
        }
        this._tracingTask.coloredShadows = value;
        this._applyMaterialPluginParameters();
        this.resetAccumulation();
    }

    /** Opacity of voxel-traced shadows. */
    public get voxelShadowOpacity(): number {
        return this._tracingTask.voxelShadowOpacity;
    }

    /** Opacity of voxel-traced shadows. */
    public set voxelShadowOpacity(value: number) {
        this._tracingTask.voxelShadowOpacity = value;
        this.resetAccumulation();
    }

    /** Opacity of screen-space shadows. */
    public get ssShadowOpacity(): number {
        return this._tracingTask.ssShadowOpacity;
    }

    /** Opacity of screen-space shadows. */
    public set ssShadowOpacity(value: number) {
        this._tracingTask.ssShadowOpacity = value;
        this.resetAccumulation();
    }

    /** Number of screen-space shadow samples. */
    public get ssShadowSampleCount(): number {
        return this._tracingTask.ssShadowSampleCount;
    }

    /** Number of screen-space shadow samples. */
    public set ssShadowSampleCount(value: number) {
        this._tracingTask.ssShadowSampleCount = value;
        this.resetAccumulation();
    }

    /** Stride used by screen-space shadow sampling. */
    public get ssShadowStride(): number {
        return this._tracingTask.ssShadowStride;
    }

    /** Stride used by screen-space shadow sampling. */
    public set ssShadowStride(value: number) {
        this._tracingTask.ssShadowStride = value;
        this.resetAccumulation();
    }

    /** Distance scale used by screen-space shadow tracing. */
    public get ssShadowDistanceScale(): number {
        return this._tracingTask.ssShadowDistanceScale;
    }

    /** Distance scale used by screen-space shadow tracing. */
    public set ssShadowDistanceScale(value: number) {
        this._tracingTask.ssShadowDistanceScale = value;
        this.resetAccumulation();
    }

    /** Thickness scale used by screen-space shadow tracing. */
    public get ssShadowThicknessScale(): number {
        return this._tracingTask.ssShadowThicknessScale;
    }

    /** Thickness scale used by screen-space shadow tracing. */
    public set ssShadowThicknessScale(value: number) {
        this._tracingTask.ssShadowThicknessScale = value;
        this.resetAccumulation();
    }

    /** Voxel tracing normal bias. */
    public get voxelNormalBias(): number {
        return this._tracingTask.voxelNormalBias;
    }

    /** Voxel tracing normal bias. */
    public set voxelNormalBias(value: number) {
        this._tracingTask.voxelNormalBias = value;
        this.resetAccumulation();
    }

    /** Voxel tracing direction bias. */
    public get voxelDirectionBias(): number {
        return this._tracingTask.voxelDirectionBias;
    }

    /** Voxel tracing direction bias. */
    public set voxelDirectionBias(value: number) {
        this._tracingTask.voxelDirectionBias = value;
        this.resetAccumulation();
    }

    /** Environment rotation in radians. */
    public get envRotation(): number {
        return this._tracingTask.envRotation;
    }

    /** Environment rotation in radians. */
    public set envRotation(value: number) {
        this._tracingTask.envRotation = value;
        this.resetAccumulation();
    }

    // ------ Accumulation properties ------

    /** Temporal shadow remanence while moving. */
    public get shadowRemanence(): number {
        return this._accumulationTask.remanence;
    }

    /** Temporal shadow remanence while moving. */
    public set shadowRemanence(value: number) {
        this._accumulationTask.remanence = value;
    }

    /** Final material shadow opacity. */
    public get shadowOpacity(): number {
        return this._shadowOpacity;
    }

    /** Final material shadow opacity. */
    public set shadowOpacity(value: number) {
        this._shadowOpacity = Math.max(0, Math.min(value, 1));
        this._applyMaterialPluginParameters();
    }

    // ------ Voxelization properties ------

    /** Voxelization resolution exponent. */
    public get resolutionExp(): number {
        return this._voxelizationTask.resolutionExp;
    }

    /** Voxelization resolution exponent. */
    public set resolutionExp(value: number) {
        this._voxelizationTask.resolutionExp = value;
        this.resetAccumulation();
    }

    /** Voxelization refresh rate. */
    public get refreshRate(): number {
        return this._voxelizationTask.refreshRate;
    }

    /** Voxelization refresh rate. */
    public set refreshRate(value: number) {
        this._voxelizationTask.refreshRate = value;
    }

    /** Whether tri-planar voxelization is used. */
    public get triPlanarVoxelization(): boolean {
        return this._voxelizationTask.triPlanarVoxelization;
    }

    /** Whether tri-planar voxelization is used. */
    public set triPlanarVoxelization(value: boolean) {
        this._voxelizationTask.triPlanarVoxelization = value;
    }

    /** Current world-space voxel grid size. */
    public get voxelGridSize(): number {
        return this._voxelizationTask.voxelGridSize;
    }

    /** True when the accumulated output texture is ready. */
    public get outputTextureReady(): boolean {
        return !!this._getAccumulationOutputTexture()?.isReady;
    }

    /** Notifies when the accumulated output texture becomes ready. */
    public get onOutputTextureReadyObservable(): Observable<InternalTexture> {
        return this._outputTextureReadyObservable;
    }

    // ------ Public methods ------

    /** Triggers a voxelization refresh on the next eligible frame. */
    public updateVoxelization(): void {
        this._voxelizationTask.requestVoxelizationUpdate();
    }

    /** Recomputes the voxelization scene bounds from the current object list. */
    public updateSceneBounds(): void {
        this._voxelizationTask.updateSceneBounds();
    }

    /** Resets temporal accumulation. */
    public resetAccumulation(): void {
        this._accumulationTask.reset = true;
    }

    /**
     * Adds one or more materials that should receive IBL shadows.
     * @param material The material or materials to register. If omitted, all scene materials are added.
     */
    public addShadowReceivingMaterial(material?: Material | Material[]): void {
        if (!material) {
            for (const sceneMaterial of this._frameGraph.scene.materials) {
                this._addShadowReceivingMaterialInternal(sceneMaterial);
            }
        } else if (Array.isArray(material)) {
            for (const sceneMaterial of material) {
                this._addShadowReceivingMaterialInternal(sceneMaterial);
            }
        } else {
            this._addShadowReceivingMaterialInternal(material);
        }

        this._applyMaterialPluginParameters();
    }

    /**
     * Removes one or more materials from IBL shadow reception.
     * @param material The material or materials to unregister.
     */
    public removeShadowReceivingMaterial(material: Material | Material[]): void {
        const materials = Array.isArray(material) ? material : [material];
        for (const mat of materials) {
            const index = this._materialsWithRenderPlugin.indexOf(mat);
            if (index !== -1) {
                this._materialsWithRenderPlugin.splice(index, 1);
            }

            const plugin = mat.pluginManager?.getPlugin<IBLShadowsPluginMaterial>(IBLShadowsPluginMaterial.Name);
            if (plugin) {
                plugin.isEnabled = false;
            }
        }
    }

    /** Clears all registered shadow-receiving materials. */
    public clearShadowReceivingMaterials(): void {
        for (const mat of this._materialsWithRenderPlugin) {
            const plugin = mat.pluginManager?.getPlugin<IBLShadowsPluginMaterial>(IBLShadowsPluginMaterial.Name);
            if (plugin) {
                plugin.isEnabled = false;
            }
        }

        this._materialsWithRenderPlugin.length = 0;
    }

    /**
     * Adds one or more meshes to the voxelization object list.
     * @param mesh The mesh or meshes to add.
     */
    public addShadowCastingMesh(mesh: Mesh | Mesh[]): void {
        const meshes = Array.isArray(mesh) ? mesh : [mesh];
        const objectMeshes = this._voxelizationTask.objectList.meshes as Mesh[];
        for (const currentMesh of meshes) {
            if (currentMesh && objectMeshes.indexOf(currentMesh) === -1) {
                objectMeshes.push(currentMesh);
            }
        }
    }

    /**
     * Removes one or more meshes from the voxelization object list.
     * @param mesh The mesh or meshes to remove.
     */
    public removeShadowCastingMesh(mesh: Mesh | Mesh[]): void {
        const meshes = Array.isArray(mesh) ? mesh : [mesh];
        const objectMeshes = this._voxelizationTask.objectList.meshes as Mesh[];
        for (const currentMesh of meshes) {
            const index = objectMeshes.indexOf(currentMesh);
            if (index !== -1) {
                objectMeshes.splice(index, 1);
            }
        }
    }

    /** Clears all shadow-casting meshes from the voxelization object list. */
    public clearShadowCastingMeshes(): void {
        const objectMeshes = this._voxelizationTask.objectList.meshes as Mesh[];
        objectMeshes.length = 0;
    }

    // ------ Framework overrides ------

    private _initAsyncCancel: Nullable<() => void> = null;

    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    public override initAsync(): Promise<unknown> {
        this._frameGraph.scene.enableIblCdfGenerator();

        return new Promise<void>((resolve, reject) => {
            this._initAsyncCancel = _RetryWithInterval(
                () => this._tryEnableShadowsTasks(),
                () => {
                    this._initAsyncCancel = null;
                    resolve();
                },
                (err, isTimeout) => {
                    this._initAsyncCancel = null;
                    if (isTimeout) {
                        reject(new Error(`FrameGraphIblShadowsRendererTask "${this.name}": timed out waiting for shadow dependencies to be ready.`));
                    } else {
                        reject(new Error(err));
                    }
                },
                16,
                10000
            );
        });
    }

    public override isReady(): boolean {
        return this._voxelizationTask.isReady() && this._tracingTask.isReady() && this._spatialBlurTask.isReady() && this._accumulationTask.isReady();
    }

    /**
     * Records the parent task.
     * Child tasks record the actual passes.
     */
    public override record(): void {
        if (this.depthTexture === undefined || this.normalTexture === undefined || this.positionTexture === undefined || this.velocityTexture === undefined) {
            throw new Error(`FrameGraphIblShadowsRendererTask "${this.name}": depthTexture, normalTexture, positionTexture and velocityTexture are required`);
        }

        this._lastImportedIcdfTexture = null;
        this._lastImportedEnvironmentTexture = null;
        this._lastImportedBlueNoiseTexture = null;

        this._tryEnableShadowsTasks();

        // Set sub-task texture inputs (these are set here because handles may not be available at construction time)
        this._tracingTask.depthTexture = this.depthTexture;
        this._tracingTask.normalTexture = this.normalTexture;
        this._spatialBlurTask.depthTexture = this.depthTexture;
        this._spatialBlurTask.normalTexture = this.normalTexture;
        this._accumulationTask.positionTexture = this.positionTexture;
        this._accumulationTask.velocityTexture = this.velocityTexture;

        this._voxelizationTask.record();
        this._tracingTask.record();
        this._spatialBlurTask.record();
        this._accumulationTask.record();

        const passDisabled = this._frameGraph.addRenderPass(this.name + "_disabled", true);
        passDisabled.setRenderTarget(this.outputTexture);
        passDisabled.setExecuteFunc((_context) => {});
    }

    /**
     * Disposes the task and owned resources.
     */
    public override dispose(): void {
        this._initAsyncCancel?.();
        this._initAsyncCancel = null;
        this._disposeObservers();
        this._voxelizationTask.dispose();
        this._tracingTask.dispose();
        this._spatialBlurTask.dispose();
        this._accumulationTask.dispose();

        super.dispose();
    }

    /**
     * Creates a new IBL shadows composite task.
     * @param name The task name.
     * @param frameGraph The owning frame graph.
     */
    constructor(name: string, frameGraph: FrameGraph) {
        super(name, frameGraph);

        this._voxelizationTask = new FrameGraphIblShadowsVoxelizationTask(`${name} Voxelization`, frameGraph);

        this._tracingTask = new FrameGraphIblShadowsTracingTask(`${name} Tracing`, frameGraph);
        this._tracingTask.voxelGridTexture = this._voxelizationTask.outputVoxelGridTexture;
        this._tracingTask.worldScaleMatrix = this._voxelizationTask.worldScaleMatrix;
        this._tracingTask.voxelizationTask = this._voxelizationTask;

        this._spatialBlurTask = new FrameGraphIblShadowsSpatialBlurTask(`${name} Blur`, frameGraph);
        this._spatialBlurTask.sourceTexture = this._tracingTask.outputTexture;
        this._spatialBlurTask.voxelizationTask = this._voxelizationTask;

        this._accumulationTask = new FrameGraphIblShadowsAccumulationTask(`${name} Accumulation`, frameGraph);
        this._accumulationTask.sourceTexture = this._spatialBlurTask.outputTexture;
        this._accumulationTask.voxelizationTask = this._voxelizationTask;

        this.outputTexture = this._accumulationTask.outputTexture;
        this._blueNoiseTexture = new Texture(
            Tools.GetAssetUrl("https://assets.babylonjs.com/core/blue_noise/blue_noise_rgb.png"),
            frameGraph.scene,
            false,
            true,
            Constants.TEXTURE_NEAREST_SAMPLINGMODE
        );

        this._initialize();
    }

    private _disposeDependencyObservers(): void {
        this._observedEnvironmentTextureUnsubscribe?.();
        this._observedEnvironmentTextureUnsubscribe = null;
        this._observedEnvironmentTexture = null;
    }

    private _disposeObservers(): void {
        this._disposeDependencyObservers();
        this._tracingTask.camera?.onViewMatrixChangedObservable.remove(this._cameraViewChangedObserver);
        this._frameGraph.scene.iblCdfGenerator?.onTextureChangedObservable.remove(this._cdfTextureChangedObserver);
        this._frameGraph.scene.iblCdfGenerator?.onGeneratedObservable.remove(this._cdfGeneratedObserver);
        this._frameGraph.scene.onEnvironmentTextureChangedObservable.remove(this._environmentTextureChangedObserver);
        this._frameGraph.scene.onBeforeRenderObservable.remove(this._beforeRenderDependencyObserver);
        this._frameGraph.scene.onBeforeRenderObservable.remove(this._beforeRenderOutputReadyObserver);
        this._blueNoiseTexture.onLoadObservable.remove(this._blueNoiseLoadObserver);
        this.onTexturesAllocatedObservable.remove(this._texturesAllocatedObserver);
        this._voxelizationTask.onVoxelizationCompleteObservable.remove(this._voxelizationCompleteObserver);

        this._cameraViewChangedObserver = null;
        this._cdfTextureChangedObserver = null;
        this._cdfGeneratedObserver = null;
        this._environmentTextureChangedObserver = null;
        this._beforeRenderDependencyObserver = null;
        this._beforeRenderOutputReadyObserver = null;
        this._blueNoiseLoadObserver = null;
        this._texturesAllocatedObserver = null;
        this._voxelizationCompleteObserver = null;
        this._blueNoiseTexture.dispose();
    }

    private _setCamera(camera: Camera): void {
        const currentCamera = this._tracingTask.camera;
        if (currentCamera === camera && this._cameraViewChangedObserver !== null) {
            return;
        }

        if (currentCamera && this._cameraViewChangedObserver) {
            currentCamera.onViewMatrixChangedObservable.remove(this._cameraViewChangedObserver);
            this._cameraViewChangedObserver = null;
        }

        this._tracingTask.camera = camera;
        this._cameraViewChangedObserver = camera.onViewMatrixChangedObservable.add(() => {
            this._accumulationTask.isMoving = true;
        });
        this._accumulationTask.reset = true;
    }

    private _observeEnvironmentTexture(): void {
        const env = this._frameGraph.scene.environmentTexture;
        const currentEnvironmentTexture = env instanceof Texture || env instanceof CubeTexture ? env : null;

        if (currentEnvironmentTexture === this._observedEnvironmentTexture) {
            return;
        }

        this._observedEnvironmentTextureUnsubscribe?.();
        this._observedEnvironmentTextureUnsubscribe = null;
        this._observedEnvironmentTexture = currentEnvironmentTexture;

        if (currentEnvironmentTexture instanceof Texture) {
            const observer = currentEnvironmentTexture.onLoadObservable.add(this._onEnvironmentTextureLoaded);
            if (observer) {
                this._observedEnvironmentTextureUnsubscribe = () => currentEnvironmentTexture.onLoadObservable.remove(observer);
            }
        } else if (currentEnvironmentTexture instanceof CubeTexture) {
            const observer = currentEnvironmentTexture.onLoadObservable.add(this._onEnvironmentTextureLoaded);
            if (observer) {
                this._observedEnvironmentTextureUnsubscribe = () => currentEnvironmentTexture.onLoadObservable.remove(observer);
            }
        }
    }

    private _getEnvironmentTextureInternal(): Nullable<InternalTexture> {
        const currentEnvironmentTexture = this._frameGraph.scene.environmentTexture;

        if (!currentEnvironmentTexture || !currentEnvironmentTexture.isReadyOrNotBlocking()) {
            return null;
        }

        const internalTexture = currentEnvironmentTexture.getInternalTexture();
        return internalTexture?.isReady ? internalTexture : null;
    }

    private _getAccumulationOutputTexture(): Nullable<InternalTexture> {
        try {
            return this._frameGraph.textureManager.getTextureFromHandle(this._accumulationTask.outputTexture);
        } catch {
            return null;
        }
    }

    private _notifyIfOutputTextureReady(): void {
        const outputTexture = this._getAccumulationOutputTexture();
        if (!outputTexture?.isReady || this._lastNotifiedOutputTexture === outputTexture) {
            return;
        }

        this._lastNotifiedOutputTexture = outputTexture;
        this._outputTextureReadyObservable.notifyObservers(outputTexture);
    }

    private _applyMaterialPluginParameters(): void {
        const accumulationTexture = this._getAccumulationOutputTexture();
        for (const material of this._materialsWithRenderPlugin) {
            const plugin = material.pluginManager?.getPlugin<IBLShadowsPluginMaterial>(IBLShadowsPluginMaterial.Name);
            if (!plugin) {
                continue;
            }

            if (accumulationTexture && accumulationTexture.isReady) {
                plugin.iblShadowsTexture = accumulationTexture;
            }

            plugin.shadowOpacity = this._shadowOpacity;
            plugin.isColored = this._tracingTask.coloredShadows;
            plugin.isEnabled = !this._disabled && this._dependenciesResolved && !!accumulationTexture;
        }
    }

    private _addShadowReceivingMaterialInternal(material: Material): void {
        const isSupportedMaterial = material instanceof PBRBaseMaterial || material instanceof StandardMaterial || material instanceof OpenPBRMaterial;
        if (!isSupportedMaterial || this._materialsWithRenderPlugin.indexOf(material) !== -1) {
            return;
        }

        const plugin = material.pluginManager?.getPlugin<IBLShadowsPluginMaterial>(IBLShadowsPluginMaterial.Name);
        if (!plugin) {
            new IBLShadowsPluginMaterial(material);
        }

        this._materialsWithRenderPlugin.push(material);
    }

    private readonly _onEnvironmentTextureLoaded = () => {
        this._tryEnableShadowsTasks();
    };

    private _tryEnableShadowsTasks(): boolean {
        const scene = this._frameGraph.scene;
        const icdfTexture = scene.iblCdfGenerator?.getIcdfTexture().getInternalTexture();
        const environmentTexture = this._getEnvironmentTextureInternal();
        const blueNoiseInternalTexture = this._blueNoiseTexture.getInternalTexture();

        if (!icdfTexture?.isReady || icdfTexture.width === 1 || !environmentTexture?.isReady || !blueNoiseInternalTexture?.isReady) {
            if (this._dependenciesResolved) {
                this._dependenciesResolved = false;
                this._applyMaterialPluginParameters();
            }
            return false;
        }

        const icdfChanged = this._lastImportedIcdfTexture !== icdfTexture;
        const environmentChanged = this._lastImportedEnvironmentTexture !== environmentTexture;
        const blueNoiseChanged = this._lastImportedBlueNoiseTexture !== blueNoiseInternalTexture;

        if (icdfChanged) {
            this._tracingTask.icdfTexture = this._frameGraph.textureManager.importTexture(`ICDF Texture`, icdfTexture, this._tracingTask.icdfTexture);
            this._lastImportedIcdfTexture = icdfTexture;
        }

        if (environmentChanged) {
            this._tracingTask.environmentTexture = this._frameGraph.textureManager.importTexture(`Environment Texture`, environmentTexture, this._tracingTask.environmentTexture);
            this._lastImportedEnvironmentTexture = environmentTexture;
        }

        if (blueNoiseChanged) {
            this._tracingTask.blueNoiseTexture = this._frameGraph.textureManager.importTexture(`Blue Noise Texture`, blueNoiseInternalTexture, this._tracingTask.blueNoiseTexture);
            this._lastImportedBlueNoiseTexture = blueNoiseInternalTexture;
        }

        if (!this._dependenciesResolved) {
            this._dependenciesResolved = true;
            if (!this._disabled) {
                this._accumulationTask.reset = true;
            }
            this._disposeDependencyObservers();
        } else if (icdfChanged || environmentChanged || blueNoiseChanged) {
            this._accumulationTask.reset = true;
        }

        this._applyMaterialPluginParameters();

        return true;
    }

    private _initialize(): void {
        const scene = this._frameGraph.scene;

        this._voxelizationCompleteObserver = this._voxelizationTask.onVoxelizationCompleteObservable.add(() => {
            this._tracingTask.voxelGridTexture = this._voxelizationTask.outputVoxelGridTexture;
            this._accumulationTask.reset = true;
        });

        this._cdfTextureChangedObserver =
            scene.iblCdfGenerator?.onTextureChangedObservable.add(() => {
                this._lastImportedIcdfTexture = null;
                this._accumulationTask.reset = true;
            }) ?? null;

        this._cdfGeneratedObserver =
            scene.iblCdfGenerator?.onGeneratedObservable.add(() => {
                this._lastImportedIcdfTexture = null;
                this._tryEnableShadowsTasks();
            }) ?? null;

        this._environmentTextureChangedObserver = scene.onEnvironmentTextureChangedObservable.add(() => {
            this._lastImportedEnvironmentTexture = null;
            this._dependenciesResolved = false;
            this._observeEnvironmentTexture();
            this._applyMaterialPluginParameters();
            this._tryEnableShadowsTasks();
        });

        this._observeEnvironmentTexture();

        if (scene.environmentTexture?.isReadyOrNotBlocking()) {
            this._tryEnableShadowsTasks();
        }

        this._blueNoiseLoadObserver = this._blueNoiseTexture.onLoadObservable.add(() => {
            this._tryEnableShadowsTasks();
        });

        this._beforeRenderDependencyObserver = scene.onBeforeRenderObservable.add(() => {
            this._tryEnableShadowsTasks();
        });

        this._beforeRenderOutputReadyObserver = scene.onBeforeRenderObservable.add(() => {
            this._notifyIfOutputTextureReady();
        });

        this._tryEnableShadowsTasks();

        this._texturesAllocatedObserver = this.onTexturesAllocatedObservable.add(() => {
            this._applyMaterialPluginParameters();
            this._notifyIfOutputTextureReady();
        });
    }
}
