/* eslint-disable @typescript-eslint/naming-convention */
import type {
    AbstractEngine,
    AbstractMesh,
    AnimationGroup,
    ArcRotateCameraKeyboardMoveInput,
    AssetContainer,
    AutoRotationBehavior,
    BaseTexture,
    Camera,
    CubeTexture,
    Engine,
    HDRCubeTexture,
    HotSpotQuery,
    IblCdfGenerator,
    IblShadowsRenderPipeline,
    IDisposable,
    IMeshDataCache,
    ISceneLoaderProgressEvent,
    LoadAssetContainerOptions,
    Nullable,
    Observer,
    PickingInfo,
    ShaderMaterial,
    ShadowGenerator,
    SSAO2RenderingPipeline,
} from "core/index";

import type { MaterialVariantsController } from "loaders/glTF/2.0/Extensions/KHR_materials_variants";

import { ArcRotateCamera, ComputeAlpha, ComputeBeta } from "core/Cameras/arcRotateCamera";
import { Constants } from "core/Engines/constants";
import { PointerEventTypes } from "core/Events/pointerEvents";
import { DirectionalLight } from "core/Lights/directionalLight";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { LoadAssetContainerAsync } from "core/Loading/sceneLoader";
import { BackgroundMaterial } from "core/Materials/Background/backgroundMaterial";
import { ImageProcessingConfiguration } from "core/Materials/imageProcessingConfiguration";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { Texture } from "core/Materials/Textures/texture";
import { Color3, Color4 } from "core/Maths/math.color";
import { Clamp, Lerp } from "core/Maths/math.scalar.functions";
import { Matrix, Vector2, Vector3 } from "core/Maths/math.vector";
import { Viewport } from "core/Maths/math.viewport";
import { GetHotSpotToRef } from "core/Meshes/abstractMesh.hotSpot";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { Mesh } from "core/Meshes/mesh";
import { computeMaxExtents, RemoveUnreferencedVerticesData } from "core/Meshes/meshUtils";
import { BuildTuple } from "core/Misc/arrayTools";
import { AsyncLock } from "core/Misc/asyncLock";
import { deepMerge } from "core/Misc/deepMerger";
import { AbortError } from "core/Misc/error";
import { Lazy } from "core/Misc/lazy";
import { Logger } from "core/Misc/logger";
import { Observable } from "core/Misc/observable";
import { HardwareScalingOptimization, SceneOptimizer, SceneOptimizerOptions } from "core/Misc/sceneOptimizer";
import { SnapshotRenderingHelper } from "core/Misc/snapshotRenderingHelper";
import { _RetryWithInterval } from "core/Misc/timingTools";
import { GetExtensionFromUrl } from "core/Misc/urlTools";
import { Scene } from "core/scene";
import { registerBuiltInLoaders } from "loaders/dynamic";

// eslint-disable-next-line @typescript-eslint/promise-function-async
const LazySSAODependenciesPromise = new Lazy(() =>
    Promise.all([
        import("core/PostProcesses/RenderPipeline/Pipelines/ssao2RenderingPipeline"),
        import("core/Rendering/prePassRendererSceneComponent"),
        import("core/Rendering/geometryBufferRendererSceneComponent"),
        import("core/Engines/Extensions/engine.multiRender"),
        import("core/Engines/WebGPU/Extensions/engine.multiRender"),
    ])
);

const WebGPUSnapshotRenderingEnabled = true;
const WebGPUSnapshotRenderingLoggingEnabled = false;
// Logger.LogLevels = Logger.AllLogLevel;

// TODO: Consider moving this to core after the 9.0 release.
async function WhenNext<T>(observable: Observable<T>, abortSignal: AbortSignal): Promise<T> {
    return await new Promise<T>((resolve, reject) => {
        if (abortSignal.aborted) {
            reject(new AbortError("Aborted"));
            return;
        }

        const observer = observable.addOnce((payload) => {
            abortSignal.removeEventListener("abort", onAbort);
            resolve(payload);
        });

        const onAbort = () => {
            observer.remove();
            reject(new AbortError("Aborted"));
        };
        abortSignal.addEventListener("abort", onAbort, { once: true });
    });
}

export type ResetFlag = "source" | "environment" | "camera" | "animation" | "post-processing" | "material-variant" | "shadow";

const shadowQualityOptions = ["none", "normal", "high"] as const;
export type ShadowQuality = (typeof shadowQualityOptions)[number];

const toneMappingOptions = ["none", "standard", "aces", "neutral"] as const;
export type ToneMapping = (typeof toneMappingOptions)[number];

const ssaoOptions = ["enabled", "disabled", "auto"] as const;
export type SSAOOptions = (typeof ssaoOptions)[number];

const environmentMode = ["none", "auto", "url"] as const;
type EnvironmentMode = (typeof environmentMode)[number];

type ActivateModelOptions = Partial<{ source: string | File | ArrayBufferView }>;

export type LoadModelOptions = LoadAssetContainerOptions;

export type CameraOrbit = [alpha: number, beta: number, radius: number];
export type CameraTarget = [x: number, y: number, z: number];

export type CameraAutoOrbit = {
    /**
     * Whether the camera should automatically orbit around the model when idle.
     */
    enabled: boolean;

    /**
     * The speed at which the camera orbits around the model when idle.
     */
    speed: number;

    /**
     * The delay in milliseconds before the camera starts orbiting around the model when idle.
     */
    delay: number;
};

export type EnvironmentParams = {
    /**
     * The intensity of the environment lighting.
     */
    intensity: number;

    /**
     * The blur applied to the environment lighting.
     */
    blur: number;

    /**
     * The rotation of the environment lighting in radians.
     */
    rotation: number;
};

export type ShadowParams = {
    /**
     * The quality of shadow being used
     */
    quality: ShadowQuality;
};

export type PostProcessing = {
    /**
     * The tone mapping to use for rendering the scene.
     */
    toneMapping: ToneMapping;

    /**
     * The contrast applied to the scene.
     */
    contrast: number;

    /**
     * The exposure applied to the scene.
     */
    exposure: number;

    /**
     * Whether to enable screen space ambient occlusion (SSAO).
     */
    ssao: SSAOOptions;
};

type ShadowState = {
    normal?: {
        readonly generator: ShadowGenerator;
        readonly ground: Mesh;
        readonly light: DirectionalLight;
        shouldRender: boolean;
        readonly iblDirection: {
            readonly iblCdfGenerator: IblCdfGenerator;
            positionFactor: number;
            direction: Vector3;
        };
        refreshLightPositionDirection(reflectionRotation: number): void;
    };
    high?: {
        readonly pipeline: IblShadowsRenderPipeline;
        readonly ground: Mesh;
        readonly groundMaterial: ShaderMaterial;
        renderTimer?: Nullable<ReturnType<typeof setTimeout>>;
        shouldRender: boolean;
        readonly resizeObserver: Observer<Engine>;
    };
};

/**
 * Checks if the given value is a valid tone mapping option.
 * @param value The value to check.
 * @returns True if the value is a valid tone mapping option, otherwise false.
 */
export function IsToneMapping(value: string): value is ToneMapping {
    return toneMappingOptions.includes(value as ToneMapping);
}

/**
 * Checks if the given value is a valid shadow quality option.
 * @param value The value to check.
 * @returns True if the value is a valid shadow quality option, otherwise false.
 */
export function IsShadowQuality(value: string): value is ShadowQuality {
    return shadowQualityOptions.includes(value as ShadowQuality);
}

/**
 * Checks if the given value is a valid SSAO option.
 * @param value The value to check.
 * @returns True if the value is a valid SSAO option, otherwise false.
 */
export function isSSAOOptions(value: string): value is SSAOOptions {
    return ssaoOptions.includes(value as SSAOOptions);
}

function throwIfAborted(...abortSignals: (Nullable<AbortSignal> | undefined)[]): void {
    for (const signal of abortSignals) {
        signal?.throwIfAborted();
    }
}

async function createCubeTexture(url: string, scene: Scene, extension?: string) {
    extension = extension ?? GetExtensionFromUrl(url);
    const instantiateTexture = await (async () => {
        if (extension === ".hdr") {
            const { HDRCubeTexture } = await import("core/Materials/Textures/hdrCubeTexture");
            return () => new HDRCubeTexture(url, scene, 256, false, true, false, true, undefined, undefined, undefined, true, true);
        } else {
            const { CubeTexture } = await import("core/Materials/Textures/cubeTexture");
            return () => new CubeTexture(url, scene, null, false, null, null, null, undefined, true, extension, true);
        }
    })();

    const originalUseDelayedTextureLoading = scene.useDelayedTextureLoading;
    try {
        scene.useDelayedTextureLoading = false;
        return instantiateTexture();
    } finally {
        scene.useDelayedTextureLoading = originalUseDelayedTextureLoading;
    }
}

function createSkybox(scene: Scene, camera: Camera, reflectionTexture: BaseTexture, blur: number): Mesh {
    const originalBlockMaterialDirtyMechanism = scene.blockMaterialDirtyMechanism;
    scene.blockMaterialDirtyMechanism = true;
    try {
        const hdrSkybox = CreateBox("hdrSkyBox", { sideOrientation: Mesh.BACKSIDE }, scene);
        const hdrSkyboxMaterial = new BackgroundMaterial("skyBox", scene);
        // Use the default image processing configuration on the skybox (e.g. don't apply tone mapping, contrast, or exposure).
        hdrSkyboxMaterial.imageProcessingConfiguration = new ImageProcessingConfiguration();
        hdrSkyboxMaterial.reflectionTexture = reflectionTexture;
        reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        hdrSkyboxMaterial.reflectionBlur = blur;
        hdrSkybox.material = hdrSkyboxMaterial;
        hdrSkybox.isPickable = false;
        hdrSkybox.infiniteDistance = true;
        hdrSkybox.applyFog = false;

        updateSkybox(hdrSkybox, camera);

        return hdrSkybox;
    } finally {
        scene.blockMaterialDirtyMechanism = originalBlockMaterialDirtyMechanism;
    }
}

function updateSkybox(skybox: Nullable<Mesh>, camera: Camera): void {
    skybox?.scaling.setAll((camera.maxZ - camera.minZ) / 2);
}

function computeModelsMaxExtents(models: readonly Model[]): Array<{ minimum: Vector3; maximum: Vector3 }> {
    return models.flatMap((model) => {
        return computeMaxExtents(model.assetContainer.meshes, model.assetContainer.animationGroups[model.selectedAnimation]);
    });
}

function reduceMeshesExtendsToBoundingInfo(maxExtents: Array<{ minimum: Vector3; maximum: Vector3 }>) {
    if (maxExtents.length === 0) {
        return null;
    }

    const min = new Vector3(Math.min(...maxExtents.map((e) => e.minimum.x)), Math.min(...maxExtents.map((e) => e.minimum.y)), Math.min(...maxExtents.map((e) => e.minimum.z)));
    const max = new Vector3(Math.max(...maxExtents.map((e) => e.maximum.x)), Math.max(...maxExtents.map((e) => e.maximum.y)), Math.max(...maxExtents.map((e) => e.maximum.z)));
    const size = max.subtract(min);
    const center = min.add(size.scale(0.5));

    return {
        extents: {
            min: min.asArray(),
            max: max.asArray(),
        },
        size: size.asArray(),
        center: center.asArray(),
    };
}

/**
 * Adjusts the light's target direction to ensure it's not too flat and points downwards.
 * @param targetDirection The target direction of the light.
 * @returns The adjusted target direction of the light.
 */
function adjustLightTargetDirection(targetDirection: Vector3): Vector3 {
    const lightSteepnessThreshold = -0.01; // threshold to trigger steepness adjustment
    const lightSteepnessFactor = 10; // the factor to multiply Y by if it's too flat
    const minLightDirectionY = -0.05; // the minimum steepness for light direction Y
    const adjustedDirection = targetDirection.clone();

    // ensure light points downwards
    if (adjustedDirection.y > 0) {
        adjustedDirection.y *= -1;
    }

    // if light is too flat (pointing almost horizontally or very slightly down), make it steeper
    if (adjustedDirection.y > lightSteepnessThreshold) {
        adjustedDirection.y = Math.min(adjustedDirection.y * lightSteepnessFactor, minLightDirectionY);
    }

    return adjustedDirection;
}

/**
 * Compute the bounding info for the models by computing their maximum extents, size, and center considering animation, skeleton, and morph targets.
 * @param models The models to consider when computing the bounding info
 * @returns The computed bounding info for the models or null
 */
function computeModelsBoundingInfos(models: readonly Model[]): Nullable<ViewerBoundingInfo> {
    const maxExtents = computeModelsMaxExtents(models);
    return reduceMeshesExtendsToBoundingInfo(maxExtents);
}

// This helper function is used in functions that are naturally void returning, but need to call an async Promise returning function.
// If there is any error (other than AbortError) in the async function, it will be logged.
function observePromise(promise: Promise<unknown>): void {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
        try {
            await promise;
        } catch (error) {
            if (!(error instanceof AbortError)) {
                Logger.Error(error);
            }
        }
    })();
}

/**
 * Generates a HotSpot from a camera by computing its spherical coordinates (alpha, beta, radius) relative to a target point.
 *
 * The target point is determined using the camera's forward ray:
 *   - If the ray intersects with a mesh in the model, the intersection point is used as the target.
 *   - If no intersection is found, a fallback target is calculated by projecting the distance
 *     between the camera and the model's center along the camera's forward direction.
 *
 * @param model The reference model used to determine the target point.
 * @param camera The camera from which the HotSpot is generated.
 * @returns A HotSpot object.
 */
