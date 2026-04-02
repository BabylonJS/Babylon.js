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
import { type IFrameGraphIblShadowsAccumulationOptions, type IFrameGraphIblShadowsTracingOptions, type IFrameGraphIblShadowsVoxelizationOptions } from "./iblShadowsTaskTypes";
import { Texture } from "core/Materials/Textures/texture";
import { Tools } from "core/Misc/tools";
import { Observable } from "core/Misc/observable";
import { FrameGraphTask } from "../../frameGraphTask";
import "../../../Rendering/iblCdfGeneratorSceneComponent";

interface IFrameGraphIblShadowsGBufferHandles {
    depthTexture: FrameGraphTextureHandle;
    normalTexture: FrameGraphTextureHandle;
    positionTexture: FrameGraphTextureHandle;
    velocityTexture: FrameGraphTextureHandle;
}

/**
 * Options used to create an IBL shadows frame graph renderer task.
 */
export interface IFrameGraphIblShadowsRendererTaskCreationOptions {
    /**
     * Camera used by tracing.
     */
    camera: Camera;
    /**
     * List of objects considered by voxelization.
     */
    objectList: FrameGraphObjectList;
    /** Depth texture handle used by tracing and blur. */
    gbufferDepthTexture: FrameGraphTextureHandle;
    /** Normal texture handle used by tracing and blur. */
    gbufferNormalTexture: FrameGraphTextureHandle;
    /** Position texture handle used by accumulation. */
    gbufferPositionTexture: FrameGraphTextureHandle;
    /** Velocity texture handle used by accumulation. */
    gbufferVelocityTexture: FrameGraphTextureHandle;
    /**
     * Options used to configure the internal IBL shadows tasks.
     */
    options?: IFrameGraphIblShadowsTracingOptions & IFrameGraphIblShadowsAccumulationOptions & IFrameGraphIblShadowsVoxelizationOptions;
}

/**
 * Child tasks used by the IBL shadows renderer task.
 */
export interface IFrameGraphIblShadowsRendererSubTasks {
    /** Voxelization stage. */
    voxelizationTask: FrameGraphIblShadowsVoxelizationTask;
    /** Tracing stage. */
    tracingTask: FrameGraphIblShadowsTracingTask;
    /** Spatial blur stage. */
    spatialBlurTask: FrameGraphIblShadowsSpatialBlurTask;
    /** Temporal accumulation stage. */
    accumulationTask: FrameGraphIblShadowsAccumulationTask;
}

/**
 * Composite task that owns the individual IBL shadows frame graph tasks.
 * The frame graph remains flat internally, but this task groups the pipeline
 * and exposes the child tasks as subtasks for configuration and inspection.
 */
export class FrameGraphIblShadowsRendererTask extends FrameGraphTask {
    /** Child tasks owned by the IBL shadows pipeline. */
    public readonly subTasks: IFrameGraphIblShadowsRendererSubTasks;
    /** Voxelization stage. */
    public readonly voxelizationTask: FrameGraphIblShadowsVoxelizationTask;
    /** Tracing stage. */
    public readonly tracingTask: FrameGraphIblShadowsTracingTask;
    /** Spatial blur stage. */
    public readonly spatialBlurTask: FrameGraphIblShadowsSpatialBlurTask;
    /** Temporal accumulation stage. */
    public readonly accumulationTask: FrameGraphIblShadowsAccumulationTask;
    /** Final frame-graph texture handle produced by the task. */
    public readonly outputTexture: FrameGraphTextureHandle;

    private _enabled = true;
    private _dependenciesResolved = false;
    private _shadowOpacity = 1.0;
    private readonly _materialsWithRenderPlugin: Material[] = [];
    private readonly _outputTextureReadyObservable = new Observable<InternalTexture>();
    private _lastNotifiedOutputTexture: Nullable<InternalTexture> = null;
    private _observedEnvironmentTexture: Nullable<any> = null;
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

    /**
     * Whether the task is disabled.
     */
    public override get disabled(): boolean {
        return !this._enabled;
    }

    /**
     * Whether the task is disabled.
     */
    public override set disabled(value: boolean) {
        this.enabled = !value;
    }

    /** Enables or disables IBL shadows. */
    public get enabled(): boolean {
        return this._enabled;
    }

