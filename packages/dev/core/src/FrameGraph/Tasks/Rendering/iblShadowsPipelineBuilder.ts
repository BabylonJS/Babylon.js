import { type Camera, type FrameGraph, type FrameGraphObjectList, type FrameGraphTextureHandle, type InternalTexture, type Mesh, type Nullable, type Observer } from "core/index";
import { Constants } from "core/Engines/constants";
import type { Material } from "core/Materials/material";
import { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { GeometryBufferRenderer, type IGeometryBufferTextureTypeAndFormat } from "core/Rendering/geometryBufferRenderer";
import { IBLShadowsPluginMaterial } from "core/Rendering/IBLShadows/iblShadowsPluginMaterial";
import { FrameGraphIblShadowsAccumulationTask } from "./iblShadowsAccumulationTask";
import { FrameGraphIblShadowsSpatialBlurTask } from "./iblShadowsSpatialBlurTask";
import { FrameGraphIblShadowsTracingTask } from "./iblShadowsTracingTask";
import { FrameGraphIblShadowsVoxelizationTask } from "./iblShadowsVoxelizationTask";
import type { FrameGraphGeometryRendererTask } from "./geometryRendererTask";
import type { IFrameGraphIblShadowsAccumulationOptions, IFrameGraphIblShadowsTracingOptions, IFrameGraphIblShadowsVoxelizationOptions } from "./iblShadowsTaskTypes";
import { Texture } from "core/Materials/Textures/texture";
import { Tools } from "core/Misc/tools";
import { Observable } from "core/Misc/observable";
import { Logger } from "core/Misc/logger";
import "../../../Rendering/geometryBufferRendererSceneComponent";
import "../../../Rendering/iblCdfGeneratorSceneComponent";

interface IFrameGraphIblShadowsGBufferHandles {
    depthTexture: FrameGraphTextureHandle;
    normalTexture: FrameGraphTextureHandle;
    positionTexture: FrameGraphTextureHandle;
    velocityTexture: FrameGraphTextureHandle;
}

/**
 * Input structure used to create an IBL shadows frame graph pipeline.
 */
export interface IFrameGraphIblShadowsPipelineBuildInput {
    /**
     * Base name used for created tasks.
     */
    name: string;
    /**
     * Frame graph where tasks are created.
     */
    frameGraph: FrameGraph;
    /**
     * Camera used by tracing.
     */
    camera: Camera;
    /**
     * List of objects considered by voxelization.
     */
    objectList: FrameGraphObjectList;
    /**
     * Optional geometry renderer task providing g-buffer textures.
     */
    geometryRendererTask?: FrameGraphGeometryRendererTask;
    /**
     * Optional depth texture handle used when no geometry renderer task is provided.
     */
    gbufferDepthTexture?: FrameGraphTextureHandle;
    /**
     * Optional normal texture handle used when no geometry renderer task is provided.
     */
    gbufferNormalTexture?: FrameGraphTextureHandle;
    /**
     * Optional position texture handle used when no geometry renderer task is provided.
     */
    gbufferPositionTexture?: FrameGraphTextureHandle;
    /**
     * Optional velocity texture handle used when no geometry renderer task is provided.
     */
    gbufferVelocityTexture?: FrameGraphTextureHandle;
    /**
     * Options used to configure the IBL shadows pipeline tasks.
     */
    options?: IFrameGraphIblShadowsTracingOptions & IFrameGraphIblShadowsAccumulationOptions & IFrameGraphIblShadowsVoxelizationOptions;
}

/**
 * Output structure returned by the IBL shadows frame graph pipeline builder.
 */
export interface IFrameGraphIblShadowsPipelineBuildResult {
    /**
     * Voxelization task used by the pipeline.
     */
    voxelizationTask: FrameGraphIblShadowsVoxelizationTask;
    /**
     * Tracing task used by the pipeline.
     */
    tracingTask: FrameGraphIblShadowsTracingTask;
    /**
     * Spatial blur task used by the pipeline.
     */
    spatialBlurTask: FrameGraphIblShadowsSpatialBlurTask;
    /**
     * Accumulation task used by the pipeline.
     */
    accumulationTask: FrameGraphIblShadowsAccumulationTask;
    /**
     * Runtime controller exposing old IBLShadowsRenderPipeline-style settings.
     */
    controller: IFrameGraphIblShadowsPipelineController;
    /**
     * Final pipeline output texture handle.
     */
    outputTexture: FrameGraphTextureHandle;
}

/**
 * Runtime controller for IBL shadows frame graph tasks.
 */
export interface IFrameGraphIblShadowsPipelineController {
    /** Enables or disables tracing, blur and accumulation tasks. */
    enabled: boolean;
    /** Triggers voxelization refresh on next eligible frame. */
    updateVoxelization(): void;
    /** Recomputes world bounds used by voxelization/tracing. */
    updateSceneBounds(): void;
    /** Resets temporal accumulation. */
    resetAccumulation(): void;
    /** Adds one or many materials receiving IBL shadows. */
    addShadowReceivingMaterial(material?: Material | Material[]): void;
    /** Removes one or many materials from IBL shadows. */
    removeShadowReceivingMaterial(material: Material | Material[]): void;
    /** Clears all registered shadow-receiving materials. */
    clearShadowReceivingMaterials(): void;
    /** Adds one or many meshes to the voxelization object list. */
    addShadowCastingMesh(mesh: Mesh | Mesh[]): void;
    /** Removes one or many meshes from the voxelization object list. */
    removeShadowCastingMesh(mesh: Mesh | Mesh[]): void;
    /** Clears the voxelization object list meshes. */
    clearShadowCastingMeshes(): void;
    /** Tracing sample directions. */
    sampleDirections: number;
    /** Accumulation remanence while moving. */
    shadowRemanence: number;
    /** Material plugin shadow opacity. */
    shadowOpacity: number;
    /** Enables colored shadows. */
    coloredShadows: boolean;
    /** Voxel shadow opacity. */
    voxelShadowOpacity: number;
    /** Screen-space shadow opacity. */
    ssShadowOpacity: number;
    /** Screen-space shadow sample count. */
    ssShadowSampleCount: number;
    /** Screen-space shadow stride. */
    ssShadowStride: number;
    /** Screen-space shadow distance scale. */
    ssShadowDistanceScale: number;
    /** Screen-space shadow thickness scale. */
    ssShadowThicknessScale: number;
    /** Voxel normal bias for tracing. */
    voxelNormalBias: number;
    /** Voxel direction bias for tracing. */
    voxelDirectionBias: number;
    /** Voxelization resolution exponent. */
    resolutionExp: number;
    /** Voxelization refresh rate. */
    refreshRate: number;
    /** Current world-space voxel grid size. */
    readonly voxelGridSize: number;
    /** True when the final accumulated shadow texture currently exists and is ready. */
    readonly outputTextureReady: boolean;
    /** Notifies when a ready output texture becomes available (fires again if texture instance changes). */
    readonly onOutputTextureReadyObservable: Observable<InternalTexture>;
    /** Final accumulated shadow texture. */
    readonly outputTexture: Nullable<InternalTexture>;
}

/**
 * Creates and wires all frame graph tasks required to evaluate IBL shadows.
 * @param input The build input.
 * @returns The created tasks and final output texture.
 */
export function BuildIblShadowsFrameGraphPipeline(input: IFrameGraphIblShadowsPipelineBuildInput): IFrameGraphIblShadowsPipelineBuildResult {
    const options = input.options;
    const gBufferHandles = _ResolveGBufferTextureHandles(input);

    const voxelizationTask = new FrameGraphIblShadowsVoxelizationTask(`${input.name} Voxelization`, input.frameGraph);
    voxelizationTask.sceneDebugCamera = input.camera;
    voxelizationTask.objectList = input.objectList;
    voxelizationTask.resolutionExp = options?.resolutionExp ?? voxelizationTask.resolutionExp;
    voxelizationTask.triPlanarVoxelization = options?.triPlanarVoxelization ?? voxelizationTask.triPlanarVoxelization;
    voxelizationTask.refreshRate = options?.refreshRate ?? voxelizationTask.refreshRate;

    const tracingTask = new FrameGraphIblShadowsTracingTask(`${input.name} Tracing`, input.frameGraph);
    tracingTask.camera = input.camera;
    tracingTask.voxelGridTexture = voxelizationTask.outputVoxelGridTexture;
    tracingTask.depthTexture = gBufferHandles.depthTexture;
    tracingTask.normalTexture = gBufferHandles.normalTexture;

    const scene = input.frameGraph.scene;
    let cdfGenerator = scene.iblCdfGenerator;
    if (!cdfGenerator) {
        cdfGenerator = scene.enableIblCdfGenerator();
    }
    if (!cdfGenerator) {
        throw new Error(`BuildIblShadowsFrameGraphPipeline ${input.name}: unable to enable IBL CDF Generator in the scene`);
    }

    if (!scene.environmentTexture) {
        throw new Error(`BuildIblShadowsFrameGraphPipeline ${input.name}: unable to get environment texture from the scene`);
    }

    tracingTask.icdfTexture = input.frameGraph.textureManager.importTexture(`ICDF Texture`, cdfGenerator.getIcdfTexture().getInternalTexture()!);

    const blueNoiseTexture = new Texture(
        Tools.GetAssetUrl("https://assets.babylonjs.com/core/blue_noise/blue_noise_rgb.png"),
        scene,
        false,
        true,
        Constants.TEXTURE_NEAREST_SAMPLINGMODE
    );
    tracingTask.sampleDirections = options?.sampleDirections ?? tracingTask.sampleDirections;
    tracingTask.worldScaleMatrix = voxelizationTask.worldScaleMatrix;
    tracingTask.voxelShadowOpacity = options?.voxelShadowOpacity ?? tracingTask.voxelShadowOpacity;
    tracingTask.voxelNormalBias = options?.voxelNormalBias ?? tracingTask.voxelNormalBias;
    tracingTask.voxelDirectionBias = options?.voxelDirectionBias ?? tracingTask.voxelDirectionBias;
    tracingTask.ssShadowOpacity = options?.ssShadowOpacity ?? tracingTask.ssShadowOpacity;
    tracingTask.ssShadowSampleCount = options?.ssShadowSampleCount ?? tracingTask.ssShadowSampleCount;
    tracingTask.ssShadowStride = options?.ssShadowStride ?? tracingTask.ssShadowStride;
    tracingTask.ssShadowDistanceScale = options?.ssShadowDistanceScale ?? tracingTask.ssShadowDistanceScale;
    tracingTask.ssShadowThicknessScale = options?.ssShadowThicknessScale ?? tracingTask.ssShadowThicknessScale;
    tracingTask.voxelizationTask = voxelizationTask;
    tracingTask.envRotation = options?.envRotation ?? tracingTask.envRotation;
    tracingTask.coloredShadows = options?.coloredShadows ?? tracingTask.coloredShadows;

    const spatialBlurTask = new FrameGraphIblShadowsSpatialBlurTask(`${input.name} Blur`, input.frameGraph);
    spatialBlurTask.sourceTexture = tracingTask.outputTexture;
    spatialBlurTask.depthTexture = gBufferHandles.depthTexture;
    spatialBlurTask.normalTexture = gBufferHandles.normalTexture;
    spatialBlurTask.voxelizationTask = voxelizationTask;

    const accumulationTask = new FrameGraphIblShadowsAccumulationTask(`${input.name} Accumulation`, input.frameGraph);
    accumulationTask.sourceTexture = spatialBlurTask.outputTexture;
    accumulationTask.velocityTexture = gBufferHandles.velocityTexture;
    accumulationTask.positionTexture = gBufferHandles.positionTexture;
    accumulationTask.remanence = options?.remanence ?? accumulationTask.remanence;
    accumulationTask.voxelizationTask = voxelizationTask;

    input.camera.onViewMatrixChangedObservable.add(() => {
        accumulationTask.isMoving = true;
    });

    voxelizationTask.onVoxelizationCompleteObservable.add(() => {
        tracingTask.voxelGridTexture = voxelizationTask.outputVoxelGridTexture;

        accumulationTask.reset = true;
    });

    let userEnabled = options?.enabled ?? true;

    tracingTask.disabled = true;
    spatialBlurTask.disabled = true;
    accumulationTask.disabled = true;

    let dependenciesResolved = false;
    let observedEnvironmentTexture: Nullable<any> = null;
    let lastImportedIcdfTexture: Nullable<InternalTexture> = null;
    let lastImportedEnvironmentTexture: Nullable<InternalTexture> = null;
    let lastImportedBlueNoiseTexture: Nullable<InternalTexture> = null;

    const disposeDependencyObservers = () => {
        if (observedEnvironmentTexture) {
            observedEnvironmentTexture.onLoadObservable.removeCallback(onEnvironmentTextureLoaded);
            observedEnvironmentTexture = null;
        }
    };

    const observeEnvironmentTexture = () => {
        const currentEnvironmentTexture = scene.environmentTexture as any;

        if (currentEnvironmentTexture === observedEnvironmentTexture) {
            return;
        }

        observedEnvironmentTexture?.onLoadObservable.removeCallback(onEnvironmentTextureLoaded);
        observedEnvironmentTexture = currentEnvironmentTexture;
        observedEnvironmentTexture?.onLoadObservable.add(onEnvironmentTextureLoaded);
    };

    const getEnvironmentTextureInternal = () => {
        const currentEnvironmentTexture = scene.environmentTexture;

        if (!currentEnvironmentTexture) {
            return null;
        }

        if (!currentEnvironmentTexture.isReadyOrNotBlocking()) {
            return null;
        }

        const internalTexture = currentEnvironmentTexture.getInternalTexture();
        if (!internalTexture?.isReady) {
            return null;
        }

        return internalTexture;
    };

    const tryEnableShadowsTasks = () => {
        const icdfTexture = scene.iblCdfGenerator?.getIcdfTexture().getInternalTexture();
        const environmentTexture = getEnvironmentTextureInternal();
        const blueNoiseInternalTexture = blueNoiseTexture.getInternalTexture();

        if (!icdfTexture?.isReady || icdfTexture?.width === 1 || !environmentTexture?.isReady || !blueNoiseInternalTexture?.isReady) {
            if (dependenciesResolved) {
                tracingTask.disabled = true;
                spatialBlurTask.disabled = true;
                accumulationTask.disabled = true;
                dependenciesResolved = false;
            }
            return;
        }

        const icdfChanged = lastImportedIcdfTexture !== icdfTexture;
        const environmentChanged = lastImportedEnvironmentTexture !== environmentTexture;
        const blueNoiseChanged = lastImportedBlueNoiseTexture !== blueNoiseInternalTexture;

        if (icdfChanged) {
            tracingTask.icdfTexture = input.frameGraph.textureManager.importTexture(`ICDF Texture`, icdfTexture);
            lastImportedIcdfTexture = icdfTexture;
        }

        if (environmentChanged) {
            tracingTask.environmentTexture = input.frameGraph.textureManager.importTexture(`Environment Texture`, environmentTexture);
            lastImportedEnvironmentTexture = environmentTexture;
        }

        if (blueNoiseChanged) {
            tracingTask.blueNoiseTexture = input.frameGraph.textureManager.importTexture(`Blue Noise Texture`, blueNoiseInternalTexture);
            lastImportedBlueNoiseTexture = blueNoiseInternalTexture;
        }

        if (!dependenciesResolved) {
            tracingTask.disabled = !userEnabled;
            spatialBlurTask.disabled = !userEnabled;
            accumulationTask.disabled = !userEnabled;
            if (userEnabled) {
                accumulationTask.reset = true;
            }
            dependenciesResolved = true;
            disposeDependencyObservers();
        } else if (icdfChanged || environmentChanged || blueNoiseChanged) {
            accumulationTask.reset = true;
        }

        applyMaterialPluginParameters();
    };

    const applyEnabledState = () => {
        if (!dependenciesResolved) {
            return;
        }

        tracingTask.disabled = !userEnabled;
        spatialBlurTask.disabled = !userEnabled;
        accumulationTask.disabled = !userEnabled;
        if (userEnabled) {
            accumulationTask.reset = true;
        }
    };

    const onEnvironmentTextureLoaded = () => {
        tryEnableShadowsTasks();
    };

    const onBeforeRenderTryEnable = () => {
        tryEnableShadowsTasks();
    };

    scene.iblCdfGenerator?.onTextureChangedObservable.add(() => {
        lastImportedIcdfTexture = null;
        accumulationTask.reset = true;
    });

    scene.iblCdfGenerator?.onGeneratedObservable.add(() => {
        lastImportedIcdfTexture = null;
        tryEnableShadowsTasks();
    });

    scene.onEnvironmentTextureChangedObservable.add(() => {
        lastImportedEnvironmentTexture = null;
        dependenciesResolved = false;
        tracingTask.disabled = true;
        spatialBlurTask.disabled = true;
        accumulationTask.disabled = true;
        observeEnvironmentTexture();
        tryEnableShadowsTasks();
    });

    observeEnvironmentTexture();

    if (scene.environmentTexture?.isReadyOrNotBlocking()) {
        tryEnableShadowsTasks();
    }

    blueNoiseTexture.onLoadObservable.add(() => {
        tryEnableShadowsTasks();
    });

    scene.onBeforeRenderObservable.add(onBeforeRenderTryEnable);

    tryEnableShadowsTasks();

    let shadowOpacity = 1.0;
    const materialsWithRenderPlugin: Material[] = [];
    const isSupportedMaterial = (material: Material) => material instanceof PBRBaseMaterial || material instanceof StandardMaterial || material instanceof OpenPBRMaterial;
    const outputTextureReadyObservable = new Observable<InternalTexture>();
    let lastNotifiedOutputTexture: Nullable<InternalTexture> = null;
    let outputTextureReadyObserver: Nullable<Observer<any>> = null;

    const getAccumulationOutputTexture = (): Nullable<InternalTexture> => {
        try {
            return input.frameGraph.textureManager.getTextureFromHandle(accumulationTask.outputTexture);
        } catch {
            return null;
        }
    };

    const notifyIfOutputTextureReady = () => {
        const outputTexture = getAccumulationOutputTexture();
        if (!outputTexture?.isReady) {
            return;
        }

        if (lastNotifiedOutputTexture === outputTexture) {
            return;
        }

        lastNotifiedOutputTexture = outputTexture;
        outputTextureReadyObservable.notifyObservers(outputTexture);
    };

    const ensureOutputTextureReadyObserver = () => {
        if (outputTextureReadyObserver) {
            return;
        }

        outputTextureReadyObserver = scene.onBeforeRenderObservable.add(() => {
            notifyIfOutputTextureReady();
        });
    };

    ensureOutputTextureReadyObserver();

    const applyMaterialPluginParameters = () => {
        const accumulationTexture = getAccumulationOutputTexture();
        for (const material of materialsWithRenderPlugin) {
            const plugin = material.pluginManager?.getPlugin<IBLShadowsPluginMaterial>(IBLShadowsPluginMaterial.Name);
            if (!plugin) {
                continue;
            }

            if (accumulationTexture && accumulationTexture.isReady) {
                plugin.iblShadowsTexture = accumulationTexture;
            }

            plugin.shadowOpacity = shadowOpacity;
            plugin.isColored = tracingTask.coloredShadows;
            plugin.isEnabled = userEnabled && dependenciesResolved && !!accumulationTexture;
        }
    };

    const addMaterialInternal = (material: Material) => {
        if (!isSupportedMaterial(material)) {
            return;
        }

        if (materialsWithRenderPlugin.indexOf(material) !== -1) {
            return;
        }

        const plugin = material.pluginManager?.getPlugin<IBLShadowsPluginMaterial>(IBLShadowsPluginMaterial.Name);
        if (!plugin) {
            new IBLShadowsPluginMaterial(material);
        }

        materialsWithRenderPlugin.push(material);
    };

    accumulationTask.onTexturesAllocatedObservable.add(() => {
        applyMaterialPluginParameters();
        notifyIfOutputTextureReady();
    });

    const controller: IFrameGraphIblShadowsPipelineController = {
        get enabled() {
            return userEnabled;
        },
        set enabled(value: boolean) {
            userEnabled = value;
            applyEnabledState();
            applyMaterialPluginParameters();
        },
        updateVoxelization: () => voxelizationTask.requestVoxelizationUpdate(),
        updateSceneBounds: () => voxelizationTask.updateSceneBounds(),
        resetAccumulation: () => {
            accumulationTask.reset = true;
        },
        addShadowReceivingMaterial: (material?: Material | Material[]) => {
            if (!material) {
                for (const sceneMaterial of scene.materials) {
                    addMaterialInternal(sceneMaterial);
                }
            } else if (Array.isArray(material)) {
                for (const sceneMaterial of material) {
                    addMaterialInternal(sceneMaterial);
                }
            } else {
                addMaterialInternal(material);
            }

            applyMaterialPluginParameters();
        },
        removeShadowReceivingMaterial: (material: Material | Material[]) => {
            const materials = Array.isArray(material) ? material : [material];
            for (const mat of materials) {
                const index = materialsWithRenderPlugin.indexOf(mat);
                if (index !== -1) {
                    materialsWithRenderPlugin.splice(index, 1);
                }

                const plugin = mat.pluginManager?.getPlugin<IBLShadowsPluginMaterial>(IBLShadowsPluginMaterial.Name);
                if (plugin) {
                    plugin.isEnabled = false;
                }
            }
        },
        clearShadowReceivingMaterials: () => {
            for (const mat of materialsWithRenderPlugin) {
                const plugin = mat.pluginManager?.getPlugin<IBLShadowsPluginMaterial>(IBLShadowsPluginMaterial.Name);
                if (plugin) {
                    plugin.isEnabled = false;
                }
            }

            materialsWithRenderPlugin.length = 0;
        },
        addShadowCastingMesh: (mesh: Mesh | Mesh[]) => {
            const meshes = Array.isArray(mesh) ? mesh : [mesh];
            const objectMeshes = voxelizationTask.objectList.meshes as Mesh[];
            for (const m of meshes) {
                if (m && objectMeshes.indexOf(m) === -1) {
                    objectMeshes.push(m);
                }
            }
        },
        removeShadowCastingMesh: (mesh: Mesh | Mesh[]) => {
            const meshes = Array.isArray(mesh) ? mesh : [mesh];
            const objectMeshes = voxelizationTask.objectList.meshes as Mesh[];
            for (const m of meshes) {
                const index = objectMeshes.indexOf(m);
                if (index !== -1) {
                    objectMeshes.splice(index, 1);
                }
            }
        },
        clearShadowCastingMeshes: () => {
            const objectMeshes = voxelizationTask.objectList.meshes as Mesh[];
            objectMeshes.length = 0;
        },
        get sampleDirections() {
            return tracingTask.sampleDirections;
        },
        set sampleDirections(value: number) {
            tracingTask.sampleDirections = value;
            this.resetAccumulation();
        },
        get shadowRemanence() {
            return accumulationTask.remanence;
        },
        set shadowRemanence(value: number) {
            accumulationTask.remanence = value;
        },
        get shadowOpacity() {
            return shadowOpacity;
        },
        set shadowOpacity(value: number) {
            shadowOpacity = Math.max(0, Math.min(value, 1));
            applyMaterialPluginParameters();
        },
        get coloredShadows() {
            return tracingTask.coloredShadows;
        },
        set coloredShadows(value: boolean) {
            if (tracingTask.coloredShadows === value) {
                return;
            }
            tracingTask.coloredShadows = value;
            applyMaterialPluginParameters();
            this.resetAccumulation();
        },
        get voxelShadowOpacity() {
            return tracingTask.voxelShadowOpacity;
        },
        set voxelShadowOpacity(value: number) {
            tracingTask.voxelShadowOpacity = value;
            this.resetAccumulation();
        },
        get ssShadowOpacity() {
            return tracingTask.ssShadowOpacity;
        },
        set ssShadowOpacity(value: number) {
            tracingTask.ssShadowOpacity = value;
            this.resetAccumulation();
        },
        get ssShadowSampleCount() {
            return tracingTask.ssShadowSampleCount;
        },
        set ssShadowSampleCount(value: number) {
            tracingTask.ssShadowSampleCount = value;
            this.resetAccumulation();
        },
        get ssShadowStride() {
            return tracingTask.ssShadowStride;
        },
        set ssShadowStride(value: number) {
            tracingTask.ssShadowStride = value;
            this.resetAccumulation();
        },
        get ssShadowDistanceScale() {
            return tracingTask.ssShadowDistanceScale;
        },
        set ssShadowDistanceScale(value: number) {
            tracingTask.ssShadowDistanceScale = value;
            this.resetAccumulation();
        },
        get ssShadowThicknessScale() {
            return tracingTask.ssShadowThicknessScale;
        },
        set ssShadowThicknessScale(value: number) {
            tracingTask.ssShadowThicknessScale = value;
            this.resetAccumulation();
        },
        get voxelNormalBias() {
            return tracingTask.voxelNormalBias;
        },
        set voxelNormalBias(value: number) {
            tracingTask.voxelNormalBias = value;
            this.resetAccumulation();
        },
        get voxelDirectionBias() {
            return tracingTask.voxelDirectionBias;
        },
        set voxelDirectionBias(value: number) {
            tracingTask.voxelDirectionBias = value;
            this.resetAccumulation();
        },
        get resolutionExp() {
            return voxelizationTask.resolutionExp;
        },
        set resolutionExp(value: number) {
            voxelizationTask.resolutionExp = value;
            this.resetAccumulation();
        },
        get refreshRate() {
            return voxelizationTask.refreshRate;
        },
        set refreshRate(value: number) {
            voxelizationTask.refreshRate = value;
        },
        get voxelGridSize() {
            return voxelizationTask.voxelGridSize;
        },
        get outputTextureReady() {
            const outputTexture = getAccumulationOutputTexture();
            return !!outputTexture?.isReady;
        },
        get onOutputTextureReadyObservable() {
            return outputTextureReadyObservable;
        },
        get outputTexture() {
            return getAccumulationOutputTexture();
        },
    };

    // It is expected that the calling application adds these tasks
    // to the frame graph in the correct order.
    return {
        voxelizationTask,
        tracingTask,
        spatialBlurTask,
        accumulationTask,
        controller,
        outputTexture: accumulationTask.outputTexture,
    };
}

function _ResolveGBufferTextureHandles(input: IFrameGraphIblShadowsPipelineBuildInput): IFrameGraphIblShadowsGBufferHandles {
    if (input.geometryRendererTask) {
        return _ResolveFromGeometryRendererTask(input.geometryRendererTask);
    }

    if (
        input.gbufferDepthTexture !== undefined &&
        input.gbufferNormalTexture !== undefined &&
        input.gbufferPositionTexture !== undefined &&
        input.gbufferVelocityTexture !== undefined
    ) {
        return {
            depthTexture: input.gbufferDepthTexture,
            normalTexture: input.gbufferNormalTexture,
            positionTexture: input.gbufferPositionTexture,
            velocityTexture: input.gbufferVelocityTexture,
        };
    }

    const gbufferTasks = input.frameGraph.getTasksByClassName("FrameGraphGeometryRendererTask");
    if (gbufferTasks.length > 0) {
        return _ResolveFromGeometryRendererTask(gbufferTasks[0] as FrameGraphGeometryRendererTask);
    }

    Logger.Warn(
        `BuildIblShadowsFrameGraphPipeline ${input.name}: falling back to GeometryBufferRenderer because no FrameGraphGeometryRendererTask was provided or discovered. ` +
            `Using a frame graph geometryRendererTask is preferred.`
    );

    return _ResolveFromGeometryBufferRenderer(input);
}

function _ResolveFromGeometryRendererTask(gbufferTask: FrameGraphGeometryRendererTask): IFrameGraphIblShadowsGBufferHandles {
    const geometryRendererTask = gbufferTask;

    const hasScreenspaceDepth = geometryRendererTask.textureDescriptions.some((description) => description.type === Constants.PREPASS_SCREENSPACE_DEPTH_TEXTURE_TYPE);
    const hasWorldNormal = geometryRendererTask.textureDescriptions.some((description) => description.type === Constants.PREPASS_WORLD_NORMAL_TEXTURE_TYPE);
    const hasWorldPosition = geometryRendererTask.textureDescriptions.some((description) => description.type === Constants.PREPASS_POSITION_TEXTURE_TYPE);
    const hasLinearVelocity = geometryRendererTask.textureDescriptions.some((description) => description.type === Constants.PREPASS_VELOCITY_LINEAR_TEXTURE_TYPE);

    if (!hasScreenspaceDepth || !hasWorldNormal || !hasWorldPosition || !hasLinearVelocity) {
        throw new Error(`BuildIblShadowsFrameGraphPipeline: geometryRendererTask must output screen depth, world normal, world position and linear velocity textures`);
    }

    const screenspaceDepthDescription = geometryRendererTask.textureDescriptions.find((description) => description.type === Constants.PREPASS_SCREENSPACE_DEPTH_TEXTURE_TYPE);
    if (screenspaceDepthDescription!.textureType !== Constants.TEXTURETYPE_FLOAT) {
        throw new Error(`BuildIblShadowsFrameGraphPipeline: the screen space depth texture in geometryRendererTask must be 32-bit floating point (TEXTURETYPE_FLOAT)`);
    }

    return {
        depthTexture: geometryRendererTask.geometryScreenDepthTexture,
        normalTexture: geometryRendererTask.geometryWorldNormalTexture,
        positionTexture: geometryRendererTask.geometryWorldPositionTexture,
        velocityTexture: geometryRendererTask.geometryLinearVelocityTexture,
    };
}

function _ResolveFromGeometryBufferRenderer(input: IFrameGraphIblShadowsPipelineBuildInput): IFrameGraphIblShadowsGBufferHandles {
    const scene = input.frameGraph.scene;
    const textureTypesAndFormats: { [key: number]: IGeometryBufferTextureTypeAndFormat } = {};

    textureTypesAndFormats[GeometryBufferRenderer.SCREENSPACE_DEPTH_TEXTURE_TYPE] = {
        textureFormat: Constants.TEXTUREFORMAT_R,
        textureType: Constants.TEXTURETYPE_FLOAT,
        samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
    };
    textureTypesAndFormats[GeometryBufferRenderer.VELOCITY_LINEAR_TEXTURE_TYPE] = {
        textureFormat: Constants.TEXTUREFORMAT_RG,
        textureType: Constants.TEXTURETYPE_HALF_FLOAT,
        samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
    };
    textureTypesAndFormats[GeometryBufferRenderer.POSITION_TEXTURE_TYPE] = {
        textureFormat: Constants.TEXTUREFORMAT_RGBA,
        textureType: Constants.TEXTURETYPE_HALF_FLOAT,
        samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
    };
    textureTypesAndFormats[GeometryBufferRenderer.NORMAL_TEXTURE_TYPE] = {
        textureFormat: Constants.TEXTUREFORMAT_RGBA,
        textureType: Constants.TEXTURETYPE_HALF_FLOAT,
        samplingMode: Constants.TEXTURE_NEAREST_SAMPLINGMODE,
    };

    const geometryBufferRenderer = scene.geometryBufferRenderer ?? scene.enableGeometryBufferRenderer(undefined, Constants.TEXTUREFORMAT_DEPTH32_FLOAT, textureTypesAndFormats);

    if (!geometryBufferRenderer) {
        throw new Error(`BuildIblShadowsFrameGraphPipeline ${input.name}: unable to create a GeometryBufferRenderer`);
    }

    geometryBufferRenderer.enableScreenspaceDepth = true;
    geometryBufferRenderer.enableVelocityLinear = true;
    geometryBufferRenderer.enablePosition = true;
    geometryBufferRenderer.enableNormal = true;
    geometryBufferRenderer.generateNormalsInWorldSpace = true;

    const gBuffer = geometryBufferRenderer.getGBuffer();

    const getTextureHandle = (textureType: number, label: string): FrameGraphTextureHandle => {
        const textureIndex = geometryBufferRenderer.getTextureIndex(textureType);
        if (textureIndex === -1) {
            throw new Error(`BuildIblShadowsFrameGraphPipeline ${input.name}: ${label} texture is unavailable in GeometryBufferRenderer`);
        }

        const texture = gBuffer.textures[textureIndex];
        const internalTexture = texture?.getInternalTexture();
        if (!internalTexture) {
            throw new Error(`BuildIblShadowsFrameGraphPipeline ${input.name}: ${label} internal texture is unavailable in GeometryBufferRenderer`);
        }

        return input.frameGraph.textureManager.importTexture(`${input.name} ${label}`, internalTexture);
    };

    return {
        depthTexture: getTextureHandle(GeometryBufferRenderer.SCREENSPACE_DEPTH_TEXTURE_TYPE, "GBuffer Depth"),
        normalTexture: getTextureHandle(GeometryBufferRenderer.NORMAL_TEXTURE_TYPE, "GBuffer Normal"),
        positionTexture: getTextureHandle(GeometryBufferRenderer.POSITION_TEXTURE_TYPE, "GBuffer Position"),
        velocityTexture: getTextureHandle(GeometryBufferRenderer.VELOCITY_LINEAR_TEXTURE_TYPE, "GBuffer Velocity"),
    };
}