export async function CreateHotSpotFromCamera(model: Model, camera: Camera): Promise<HotSpot> {
    await import("core/Culling/ray");
    const scene = model.assetContainer.scene;
    const ray = camera.getForwardRay(100, camera.getWorldMatrix(), camera.globalPosition); // Set starting point to camera global position
    const camGlobalPos = camera.globalPosition.clone();

    // Target
    let radius: number = 0.0001; // Just to avoid division by zero
    const targetPoint = Vector3.Zero();
    const pickingInfo = scene.pickWithRay(ray, (mesh) => model.assetContainer.meshes.includes(mesh));
    if (pickingInfo && pickingInfo.hit) {
        targetPoint.copyFrom(pickingInfo.pickedPoint!); // Use intersection point as target
    } else {
        const worldBounds = model.getWorldBounds();
        const centerArray = worldBounds ? worldBounds.center : [0, 0, 0];
        const distancePoint = Vector3.FromArray(centerArray);
        const direction = ray.direction.clone();
        targetPoint.copyFrom(camGlobalPos);
        radius = Vector3.Distance(camGlobalPos, distancePoint);
        direction.scaleAndAddToRef(radius, targetPoint); // Compute fallback target
    }

    const computationVector = Vector3.Zero();
    camGlobalPos.subtractToRef(targetPoint, computationVector);

    // Radius
    if (pickingInfo && pickingInfo.hit) {
        radius = computationVector.length();
    }

    // Alpha and Beta
    const alpha = ComputeAlpha(computationVector);
    const beta = ComputeBeta(computationVector.y, radius);

    const targetArray = targetPoint.asArray();
    return { type: "world", position: targetArray, normal: targetArray, cameraOrbit: [alpha, beta, radius] };
}

export type ViewerDetails = {
    /**
     * Provides access to the Scene managed by the Viewer.
     */
    scene: Scene;

    /**
     * Provides access to the Camera managed by the Viewer.
     */
    camera: ArcRotateCamera;

    /**
     * Provides access to the currently loaded model.
     */
    model: Nullable<Model>;

    /**
     * Suspends the render loop.
     * @returns A token that should be disposed when the request for suspending rendering is no longer needed.
     */
    suspendRendering(): IDisposable;

    /**
     * Marks the scene as mutated, which will trigger a render on the next frame (unless rendering is suspended).
     */
    markSceneMutated(): void;

    /**
     * Picks the object at the given screen coordinates.
     * @remarks This function ensures skeletal and morph target animations are up to date before picking, and typically should not be called at high frequency (e.g. every frame, on pointer move, etc.).
     * @param screenX The x coordinate in screen space.
     * @param screenY The y coordinate in screen space.
     * @returns A PickingInfo if an object was picked, otherwise null.
     */
    pick(screenX: number, screenY: number): Promise<Nullable<PickingInfo>>;
};

/**
 * The options for the Viewer.
 */
export type ViewerOptions = Partial<{
    /**
     * Called once when the viewer is initialized and provides viewer details that can be used for advanced customization.
     */
    onInitialized: (details: Readonly<ViewerDetails>) => void;

    /**
     * The default clear color of the scene.
     */
    clearColor: [r: number, g: number, b: number, a?: number];

    /**
     * When enabled, rendering will be suspended when no scene state driven by the Viewer has changed.
     * This can reduce resource CPU/GPU pressure when the scene is static.
     * Enabled by default.
     */
    autoSuspendRendering: boolean;

    /**
     * The default source model to load into the viewer.
     */
    source: string;

    /**
     * The default environment to load into the viewer for lighting (IBL).
     */
    environmentLighting: string;

    /**
     * The default environment to load into the viewer for the skybox.
     */
    environmentSkybox: string;

    /**
     * The default environment configuration.
     */
    environmentConfig: Partial<EnvironmentParams>;

    /**
     * The default camera orbit.
     * @remarks The default camera orbit is restored when a new model is loaded.
     */
    cameraOrbit: Partial<CameraOrbit>;

    /**
     * The default camera target.
     * @remarks The default camera target is restored when a new model is loaded.
     */
    cameraTarget: Partial<CameraTarget>;

    /**
     * Automatically rotates a 3D model or scene without requiring user interaction.
     * @remarks The default camera auto orbit is restored when a new model is loaded.
     */
    cameraAutoOrbit: Partial<CameraAutoOrbit>;

    /**
     * Whether to play the default animation immediately after loading.
     * @remarks The default animation auto play is restored when a new model is loaded.
     */
    animationAutoPlay: boolean;

    /**
     * The default speed of the animation.
     * @remarks The default animation speed is restored when a new model is loaded.
     */
    animationSpeed: number;

    /**
     * The default selected animation.
     * @remarks The default selected animation is restored when a new model is loaded.
     */
    selectedAnimation: number;

    /**
     * The default post processing configuration.
     */
    postProcessing: Partial<PostProcessing>;

    /**
     * Shadow configuration.
     */
    shadowConfig: Partial<ShadowParams>;

    /**
     * The default selected material variant.
     * @remarks The default material variant is restored when a new model is loaded.
     */
    selectedMaterialVariant: string;

    /**
     * The default hotspots.
     */
    hotSpots: Record<string, HotSpot>;

    /**
     * Boolean indicating if the scene must use right-handed coordinates system.
     */
    useRightHandedSystem: boolean;
}>;

/**
 * The default options for the Viewer.
 */
export const DefaultViewerOptions = {
    clearColor: [0, 0, 0, 0],
    autoSuspendRendering: true,
    environmentConfig: {
        intensity: 1,
        blur: 0.3,
        rotation: 0,
    },
    environmentLighting: "auto",
    environmentSkybox: "none",
    cameraAutoOrbit: {
        enabled: false,
        delay: 2000,
        speed: 0.05,
    },
    animationAutoPlay: false,
    animationSpeed: 1,
    shadowConfig: {
        quality: "none",
    },
    postProcessing: {
        toneMapping: "neutral",
        contrast: 1,
        exposure: 1,
        ssao: "auto",
    },
    useRightHandedSystem: false,
} as const satisfies ViewerOptions;

export type EnvironmentOptions = Partial<
    Readonly<{
        /**
         * Whether to use the environment for lighting (e.g. IBL).
         */
        lighting: boolean;

        /**
         * Whether to use the environment for the skybox.
         */
        skybox: boolean;
    }>
>;

export type LoadEnvironmentOptions = EnvironmentOptions &
    Partial<
        Readonly<{
            /**
             * Specifies the extension of the environment texture to load.
             * This must be specified when the extension cannot be determined from the url.
             */
            extension: string;
        }>
    >;

const defaultLoadEnvironmentOptions = {
    lighting: true,
    skybox: true,
} as const satisfies EnvironmentOptions;

export type ViewerHotSpotQuery =
    | ({
          /**
           * The type of the hot spot.
           */
          type: "surface";

          /**
           * The index of the mesh within the loaded model.
           */
          meshIndex: number;
      } & HotSpotQuery)
    | {
          /**
           * The type of the hot spot.
           */
          type: "world";

          /**
           * The fixed world space position of the hot spot.
           */
          position: [x: number, y: number, z: number];

          /**
           * The fixed world space normal of the hot spot.
           */
          normal: [x: number, y: number, z: number];
      };

export type HotSpot = ViewerHotSpotQuery & {
    /**
     * An optional camera pose to associate with the hotspot.
     */
    cameraOrbit?: CameraOrbit;
};

/**
 * Provides the result of a hot spot query.
 */
export class ViewerHotSpotResult {
    /**
     * 2D canvas position in pixels
     */
    public readonly screenPosition: [x: number, y: number] = [NaN, NaN];

    /**
     * 3D world coordinates
     */
    public readonly worldPosition: [x: number, y: number, z: number] = [NaN, NaN, NaN];

    /**
     * visibility range is [-1..1]. A value of 0 means camera eye is on the plane.
     */
    public visibility: number = NaN;
}

export type ViewerBoundingInfo = {
    /**
     * The minimum and maximum extents of the model.
     */
    extents: Readonly<{
        /**
         * The minimum extent of the model.
         */
        readonly min: readonly [x: number, y: number, z: number];

        /**
         * The maximum extent of the model.
         */
        readonly max: readonly [x: number, y: number, z: number];
    }>;

    /**
     * The size of the model.
     */
    readonly size: readonly [x: number, y: number, z: number];

    /**
     * The center of the model.
     */
    readonly center: readonly [x: number, y: number, z: number];
};

export type ViewerCameraConfig = {
    /**
     * The goal radius of the camera.
     * @remarks This is the size of the scene bounds (times a factor)
     */
    radius: number;
    /**
     * The goal target of the camera.
     * @remarks Center of the bounds of the scene or 0,0,0 by default
     */
    target: Vector3;
    /**
     * The minimum zoom distance of the camera.
     */
    lowerRadiusLimit: number;
    /**
     * The maximum zoom distance of the camera.
     */
    upperRadiusLimit: number;
    /**
     * The minZ of the camera.
     */
    minZ: number;
    /**
     * The maxZ of the camera.
     */
    maxZ: number;
};

export type Model = IDisposable & {
    /**
     * The asset container representing the model.
     */
    readonly assetContainer: AssetContainer;

    /**
     * The material variants controller for the model.
     */
    readonly materialVariantsController: Nullable<MaterialVariantsController>;

    /**
     * The current animation.
     */
    selectedAnimation: number;

    /**
     * Returns the world position and visibility of a hot spot.
     */
    getHotSpotToRef(query: Readonly<ViewerHotSpotQuery>, result: ViewerHotSpotResult): boolean;

    /**
     * Compute and return the world bounds of the model.
     * The minimum and maximum extents, the size and the center.
     * @param animationIndex The index of the animation group to use for computation. If omitted, the current selected animation is used.
     * @returns The computed bounding info for the model or null if no meshes are present in the asset container.
     */
    getWorldBounds(animationIndex?: number): Nullable<ViewerBoundingInfo>;

    /**
     * Resets the computed world bounds of the model.
     * Should be called after the model undergoes transformations.
     */
    resetWorldBounds(): void;

    /**
     * Makes the model the current active model in the viewer.
     * @param options Options for activating the model.
     */
    makeActive(options?: ActivateModelOptions): void;

    /**
     * The selected material variant.
     */
    selectedMaterialVariant: Nullable<string>;
};

type ModelInternal = Model & {
    _animationPlaying(): boolean;
    _shouldRender(): boolean;
};

/**
 * Provides an experience for viewing a single 3D model.
 * @remarks
 * The Viewer is not tied to a specific UI framework and can be used with Babylon.js in a browser or with Babylon Native.
 */
export class Viewer implements IDisposable {
    static {
        registerBuiltInLoaders();
    }

    /**
     * When enabled, the Viewer will emit additional diagnostic logs to the console.
     */
    public showDebugLogs = false;

    /**
     * Fired when the environment has changed.
     */
    public readonly onEnvironmentChanged = new Observable<void>();

    /**
     * Fired when the environment configuration has changed.
     */
    public readonly onEnvironmentConfigurationChanged = new Observable<void>();

    /**
     * Fired when an error occurs while loading the environment.
     */
    public readonly onEnvironmentError = new Observable<unknown>();

    /**
     * Fired when the shadows configuration changes.
     */
    public readonly onShadowsConfigurationChanged = new Observable<void>();

    /**
     * Fired when the post processing state changes.
     */
    public readonly onPostProcessingChanged = new Observable<void>();

    /**
     * Fired when a model is loaded into the viewer (or unloaded from the viewer).
     * @remarks
     * The event argument is the source that was loaded, or null if no model is loaded.
     */
    public readonly onModelChanged = new Observable<Nullable<string | File | ArrayBufferView>>();

    /**
     * Fired when an error occurs while loading a model.
     */
    public readonly onModelError = new Observable<unknown>();

    /**
     * Fired when progress changes on loading activity.
     */
    public readonly onLoadingProgressChanged = new Observable<void>();

    /**
     * Fired when the camera auto orbit state changes.
     */
    public readonly onCameraAutoOrbitChanged = new Observable<void>();

    /**
     * Fired when the selected animation changes.
     */
    public readonly onSelectedAnimationChanged = new Observable<void>();

    /**
     * Fired when the animation speed changes.
     */
    public readonly onAnimationSpeedChanged = new Observable<void>();

    /**
     * Fired when the selected animation is playing or paused.
     */
    public readonly onIsAnimationPlayingChanged = new Observable<void>();

    /**
     * Fired when the current point on the selected animation timeline changes.
     */
    public readonly onAnimationProgressChanged = new Observable<void>();

    /**
     * Fired when the selected material variant changes.
     */
    public readonly onSelectedMaterialVariantChanged = new Observable<void>();

    /**
     * Fired when the hot spots object changes to a complete new object instance.
     */
    public readonly onHotSpotsChanged = new Observable<void>();

    /**
     * Fired when the cameras as hot spots property changes.
     */
    public readonly onCamerasAsHotSpotsChanged = new Observable<void>();

    protected readonly _scene: Scene;
    protected readonly _camera: ArcRotateCamera;
    protected readonly _snapshotHelper: Nullable<SnapshotRenderingHelper> = null;

    private readonly _defaultHardwareScalingLevel: number;
    private _lastHardwareScalingLevel: number;
    private _renderedLastFrame: Nullable<boolean> = null;
    private _sceneOptimizer: Nullable<SceneOptimizer> = null;