    /** Enables or disables IBL shadows. */
    public set enabled(value: boolean) {
        this._enabled = value;
        this._applyEnabledState();
        this._applyMaterialPluginParameters();
    }

    /** Triggers a voxelization refresh on the next eligible frame. */
    public updateVoxelization(): void {
        this.voxelizationTask.requestVoxelizationUpdate();
    }

    /** Recomputes the voxelization scene bounds from the current object list. */
    public updateSceneBounds(): void {
        this.voxelizationTask.updateSceneBounds();
    }

    /** Resets temporal accumulation. */
    public resetAccumulation(): void {
        this.accumulationTask.reset = true;
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
        const objectMeshes = this.voxelizationTask.objectList.meshes as Mesh[];
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
        const objectMeshes = this.voxelizationTask.objectList.meshes as Mesh[];
        for (const currentMesh of meshes) {
            const index = objectMeshes.indexOf(currentMesh);
            if (index !== -1) {
                objectMeshes.splice(index, 1);
            }
        }
    }

    /** Clears all shadow-casting meshes from the voxelization object list. */
    public clearShadowCastingMeshes(): void {
        const objectMeshes = this.voxelizationTask.objectList.meshes as Mesh[];
        objectMeshes.length = 0;
    }

    /** Number of tracing sample directions. */
    public get sampleDirections(): number {
        return this.tracingTask.sampleDirections;
    }

    /** Number of tracing sample directions. */
    public set sampleDirections(value: number) {
        this.tracingTask.sampleDirections = value;
        this.resetAccumulation();
    }

    /** Temporal shadow remanence while moving. */
    public get shadowRemanence(): number {
        return this.accumulationTask.remanence;
    }

