import type { Camera, FrameGraph, FrameGraphObjectList, FrameGraphTextureHandle } from "core/index";
import { Constants } from "core/Engines/constants";
import type { Material } from "core/Materials/material";
import { PBRBaseMaterial } from "core/Materials/PBR/pbrBaseMaterial";
import { OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { GeometryBufferRenderer } from "core/Rendering/geometryBufferRenderer";
import { IBLShadowsPluginMaterial } from "core/Rendering/IBLShadows/iblShadowsPluginMaterial";
import { FrameGraphIblShadowsAccumulationTask } from "./iblShadowsAccumulationTask";
import { FrameGraphIblShadowsSpatialBlurTask } from "./iblShadowsSpatialBlurTask";
import { FrameGraphIblShadowsTracingTask } from "./iblShadowsTracingTask";
import { FrameGraphIblShadowsVoxelDebugTask } from "./iblShadowsVoxelDebugTask";
import { FrameGraphIblShadowsVoxelizationTask } from "./iblShadowsVoxelizationTask";
import type { FrameGraphGeometryRendererTask } from "./geometryRendererTask";
import type {
    IFrameGraphIblShadowsAccumulationOptions,
    IFrameGraphIblShadowsBlurOptions,
    IFrameGraphIblShadowsTracingOptions,
    IFrameGraphIblShadowsVoxelizationOptions,
} from "./iblShadowsTaskTypes";
import { Texture } from "core/Materials/Textures/texture";
import { Tools } from "core/Misc/tools";
import "../../../Rendering/geometryBufferRendererSceneComponent";
import "../../../Rendering/iblCdfGeneratorSceneComponent";

interface IFrameGraphIblShadowsGBufferHandles {
    depthTexture: FrameGraphTextureHandle;
    normalTexture: FrameGraphTextureHandle;
    positionTexture: FrameGraphTextureHandle;
    velocityTexture: FrameGraphTextureHandle;
}

/**
 * Optional voxel debug view configuration.
 */
export interface IFrameGraphIblShadowsVoxelDebugInput {
    /**
     * Enables the voxel debug pass.
     */
    enabled?: boolean;
    /**
     * Target texture used to render the voxel debug output.
     */
    targetTexture: FrameGraphTextureHandle;
    /**
     * Horizontal offset in normalized screen space.
     */
    x?: number;
    /**
     * Vertical offset in normalized screen space.
     */
    y?: number;
    /**
     * Width scale in normalized screen space.
     */
    widthScale?: number;
    /**
     * Height scale in normalized screen space.
     */
    heightScale?: number;
    /**
     * Mip level displayed by the debug pass.
     */
    mipNumber?: number;
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
     * Optional voxel debug pass configuration.
     */
    voxelDebug?: IFrameGraphIblShadowsVoxelDebugInput;
    /**
     * Options used to configure the IBL shadows pipeline tasks.
     */
    options?: IFrameGraphIblShadowsTracingOptions & IFrameGraphIblShadowsBlurOptions & IFrameGraphIblShadowsAccumulationOptions & IFrameGraphIblShadowsVoxelizationOptions;
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
     * Optional voxel debug task when debug input is enabled.
     */
    voxelDebugTask?: FrameGraphIblShadowsVoxelDebugTask;
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
     * Final pipeline output texture handle.
     */
    outputTexture: FrameGraphTextureHandle;
}

/**
 * Input structure used to apply IBL shadows material support when using the FrameGraph pipeline.
 */
export interface IFrameGraphIblShadowsMaterialSupportInput {
    /**
     * Frame graph owning the accumulation texture.
     */
    frameGraph: FrameGraph;
    /**
     * Accumulation task exposing the output texture.
     */
    accumulationTask: FrameGraphIblShadowsAccumulationTask;
    /**
     * One material, a list of materials, or omitted for all scene materials.
     */
    material?: Material | Material[];
    /**
     * Enables or disables the plugin on supported materials.
     */
    enabled?: boolean;
    /**
     * Shadow opacity applied by the material plugin.
     */
    shadowOpacity?: number;
    /**
     * Enables colored shadows in the material plugin.
     */
    coloredShadows?: boolean;
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
    voxelizationTask.voxelGridSize = options?.voxelGridSize ?? voxelizationTask.voxelGridSize;
    voxelizationTask.triPlanarVoxelization = options?.triPlanarVoxelization ?? voxelizationTask.triPlanarVoxelization;
    voxelizationTask.refreshRate = options?.refreshRate ?? voxelizationTask.refreshRate;
    voxelizationTask.debugEnabled = input.voxelDebug?.enabled ?? false;

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

    tracingTask.icdfTexture = input.frameGraph.textureManager.createRenderTargetTexture(`${input.name} ICDF Placeholder`, {
        size: { width: 1, height: 1 },
        sizeIsPercentage: false,
        isHistoryTexture: false,
        options: {
            createMipMaps: false,
            samples: 1,
            types: [Constants.TEXTURETYPE_UNSIGNED_BYTE],
            formats: [Constants.TEXTUREFORMAT_RGBA],
            useSRGBBuffers: [false],
            creationFlags: [0],
            labels: [`${input.name} ICDF Placeholder`],
        },
    });

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
    tracingTask.envRotation = options?.envRotation ?? tracingTask.envRotation;
    tracingTask.coloredShadows = options?.coloredShadows ?? tracingTask.coloredShadows;

    const spatialBlurTask = new FrameGraphIblShadowsSpatialBlurTask(`${input.name} Blur`, input.frameGraph);
    spatialBlurTask.sourceTexture = tracingTask.outputTexture;
    spatialBlurTask.depthTexture = gBufferHandles.depthTexture;
    spatialBlurTask.normalTexture = gBufferHandles.normalTexture;
    spatialBlurTask.worldScale = options?.worldScale ?? spatialBlurTask.worldScale;
    spatialBlurTask.iterationCount = options?.iterationCount ?? spatialBlurTask.iterationCount;

    const accumulationTask = new FrameGraphIblShadowsAccumulationTask(`${input.name} Accumulation`, input.frameGraph);
    accumulationTask.sourceTexture = spatialBlurTask.outputTexture;
    accumulationTask.velocityTexture = gBufferHandles.velocityTexture;
    accumulationTask.positionTexture = gBufferHandles.positionTexture;
    accumulationTask.remanence = options?.remanence ?? accumulationTask.remanence;
    accumulationTask.reset = options?.reset ?? accumulationTask.reset;
    accumulationTask.voxelGridSize = options?.voxelGridSize ?? accumulationTask.voxelGridSize;

    let voxelDebugTask: FrameGraphIblShadowsVoxelDebugTask | undefined;
    if (input.voxelDebug?.enabled && input.voxelDebug.targetTexture !== undefined) {
        voxelDebugTask = new FrameGraphIblShadowsVoxelDebugTask(`${input.name} Voxel Debug`, input.frameGraph);
        voxelDebugTask.voxelTexture = voxelizationTask.outputVoxelGridTexture;
        voxelDebugTask.voxelSlabTexture = voxelizationTask.outputVoxelSlabTexture;
        voxelDebugTask.targetTexture = input.voxelDebug.targetTexture;
        voxelDebugTask.setDebugDisplayParams(input.voxelDebug.x ?? 0, input.voxelDebug.y ?? 0, input.voxelDebug.widthScale ?? 1, input.voxelDebug.heightScale ?? 1);
        voxelDebugTask.mipNumber = input.voxelDebug.mipNumber ?? 0;
    }

    tracingTask.disabled = true;
    spatialBlurTask.disabled = true;
    accumulationTask.disabled = true;

    let dependenciesResolved = false;
    const tryEnableShadowsTasks = () => {
        if (dependenciesResolved) {
            return;
        }

        const icdfTexture = cdfGenerator.getIcdfTexture().getInternalTexture();
        const environmentTexture = scene.environmentTexture?.getInternalTexture();
        const blueNoiseInternalTexture = blueNoiseTexture.getInternalTexture();

        if (!icdfTexture?.isReady || !environmentTexture?.isReady || !blueNoiseInternalTexture?.isReady) {
            return;
        }

        tracingTask.icdfTexture = input.frameGraph.textureManager.importTexture(`ICDF Texture`, icdfTexture);
        tracingTask.environmentTexture = input.frameGraph.textureManager.importTexture(`Environment Texture`, environmentTexture);
        tracingTask.blueNoiseTexture = input.frameGraph.textureManager.importTexture(`Blue Noise Texture`, blueNoiseInternalTexture);

        tracingTask.disabled = false;
        spatialBlurTask.disabled = false;
        accumulationTask.disabled = false;
        accumulationTask.reset = true;
        dependenciesResolved = true;
    };

    cdfGenerator.onGeneratedObservable.add(() => {
        tryEnableShadowsTasks();
    });
    (scene.environmentTexture as any)?.onLoadObservable?.add(() => {
        tryEnableShadowsTasks();
    });
    blueNoiseTexture.onLoadObservable.add(() => {
        tryEnableShadowsTasks();
    });

    tryEnableShadowsTasks();

    // input.frameGraph.addTask(voxelizationTask);
    // if (voxelDebugTask) {
    //     input.frameGraph.addTask(voxelDebugTask);
    // }
    // input.frameGraph.addTask(tracingTask);
    // input.frameGraph.addTask(spatialBlurTask);
    // input.frameGraph.addTask(accumulationTask);

    return {
        voxelizationTask,
        voxelDebugTask,
        tracingTask,
        spatialBlurTask,
        accumulationTask,
        outputTexture: accumulationTask.outputTexture,
    };
}

/**
 * Adds IBL shadows material-plugin support for one material, a list of materials, or all scene materials.
 * The helper also updates plugin texture binding after texture allocation events (build/resize).
 * @param input The material support input.
 */
export function AddIblShadowsSupportToMaterials(input: IFrameGraphIblShadowsMaterialSupportInput): void {
    const materials = input.material ? (Array.isArray(input.material) ? input.material : [input.material]) : input.frameGraph.scene.materials;

    const enabled = input.enabled ?? true;
    const shadowOpacity = input.shadowOpacity ?? 1.0;
    const coloredShadows = input.coloredShadows ?? false;

    const supportedMaterials: Material[] = [];
    for (const material of materials) {
        if (!material) {
            continue;
        }

        if (!(material instanceof PBRBaseMaterial) && !(material instanceof StandardMaterial) && !(material instanceof OpenPBRMaterial)) {
            continue;
        }

        supportedMaterials.push(material);
    }

    const applyToMaterials = () => {
        const accumulationTexture = input.frameGraph.textureManager.getTextureFromHandle(input.accumulationTask.outputTexture);

        for (const material of supportedMaterials) {
            let plugin = material.pluginManager?.getPlugin<IBLShadowsPluginMaterial>(IBLShadowsPluginMaterial.Name);
            if (!plugin) {
                plugin = new IBLShadowsPluginMaterial(material);
            }

            if (accumulationTexture) {
                plugin.iblShadowsTexture = accumulationTexture;
            }
            plugin.shadowOpacity = shadowOpacity;
            plugin.isColored = coloredShadows;
            plugin.isEnabled = enabled && !!accumulationTexture;
        }
    };

    applyToMaterials();

    input.accumulationTask.onTexturesAllocatedObservable.add(() => {
        applyToMaterials();
    });
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

    return {
        depthTexture: geometryRendererTask.geometryScreenDepthTexture,
        normalTexture: geometryRendererTask.geometryWorldNormalTexture,
        positionTexture: geometryRendererTask.geometryWorldPositionTexture,
        velocityTexture: geometryRendererTask.geometryLinearVelocityTexture,
    };
}

function _ResolveFromGeometryBufferRenderer(input: IFrameGraphIblShadowsPipelineBuildInput): IFrameGraphIblShadowsGBufferHandles {
    const scene = input.frameGraph.scene;
    const textureTypesAndFormats: { [key: number]: { textureType: number; textureFormat: number } } = {};

    textureTypesAndFormats[GeometryBufferRenderer.SCREENSPACE_DEPTH_TEXTURE_TYPE] = {
        textureFormat: Constants.TEXTUREFORMAT_R,
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