    private readonly _tempVectors = BuildTuple(4, Vector3.Zero);
    private readonly _meshDataCache = new Map<AbstractMesh, IMeshDataCache>();
    private readonly _autoRotationBehavior: AutoRotationBehavior;
    private readonly _imageProcessingConfigurationObserver: Observer<ImageProcessingConfiguration>;
    private readonly _beforeRenderObserver: Nullable<Observer<Scene>> = null;
    private _renderLoopController: Nullable<IDisposable> = null;
    private _loadedModelsBacking: ModelInternal[] = [];
    private _activeModelBacking: Nullable<ModelInternal> = null;
    private _environmentSkyboxMode: EnvironmentMode = "none";
    private _environmentLightingMode: EnvironmentMode = "none";
    private _skybox: Nullable<Mesh> = null;
    private _skyboxBlur = this._options?.environmentConfig?.blur ?? DefaultViewerOptions.environmentConfig.blur;
    private _skyboxTexture: Nullable<CubeTexture | HDRCubeTexture> = null;
    private _reflectionTexture: Nullable<CubeTexture | HDRCubeTexture> = null;
    private _reflectionsIntensity = this._options?.environmentConfig?.intensity ?? DefaultViewerOptions.environmentConfig.intensity;
    private _reflectionsRotation = this._options?.environmentConfig?.rotation ?? DefaultViewerOptions.environmentConfig.rotation;
    private _light: Nullable<HemisphericLight> = null;
    private _toneMappingEnabled: boolean;
    private _toneMappingType: number;
    private _contrast: number;
    private _exposure: number;
    private _ssaoOption: SSAOOptions = this._options?.postProcessing?.ssao ?? DefaultViewerOptions.postProcessing.ssao;
    private _ssaoPipeline: Nullable<SSAO2RenderingPipeline> = null;

    private readonly _autoSuspendRendering = this._options?.autoSuspendRendering ?? DefaultViewerOptions.autoSuspendRendering;
    private _sceneMutated = false;
    private _suspendRenderCount = 0;
    private _isDisposed = false;

    private readonly _loadModelLock = new AsyncLock();
    private _loadModelAbortController: Nullable<AbortController> = null;

    private readonly _loadEnvironmentLock = new AsyncLock();
    private _loadEnvironmentAbortController: Nullable<AbortController> = null;

    private _camerasAsHotSpotsAbortController: Nullable<AbortController> = null;

    private readonly _updateShadowsLock = new AsyncLock();
    private _shadowsAbortController: Nullable<AbortController> = null;

    private readonly _updateSSAOLock = new AsyncLock();
    private _ssaoAbortController: Nullable<AbortController> = null;

    private readonly _loadOperations = new Set<Readonly<{ progress: Nullable<number> }>>();

    private _activeAnimationObservers: Observer<AnimationGroup>[] = [];
    private _animationSpeed = this._options?.animationSpeed ?? DefaultViewerOptions.animationSpeed;

    private _camerasAsHotSpots = false;
    private _hotSpots: Record<string, HotSpot> = this._options?.hotSpots ?? {};

    private _shadowQuality: ShadowQuality = this._options?.shadowConfig?.quality ?? DefaultViewerOptions.shadowConfig.quality;
    private readonly _shadowState: ShadowState = {};

    public constructor(
        private readonly _engine: AbstractEngine,
        private readonly _options?: Readonly<ViewerOptions>
    ) {
        if (this._options?.shadowConfig?.quality === "high" && this._options?.postProcessing?.ssao === "enabled") {
            throw new Error("High quality shadows are not compatible with SSAO. Please choose either high quality shadows or SSAO.");
        }

        this._defaultHardwareScalingLevel = this._lastHardwareScalingLevel = this._engine.getHardwareScalingLevel();
        {
            const scene = new Scene(this._engine);
            scene.useRightHandedSystem = this._options?.useRightHandedSystem ?? DefaultViewerOptions.useRightHandedSystem;

            const defaultMaterial = new PBRMaterial("default Material", scene);
            defaultMaterial.albedoColor = new Color3(0.4, 0.4, 0.4);
            defaultMaterial.metallic = 0;
            defaultMaterial.roughness = 1;
            defaultMaterial.baseDiffuseRoughness = 1;
            defaultMaterial.microSurface = 0;
            scene.defaultMaterial = defaultMaterial;

            // Deduce tone mapping, contrast, and exposure from the scene (so the viewer stays in sync if anything mutates these values directly on the scene).
            this._toneMappingEnabled = scene.imageProcessingConfiguration.toneMappingEnabled;
            this._toneMappingType = scene.imageProcessingConfiguration.toneMappingType;
            this._contrast = scene.imageProcessingConfiguration.contrast;
            this._exposure = scene.imageProcessingConfiguration.exposure;

            this._imageProcessingConfigurationObserver = scene.imageProcessingConfiguration.onUpdateParameters.add(() => {
                let hasChanged = false;

                if (this._toneMappingEnabled !== scene.imageProcessingConfiguration.toneMappingEnabled) {
                    this._toneMappingEnabled = scene.imageProcessingConfiguration.toneMappingEnabled;
                    hasChanged = true;
                }

                if (this._toneMappingType !== scene.imageProcessingConfiguration.toneMappingType) {
                    this._toneMappingType = scene.imageProcessingConfiguration.toneMappingType;
                    hasChanged = true;
                }

                if (this._contrast !== scene.imageProcessingConfiguration.contrast) {
                    this._contrast = scene.imageProcessingConfiguration.contrast;
                    hasChanged = true;
                }

                if (this._exposure !== scene.imageProcessingConfiguration.exposure) {
                    this._exposure = scene.imageProcessingConfiguration.exposure;
                    hasChanged = true;
                }

                if (hasChanged) {
                    this.onPostProcessingChanged.notifyObservers();
                }
            });

            const camera = new ArcRotateCamera("Viewer Default Camera", 0, 0, 1, Vector3.Zero(), scene);
            camera.useInputToRestoreState = false;
            camera.useAutoRotationBehavior = true;

            camera.onViewMatrixChangedObservable.add(() => {
                this._markSceneMutated();
            });

            scene.onClearColorChangedObservable.add(() => {
                this._markSceneMutated();
            });

            scene.onPointerObservable.add(async (pointerInfo) => {
                const pickingInfo = await this._pick(pointerInfo.event.offsetX, pointerInfo.event.offsetY);
                if (pickingInfo?.pickedPoint) {
                    const distance = pickingInfo.pickedPoint.subtract(camera.position).dot(camera.getForwardRay().direction);
                    // Immediately reset the target and the radius based on the distance to the picked point.
                    // This eliminates unnecessary camera movement on the local z-axis when interpolating.
                    camera.target = camera.position.add(camera.getForwardRay().direction.scale(distance));
                    camera.radius = distance;
                    camera.interpolateTo(undefined, undefined, undefined, pickingInfo.pickedPoint);
                } else {
                    this.resetCamera(true);
                }
            }, PointerEventTypes.POINTERDOUBLETAP);

            scene.onNewCameraAddedObservable.add((camera) => {
                if (this.camerasAsHotSpots) {
                    observePromise(this._addCameraHotSpot(camera, this._camerasAsHotSpotsAbortController?.signal));
                }
            });

            scene.onCameraRemovedObservable.add((camera) => {
                this._removeCameraHotSpot(camera);
            });

            this._scene = scene;
            this._camera = camera;
        }

        this._scene.skipFrustumClipping = true;
        this._scene.skipPointerDownPicking = true;
        this._scene.skipPointerUpPicking = true;
        this._scene.skipPointerMovePicking = true;
        if (WebGPUSnapshotRenderingEnabled) {
            this._snapshotHelper = new SnapshotRenderingHelper(this._scene, { morphTargetsNumMaxInfluences: 30 });
            this._snapshotHelper.showDebugLogs = WebGPUSnapshotRenderingLoggingEnabled;
            this._beforeRenderObserver = this._scene.onBeforeRenderObservable.add(() => {
                this._snapshotHelper?.updateMesh(this._scene.meshes);
            });
        }
        this._camera.attachControl();
        this._autoRotationBehavior = this._camera.getBehaviorByName("AutoRotation") as AutoRotationBehavior;
        this._reset(false, "camera");

        // Load a default light, but ignore errors as the user might be immediately loading their own environment.
        observePromise(this.resetEnvironment());

        this._beginRendering();

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const viewer = this;
        this._options?.onInitialized?.({
            scene: viewer._scene,
            camera: viewer._camera,
            get model() {
                return viewer._activeModel ?? null;
            },
            suspendRendering: () => this._suspendRendering(),
            markSceneMutated: () => this._markSceneMutated(),
            pick: async (screenX: number, screenY: number) => await this._pick(screenX, screenY),
        });

        this._reset(false, "source", "environment", "post-processing");
    }

    /**
     * The camera auto orbit configuration.
     */
    public get cameraAutoOrbit(): Readonly<CameraAutoOrbit> {
        return {
            enabled: this._camera.behaviors.includes(this._autoRotationBehavior),
            speed: this._autoRotationBehavior.idleRotationSpeed,
            delay: this._autoRotationBehavior.idleRotationWaitTime,
        };
    }

    public set cameraAutoOrbit(value: Partial<Readonly<CameraAutoOrbit>>) {
        if (value.enabled !== undefined && value.enabled !== this.cameraAutoOrbit.enabled) {
            if (value.enabled) {
                this._camera.addBehavior(this._autoRotationBehavior);
            } else {
                this._camera.removeBehavior(this._autoRotationBehavior);
            }
        }

        if (value.delay !== undefined) {
            this._autoRotationBehavior.idleRotationWaitTime = value.delay;
        }

        if (value.speed !== undefined) {
            this._autoRotationBehavior.idleRotationSpeed = value.speed;
        }

        this.onCameraAutoOrbitChanged.notifyObservers();
    }

    /**
     * Get the current environment configuration.
     */
    public get environmentConfig(): Readonly<EnvironmentParams> {
        return {
            intensity: this._reflectionsIntensity,
            blur: this._skyboxBlur,
            rotation: this._reflectionsRotation,
        };
    }

    public set environmentConfig(value: Partial<Readonly<EnvironmentParams>>) {
        if (value.blur !== undefined) {
            this._changeSkyboxBlur(value.blur);
        }
        if (value.intensity !== undefined) {
            this._changeEnvironmentIntensity(value.intensity);
            this._changeShadowLightIntensity();
        }
        if (value.rotation !== undefined) {
            this._changeEnvironmentRotation(value.rotation);
            this._rotateShadowLightWithEnvironment();
        }
        this.onEnvironmentConfigurationChanged.notifyObservers();
    }

    /**
     * Get the current shadow configuration.
     */
    public get shadowConfig(): Readonly<ShadowParams> {
        return {
            quality: this._shadowQuality,
        };
    }

    /**
     * Update the shadow configuration.
     * @param value The new shadow configuration.
     */
    public async updateShadows(value: Partial<Readonly<ShadowParams>>): Promise<void> {
        if (value.quality && this._shadowQuality !== value.quality) {
            if (value.quality === "high" && this._ssaoOption === "enabled") {
                throw new Error("Shadows quality cannot be set to high when SSAO is enabled.");
            }

            this._shadowQuality = value.quality;

            await this._updateShadows();
            this.onShadowsConfigurationChanged.notifyObservers();
        }
    }

    private _changeSkyboxBlur(value: number) {
        if (value !== this._skyboxBlur) {
            this._skyboxBlur = value;
            if (this._skybox) {
                const material = this._skybox.material;
                if (material instanceof BackgroundMaterial) {
                    this._snapshotHelper?.disableSnapshotRendering();
                    material.reflectionBlur = this._skyboxBlur;
                    this._snapshotHelper?.enableSnapshotRendering();
                    this._markSceneMutated();
                }
            }
        }
    }

    /**
     * Change the environment rotation.
     * @param value the rotation in radians
     */
    private _changeEnvironmentRotation(value: number) {
        if (value !== this._reflectionsRotation) {
            this._reflectionsRotation = value;

            this._snapshotHelper?.disableSnapshotRendering();
            if (this._skyboxTexture) {
                this._skyboxTexture.rotationY = this._reflectionsRotation;
            }
            if (this._reflectionTexture) {
                this._reflectionTexture.rotationY = this._reflectionsRotation;
            }
            this._snapshotHelper?.enableSnapshotRendering();
            this._markSceneMutated();
        }
    }

    private _changeEnvironmentIntensity(value: number) {
        if (value !== this._reflectionsIntensity) {
            this._reflectionsIntensity = value;

            this._snapshotHelper?.disableSnapshotRendering();
            if (this._skyboxTexture) {
                this._skyboxTexture.level = this._reflectionsIntensity;
            }
            if (this._reflectionTexture) {
                this._reflectionTexture.level = this._reflectionsIntensity;
            }
            this._snapshotHelper?.enableSnapshotRendering();
            this._markSceneMutated();
        }
    }

    private _updateAutoClear() {
        // NOTE: Not clearing (even when every pixel is rendered with an opaque color) results in rendering
        //       artifacts in Chromium browsers on Intel-based Macs (see https://issues.chromium.org/issues/396612322).
        //       The performance impact of clearing when not necessary is very small, so for now just always auto clear.
        //this._scene.autoClear = !this._skybox || !this._skybox.isEnabled() || !this._skyboxVisible;
        this._scene.autoClear = true;
        this._markSceneMutated();
    }

    /**
     * The post processing configuration.
     */
    public get postProcessing(): PostProcessing {
        let toneMapping: ToneMapping = "none";
        if (this._toneMappingEnabled) {
            switch (this._toneMappingType) {
                case ImageProcessingConfiguration.TONEMAPPING_STANDARD:
                    toneMapping = "standard";
                    break;
                case ImageProcessingConfiguration.TONEMAPPING_ACES:
                    toneMapping = "aces";
                    break;
                case ImageProcessingConfiguration.TONEMAPPING_KHR_PBR_NEUTRAL:
                    toneMapping = "neutral";
                    break;
            }
        }

        return {
            toneMapping,
            contrast: this._contrast,
            exposure: this._exposure,
            ssao: this._ssaoOption,
        };
    }