    /** Temporal shadow remanence while moving. */
    public set shadowRemanence(value: number) {
        this.accumulationTask.remanence = value;
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

    /** Whether traced shadows preserve environment color. */
    public get coloredShadows(): boolean {
        return this.tracingTask.coloredShadows;
    }

    /** Whether traced shadows preserve environment color. */
    public set coloredShadows(value: boolean) {
        if (this.tracingTask.coloredShadows === value) {
            return;
        }
        this.tracingTask.coloredShadows = value;
        this._applyMaterialPluginParameters();
        this.resetAccumulation();
    }

    /** Opacity of voxel-traced shadows. */
    public get voxelShadowOpacity(): number {
        return this.tracingTask.voxelShadowOpacity;
    }

    /** Opacity of voxel-traced shadows. */
    public set voxelShadowOpacity(value: number) {
        this.tracingTask.voxelShadowOpacity = value;
        this.resetAccumulation();
    }

    /** Opacity of screen-space shadows. */
    public get ssShadowOpacity(): number {
        return this.tracingTask.ssShadowOpacity;
    }

    /** Opacity of screen-space shadows. */
    public set ssShadowOpacity(value: number) {
        this.tracingTask.ssShadowOpacity = value;
        this.resetAccumulation();
    }

    /** Number of screen-space shadow samples. */
    public get ssShadowSampleCount(): number {
        return this.tracingTask.ssShadowSampleCount;
    }

    /** Number of screen-space shadow samples. */
    public set ssShadowSampleCount(value: number) {
        this.tracingTask.ssShadowSampleCount = value;
        this.resetAccumulation();
    }

    /** Stride used by screen-space shadow sampling. */
    public get ssShadowStride(): number {
        return this.tracingTask.ssShadowStride;
    }

    /** Stride used by screen-space shadow sampling. */
    public set ssShadowStride(value: number) {
        this.tracingTask.ssShadowStride = value;
        this.resetAccumulation();
    }

    /** Distance scale used by screen-space shadow tracing. */
    public get ssShadowDistanceScale(): number {
        return this.tracingTask.ssShadowDistanceScale;
    }

    /** Distance scale used by screen-space shadow tracing. */
    public set ssShadowDistanceScale(value: number) {
        this.tracingTask.ssShadowDistanceScale = value;
        this.resetAccumulation();
    }

    /** Thickness scale used by screen-space shadow tracing. */
    public get ssShadowThicknessScale(): number {
        return this.tracingTask.ssShadowThicknessScale;
    }

    /** Thickness scale used by screen-space shadow tracing. */
    public set ssShadowThicknessScale(value: number) {
        this.tracingTask.ssShadowThicknessScale = value;
        this.resetAccumulation();
    }

    /** Voxel tracing normal bias. */
    public get voxelNormalBias(): number {
        return this.tracingTask.voxelNormalBias;
    }

    /** Voxel tracing normal bias. */
    public set voxelNormalBias(value: number) {
        this.tracingTask.voxelNormalBias = value;
        this.resetAccumulation();
    }

    /** Voxel tracing direction bias. */
    public get voxelDirectionBias(): number {
        return this.tracingTask.voxelDirectionBias;
    }

    /** Voxel tracing direction bias. */
    public set voxelDirectionBias(value: number) {
        this.tracingTask.voxelDirectionBias = value;
        this.resetAccumulation();
    }

    /** Voxelization resolution exponent. */
    public get resolutionExp(): number {
        return this.voxelizationTask.resolutionExp;
    }

    /** Voxelization resolution exponent. */
    public set resolutionExp(value: number) {
        this.voxelizationTask.resolutionExp = value;
        this.resetAccumulation();
    }

    /** Voxelization refresh rate. */
    public get refreshRate(): number {
        return this.voxelizationTask.refreshRate;
    }

    /** Voxelization refresh rate. */
    public set refreshRate(value: number) {
        this.voxelizationTask.refreshRate = value;
    }

    /** Current world-space voxel grid size. */
    public get voxelGridSize(): number {
        return this.voxelizationTask.voxelGridSize;
    }

    /** True when the accumulated output texture is ready. */
    public get outputTextureReady(): boolean {
        return !!this._getAccumulationOutputTexture()?.isReady;
    }

    /** Notifies when the accumulated output texture becomes ready. */
    public get onOutputTextureReadyObservable(): Observable<InternalTexture> {
        return this._outputTextureReadyObservable;
    }

    /**
     * Records the parent task.
     * Child tasks record the actual passes.
     */
    public override record(): void {}

    /**
     * Disposes the task and owned resources.
     */
    public override dispose(): void {
        this._disposeObservers();

        const childrenAreRegisteredInFrameGraph = this._frameGraph.tasks.includes(this.voxelizationTask);
        if (!childrenAreRegisteredInFrameGraph) {
            this.voxelizationTask.dispose();
            this.tracingTask.dispose();
            this.spatialBlurTask.dispose();
            this.accumulationTask.dispose();
        }

        super.dispose();
    }

    /**
     * Creates a new IBL shadows composite task.
     * @param name The task name.
     * @param frameGraph The owning frame graph.
     * @param options Options used to configure the task and child stages.
     */
    constructor(name: string, frameGraph: FrameGraph, options: IFrameGraphIblShadowsRendererTaskCreationOptions) {
        super(name, frameGraph);

        const gBufferHandles = ResolveGBufferTextureHandles(options);
        this.voxelizationTask = this._createVoxelizationTask(name, frameGraph, options);
        this.tracingTask = this._createTracingTask(name, frameGraph, options, gBufferHandles);
        this.spatialBlurTask = this._createSpatialBlurTask(name, frameGraph, gBufferHandles);
        this.accumulationTask = this._createAccumulationTask(name, frameGraph, options, gBufferHandles);
        this.subTasks = {
            voxelizationTask: this.voxelizationTask,
            tracingTask: this.tracingTask,
            spatialBlurTask: this.spatialBlurTask,
            accumulationTask: this.accumulationTask,
        };
        this.outputTexture = this.accumulationTask.outputTexture;
        this._blueNoiseTexture = new Texture(
            Tools.GetAssetUrl("https://assets.babylonjs.com/core/blue_noise/blue_noise_rgb.png"),
            frameGraph.scene,
            false,
            true,
            Constants.TEXTURE_NEAREST_SAMPLINGMODE
        );

        this._initialize(options);

        this._frameGraph.addTask(this.voxelizationTask);
        this._frameGraph.addTask(this.tracingTask);
        this._frameGraph.addTask(this.spatialBlurTask);
        this._frameGraph.addTask(this.accumulationTask);
    }

    private _disposeDependencyObservers(): void {
        if (this._observedEnvironmentTexture) {
            this._observedEnvironmentTexture.onLoadObservable.removeCallback(this._onEnvironmentTextureLoaded);
            this._observedEnvironmentTexture = null;
        }
    }

    private _disposeObservers(): void {
        this._disposeDependencyObservers();
        this._cameraViewChangedObserver && this.tracingTask.camera?.onViewMatrixChangedObservable.remove(this._cameraViewChangedObserver);
        this._cdfTextureChangedObserver && this._frameGraph.scene.iblCdfGenerator?.onTextureChangedObservable.remove(this._cdfTextureChangedObserver);
        this._cdfGeneratedObserver && this._frameGraph.scene.iblCdfGenerator?.onGeneratedObservable.remove(this._cdfGeneratedObserver);
        this._environmentTextureChangedObserver && this._frameGraph.scene.onEnvironmentTextureChangedObservable.remove(this._environmentTextureChangedObserver);
        this._beforeRenderDependencyObserver && this._frameGraph.scene.onBeforeRenderObservable.remove(this._beforeRenderDependencyObserver);
        this._beforeRenderOutputReadyObserver && this._frameGraph.scene.onBeforeRenderObservable.remove(this._beforeRenderOutputReadyObserver);
        this._blueNoiseLoadObserver && this._blueNoiseTexture.onLoadObservable.remove(this._blueNoiseLoadObserver);
        this._texturesAllocatedObserver && this.accumulationTask.onTexturesAllocatedObservable.remove(this._texturesAllocatedObserver);
        this._voxelizationCompleteObserver && this.voxelizationTask.onVoxelizationCompleteObservable.remove(this._voxelizationCompleteObserver);

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

    private _observeEnvironmentTexture(): void {
        const currentEnvironmentTexture = this._frameGraph.scene.environmentTexture as any;

        if (currentEnvironmentTexture === this._observedEnvironmentTexture) {
            return;
        }

        this._observedEnvironmentTexture?.onLoadObservable.removeCallback(this._onEnvironmentTextureLoaded);
        this._observedEnvironmentTexture = currentEnvironmentTexture;
        this._observedEnvironmentTexture?.onLoadObservable.add(this._onEnvironmentTextureLoaded);
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
            return this._frameGraph.textureManager.getTextureFromHandle(this.accumulationTask.outputTexture);
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
            plugin.isColored = this.tracingTask.coloredShadows;
            plugin.isEnabled = this._enabled && this._dependenciesResolved && !!accumulationTexture;
        }
    }

    private _applyEnabledState(): void {
        if (!this._dependenciesResolved) {
            return;
        }

        this.tracingTask.disabled = !this._enabled;
        this.spatialBlurTask.disabled = !this._enabled;
        this.accumulationTask.disabled = !this._enabled;
        if (this._enabled) {
            this.accumulationTask.reset = true;
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

    private _tryEnableShadowsTasks(): void {
        const scene = this._frameGraph.scene;
        const icdfTexture = scene.iblCdfGenerator?.getIcdfTexture().getInternalTexture();
        const environmentTexture = this._getEnvironmentTextureInternal();
        const blueNoiseInternalTexture = this._blueNoiseTexture.getInternalTexture();

        if (!icdfTexture?.isReady || icdfTexture.width === 1 || !environmentTexture?.isReady || !blueNoiseInternalTexture?.isReady) {
            if (this._dependenciesResolved) {
                this.tracingTask.disabled = true;
                this.spatialBlurTask.disabled = true;
                this.accumulationTask.disabled = true;
                this._dependenciesResolved = false;
            }
            return;
        }

        const icdfChanged = this._lastImportedIcdfTexture !== icdfTexture;
        const environmentChanged = this._lastImportedEnvironmentTexture !== environmentTexture;
        const blueNoiseChanged = this._lastImportedBlueNoiseTexture !== blueNoiseInternalTexture;

        if (icdfChanged) {
            this.tracingTask.icdfTexture = this._frameGraph.textureManager.importTexture(`ICDF Texture`, icdfTexture);
            this._lastImportedIcdfTexture = icdfTexture;
        }

        if (environmentChanged) {
            this.tracingTask.environmentTexture = this._frameGraph.textureManager.importTexture(`Environment Texture`, environmentTexture);
            this._lastImportedEnvironmentTexture = environmentTexture;
        }

        if (blueNoiseChanged) {
            this.tracingTask.blueNoiseTexture = this._frameGraph.textureManager.importTexture(`Blue Noise Texture`, blueNoiseInternalTexture);
            this._lastImportedBlueNoiseTexture = blueNoiseInternalTexture;
        }

        if (!this._dependenciesResolved) {
            this.tracingTask.disabled = !this._enabled;
            this.spatialBlurTask.disabled = !this._enabled;
            this.accumulationTask.disabled = !this._enabled;
            if (this._enabled) {
                this.accumulationTask.reset = true;
            }
            this._dependenciesResolved = true;
            this._disposeDependencyObservers();
        } else if (icdfChanged || environmentChanged || blueNoiseChanged) {
            this.accumulationTask.reset = true;
        }

        this._applyMaterialPluginParameters();
    }
    private _initialize(input: IFrameGraphIblShadowsRendererTaskCreationOptions): void {
        const scene = this._frameGraph.scene;

        this._enabled = input.options?.enabled ?? true;
        this.tracingTask.disabled = true;
        this.spatialBlurTask.disabled = true;
        this.accumulationTask.disabled = true;

        this._cameraViewChangedObserver = input.camera.onViewMatrixChangedObservable.add(() => {
            this.accumulationTask.isMoving = true;
        });

        this._voxelizationCompleteObserver = this.voxelizationTask.onVoxelizationCompleteObservable.add(() => {
            this.tracingTask.voxelGridTexture = this.voxelizationTask.outputVoxelGridTexture;
            this.accumulationTask.reset = true;
        });

        this._cdfTextureChangedObserver =
            scene.iblCdfGenerator?.onTextureChangedObservable.add(() => {
                this._lastImportedIcdfTexture = null;
                this.accumulationTask.reset = true;
            }) ?? null;

        this._cdfGeneratedObserver =
            scene.iblCdfGenerator?.onGeneratedObservable.add(() => {
                this._lastImportedIcdfTexture = null;
                this._tryEnableShadowsTasks();
            }) ?? null;

        this._environmentTextureChangedObserver = scene.onEnvironmentTextureChangedObservable.add(() => {
            this._lastImportedEnvironmentTexture = null;
            this._dependenciesResolved = false;
            this.tracingTask.disabled = true;
            this.spatialBlurTask.disabled = true;
            this.accumulationTask.disabled = true;
            this._observeEnvironmentTexture();
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

        this._texturesAllocatedObserver = this.accumulationTask.onTexturesAllocatedObservable.add(() => {
            this._applyMaterialPluginParameters();
            this._notifyIfOutputTextureReady();
        });
    }

    private _createVoxelizationTask(name: string, frameGraph: FrameGraph, input: IFrameGraphIblShadowsRendererTaskCreationOptions): FrameGraphIblShadowsVoxelizationTask {
        const options = input.options;
        const voxelizationTask = new FrameGraphIblShadowsVoxelizationTask(`${name} Voxelization`, frameGraph);
        voxelizationTask.objectList = input.objectList;
        voxelizationTask.resolutionExp = options?.resolutionExp ?? voxelizationTask.resolutionExp;
        voxelizationTask.triPlanarVoxelization = options?.triPlanarVoxelization ?? voxelizationTask.triPlanarVoxelization;
        voxelizationTask.refreshRate = options?.refreshRate ?? voxelizationTask.refreshRate;
        return voxelizationTask;
    }

    private _createTracingTask(
        name: string,
        frameGraph: FrameGraph,
        input: IFrameGraphIblShadowsRendererTaskCreationOptions,
        gBufferHandles: IFrameGraphIblShadowsGBufferHandles
    ): FrameGraphIblShadowsTracingTask {
        const options = input.options;
        const scene = frameGraph.scene;
        let cdfGenerator = scene.iblCdfGenerator;
        if (!cdfGenerator) {
            cdfGenerator = scene.enableIblCdfGenerator();
        }
        if (!cdfGenerator) {
            throw new Error(`FrameGraphIblShadowsRendererTask ${name}: unable to enable IBL CDF Generator in the scene`);
        }

        if (!scene.environmentTexture) {
            throw new Error(`FrameGraphIblShadowsRendererTask ${name}: unable to get environment texture from the scene`);
        }

        const tracingTask = new FrameGraphIblShadowsTracingTask(`${name} Tracing`, frameGraph);
        tracingTask.camera = input.camera;
        tracingTask.voxelGridTexture = this.voxelizationTask.outputVoxelGridTexture;
        tracingTask.depthTexture = gBufferHandles.depthTexture;
        tracingTask.normalTexture = gBufferHandles.normalTexture;
        tracingTask.icdfTexture = frameGraph.textureManager.importTexture(`ICDF Texture`, cdfGenerator.getIcdfTexture().getInternalTexture()!);
        tracingTask.sampleDirections = options?.sampleDirections ?? tracingTask.sampleDirections;
        tracingTask.worldScaleMatrix = this.voxelizationTask.worldScaleMatrix;
        tracingTask.voxelShadowOpacity = options?.voxelShadowOpacity ?? tracingTask.voxelShadowOpacity;
        tracingTask.voxelNormalBias = options?.voxelNormalBias ?? tracingTask.voxelNormalBias;
        tracingTask.voxelDirectionBias = options?.voxelDirectionBias ?? tracingTask.voxelDirectionBias;
        tracingTask.ssShadowOpacity = options?.ssShadowOpacity ?? tracingTask.ssShadowOpacity;
        tracingTask.ssShadowSampleCount = options?.ssShadowSampleCount ?? tracingTask.ssShadowSampleCount;
        tracingTask.ssShadowStride = options?.ssShadowStride ?? tracingTask.ssShadowStride;
        tracingTask.ssShadowDistanceScale = options?.ssShadowDistanceScale ?? tracingTask.ssShadowDistanceScale;
        tracingTask.ssShadowThicknessScale = options?.ssShadowThicknessScale ?? tracingTask.ssShadowThicknessScale;
        tracingTask.voxelizationTask = this.voxelizationTask;
        tracingTask.envRotation = options?.envRotation ?? tracingTask.envRotation;
        tracingTask.coloredShadows = options?.coloredShadows ?? tracingTask.coloredShadows;
        return tracingTask;
    }

    private _createSpatialBlurTask(name: string, frameGraph: FrameGraph, gBufferHandles: IFrameGraphIblShadowsGBufferHandles): FrameGraphIblShadowsSpatialBlurTask {
        const spatialBlurTask = new FrameGraphIblShadowsSpatialBlurTask(`${name} Blur`, frameGraph);
        spatialBlurTask.sourceTexture = this.tracingTask.outputTexture;
        spatialBlurTask.depthTexture = gBufferHandles.depthTexture;
        spatialBlurTask.normalTexture = gBufferHandles.normalTexture;
        spatialBlurTask.voxelizationTask = this.voxelizationTask;
        return spatialBlurTask;
    }

    private _createAccumulationTask(
        name: string,
        frameGraph: FrameGraph,
        input: IFrameGraphIblShadowsRendererTaskCreationOptions,
        gBufferHandles: IFrameGraphIblShadowsGBufferHandles
    ): FrameGraphIblShadowsAccumulationTask {
        const options = input.options;
        const accumulationTask = new FrameGraphIblShadowsAccumulationTask(`${name} Accumulation`, frameGraph);
        accumulationTask.sourceTexture = this.spatialBlurTask.outputTexture;
        accumulationTask.velocityTexture = gBufferHandles.velocityTexture;
        accumulationTask.positionTexture = gBufferHandles.positionTexture;
        accumulationTask.remanence = options?.remanence ?? accumulationTask.remanence;
        accumulationTask.voxelizationTask = this.voxelizationTask;
        return accumulationTask;
    }
}

function ResolveGBufferTextureHandles(input: IFrameGraphIblShadowsRendererTaskCreationOptions): IFrameGraphIblShadowsGBufferHandles {
    if (
        input.gbufferDepthTexture === undefined ||
        input.gbufferNormalTexture === undefined ||
        input.gbufferPositionTexture === undefined ||
        input.gbufferVelocityTexture === undefined
    ) {
        throw new Error("FrameGraphIblShadowsRendererTask: gbufferDepthTexture, gbufferNormalTexture, gbufferPositionTexture and gbufferVelocityTexture are required");
    }

    return {
        depthTexture: input.gbufferDepthTexture,
        normalTexture: input.gbufferNormalTexture,
        positionTexture: input.gbufferPositionTexture,
        velocityTexture: input.gbufferVelocityTexture,
    };
}