    public set postProcessing(value: Partial<Readonly<PostProcessing>>) {
        this._snapshotHelper?.disableSnapshotRendering();

        if (value.toneMapping !== undefined) {
            if (value.toneMapping === "none") {
                this._scene.imageProcessingConfiguration.toneMappingEnabled = false;
            } else {
                switch (value.toneMapping) {
                    case "standard":
                        this._scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_STANDARD;
                        break;
                    case "aces":
                        this._scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
                        break;
                    case "neutral":
                        this._scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_KHR_PBR_NEUTRAL;
                        break;
                }
                this._scene.imageProcessingConfiguration.toneMappingEnabled = true;
            }
        }

        if (value.contrast !== undefined) {
            this._scene.imageProcessingConfiguration.contrast = value.contrast;
        }

        if (value.exposure !== undefined) {
            this._scene.imageProcessingConfiguration.exposure = value.exposure;
        }

        if (value.ssao && this._ssaoOption !== value.ssao) {
            if (value.ssao === "enabled" && this._shadowQuality === "high") {
                throw new Error("SSAO cannot be enabled when shadows quality is set to high.");
            }
            this._ssaoOption = value.ssao;
            this._updateSSAOPipeline();
        }

        this._scene.imageProcessingConfiguration.isEnabled = this._toneMappingEnabled || this._contrast !== 1 || this._exposure !== 1 || this._ssaoPipeline !== null;

        this._snapshotHelper?.enableSnapshotRendering();
        this._markSceneMutated();
    }

    /**
     * Gets information about loading activity.
     * @remarks
     * false indicates no loading activity.
     * true indicates loading activity with no progress information.
     * A number between 0 and 1 indicates loading activity with progress information.
     */
    public get loadingProgress(): boolean | number {
        if (this._loadOperations.size > 0) {
            let totalProgress = 0;
            for (const operation of this._loadOperations) {
                if (operation.progress == null) {
                    return true;
                }
                totalProgress += operation.progress;
            }

            return totalProgress / this._loadOperations.size;
        }

        return false;
    }

    protected get _loadedModels(): readonly Model[] {
        return this._loadedModelsBacking;
    }

    protected get _activeModel(): Nullable<Model> {
        return this._activeModelBacking;
    }

    private _setActiveModel(...args: [model: null] | [model: ModelInternal, options?: ActivateModelOptions]) {
        const [model, options] = args;
        if (model !== this._activeModelBacking) {
            this._activeModelBacking = model;
            this._updateLight();
            observePromise(this._updateShadows());
            this._updateSSAOPipeline();
            this._applyAnimationSpeed();
            this._selectAnimation(0, false);
            this.onSelectedMaterialVariantChanged.notifyObservers();
            this._reframeCamera(true, model ? [model] : undefined);
            this.onModelChanged.notifyObservers(options?.source ?? null);
        }
    }

    private async _enableSSAOPipeline(abortSignal: AbortSignal) {
        if (!this._ssaoPipeline) {
            const [{ SSAO2RenderingPipeline }] = await LazySSAODependenciesPromise.value;
            this._throwIfDisposedOrAborted(abortSignal);

            this._scene.postProcessRenderPipelineManager.onNewPipelineAddedObservable.addOnce((pipeline) => {
                if (pipeline.name === "ssao") {
                    this.onPostProcessingChanged.notifyObservers();
                }
            });

            this._scene.postProcessRenderPipelineManager.onPipelineRemovedObservable.addOnce((pipeline) => {
                if (pipeline.name === "ssao") {
                    this.onPostProcessingChanged.notifyObservers();
                }
            });

            const ssaoRatio = {
                ssaoRatio: 1,
                blurRatio: 1,
            };

            let ssaoPipeline: Nullable<SSAO2RenderingPipeline> = null;
            try {
                ssaoPipeline = new SSAO2RenderingPipeline("ssao", this._scene, ssaoRatio);
                const worldBounds = this._getWorldBounds(this._loadedModels);
                if (worldBounds) {
                    const size = Vector3.FromArray(worldBounds.size).length();
                    ssaoPipeline.expensiveBlur = true;
                    ssaoPipeline.maxZ = size * 2;
                    // arbitrary max size to cap SSAO settings
                    const maxSceneSize = 50;
                    ssaoPipeline.radius = Clamp(Lerp(1, 5, Clamp((size - 1) / maxSceneSize, 0, 1)), 1, 5);
                    ssaoPipeline.totalStrength = Clamp(Lerp(0.3, 1.0, Clamp((size - 1) / maxSceneSize, 0, 1)), 0.3, 1.0);
                    ssaoPipeline.samples = Math.round(Clamp(Lerp(8, 32, Clamp((size - 1) / maxSceneSize, 0, 1)), 8, 32));
                }

                // Wait for the SSAO pipeline to be ready before attaching it to the camera.
                while (!ssaoPipeline.isReady()) {
                    // eslint-disable-next-line no-await-in-loop
                    await WhenNext(this._scene.onAfterRenderObservable, abortSignal);
                }

                this._throwIfDisposedOrAborted(abortSignal);
                this._ssaoPipeline = ssaoPipeline;
                this._scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("ssao", this._camera);
            } catch (error) {
                ssaoPipeline?.dispose();
                throw error;
            }
        }
    }

    private _disableSSAOPipeline() {
        if (this._ssaoPipeline) {
            this._scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline("ssao", this._camera);
            this._scene.postProcessRenderPipelineManager.removePipeline("ssao");
            this._ssaoPipeline?.dispose();
            this._ssaoPipeline = null;
        }
    }

    protected _updateSSAOPipeline() {
        observePromise(
            (async () => {
                this._ssaoAbortController?.abort(new AbortError("SSAO is being changed before previous SSAO finished initializing."));
                this._ssaoAbortController = new AbortController();
                const abortSignal = this._ssaoAbortController.signal;

                await this._updateSSAOLock.lockAsync(async () => {
                    let shouldEnable = this._ssaoOption === "enabled";

                    if (this._ssaoOption === "auto") {
                        const hasModels = this._loadedModels.length > 0;
                        const hasMaterials = this._loadedModels.some((model) => model.assetContainer.materials.length > 0);
                        const ibleShadowsEnabled = this._shadowQuality === "high";
                        shouldEnable = hasModels && !hasMaterials && !ibleShadowsEnabled;
                    }

                    if (shouldEnable) {
                        await this._enableSSAOPipeline(abortSignal);
                    } else {
                        this._disableSSAOPipeline();
                    }
                });
            })()
        );
    }

    /**
     * The list of animation names for the currently loaded model.
     */
    public get animations(): readonly string[] {
        return this._activeModel?.assetContainer.animationGroups.map((group) => group.name) ?? [];
    }

    /**
     * The currently selected animation index.
     */
    public get selectedAnimation(): number {
        return this._activeModel?.selectedAnimation ?? -1;
    }

    public set selectedAnimation(value: number) {
        this._selectAnimation(value, this._loadOperations.size === 0);
    }

    protected _selectAnimation(index: number, interpolateCamera = true) {
        index = Math.round(Clamp(index, -1, this.animations.length - 1));
        if (this._activeModel && index !== this._activeModel.selectedAnimation) {
            this._activeAnimationObservers.forEach((observer) => observer.remove());
            this._activeAnimationObservers = [];

            this._activeModel.selectedAnimation = index;

            if (this._activeAnimation) {
                this._activeAnimationObservers = [
                    this._activeAnimation.onAnimationGroupPlayObservable.add(() => {
                        this.onIsAnimationPlayingChanged.notifyObservers();
                    }),
                    this._activeAnimation.onAnimationGroupPauseObservable.add(() => {
                        this.onIsAnimationPlayingChanged.notifyObservers();
                    }),
                    this._activeAnimation.onAnimationGroupEndObservable.add(() => {
                        this.onIsAnimationPlayingChanged.notifyObservers();
                        this.onAnimationProgressChanged.notifyObservers();
                    }),
                ];

                this._reframeCamera(interpolateCamera);
            }

            this.onSelectedAnimationChanged.notifyObservers();
            this.onAnimationProgressChanged.notifyObservers();
        }
    }

    /**
     * True if an animation is currently playing.
     */
    public get isAnimationPlaying(): boolean {
        return this._activeModelBacking?._animationPlaying() ?? false;
    }

    /**
     * The speed scale at which animations are played.
     */
    public get animationSpeed(): number {
        return this._animationSpeed;
    }

    public set animationSpeed(value: number) {
        this._animationSpeed = value;
        this._applyAnimationSpeed();
        this.onAnimationSpeedChanged.notifyObservers();
    }

    /**
     * The current point on the selected animation timeline, normalized between 0 and 1.
     */
    public get animationProgress(): number {
        if (this._activeAnimation) {
            return this._activeAnimation.getCurrentFrame() / (this._activeAnimation.to - this._activeAnimation.from);
        }
        return 0;
    }

    public set animationProgress(value: number) {
        if (this._activeAnimation) {
            this._activeAnimation.goToFrame(value * (this._activeAnimation.to - this._activeAnimation.from));
            this.onAnimationProgressChanged.notifyObservers();
            this._autoRotationBehavior.resetLastInteractionTime();
            this._markSceneMutated();
        }
    }

    private get _activeAnimation(): Nullable<AnimationGroup> {
        return this._activeModel?.assetContainer.animationGroups[this._activeModel?.selectedAnimation] ?? null;
    }

    /**
     * The list of material variant names for the currently loaded model.
     */
    public get materialVariants(): readonly string[] {
        return this._activeModel?.materialVariantsController?.variants ?? [];
    }

    /**
     * The currently selected material variant.
     */
    public get selectedMaterialVariant(): Nullable<string> {
        return this._activeModel?.selectedMaterialVariant ?? null;
    }

    public set selectedMaterialVariant(value: Nullable<string>) {
        if (this._activeModel && value) {
            this._activeModel.selectedMaterialVariant = value;
        }
    }

    /**
     * The set of defined hotspots.
     */
    public get hotSpots() {
        return this._hotSpots;
    }

    public set hotSpots(value: Record<string, HotSpot>) {
        this._hotSpots = value;
        this.onHotSpotsChanged.notifyObservers();
    }

    /**
     * True if scene cameras should be used as hotspots.
     */
    public get camerasAsHotSpots() {
        return this._camerasAsHotSpots;
    }

    public set camerasAsHotSpots(value: boolean) {
        if (this._camerasAsHotSpots !== value) {
            this._camerasAsHotSpots = value;
            this._toggleCamerasAsHotSpots();
            this.onCamerasAsHotSpotsChanged.notifyObservers();
        }
    }

    protected _beginLoadOperation(): IDisposable & { progress: Nullable<number> } {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const viewer = this;
        let progress: Nullable<number> = null;

        const loadOperation = {
            get progress() {
                return progress;
            },
            set progress(value: Nullable<number>) {
                progress = value;
                viewer.onLoadingProgressChanged.notifyObservers();
            },
            dispose: () => {
                viewer._loadOperations.delete(loadOperation);
                viewer.onLoadingProgressChanged.notifyObservers();
            },
        };

        this._loadOperations.add(loadOperation);
        this.onLoadingProgressChanged.notifyObservers();

        return loadOperation;
    }

    /**
     * Loads a 3D model from the specified URL.
     * @remarks
     * If a model is already loaded, it will be unloaded before loading the new model.
     * @param source A url or File or ArrayBufferView that points to the model to load.
     * @param options The options to use when loading the model.
     * @param abortSignal An optional signal that can be used to abort the loading process.
     */
    public async loadModel(source: string | File | ArrayBufferView, options?: LoadModelOptions, abortSignal?: AbortSignal): Promise<void> {
        await this._updateModel(source, options, abortSignal);
    }

    /**
     * Unloads the current 3D model if one is loaded.
     * @param abortSignal An optional signal that can be used to abort the reset.
     */
    public async resetModel(abortSignal?: AbortSignal): Promise<void> {
        await this._updateModel(undefined, undefined, abortSignal);
    }

    protected async _loadModel(source: string | File | ArrayBufferView, options?: LoadAssetContainerOptions, abortSignal?: AbortSignal): Promise<Model> {
        this._throwIfDisposedOrAborted(abortSignal);

        const loadOperation = this._beginLoadOperation();
        const originalOnProgress = options?.onProgress;
        const onProgress = (event: ISceneLoaderProgressEvent) => {
            originalOnProgress?.(event);
            loadOperation.progress = event.lengthComputable ? event.loaded / event.total : null;
        };
        delete options?.onProgress;

        let materialVariantsController: Nullable<MaterialVariantsController> = null;
        const originalOnMaterialVariantsLoaded = options?.pluginOptions?.gltf?.extensionOptions?.KHR_materials_variants?.onLoaded;
        const onMaterialVariantsLoaded: typeof originalOnMaterialVariantsLoaded = (controller) => {
            originalOnMaterialVariantsLoaded?.(controller);
            materialVariantsController = controller;
        };
        delete options?.pluginOptions?.gltf?.extensionOptions?.KHR_materials_variants?.onLoaded;

        const defaultOptions: LoadAssetContainerOptions = {
            // Pass a progress callback to update the loading progress.
            onProgress,
            pluginOptions: {
                gltf: {
                    // Enable transparency as coverage by default to be 3D Commerce compliant by default.
                    // https://doc.babylonjs.com/setup/support/3D_commerce_certif
                    transparencyAsCoverage: true,
                    extensionOptions: {
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        KHR_materials_variants: {
                            // Capture the material variants controller when it is loaded.
                            onLoaded: onMaterialVariantsLoaded,
                        },
                    },
                },
            },
        };

        options = deepMerge(defaultOptions, options ?? {});

        this._snapshotHelper?.disableSnapshotRendering();

        try {
            const assetContainer = await LoadAssetContainerAsync(source, this._scene, options);
            RemoveUnreferencedVerticesData(assetContainer.meshes.filter((mesh) => mesh instanceof Mesh));
            assetContainer.animationGroups.forEach((group) => {
                group.start(true, this.animationSpeed);
                group.pause();
            });
            assetContainer.addAllToScene();
            this._snapshotHelper?.fixMeshes(assetContainer.meshes);

            let selectedAnimation = -1;
            const cachedWorldBounds: ViewerBoundingInfo[] = [];
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const viewer = this;

            const model = {
                assetContainer,
                materialVariantsController,
                _animationPlaying: () => {
                    const activeAnimation = assetContainer.animationGroups[selectedAnimation];
                    return activeAnimation?.isPlaying ?? false;
                },
                _shouldRender: () => {
                    const stillTransitioning = model?.assetContainer.animationGroups.some((group) => group.animatables.some((animatable) => animatable.animationStarted));
                    // Should render if :
                    // 1. An animation is playing.
                    // 2. Animation is paused, but any individual animatable hasn't transitioned to a paused state yet.
                    return model._animationPlaying() || stillTransitioning;
                },
                getHotSpotToRef: (query: Readonly<ViewerHotSpotQuery>, result: ViewerHotSpotResult) => {
                    return this._getHotSpotToRef(assetContainer, query, result);
                },
                dispose: () => {
                    this._snapshotHelper?.disableSnapshotRendering();
                    assetContainer.meshes.forEach((mesh) => this._meshDataCache.delete(mesh));
                    assetContainer.dispose();

                    const index = this._loadedModelsBacking.indexOf(model);
                    if (index !== -1) {
                        this._loadedModelsBacking.splice(index, 1);
                        if (model === this._activeModel) {
                            this._setActiveModel(null);
                        }
                    }

                    this._snapshotHelper?.enableSnapshotRendering();
                    this._markSceneMutated();
                },
                getWorldBounds: (animationIndex: number = selectedAnimation): Nullable<ViewerBoundingInfo> => {
                    let worldBounds: Nullable<ViewerBoundingInfo> = cachedWorldBounds[animationIndex];
                    if (!worldBounds) {
                        worldBounds = computeModelsBoundingInfos([model]);
                        if (worldBounds) {
                            cachedWorldBounds[animationIndex] = worldBounds;
                        }
                    }
                    return worldBounds;
                },
                resetWorldBounds: () => {
                    cachedWorldBounds.length = 0;
                },
                get selectedAnimation() {
                    return selectedAnimation;
                },
                set selectedAnimation(index: number) {
                    let activeAnimation = assetContainer.animationGroups[selectedAnimation];
                    const startAnimation = activeAnimation?.isPlaying ?? false;
                    if (activeAnimation) {
                        activeAnimation.pause();
                        activeAnimation.goToFrame(0);
                    }

                    selectedAnimation = index;
                    activeAnimation = assetContainer.animationGroups[selectedAnimation];
                    observePromise(viewer._updateShadows());

                    if (activeAnimation) {
                        activeAnimation.goToFrame(0);
                        activeAnimation.play(true);

                        if (!startAnimation) {
                            activeAnimation.pause();
                        }
                    }
                },
                makeActive: (options?: ActivateModelOptions) => {
                    this._setActiveModel(model, options);
                },
                set selectedMaterialVariant(variantName: string) {
                    if (materialVariantsController) {
                        let value: Nullable<string> = variantName;
                        if (!value) {
                            value = materialVariantsController.variants[0];
                        }

                        if (value !== materialVariantsController.selectedVariant && materialVariantsController.variants.includes(value)) {
                            viewer._snapshotHelper?.disableSnapshotRendering();
                            materialVariantsController.selectedVariant = value;
                            viewer._snapshotHelper?.enableSnapshotRendering();
                            viewer._markSceneMutated();
                            viewer.onSelectedMaterialVariantChanged.notifyObservers();
                        }
                    }
                },
                get selectedMaterialVariant(): Nullable<string> {
                    if (materialVariantsController) {
                        return materialVariantsController.selectedVariant;
                    }
                    return null;
                },
            };

            this._loadedModelsBacking.push(model);

            return model;
        } catch (e) {
            this.onModelError.notifyObservers(e);
            throw e;
        } finally {
            loadOperation.dispose();
            this._snapshotHelper?.enableSnapshotRendering();
            this._markSceneMutated();
        }
    }

    private async _updateModel(source: string | File | ArrayBufferView | undefined, options?: LoadModelOptions, abortSignal?: AbortSignal): Promise<void> {
        this._throwIfDisposedOrAborted(abortSignal);

        this._loadModelAbortController?.abort(new AbortError("New model is being loaded before previous model finished loading."));
        const abortController = (this._loadModelAbortController = new AbortController());

        await this._loadModelLock.lockAsync(async () => {
            throwIfAborted(abortSignal, abortController.signal);
            this._activeModel?.dispose();
            this._activeModelBacking = null;
            this.selectedAnimation = -1;

            if (source) {
                const model = await this._loadModel(source, options, abortController.signal);
                model.makeActive(Object.assign({ source, interpolateCamera: false }, options));
                this._reset(false, "camera", "animation", "material-variant");
            }
        });

        const hasPBRMaterials = this._loadedModels.some((model) => model.assetContainer.materials.some((material) => material instanceof PBRMaterial));
        const usesDefaultMaterial = this._loadedModels.some((model) => model.assetContainer.meshes.some((mesh) => !mesh.material));
        // If PBR is used (either explicitly, or implicitly by a mesh not having a material and therefore using the default PBRMaterial)
        // and an environment texture is not already loaded, then load the default environment.
        if (!this._scene.environmentTexture && (hasPBRMaterials || usesDefaultMaterial)) {
            await this.resetEnvironment({ lighting: true }, abortSignal);
        }

        this._startSceneOptimizer(true);
    }

    protected async _updateShadows() {
        this._shadowsAbortController?.abort(new AbortError("Shadows quality is being changed before previous shadows finished initializing."));
        const abortController = (this._shadowsAbortController = new AbortController());

        await this._updateShadowsLock.lockAsync(async () => {
            if (this._shadowQuality === "none") {
                this._disposeShadows();
            } else {
                // make sure there is an env light before creating shadows
                if (!this._reflectionTexture) {
                    await this.loadEnvironment("auto", { lighting: true, skybox: false });
                }

                if (this._shadowQuality === "normal") {
                    await this._updateShadowMap(abortController.signal);
                } else if (this._shadowQuality === "high") {
                    await this._updateEnvShadow(abortController.signal);
                }
            }
        });
    }

    private _changeShadowLightIntensity() {
        if (this._shadowState.high) {
            this._shadowState.high.pipeline.resetAccumulation();
            this._startIblShadowsRenderTime();
        }
    }

    private _rotateShadowLightWithEnvironment(): void {
        if (this._shadowQuality === "normal" && this._shadowState.normal) {
            if (this._shadowState.normal.light) {
                this._shadowState.normal.refreshLightPositionDirection(this._reflectionsRotation);
            }
        } else if (this._shadowQuality === "high" && this._shadowState.high) {
            this._shadowState.high.pipeline?.resetAccumulation();
            this._startIblShadowsRenderTime();
        }
    }

    // maybe move this into shadow state
    private _startIblShadowsRenderTime() {
        if (this._shadowState.high) {
            if (this._shadowState.high.renderTimer != null) {
                clearTimeout(this._shadowState.high.renderTimer);
            } else {
                // Only disable if a timeout is not pending, otherwise it has already been called without a paired enable call.
                this._snapshotHelper?.disableSnapshotRendering();
            }

            this._shadowState.high.shouldRender = true;
            const onRenderTimeout = () => {
                if (this._shadowState.high) {
                    this._shadowState.high.shouldRender = false;
                    this._shadowState.high.renderTimer = null;
                }
                this._snapshotHelper?.enableSnapshotRendering();
            };
            this._shadowState.high.renderTimer = setTimeout(
                onRenderTimeout,
                // based on the shadow remanence as we can't estimate the time it takes to accumulate the shadows
                this._shadowState.high.pipeline.shadowRemanence * 4000
            );
        }
    }

    private async _updateEnvShadow(abortSignal?: AbortSignal) {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const [{ ShaderMaterial }, { ShaderLanguage }, { CreateDisc }, { IblShadowsRenderPipeline }] = await Promise.all([
            import("core/Materials/shaderMaterial"),
            import("core/Materials/shaderLanguage"),
            import("core/Meshes/Builders/discBuilder"),
            import("core/Rendering/IBLShadows/iblShadowsRenderPipeline"),
            import("core/Engines/Extensions/engine.multiRender"),
            import("core/Engines/WebGPU/Extensions/engine.multiRender"),
            import("core/PostProcesses/RenderPipeline/postProcessRenderPipelineManagerSceneComponent"),
        ]);

        // cancel if the model is unloaded before the shadows are created
        this._throwIfDisposedOrAborted(abortSignal, this._loadModelAbortController?.signal, this._loadEnvironmentAbortController?.signal);

        let high = this._shadowState.high;

        const worldBounds = computeModelsBoundingInfos(this._loadedModelsBacking);
        if (!worldBounds) {
            high?.ground.setEnabled(false);
            this._log("No models loaded, cannot create shadows.");
            return;
        }

        const groundFactor = 4;
        const radius = Vector3.FromArray(worldBounds.size).length();
        const groundSize = groundFactor * radius;

        const updateMaterial = () => {
            if (this._shadowState.high) {
                this._snapshotHelper?.disableSnapshotRendering();
                const { pipeline, groundMaterial, ground } = this._shadowState.high;
                groundMaterial?.setVector2("renderTargetSize", new Vector2(this._scene.getEngine().getRenderWidth(), this._scene.getEngine().getRenderHeight()));
                groundMaterial?.setFloat("shadowOpacity", pipeline.shadowOpacity);
                groundMaterial?.setTexture("shadowTexture", pipeline._getAccumulatedTexture());
                const groundSize = groundFactor * pipeline?.voxelGridSize;
                ground?.scaling.set(groundSize, groundSize, groundSize);
                this._snapshotHelper?.enableSnapshotRendering();
                this._markSceneMutated();
            }
        };

        this._snapshotHelper?.disableSnapshotRendering();
        if (!high) {
            const pipeline = new IblShadowsRenderPipeline(
                "ibl shadows",
                this._scene,
                {
                    resolutionExp: 6,
                    sampleDirections: 3,
                    ssShadowsEnabled: true,
                    shadowRemanence: 0.7,
                    triPlanarVoxelization: true,
                },
                [this._camera]
            );

            pipeline.toggleShadow(false);

            // Useful for debugging, but not needed in production
            // pipeline.allowDebugPasses = false;
            // pipeline.gbufferDebugEnabled = false;
            // pipeline.voxelDebugEnabled = false;
            // pipeline.accumulationPassDebugEnabled = false;

            const isWebGPU = this._scene.getEngine().isWebGPU;
            const shaderLanguage = isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL;
            const options = {
                attributes: ["position", "uv"],
                uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "renderTargetSize", "shadowOpacity"],
                samplers: ["shadowTexture"],
                shaderLanguage,
                extraInitializationsAsync: async () => {
                    if (shaderLanguage === ShaderLanguage.WGSL) {
                        await Promise.all([import("./ShadersWGSL/envShadowGround.vertex"), import("./ShadersWGSL/envShadowGround.fragment")]);
                    } else {
                        await Promise.all([import("./Shaders/envShadowGround.vertex"), import("./Shaders/envShadowGround.fragment")]);
                    }
                },
            };

            const groundMaterial = new ShaderMaterial("envShadowGroundMaterial", this._scene, "envShadowGround", options);
            groundMaterial.alphaMode = Constants.ALPHA_MULTIPLY;
            groundMaterial.alpha = 0.99;

            updateMaterial();

            pipeline.onShadowTextureReadyObservable.addOnce(updateMaterial);

            const resizeObserver = this._engine.onResizeObservable.add(() => {
                updateMaterial();
                pipeline?.resetAccumulation();
                this._startIblShadowsRenderTime();
            });

            this._camera.onViewMatrixChangedObservable.add(() => {
                this._startIblShadowsRenderTime();
            });

            const ground = CreateDisc("envShadowGround", { radius: groundSize, tessellation: 64 }, this._scene);
            ground.setEnabled(false);
            ground.rotation.x = Math.PI / 2;
            ground.position.y = worldBounds.extents.min[1];
            ground.material = groundMaterial;

            high = {
                pipeline: pipeline,
                groundMaterial: groundMaterial,
                resizeObserver: resizeObserver,
                shouldRender: true,
                ground: ground,
            };
        }

        // Remove previous meshes and materials.
        high.pipeline.clearShadowCastingMeshes();
        high.pipeline.clearShadowReceivingMaterials();

        for (const model of this._loadedModelsBacking) {
            const meshes = model.assetContainer.meshes;
            for (const mesh of meshes) {
                if (mesh instanceof Mesh) {
                    high.pipeline.addShadowCastingMesh(mesh);
                    if (mesh.material) {
                        high.pipeline.addShadowReceivingMaterial(mesh.material);
                    }
                }
            }
        }

        high.pipeline.onVoxelizationCompleteObservable.addOnce(() => {
            this._snapshotHelper?.disableSnapshotRendering();
            updateMaterial();
            high.pipeline.toggleShadow(true);
            high.ground.setEnabled(true);
            this._snapshotHelper?.enableSnapshotRendering();
            this._markSceneMutated();
        });

        high.ground.position.y = worldBounds.extents.min[1];

        // call the update now because a model might be loaded before the shadows are created
        high.pipeline.updateSceneBounds();
        high.pipeline.updateVoxelization();
        high.pipeline.resetAccumulation();
        // shadow map
        this._shadowState.normal?.ground.setEnabled(false);
        this._startIblShadowsRenderTime();

        this._shadowState.high = high;

        this._snapshotHelper?.enableSnapshotRendering();
        this._markSceneMutated();
    }

    /**
     * Finds the light direction the environment (IBL).
     * If the environment changes, it will explicitly trigger the generation of CDF maps.
     * @param iblCdfGenerator The IblCdfGenerator to use for finding the dominant direction.
     * @returns A promise that resolves to the dominant direction vector.
     */
    private async _findIblDominantDirection(iblCdfGenerator: IblCdfGenerator): Promise<Vector3> {
        if (this._reflectionTexture && iblCdfGenerator.iblSource !== this._reflectionTexture) {
            iblCdfGenerator.iblSource = this._reflectionTexture;
            await iblCdfGenerator.renderWhenReady();
        }
        return await iblCdfGenerator.findDominantDirection();
    }

    private async _updateShadowMap(abortSignal?: AbortSignal) {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const [{ CreateDisc }, { RenderTargetTexture }, { ShadowGenerator }, { IblCdfGenerator }] = await Promise.all([
            import("core/Meshes/Builders/discBuilder"),
            import("core/Materials/Textures/renderTargetTexture"),
            import("core/Lights/Shadows/shadowGenerator"),
            import("core/Rendering/iblCdfGenerator"),
            import("core/Rendering/iblCdfGeneratorSceneComponent"),
            import("core/Lights/Shadows/shadowGeneratorSceneComponent"),
        ]);

        // cancel if the model is unloaded before the shadows are created
        this._throwIfDisposedOrAborted(abortSignal, this._loadModelAbortController?.signal, this._loadEnvironmentAbortController?.signal);

        let normal = this._shadowState.normal;

        const worldBounds = computeModelsBoundingInfos(this._loadedModelsBacking);
        if (!worldBounds) {
            normal?.ground.setEnabled(false);
            this._log("No models loaded, cannot create shadows.");
            return;
        }

        const radius = Vector3.FromArray(worldBounds.size).length();

        if (this._shadowQuality !== "normal") {
            return;
        }

        const iblCdfGenerator = normal?.iblDirection.iblCdfGenerator ? normal?.iblDirection.iblCdfGenerator : new IblCdfGenerator(this._engine);
        const iblDirection = await this._findIblDominantDirection(iblCdfGenerator);
        this._throwIfDisposedOrAborted(abortSignal, this._loadModelAbortController?.signal, this._loadEnvironmentAbortController?.signal);

        this._snapshotHelper?.disableSnapshotRendering();

        const size = 4096;
        const groundFactor = 20;
        const groundSize = radius * groundFactor;
        const positionFactor = radius * 3;
        const iblLightStrength = iblDirection ? Clamp(iblDirection.length(), 0.0, 1.0) : 0.5;

        if (!normal) {
            const light = new DirectionalLight("shadowMapDirectionalLight", Vector3.Zero(), this._scene);
            light.autoUpdateExtends = false;

            const generator = new ShadowGenerator(size, light);
            generator.setDarkness(Lerp(0.8, 0.2, iblLightStrength));
            generator.setTransparencyShadow(true);
            generator.filteringQuality = ShadowGenerator.QUALITY_HIGH;
            generator.useBlurExponentialShadowMap = true;
            generator.enableSoftTransparentShadow = true;
            generator.bias = radius / 1000;
            generator.useKernelBlur = true;
            generator.blurKernel = Math.floor(Lerp(64, 8, iblLightStrength));

            const shadowMap = generator.getShadowMap();
            if (shadowMap) {
                shadowMap.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONEVERYFRAME;
                shadowMap.renderList = this._scene.meshes.slice();
            }

            const shadowMaterial = new BackgroundMaterial("shadowMapGroundMaterial", this._scene);
            shadowMaterial.shadowOnly = true;
            shadowMaterial.primaryColor = Color3.Black();

            const ground = CreateDisc("shadowMapGround", { radius: groundSize, tessellation: 64 }, this._scene);
            ground.rotation.x = Math.PI / 2;
            ground.receiveShadows = true;
            ground.position.y = worldBounds.extents.min[1];
            ground.material = shadowMaterial;

            const newNormal: ShadowState["normal"] = (normal = {
                light: light,
                generator: generator,
                ground: ground,
                shouldRender: true,
                iblDirection: {
                    iblCdfGenerator: iblCdfGenerator,
                    positionFactor: positionFactor,
                    direction: iblDirection,
                },
                refreshLightPositionDirection(reflectionRotation: number) {
                    let effectiveSourceDir = this.iblDirection.direction.normalizeToNew();

                    if (this.light.getScene().useRightHandedSystem) {
                        effectiveSourceDir.z *= -1;
                    }

                    const rotationYMatrix = Matrix.RotationY(reflectionRotation * -1);
                    effectiveSourceDir = Vector3.TransformCoordinates(effectiveSourceDir, rotationYMatrix);

                    this.light.position = effectiveSourceDir.scale(this.iblDirection.positionFactor);
                    this.light.direction = adjustLightTargetDirection(effectiveSourceDir.negate());
                },
            });

            await new Promise((resolve, reject) => {
                _RetryWithInterval(
                    () => shadowMap!.isReadyForRendering(),
                    () => resolve(void 0),
                    () => reject(new Error("Failed to get shadow map generator ready"))
                );
            });

            // Since the light is not applied to the meshes of the model (we only want shadows, not lighting),
            // the ShadowGenerator's isReady will think everything is ready before it actually is. To account
            // for this, explicitly wait for the first shadow map render to consider shadows in a ready state.
            generator.onAfterShadowMapRenderObservable.addOnce(() => {
                newNormal.shouldRender = false;
            });
        }

        normal.iblDirection.direction = iblDirection;
        normal.iblDirection.positionFactor = positionFactor;
        normal.refreshLightPositionDirection(this._reflectionsRotation);
        normal.light.shadowFrustumSize = radius * 4;

        for (const model of this._loadedModelsBacking) {
            for (const mesh of model.assetContainer.meshes) {
                normal.generator.addShadowCaster(mesh, false);
                mesh.receiveShadows = true;
            }
        }

        normal.ground.position.y = worldBounds.extents.min[1];
        normal.ground.scaling.set(groundSize, groundSize, groundSize);

        this._shadowState.high?.ground.setEnabled(false);
        this._shadowState.high?.pipeline.toggleShadow(false);
        normal.ground.setEnabled(true);

        this._shadowState.normal = normal;

        this._snapshotHelper?.enableSnapshotRendering();
        this._markSceneMutated();
    }

    private _disposeShadows() {
        this._snapshotHelper?.disableSnapshotRendering();

        if (!this._shadowState) {
            return;
        }

        for (const model of this._loadedModelsBacking) {
            const meshes = model.assetContainer.meshes;

            const mesh = model.assetContainer.meshes[0];
            this._shadowState.normal?.generator.removeShadowCaster(mesh, true);
            mesh.receiveShadows = false;

            for (const mesh of meshes) {
                if (mesh instanceof Mesh) {
                    this._shadowState.high?.pipeline.removeShadowCastingMesh(mesh);
                    if (mesh.material) {
                        this._shadowState.high?.pipeline.removeShadowReceivingMaterial(mesh.material);
                    }
                }
            }
        }

        const highShadow = this._shadowState.high;
        const normalShadow = this._shadowState.normal;

        if (normalShadow) {
            normalShadow.generator.dispose();
            normalShadow.light.dispose();
            normalShadow.ground.dispose(true, true);
            normalShadow.iblDirection.iblCdfGenerator.dispose();
            this._scene.removeMesh(normalShadow.ground);
        }

        if (highShadow) {
            highShadow.resizeObserver.remove();
            highShadow.pipeline.dispose();
            highShadow.ground.dispose(true, true);
            this._scene.removeMesh(highShadow.ground);
            if (highShadow.renderTimer) {
                clearTimeout(highShadow.renderTimer);
            }
        }

        delete this._shadowState.normal;
        delete this._shadowState.high;
        this.onShadowsConfigurationChanged.clear();

        this._snapshotHelper?.enableSnapshotRendering();
        this._markSceneMutated();
    }

    /**
     * Loads an environment texture from the specified url and sets up a corresponding skybox.
     * @remarks
     * If an environment is already loaded, it will be unloaded before loading the new environment.
     * @param url The url of the environment texture to load.
     * @param options The options to use when loading the environment.
     * @param abortSignal An optional signal that can be used to abort the loading process.
     */
    public async loadEnvironment(url: string, options?: LoadEnvironmentOptions, abortSignal?: AbortSignal): Promise<void> {
        await this._updateEnvironment(url, options, abortSignal);
    }

    /**
     * Resets the environment to its default state.
     * @param options The options to use when resetting the environment.
     * @param abortSignal An optional signal that can be used to abort the reset.
     */
    public async resetEnvironment(options?: EnvironmentOptions, abortSignal?: AbortSignal): Promise<void> {
        const promises: Promise<void>[] = [];
        // When there are PBR materials, the default environment should be used for lighting.
        if (options?.lighting && this._scene.materials.some((material) => material instanceof PBRMaterial)) {
            const lightingOptions = { ...options, skybox: false };
            options = { ...options, lighting: false };
            promises.push(this._updateEnvironment("auto", lightingOptions, abortSignal));
        }

        promises.push(this._updateEnvironment(undefined, options, abortSignal));
        await Promise.all(promises);
    }

    private _setEnvironmentLighting(cubeTexture: CubeTexture | HDRCubeTexture): void {
        this._reflectionTexture = cubeTexture;
        this._scene.environmentTexture = this._reflectionTexture;
        this._reflectionTexture.level = this.environmentConfig.intensity;
        this._reflectionTexture.rotationY = this.environmentConfig.rotation;
    }

    private _setEnvironmentSkybox(cubeTexture: CubeTexture | HDRCubeTexture): void {
        this._skyboxTexture = cubeTexture;
        this._skyboxTexture.level = this.environmentConfig.intensity;
        this._skyboxTexture.rotationY = this.environmentConfig.rotation;
        this._skybox = createSkybox(this._scene, this._camera, this._skyboxTexture, this.environmentConfig.blur);
        this._skybox.setEnabled(true);
        this._snapshotHelper?.fixMeshes([this._skybox]);
        this._updateAutoClear();
    }

    private async _updateEnvironment(url: Nullable<string | undefined>, options: LoadEnvironmentOptions = defaultLoadEnvironmentOptions, abortSignal?: AbortSignal): Promise<void> {
        this._throwIfDisposedOrAborted(abortSignal);

        if (!options.lighting && !options.skybox) {
            return;
        }

        url = url?.trim();
        if (url === "auto") {
            options = { ...options, extension: ".env" };
        }

        this._loadEnvironmentAbortController?.abort(new AbortError("New environment is being loaded before previous environment finished loading."));
        const loadEnvironmentAbortController = (this._loadEnvironmentAbortController = new AbortController());

        await this._loadEnvironmentLock.lockAsync(async () => {
            throwIfAborted(abortSignal, loadEnvironmentAbortController.signal);

            const getDefaultEnvironmentUrlAsync = async () => (await import("./defaultEnvironment")).default;

            const whenTextureLoadedAsync = async (cubeTexture: CubeTexture | HDRCubeTexture) => {
                await new Promise<void>((resolve, reject) => {
                    const successObserver = (cubeTexture.onLoadObservable as Observable<unknown>).addOnce(() => {
                        errorObserver.remove();
                        resolve();
                    });

                    const errorObserver = Texture.OnTextureLoadErrorObservable.add((texture) => {
                        if (texture === cubeTexture) {
                            successObserver.remove();
                            errorObserver.remove();
                            reject(new Error("Failed to load environment texture."));
                        }
                    });
                });
            };

            const mode: EnvironmentMode = !url ? "none" : url === "auto" ? "auto" : "url";

            this._environmentLightingMode = options.lighting ? mode : this._environmentLightingMode;
            this._environmentSkyboxMode = options.skybox ? mode : this._environmentSkyboxMode;

            let lightingUrl: Nullable<string | undefined> = this._reflectionTexture?.url;
            let skyboxUrl: Nullable<string | undefined> = this._skyboxTexture?.url;

            this._snapshotHelper?.disableSnapshotRendering();

            try {
                // If both modes are auto, use the default environment.
                if (this._environmentLightingMode === "auto" && this._environmentSkyboxMode === "auto") {
                    lightingUrl = skyboxUrl = await getDefaultEnvironmentUrlAsync();
                } else {
                    // If the lighting mode is not auto and we are updating the lighting, use the provided url.
                    if (this._environmentLightingMode !== "auto" && options.lighting) {
                        lightingUrl = url;
                    }

                    // If the skybox mode is not auto and we are updating the skybox, use the provided url.
                    if (this._environmentSkyboxMode !== "auto" && options.skybox) {
                        skyboxUrl = url;
                    }

                    // If the lighting mode is auto, use the skybox texture if there is one, otherwise use the default environment.
                    if (this._environmentLightingMode === "auto") {
                        lightingUrl = skyboxUrl ?? (await getDefaultEnvironmentUrlAsync());
                    }

                    // If the skybox mode is auto, use the lighting texture if there is one, otherwise use the default environment.
                    if (this._environmentSkyboxMode === "auto") {
                        skyboxUrl = lightingUrl ?? (await getDefaultEnvironmentUrlAsync());
                    }
                }

                const newTexturePromises: Promise<void>[] = [];

                // If the lighting url is not the same as the current lighting url, load the new lighting texture.
                if (lightingUrl !== this._reflectionTexture?.url) {
                    // Dispose the existing lighting texture if it exists.
                    this._reflectionTexture?.dispose();
                    this._reflectionTexture = null;
                    this._scene.environmentTexture = null;

                    // Load the new lighting texture if there is a target url.
                    if (lightingUrl) {
                        if (lightingUrl === this._skyboxTexture?.url) {
                            // If the lighting url is the same as the skybox url, clone the skybox texture.
                            this._setEnvironmentLighting(this._skyboxTexture.clone());
                        } else {
                            // Otherwise, create a new cube texture from the lighting url.
                            const lightingTexture = await createCubeTexture(lightingUrl, this._scene, options.extension);
                            newTexturePromises.push(whenTextureLoadedAsync(lightingTexture));
                            this._setEnvironmentLighting(lightingTexture);
                        }
                    }
                }

                // If the skybox url is not the same as the current skybox url, load the new skybox texture.
                if (skyboxUrl !== this._skyboxTexture?.url) {
                    // Dispose the existing skybox texture if it exists.
                    this._skybox?.dispose(undefined, true);
                    this._skyboxTexture = null;
                    this._skybox = null;
                    this._updateAutoClear();

                    // Load the new skybox texture if there is a target url.
                    if (skyboxUrl) {
                        if (skyboxUrl === this._reflectionTexture?.url) {
                            // If the skybox url is the same as the lighting url, clone the lighting texture.
                            this._setEnvironmentSkybox(this._reflectionTexture.clone());
                        } else {
                            // Otherwise, create a new cube texture from the skybox url.
                            const skyboxTexture = await createCubeTexture(skyboxUrl, this._scene, options.extension);
                            newTexturePromises.push(whenTextureLoadedAsync(skyboxTexture));
                            this._setEnvironmentSkybox(skyboxTexture);
                        }
                    }
                }

                await Promise.all(newTexturePromises);

                this._updateLight();
                observePromise(this._updateShadows());
                this.onEnvironmentChanged.notifyObservers();
            } catch (e) {
                this.onEnvironmentError.notifyObservers(e);
                throw e;
            } finally {
                this._snapshotHelper?.enableSnapshotRendering();
                this._markSceneMutated();
            }
        });
    }

    /**
     * Toggles the play/pause animation state if there is a selected animation.
     */
    public toggleAnimation() {
        if (this.isAnimationPlaying) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this.pauseAnimation();
        } else {
            this.playAnimation();
        }
    }

    /**
     * Plays the selected animation if there is one.
     */
    public playAnimation() {
        this._activeAnimation?.play(true);
    }

    /**
     * Pauses the selected animation if there is one.
     */
    public async pauseAnimation() {
        this._activeAnimation?.pause();
    }

    /**
     * Resets the camera to its initial pose.
     * @param reframe If true, the camera will be reframed to fit the model bounds. If false, it will use the default camera pose passed in with the options to the constructor (if present).
     *                If undefined, default to false if other viewer state matches the default state (such as the selected animation), otherwise true.
     */
    public resetCamera(reframe?: boolean): void {
        if (reframe == undefined) {
            // If the selected animation is different from the default, there is a good chance the default explicit camera framing won't make sense
            // and the model may not even be in view. So when this is the case, by default we reframe the camera.
            reframe = this.selectedAnimation !== (this._options?.selectedAnimation ?? 0);
        }

        if (reframe) {
            this._reframeCamera(true);
        } else {
            this._reset(true, "camera");
        }
    }

    /**
     * Updates the camera pose.
     * @param pose The new pose of the camera.
     * @remarks Any unspecified values are left unchanged.
     */
    public updateCamera(pose: { alpha?: number; beta?: number; radius?: number; targetX?: number; targetY?: number; targetZ?: number }): void {
        // undefined means default for _resetCameraFromBounds, so convert to NaN if needed.
        this._reframeCameraFromBounds(
            true,
            this._loadedModels,
            pose.alpha ?? NaN,
            pose.beta ?? NaN,
            pose.radius ?? NaN,
            pose.targetX ?? NaN,
            pose.targetY ?? NaN,
            pose.targetZ ?? NaN
        );
    }

    /**
     * Resets the viewer to its initial state based on the options passed in to the constructor.
     * @param flags The flags that specify which parts of the viewer to reset. If no flags are provided, all parts will be reset.
     * - "source": Reset the loaded model.
     * - "environment": Reset environment related state.
     * - "animation": Reset animation related state.
     * - "camera": Reset camera related state.
     * - "post-processing": Reset post-processing related state.
     * - "material-variant": Reset material variant related state.
     */
    public reset(...flags: ResetFlag[]) {
        this._reset(true, ...flags);
    }

    private _reset(interpolate: boolean, ...flags: ResetFlag[]) {
        if (flags.length === 0 || flags.includes("source")) {
            observePromise(this._updateModel(this._options?.source));
        }

        if (flags.length === 0 || flags.includes("environment")) {
            this._scene.clearColor = new Color4(...(this._options?.clearColor ?? DefaultViewerOptions.clearColor));
            this.environmentConfig = {
                intensity: this._options?.environmentConfig?.intensity ?? DefaultViewerOptions.environmentConfig.intensity,
                blur: this._options?.environmentConfig?.blur ?? DefaultViewerOptions.environmentConfig.blur,
                rotation: this._options?.environmentConfig?.rotation ?? DefaultViewerOptions.environmentConfig.rotation,
            };

            if (this._options?.environmentLighting === this._options?.environmentSkybox) {
                observePromise(this._updateEnvironment(this._options?.environmentLighting, { lighting: true, skybox: true }));
            } else {
                observePromise(this._updateEnvironment(this._options?.environmentLighting, { lighting: true }));
                observePromise(this._updateEnvironment(this._options?.environmentSkybox, { skybox: true }));
            }
        }

        if (flags.length === 0 || flags.includes("shadow")) {
            this._shadowQuality = this._options?.shadowConfig?.quality ?? DefaultViewerOptions.shadowConfig.quality;
            observePromise(this.updateShadows({ quality: this._shadowQuality }));
        }

        if (flags.length === 0 || flags.includes("animation")) {
            this.animationSpeed = this._options?.animationSpeed ?? DefaultViewerOptions.animationSpeed;
            this.selectedAnimation = this._options?.selectedAnimation ?? 0;
            if (this._options?.animationAutoPlay) {
                this.playAnimation();
            } else {
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                this.pauseAnimation();
            }
        }

        if (flags.length === 0 || flags.includes("camera")) {
            // In the case of resetting the camera, we always want to restore default states, so convert NaN to undefined.
            const alpha = Number(this._options?.cameraOrbit?.[0]);
            const beta = Number(this._options?.cameraOrbit?.[1]);
            const radius = Number(this._options?.cameraOrbit?.[2]);
            const targetX = Number(this._options?.cameraTarget?.[0]);
            const targetY = Number(this._options?.cameraTarget?.[1]);
            const targetZ = Number(this._options?.cameraTarget?.[2]);
            this._reframeCameraFromBounds(
                interpolate,
                this._loadedModels,
                isNaN(alpha) ? undefined : alpha,
                isNaN(beta) ? undefined : beta,
                isNaN(radius) ? undefined : radius,
                isNaN(targetX) ? undefined : targetX,
                isNaN(targetY) ? undefined : targetY,
                isNaN(targetZ) ? undefined : targetZ
            );
            this.cameraAutoOrbit = {
                enabled: this._options?.cameraAutoOrbit?.enabled ?? DefaultViewerOptions.cameraAutoOrbit.enabled,
                speed: this._options?.cameraAutoOrbit?.speed ?? DefaultViewerOptions.cameraAutoOrbit.speed,
                delay: this._options?.cameraAutoOrbit?.delay ?? DefaultViewerOptions.cameraAutoOrbit.delay,
            };
        }

        if (flags.length === 0 || flags.includes("post-processing")) {
            this.postProcessing = {
                toneMapping: this._options?.postProcessing?.toneMapping ?? DefaultViewerOptions.postProcessing.toneMapping,
                contrast: this._options?.postProcessing?.contrast ?? DefaultViewerOptions.postProcessing.contrast,
                exposure: this._options?.postProcessing?.exposure ?? DefaultViewerOptions.postProcessing.exposure,
                ssao: this._options?.postProcessing?.ssao ?? DefaultViewerOptions.postProcessing.ssao,
            };
        }

        if (flags.length === 0 || flags.includes("material-variant")) {
            this.selectedMaterialVariant = this._options?.selectedMaterialVariant ?? null;
        }
    }

    /**
     * Disposes of the resources held by the Viewer.
     */
    public dispose(): void {
        this.selectedAnimation = -1;
        this.animationProgress = 0;

        this._loadEnvironmentAbortController?.abort(new AbortError("Thew viewer is being disposed."));
        this._loadModelAbortController?.abort(new AbortError("Thew viewer is being disposed."));
        this._camerasAsHotSpotsAbortController?.abort(new AbortError("Thew viewer is being disposed."));
        this._shadowsAbortController?.abort(new AbortError("Thew viewer is being disposed."));
        this._ssaoAbortController?.abort(new AbortError("Thew viewer is being disposed."));

        this._renderLoopController?.dispose();
        this._activeModel?.dispose();
        this._loadedModelsBacking.forEach((model) => model.dispose());
        this._disposeShadows();
        this._scene.dispose();

        this.onEnvironmentChanged.clear();
        this.onEnvironmentError.clear();
        this.onEnvironmentConfigurationChanged.clear();
        this.onPostProcessingChanged.clear();
        this.onModelChanged.clear();
        this.onModelError.clear();
        this.onCameraAutoOrbitChanged.clear();
        this.onSelectedAnimationChanged.clear();
        this.onAnimationSpeedChanged.clear();
        this.onIsAnimationPlayingChanged.clear();
        this.onAnimationProgressChanged.clear();
        this.onSelectedMaterialVariantChanged.clear();
        this.onHotSpotsChanged.clear();
        this.onCamerasAsHotSpotsChanged.clear();
        this.onLoadingProgressChanged.clear();

        this._imageProcessingConfigurationObserver.remove();
        this._beforeRenderObserver?.remove();
        this._snapshotHelper?.dispose();

        this._isDisposed = true;
    }

    /**
     * Return world and canvas coordinates of an hot spot.
     * @param query mesh index and surface information to query the hot spot positions.
     * @param result Query a Hot Spot and does the conversion for Babylon Hot spot to a more generic HotSpotPositions, without Vector types.
     * @returns true if hotspot found.
     */
    public getHotSpotToRef(query: Readonly<ViewerHotSpotQuery>, result: ViewerHotSpotResult): boolean {
        return this._getHotSpotToRef(
            this._loadedModels.flatMap((model) => model.assetContainer.meshes),
            query,
            result
        );
    }

    protected _getHotSpotToRef(
        ...args: [...([assetContainer: Nullable<AssetContainer>] | [meshes: Nullable<AbstractMesh[]>]), query: Readonly<ViewerHotSpotQuery>, result: ViewerHotSpotResult]
    ): boolean {
        const [meshesOrAssetContainer, query, result] = args;
        const meshes = Array.isArray(meshesOrAssetContainer) ? meshesOrAssetContainer : meshesOrAssetContainer?.meshes;
        const worldNormal = this._tempVectors[2];
        const worldPos = this._tempVectors[1];
        const screenPos = this._tempVectors[0];

        if (query.type === "surface") {
            const mesh = meshes?.[query.meshIndex];
            if (!mesh) {
                return false;
            }

            if (!GetHotSpotToRef(mesh, query, worldPos, worldNormal)) {
                return false;
            }
        } else {
            worldPos.copyFromFloats(query.position[0], query.position[1], query.position[2]);
            worldNormal.copyFromFloats(query.normal[0], query.normal[1], query.normal[2]);
        }

        const viewportWidth = this._camera.viewport.width * this._engine.getRenderWidth() * this._engine.getHardwareScalingLevel();
        const viewportHeight = this._camera.viewport.height * this._engine.getRenderHeight() * this._engine.getHardwareScalingLevel();
        const scene = this._scene;

        Vector3.ProjectToRef(worldPos, Matrix.IdentityReadOnly, scene.getTransformMatrix(), new Viewport(0, 0, viewportWidth, viewportHeight), screenPos);
        result.screenPosition[0] = screenPos.x;
        result.screenPosition[1] = screenPos.y;
        result.worldPosition[0] = worldPos.x;
        result.worldPosition[1] = worldPos.y;
        result.worldPosition[2] = worldPos.z;

        // visibility
        const eyeToSurface = this._tempVectors[3];
        eyeToSurface.copyFrom(this._camera.globalPosition);
        eyeToSurface.subtractInPlace(worldPos);
        eyeToSurface.normalize();
        result.visibility = Vector3.Dot(eyeToSurface, worldNormal);

        return true;
    }

    /**
     * Get hotspot world and screen values from a named hotspot.
     * @param name slot of the hot spot.
     * @param result resulting world and screen positions.
     * @returns world position, world normal and screen space coordinates.
     */
    public queryHotSpot(name: string, result: ViewerHotSpotResult): boolean {
        return this._queryHotSpot(name, result) != null;
    }

    /**
     * Updates the camera to focus on a named hotspot.
     * @param name The name of the hotspot to focus on.
     * @returns true if the hotspot was found and the camera was updated, false otherwise.
     */
    public focusHotSpot(name: string): boolean {
        const result = new ViewerHotSpotResult();
        const query = this._queryHotSpot(name, result);
        if (query) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this.pauseAnimation();
            const cameraOrbit = query.cameraOrbit ?? [undefined, undefined, undefined];
            this._camera.interpolateTo(cameraOrbit[0], cameraOrbit[1], cameraOrbit[2], new Vector3(result.worldPosition[0], result.worldPosition[1], result.worldPosition[2]));
            return true;
        }
        return false;
    }

    private _queryHotSpot(name: string, result: ViewerHotSpotResult): Nullable<HotSpot> {
        const hotSpot = this.hotSpots?.[name];
        if (hotSpot) {
            if (this.getHotSpotToRef(hotSpot, result)) {
                return hotSpot;
            }
        }
        return null;
    }

    private async _addCameraHotSpot(camera: Camera, signal?: AbortSignal) {
        if (camera !== this._camera) {
            const hotSpot = await this._createHotSpotFromCamera(camera);
            if (hotSpot && !signal?.aborted) {
                this.hotSpots = {
                    ...this.hotSpots,
                    [`camera-${camera.name}`]: hotSpot,
                };
            }
        }
    }

    private _removeCameraHotSpot(camera: Camera) {
        delete this.hotSpots[`camera-${camera.name}`];
        this.hotSpots = { ...this.hotSpots };
    }

    private _toggleCamerasAsHotSpots() {
        if (!this.camerasAsHotSpots) {
            this._camerasAsHotSpotsAbortController?.abort();
            this._camerasAsHotSpotsAbortController = null;
            this._scene.cameras.forEach((camera) => this._removeCameraHotSpot(camera));
        } else {
            const abortController = (this._camerasAsHotSpotsAbortController = new AbortController());
            this._scene.cameras.forEach(async (camera) => await this._addCameraHotSpot(camera, abortController.signal));
        }
    }

    /**
     * Creates a world HotSpot from a camera.
     * @param camera The camera to create a HotSpot from.
     * @returns A HotSpot created from the camera.
     */
    private async _createHotSpotFromCamera(camera: Camera): Promise<Nullable<HotSpot>> {
        if (camera instanceof ArcRotateCamera) {
            const targetArray = camera.target.asArray();
            return { type: "world", position: targetArray, normal: targetArray, cameraOrbit: [camera.alpha, camera.beta, camera.radius] };
        }

        if (this._activeModel) {
            return await CreateHotSpotFromCamera(this._activeModel, camera);
        }

        return null;
    }

    protected get _shouldRender() {
        // We should render if:
        // 1. Auto suspend rendering is disabled.
        // 2. The scene has been mutated.
        // 3. The snapshot helper is not yet in a ready state.
        // 4. The classic shadows are not yet in a ready state.
        // 5. The environment shadows are not yet in a ready state.
        // 6. The SSAO pipeline is not yet in a ready state.
        // 7. At least one model should render (playing animations).
        return (
            !this._autoSuspendRendering ||
            this._sceneMutated ||
            this._snapshotHelper?.isReady === false ||
            this._shadowState.normal?.shouldRender ||
            this._shadowState.high?.shouldRender ||
            this._ssaoPipeline?.isReady() === false ||
            this._loadedModelsBacking.some((model) => model._shouldRender())
        );
    }

    protected _markSceneMutated() {
        this._sceneMutated = true;
    }

    protected _suspendRendering(): IDisposable {
        this._renderLoopController?.dispose();
        this._suspendRenderCount++;
        let disposed = false;
        return {
            dispose: () => {
                if (!disposed) {
                    disposed = true;
                    this._suspendRenderCount--;
                    if (this._suspendRenderCount === 0) {
                        this._beginRendering();
                    }
                }
            },
        };
    }

    private _beginRendering(): void {
        if (!this._renderLoopController) {
            let renderedReadyFrame = false;

            const onRenderingResumed = () => {
                this._log("Viewer Resumed Rendering");
                // Resume rendering with the hardware scaling level from prior to suspending.
                this._engine.setHardwareScalingLevel(this._lastHardwareScalingLevel);
                this._engine.performanceMonitor.enable();
                this._snapshotHelper?.enableSnapshotRendering();
                this._startSceneOptimizer();
            };

            const onRenderingSuspended = () => {
                this._log("Viewer Suspended Rendering");
                this._renderedLastFrame = false;
                renderedReadyFrame = false;
                // Take note of the current hardware scaling level for when rendering is resumed.
                this._lastHardwareScalingLevel = this._engine.getHardwareScalingLevel();
                this._stopSceneOptimizer();
                this._snapshotHelper?.disableSnapshotRendering();
                // We want a high quality render right before suspending, so set the hardware scaling level back to the default,
                // disable the performance monitor (so the SceneOptimizer doesn't take into account this potentially slower frame),
                // and then render the scene once.
                this._engine.performanceMonitor.disable();
                this._engine.setHardwareScalingLevel(this._defaultHardwareScalingLevel);
                this._engine.beginFrame();
                this._scene.render();
                this._engine.endFrame();
            };

            const render = () => {
                // First check if we have indicators that we should render.
                let shouldRender = this._shouldRender;

                // If we don't have indicators that we should render (e.g. nothing has changed since the last frame),
                // we still need to ensure that we render at least one frame after any mutations. Scene.isReady does
                // a bunch of the same work that happens when we actually render a frame, so we don't want to check
                // this unless we know we are in a state where there were mutations and now we are waiting for a frame
                // to render after the scene is ready.
                if (!shouldRender && this._renderedLastFrame && !renderedReadyFrame) {
                    renderedReadyFrame = this._scene.isReady(true);
                    shouldRender = true;
                }

                if (shouldRender) {
                    if (!this._renderedLastFrame) {
                        if (this._renderedLastFrame !== null) {
                            onRenderingResumed();
                        }
                        this._renderedLastFrame = true;
                    }

                    this._sceneMutated = false;
                    this._scene.render();

                    // NOTE: this logic to adjust camera parameters based on radius is copied in renderingZone.tsx (for sandbox).
                    // Please keep them in sync.

                    // Update the camera panning sensitivity based on the camera's distance from the target.
                    this._camera.panningSensibility = 5000 / this._camera.radius;

                    // Update the camera speed based on the camera's distance from the target.
                    // TODO: This makes mouse wheel zooming behave well, but makes mouse based rotation a bit worse.
                    this._camera.speed = this._camera.radius * 0.2;

                    // Update the keyboard zooming sensitivity based on the camera's distance from the target.
                    (this._camera.inputs.attached["keyboard"] as ArcRotateCameraKeyboardMoveInput).zoomingSensibility = 500 / this._camera.radius;

                    if (this.isAnimationPlaying) {
                        this.onAnimationProgressChanged.notifyObservers();
                        this._autoRotationBehavior.resetLastInteractionTime();
                    }
                } else {
                    this._camera.update();

                    if (this._renderedLastFrame) {
                        onRenderingSuspended();
                    }
                }
            };

            this._engine.runRenderLoop(render);

            let disposed = false;
            this._renderLoopController = {
                dispose: () => {
                    if (!disposed) {
                        disposed = true;
                        this._engine.stopRenderLoop(render);
                        this._renderLoopController = null;

                        if (this._renderedLastFrame) {
                            onRenderingSuspended();
                        }
                    }
                },
            };
        }
    }

    protected _reframeCamera(interpolate: boolean = false, models: readonly Model[] = this._loadedModelsBacking): void {
        this._reframeCameraFromBounds(interpolate, models);
    }

    protected _getWorldBounds(models: readonly Model[]): Nullable<ViewerBoundingInfo> {
        return computeModelsBoundingInfos(models);
    }

    protected _getCameraConfig(models: readonly Model[]): ViewerCameraConfig {
        let radius = 1;
        let target = Vector3.Zero();
        const worldBounds = this._getWorldBounds(models);
        if (worldBounds) {
            // get bounds and prepare framing/camera radius from its values
            this._camera.lowerRadiusLimit = null;

            radius = Vector3.FromArray(worldBounds.size).length() * 1.1;
            target = Vector3.FromArray(worldBounds.center);
            if (!isFinite(radius)) {
                radius = 1;
                target.copyFromFloats(0, 0, 0);
            }
        }

        const lowerRadiusLimit = radius * 0.001;
        const upperRadiusLimit = radius * 5;
        const minZ = radius * 0.001;
        const maxZ = radius * 1000;

        return {
            radius,
            target,
            lowerRadiusLimit,
            upperRadiusLimit,
            minZ,
            maxZ,
        };
    }

    // For rotation/radius/target, undefined means default framing, NaN means keep current value.
    private _reframeCameraFromBounds(
        interpolate: boolean,
        models: readonly Model[],
        alpha?: number,
        beta?: number,
        radius?: number,
        targetX?: number,
        targetY?: number,
        targetZ?: number
    ): void {
        let goalRadius = 1;
        const goalTarget = Vector3.Zero();
        let goalAlpha = Math.PI / 2;
        let goalBeta = Math.PI / 2.4;

        const { radius: sceneRadius, target: sceneTarget, lowerRadiusLimit, upperRadiusLimit, minZ, maxZ } = this._getCameraConfig(models);

        this._camera.lowerRadiusLimit = lowerRadiusLimit;
        this._camera.upperRadiusLimit = upperRadiusLimit;
        this._camera.minZ = minZ;
        this._camera.maxZ = maxZ;

        goalAlpha = alpha ?? goalAlpha;
        goalBeta = beta ?? goalBeta;
        goalRadius = radius ?? sceneRadius;
        goalTarget.x = targetX ?? sceneTarget.x;
        goalTarget.y = targetY ?? sceneTarget.y;
        goalTarget.z = targetZ ?? sceneTarget.z;

        if (interpolate) {
            this._camera.interpolateTo(goalAlpha, goalBeta, goalRadius, goalTarget, undefined, 0.1);
        } else {
            this._camera.stopInterpolation();

            if (!isNaN(goalAlpha)) {
                this._camera.alpha = goalAlpha;
            }
            if (!isNaN(goalBeta)) {
                this._camera.beta = goalBeta;
            }
            if (!isNaN(goalRadius)) {
                this._camera.radius = goalRadius;
            }
            this._camera.setTarget(
                new Vector3(
                    isNaN(goalTarget.x) ? this._camera.target.x : goalTarget.x,
                    isNaN(goalTarget.y) ? this._camera.target.y : goalTarget.y,
                    isNaN(goalTarget.z) ? this._camera.target.z : goalTarget.z
                ),
                undefined,
                undefined,
                true
            );
        }

        this._camera.wheelDeltaPercentage = 0.01;
        this._camera.useNaturalPinchZoom = true;

        updateSkybox(this._skybox, this._camera);
    }

    protected _updateLight() {
        let shouldHaveDefaultLight: boolean;
        if (this._loadedModels.length === 0) {
            shouldHaveDefaultLight = false;
        } else {
            const hasModelProvidedLights = this._loadedModels.some((model) => model.assetContainer.lights.length > 0);
            const hasImageBasedLighting = !!this._reflectionTexture;
            const hasNonPBRMaterials = this._loadedModels.some((model) => model.assetContainer.materials.some((material) => !(material instanceof PBRMaterial)));

            if (hasModelProvidedLights) {
                shouldHaveDefaultLight = false;
            } else {
                shouldHaveDefaultLight = !hasImageBasedLighting || hasNonPBRMaterials;
            }
        }

        if (shouldHaveDefaultLight) {
            if (!this._light) {
                this._light = new HemisphericLight("defaultLight", Vector3.Up(), this._scene);
            }
        } else {
            this._light?.dispose();
            this._light = null;
        }
    }

    private _applyAnimationSpeed() {
        this._activeModel?.assetContainer.animationGroups.forEach((group) => (group.speedRatio = this._animationSpeed));
    }

    protected async _pick(screenX: number, screenY: number): Promise<Nullable<PickingInfo>> {
        await import("core/Culling/ray");
        if (this._loadedModels.length > 0) {
            const meshes = this._loadedModelsBacking.flatMap((model) => model.assetContainer.meshes);
            // Refresh bounding info to ensure morph target and skeletal animations are taken into account.
            meshes.forEach((mesh) => {
                let cache = this._meshDataCache.get(mesh);
                if (!cache) {
                    cache = {};
                    this._meshDataCache.set(mesh, cache);
                }
                mesh.refreshBoundingInfo({ applyMorph: true, applySkeleton: true, cache });
            });

            const pickingInfo = this._scene.pick(screenX, screenY, (mesh) => meshes.includes(mesh));
            if (pickingInfo.hit) {
                return pickingInfo;
            }
        }

        return null;
    }

    protected _startSceneOptimizer(reset = false) {
        this._stopSceneOptimizer();

        if (reset) {
            this._engine.setHardwareScalingLevel(this._defaultHardwareScalingLevel);
        }

        const sceneOptimizerOptions = new SceneOptimizerOptions(60, 1000);
        const hardwareScalingOptimization = new HardwareScalingOptimization(undefined, 1);
        sceneOptimizerOptions.addOptimization(hardwareScalingOptimization);
        this._sceneOptimizer = new SceneOptimizer(this._scene, sceneOptimizerOptions);

        this._sceneOptimizer.start();
    }

    protected _stopSceneOptimizer() {
        this._sceneOptimizer?.dispose();
        this._sceneOptimizer = null;
    }

    protected _log(message: string) {
        if (this.showDebugLogs) {
            Logger.Log(message);
        }
    }

    /**
     * Check for disposed or aborted state (basically everything that can interrupt an async operation).
     * @param abortSignals A set of optional AbortSignals to also check.
     */
    private _throwIfDisposedOrAborted(...abortSignals: (Nullable<AbortSignal> | undefined)[]): void {
        if (this._isDisposed) {
            throw new Error("Viewer is disposed.");
        }

        throwIfAborted(...abortSignals);
    }
}
