import type {
    AbstractEngine,
    AbstractMesh,
    AnimationGroup,
    AssetContainer,
    AutoRotationBehavior,
    BaseTexture,
    Camera,
    CubeTexture,
    FramingBehavior,
    HDRCubeTexture,
    HotSpotQuery,
    IDisposable,
    IMeshDataCache,
    ISceneLoaderProgressEvent,
    LoadAssetContainerOptions,
    Mesh,
    Nullable,
    Observer,
    PickingInfo,
    // eslint-disable-next-line import/no-internal-modules
} from "core/index";

import type { MaterialVariantsController } from "loaders/glTF/2.0/Extensions/KHR_materials_variants";

import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { PointerEventTypes } from "core/Events/pointerEvents";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { LoadAssetContainerAsync } from "core/Loading/sceneLoader";
import { ImageProcessingConfiguration } from "core/Materials/imageProcessingConfiguration";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { Texture } from "core/Materials/Textures/texture";
import { Color4 } from "core/Maths/math.color";
import { Clamp } from "core/Maths/math.scalar.functions";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import { Viewport } from "core/Maths/math.viewport";
import { GetHotSpotToRef } from "core/Meshes/abstractMesh.hotSpot";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { computeMaxExtents } from "core/Meshes/meshUtils";
import { BuildTuple } from "core/Misc/arrayTools";
import { AsyncLock } from "core/Misc/asyncLock";
import { deepMerge } from "core/Misc/deepMerger";
import { AbortError } from "core/Misc/error";
import { Logger } from "core/Misc/logger";
import { Observable } from "core/Misc/observable";
import { HardwareScalingOptimization, SceneOptimizer, SceneOptimizerOptions } from "core/Misc/sceneOptimizer";
import { SnapshotRenderingHelper } from "core/Misc/snapshotRenderingHelper";
import { GetExtensionFromUrl } from "core/Misc/urlTools";
import { Scene } from "core/scene";
import { registerBuiltInLoaders } from "loaders/dynamic";

const toneMappingOptions = ["none", "standard", "aces", "neutral"] as const;
export type ToneMapping = (typeof toneMappingOptions)[number];

type UpdateModelOptions = {
    /**
     * The default animation index.
     */
    defaultAnimation?: number;

    /**
     * Whether to play the default animation immediately after loading.
     */
    animationAutoPlay?: boolean;
};

type ActivateModelOptions = UpdateModelOptions & Partial<{ source: string | File | ArrayBufferView; interpolateCamera: boolean }>;

export type LoadModelOptions = LoadAssetContainerOptions & UpdateModelOptions;

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

    /**
     * If the environment should be visible.
     */
    visible: boolean;
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
};

/**
 * Checks if the given value is a valid tone mapping option.
 * @param value The value to check.
 * @returns True if the value is a valid tone mapping option, otherwise false.
 */
export function IsToneMapping(value: string): value is ToneMapping {
    return toneMappingOptions.includes(value as ToneMapping);
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
            // eslint-disable-next-line @typescript-eslint/naming-convention
            const { HDRCubeTexture } = await import("core/Materials/Textures/hdrCubeTexture");
            return () => new HDRCubeTexture(url, scene, 256, false, true, false, true, undefined, undefined, undefined, true, true);
        } else {
            // eslint-disable-next-line @typescript-eslint/naming-convention
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
        const hdrSkybox = CreateBox("hdrSkyBox", undefined, scene);
        const hdrSkyboxMaterial = new PBRMaterial("skyBox", scene);
        // Use the default image processing configuration on the skybox (e.g. don't apply tone mapping, contrast, or exposure).
        hdrSkyboxMaterial.imageProcessingConfiguration = new ImageProcessingConfiguration();
        hdrSkyboxMaterial.backFaceCulling = false;
        hdrSkyboxMaterial.reflectionTexture = reflectionTexture;
        if (hdrSkyboxMaterial.reflectionTexture) {
            hdrSkyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        }
        hdrSkyboxMaterial.microSurface = 1.0 - blur;
        hdrSkyboxMaterial.disableLighting = true;
        hdrSkyboxMaterial.twoSidedLighting = true;
        hdrSkybox.material = hdrSkyboxMaterial;
        hdrSkybox.isPickable = false;
        hdrSkybox.infiniteDistance = true;

        updateSkybox(hdrSkybox, camera);

        return hdrSkybox;
    } finally {
        scene.blockMaterialDirtyMechanism = originalBlockMaterialDirtyMechanism;
    }
}

function updateSkybox(skybox: Nullable<Mesh>, camera: Camera): void {
    skybox?.scaling.setAll((camera.maxZ - camera.minZ) / 2);
}

function computeModelsMaxExtents(models: Model[]): Array<{ minimum: Vector3; maximum: Vector3 }> {
    return models.flatMap((model) => {
        return computeMaxExtents(model.assetContainer.meshes, model.assetContainer.animationGroups[model.selectedAnimation]);
    });
}

function reduceMeshesExtendsToBoundingInfo(maxExtents: Array<{ minimum: Vector3; maximum: Vector3 }>) {
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
 * Compute the bounding info for the models by computing their maximum extents, size, and center considering animation, skeleton, and morph targets.
 * @param models The models to consider when computing the bounding info
 * @returns The computed bounding info for the models or null
 */
function computeModelsBoundingInfos(models: Model[]): Nullable<ViewerBoundingInfo> {
    const maxExtents = computeModelsMaxExtents(models);
    return reduceMeshesExtendsToBoundingInfo(maxExtents);
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
     * Automatically rotates a 3D model or scene without requiring user interaction.
     */
    cameraAutoOrbit: Partial<CameraAutoOrbit>;

    /**
     * Boolean indicating if the scene must use right-handed coordinates system.
     */
    useRightHandedSystem: boolean;
}>;

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
};

type ModelInternal = Model & {
    _animationPlaying(): boolean;
    _shouldRender(): boolean;
};

/**
 * @experimental
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

    protected readonly _scene: Scene;
    protected readonly _camera: ArcRotateCamera;
    protected readonly _snapshotHelper: SnapshotRenderingHelper;

    private readonly _defaultHardwareScalingLevel: number;
    private _lastHardwareScalingLevel: number;
    private _renderedLastFrame: Nullable<boolean> = null;
    private _sceneOptimizer: Nullable<SceneOptimizer> = null;

    private readonly _tempVectors = BuildTuple(4, Vector3.Zero);
    private readonly _meshDataCache = new Map<AbstractMesh, IMeshDataCache>();
    private readonly _autoRotationBehavior: AutoRotationBehavior;
    private readonly _imageProcessingConfigurationObserver: Observer<ImageProcessingConfiguration>;
    private readonly _beforeRenderObserver: Observer<Scene>;
    private _renderLoopController: Nullable<IDisposable> = null;
    private _loadedModelsBacking: ModelInternal[] = [];
    private _activeModelBacking: Nullable<ModelInternal> = null;
    private _skybox: Nullable<Mesh> = null;
    private _skyboxBlur: number = 0.3;
    private _skyboxVisible: boolean = true;
    private _skyboxTexture: Nullable<CubeTexture | HDRCubeTexture> = null;
    private _reflectionTexture: Nullable<CubeTexture | HDRCubeTexture> = null;
    private _reflectionsIntensity: number = 1;
    private _reflectionsRotation: number = 0;
    private _light: Nullable<HemisphericLight> = null;
    private _toneMappingEnabled: boolean;
    private _toneMappingType: number;
    private _contrast: number;
    private _exposure: number;

    private readonly _autoSuspendRendering: boolean;
    private _sceneMutated = false;
    private _suspendRenderCount = 0;
    private _isDisposed = false;

    private readonly _loadModelLock = new AsyncLock();
    private _loadModelAbortController: Nullable<AbortController> = null;

    private readonly _loadEnvironmentLock = new AsyncLock();
    private _loadEnvironmentAbortController: Nullable<AbortController> = null;

    private readonly _loadSkyboxLock = new AsyncLock();
    private _loadSkyboxAbortController: Nullable<AbortController> = null;

    private readonly _loadOperations = new Set<Readonly<{ progress: Nullable<number> }>>();

    private _activeAnimationObservers: Observer<AnimationGroup>[] = [];
    private _animationSpeed = 1;

    public constructor(
        private readonly _engine: AbstractEngine,
        options?: ViewerOptions
    ) {
        this._defaultHardwareScalingLevel = this._lastHardwareScalingLevel = this._engine.getHardwareScalingLevel();
        this._autoSuspendRendering = options?.autoSuspendRendering ?? true;
        {
            const scene = new Scene(this._engine);
            scene.clearColor = options?.clearColor ? new Color4(...options.clearColor) : new Color4(0, 0, 0, 0);
            scene.useRightHandedSystem = !!options?.useRightHandedSystem;

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
                    camera.restoreState();
                }
            }, PointerEventTypes.POINTERDOUBLETAP);

            this._scene = scene;
            this._camera = camera;
        }
        this._scene.skipFrustumClipping = true;
        this._scene.skipPointerDownPicking = true;
        this._scene.skipPointerUpPicking = true;
        this._scene.skipPointerMovePicking = true;
        this._snapshotHelper = new SnapshotRenderingHelper(this._scene, { morphTargetsNumMaxInfluences: 30 });
        this._beforeRenderObserver = this._scene.onBeforeRenderObservable.add(() => {
            this._snapshotHelper.updateMesh(this._scene.meshes);
        });
        this._camera.attachControl();
        this._reframeCamera(); // set default camera values
        this._autoRotationBehavior = this._camera.getBehaviorByName("AutoRotation") as AutoRotationBehavior;
        if (options?.cameraAutoOrbit) {
            this.cameraAutoOrbit = options?.cameraAutoOrbit;
        }

        // Default to KHR PBR Neutral tone mapping.
        this.postProcessing = {
            toneMapping: "neutral",
        };

        // Load a default light, but ignore errors as the user might be immediately loading their own environment.
        this.resetEnvironment().catch(() => {});

        this._beginRendering();

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const viewer = this;
        options?.onInitialized?.({
            scene: viewer._scene,
            camera: viewer._camera,
            get model() {
                return viewer._activeModel ?? null;
            },
            suspendRendering: () => this._suspendRendering(),
            markSceneMutated: () => this._markSceneMutated(),
            pick: (screenX: number, screenY: number) => this._pick(screenX, screenY),
        });
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
            visible: this._skyboxVisible,
        };
    }

    public set environmentConfig(value: Partial<Readonly<EnvironmentParams>>) {
        if (value.blur !== undefined) {
            this._changeSkyboxBlur(value.blur);
        }
        if (value.intensity !== undefined) {
            this._changeEnvironmentIntensity(value.intensity);
        }
        if (value.rotation !== undefined) {
            this._changeEnvironmentRotation(value.rotation);
        }
        if (value.visible !== undefined) {
            this._changeSkyboxVisible(value.visible);
        }
        this.onEnvironmentConfigurationChanged.notifyObservers();
    }

    private _changeSkyboxBlur(value: number) {
        if (value !== this._skyboxBlur) {
            this._skyboxBlur = value;
            if (this._skybox) {
                const material = this._skybox.material;
                if (material instanceof PBRMaterial) {
                    this._snapshotHelper.disableSnapshotRendering();
                    material.microSurface = 1.0 - this._skyboxBlur;
                    this._snapshotHelper.enableSnapshotRendering();
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

            this._snapshotHelper.disableSnapshotRendering();
            if (this._skyboxTexture) {
                this._skyboxTexture.rotationY = this._reflectionsRotation;
            }
            if (this._reflectionTexture) {
                this._reflectionTexture.rotationY = this._reflectionsRotation;
            }
            this._snapshotHelper.enableSnapshotRendering();
            this._markSceneMutated();
        }
    }

    private _changeEnvironmentIntensity(value: number) {
        if (value !== this._reflectionsIntensity) {
            this._reflectionsIntensity = value;

            this._snapshotHelper.disableSnapshotRendering();
            if (this._skyboxTexture) {
                this._skyboxTexture.level = this._reflectionsIntensity;
            }
            if (this._reflectionTexture) {
                this._reflectionTexture.level = this._reflectionsIntensity;
            }
            this._snapshotHelper.enableSnapshotRendering();
            this._markSceneMutated();
        }
    }

    private _changeSkyboxVisible(value: boolean) {
        if (value !== this._skyboxVisible) {
            this._skyboxVisible = value;
            if (this._skybox) {
                this._snapshotHelper.disableSnapshotRendering();
                this._skybox.setEnabled(this._skyboxVisible);
                this._updateAutoClear();
                this._snapshotHelper.enableSnapshotRendering();
                this._markSceneMutated();
            }
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
        };
    }

    public set postProcessing(value: Partial<Readonly<PostProcessing>>) {
        this._snapshotHelper.disableSnapshotRendering();

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

        this._scene.imageProcessingConfiguration.isEnabled = this._toneMappingEnabled || this._contrast !== 1 || this._exposure !== 1;

        this._snapshotHelper.enableSnapshotRendering();
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
            this._applyAnimationSpeed();
            this._selectAnimation(options?.defaultAnimation ?? 0, false);
            if (options?.animationAutoPlay) {
                this.playAnimation();
            }
            this.onSelectedMaterialVariantChanged.notifyObservers();
            this._reframeCamera(options?.interpolateCamera);
            this.onModelChanged.notifyObservers(options?.source ?? null);
        }
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
        return this._activeModel?.materialVariantsController?.selectedVariant ?? null;
    }

    public set selectedMaterialVariant(value: string) {
        if (value !== this.selectedMaterialVariant && this._activeModel?.materialVariantsController?.variants.includes(value)) {
            this._snapshotHelper.disableSnapshotRendering();
            this._activeModel.materialVariantsController.selectedVariant = value;
            this._snapshotHelper.enableSnapshotRendering();
            this._markSceneMutated();
            this.onSelectedMaterialVariantChanged.notifyObservers();
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

        this._snapshotHelper.disableSnapshotRendering();

        try {
            const assetContainer = await LoadAssetContainerAsync(source, this._scene, options);
            assetContainer.animationGroups.forEach((group) => {
                group.start(true, this.animationSpeed);
                group.pause();
            });
            assetContainer.addAllToScene();
            this._snapshotHelper.fixMeshes(assetContainer.meshes);

            let selectedAnimation = -1;
            const cachedWorldBounds: ViewerBoundingInfo[] = [];

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
                    this._snapshotHelper.disableSnapshotRendering();
                    assetContainer.meshes.forEach((mesh) => this._meshDataCache.delete(mesh));
                    assetContainer.dispose();

                    const index = this._loadedModelsBacking.indexOf(model);
                    if (index !== -1) {
                        this._loadedModelsBacking.splice(index, 1);
                        if (model === this._activeModel) {
                            this._activeModelBacking = null;
                        }
                    }

                    this._snapshotHelper.enableSnapshotRendering();
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
            };

            this._loadedModelsBacking.push(model);

            return model;
        } catch (e) {
            this.onModelError.notifyObservers(e);
            throw e;
        } finally {
            loadOperation.dispose();
            this._snapshotHelper.enableSnapshotRendering();
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
            }
        });

        // If there are PBR materials after the model load operation and an environment texture is not loaded, load the default environment.
        if (!this._scene.environmentTexture && this._scene.materials.some((material) => material instanceof PBRMaterial)) {
            await this.resetEnvironment({ lighting: true }, abortSignal);
        }

        this._startSceneOptimizer(true);
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

    private async _updateEnvironment(url: Nullable<string | undefined>, options?: LoadEnvironmentOptions, abortSignal?: AbortSignal): Promise<void> {
        this._throwIfDisposedOrAborted(abortSignal);

        let urlPromise: Nullable<string | undefined> | Promise<string> = url;
        if (url && url.trim() === "auto") {
            options = { ...options, extension: ".env" };
            urlPromise = (async () => (await import("./defaultEnvironment")).default)();
        }

        options = options ?? defaultLoadEnvironmentOptions;
        if (!options.lighting && !options.skybox) {
            return;
        }

        const locks: AsyncLock[] = [];
        if (options.lighting) {
            this._loadEnvironmentAbortController?.abort(new AbortError("New environment lighting is being loaded before previous environment lighting finished loading."));
            locks.push(this._loadEnvironmentLock);
        }
        if (options.skybox) {
            this._loadSkyboxAbortController?.abort(new AbortError("New environment skybox is being loaded before previous environment skybox finished loading."));
            locks.push(this._loadSkyboxLock);
        }

        const environmentAbortController = (this._loadEnvironmentAbortController = options.lighting ? new AbortController() : null);
        const skyboxAbortController = (this._loadSkyboxAbortController = options.skybox ? new AbortController() : null);

        await AsyncLock.LockAsync(async () => {
            throwIfAborted(abortSignal, environmentAbortController?.signal, skyboxAbortController?.signal);
            this._snapshotHelper.disableSnapshotRendering();

            const dispose = () => {
                if (options.lighting) {
                    this._reflectionTexture?.dispose();
                    this._reflectionTexture = null;
                }
                if (options.skybox) {
                    this._skybox?.dispose(undefined, true);
                    this._skyboxTexture = null;
                    this._skybox = null;
                    this._updateAutoClear();
                }
            };

            // First dispose the current environment and/or skybox.
            dispose();

            try {
                url = await urlPromise;
                if (url) {
                    const cubeTexture = await createCubeTexture(url, this._scene, options.extension);

                    if (options.lighting) {
                        this._reflectionTexture = cubeTexture;
                        this._scene.environmentTexture = this._reflectionTexture;
                        cubeTexture.level = this.environmentConfig.intensity;
                        cubeTexture.rotationY = this.environmentConfig.rotation;
                    }
                    if (options.skybox) {
                        this._skyboxTexture = options.lighting ? cubeTexture.clone() : cubeTexture;
                        this._skyboxTexture.level = this.environmentConfig.intensity;
                        this._skyboxTexture.rotationY = this.environmentConfig.rotation;
                        this._skybox = createSkybox(this._scene, this._camera, this._skyboxTexture, this.environmentConfig.blur);
                        this._skybox.setEnabled(this._skyboxVisible);
                        this._snapshotHelper.fixMeshes([this._skybox]);
                        this._updateAutoClear();
                    }

                    await new Promise<void>((resolve, reject) => {
                        const successObserver = (cubeTexture.onLoadObservable as Observable<unknown>).addOnce(() => {
                            successObserver.remove();
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
                }

                this._updateLight();
                this.onEnvironmentChanged.notifyObservers();
            } catch (e) {
                dispose();
                this.onEnvironmentError.notifyObservers(e);
                throw e;
            } finally {
                this._snapshotHelper.enableSnapshotRendering();
                this._markSceneMutated();
            }
        }, locks);
    }

    /**
     * Toggles the play/pause animation state if there is a selected animation.
     */
    public toggleAnimation() {
        if (this.isAnimationPlaying) {
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
     */
    public resetCamera() {
        this._camera.restoreState();
    }

    /**
     * Disposes of the resources held by the Viewer.
     */
    public dispose(): void {
        this.selectedAnimation = -1;
        this.animationProgress = 0;

        this._loadEnvironmentAbortController?.abort(new AbortError("Thew viewer is being disposed."));
        this._loadSkyboxAbortController?.abort(new AbortError("Thew viewer is being disposed."));
        this._loadModelAbortController?.abort(new AbortError("Thew viewer is being disposed."));

        this._renderLoopController?.dispose();
        this._activeModel?.dispose();
        this._loadedModelsBacking.forEach((model) => model.dispose());
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
        this.onLoadingProgressChanged.clear();

        this._imageProcessingConfigurationObserver.remove();
        this._beforeRenderObserver.remove();

        this._isDisposed = true;
    }

    /**
     * Return world and canvas coordinates of an hot spot
     * @param query mesh index and surface information to query the hot spot positions
     * @param result Query a Hot Spot and does the conversion for Babylon Hot spot to a more generic HotSpotPositions, without Vector types
     * @returns true if hotspot found
     */
    public getHotSpotToRef(query: Readonly<ViewerHotSpotQuery>, result: ViewerHotSpotResult): boolean {
        return this._activeModel?.getHotSpotToRef(query, result) ?? false;
    }

    protected _getHotSpotToRef(assetContainer: Nullable<AssetContainer>, query: Readonly<ViewerHotSpotQuery>, result: ViewerHotSpotResult): boolean {
        const worldNormal = this._tempVectors[2];
        const worldPos = this._tempVectors[1];
        const screenPos = this._tempVectors[0];

        if (query.type === "surface") {
            const mesh = assetContainer?.meshes[query.meshIndex];
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

    protected get _shouldRender() {
        // We should render if:
        // 1. Auto suspend rendering is disabled.
        // 2. The scene has been mutated.
        // 3. The snapshot helper is not yet in a ready state.
        // 4. At least one model should render (playing animations).
        return !this._autoSuspendRendering || this._sceneMutated || !this._snapshotHelper.isReady || this._loadedModelsBacking.some((model) => model._shouldRender());
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
                this._startSceneOptimizer();
            };

            const onRenderingSuspended = () => {
                this._log("Viewer Suspended Rendering");
                this._renderedLastFrame = false;
                renderedReadyFrame = false;
                // Take note of the current hardware scaling level for when rendering is resumed.
                this._lastHardwareScalingLevel = this._engine.getHardwareScalingLevel();
                this._stopSceneOptimizer();
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

                    // Update the camera panning sensitivity related properties based on the camera's distance from the target.
                    this._camera.panningSensibility = 5000 / this._camera.radius;
                    this._camera.speed = this._camera.radius * 0.2;

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

    protected _reframeCamera(interpolateCamera: boolean = false, models: Model[] = this._loadedModelsBacking): void {
        const worldBounds = computeModelsBoundingInfos(models);
        this._reframeCameraFromBounds(worldBounds, interpolateCamera);
    }

    private _reframeCameraFromBounds(worldBounds?: Nullable<ViewerBoundingInfo>, interpolate: boolean = false): void {
        this._camera.useFramingBehavior = true;
        const framingBehavior = this._camera.getBehaviorByName("Framing") as FramingBehavior;
        framingBehavior.framingTime = 0;
        framingBehavior.elevationReturnTime = -1;

        this._camera.useAutoRotationBehavior = true;

        const currentAlpha = this._camera.alpha;
        const currentBeta = this._camera.beta;
        const currentRadius = this._camera.radius;
        const currentTarget = this._camera.target;

        const goalAlpha = Math.PI / 2;
        const goalBeta = Math.PI / 2.4;
        let goalRadius = 1;
        let goalTarget = currentTarget;

        if (worldBounds) {
            // get bounds and prepare framing/camera radius from its values
            this._camera.lowerRadiusLimit = null;

            const worldExtentsMin = this._tempVectors[0].copyFromFloats(...worldBounds.extents.min);
            const worldExtentsMax = this._tempVectors[1].copyFromFloats(...worldBounds.extents.max);
            framingBehavior.zoomOnBoundingInfo(worldExtentsMin, worldExtentsMax);

            goalRadius = Vector3.FromArray(worldBounds.size).length() * 1.1;
            goalTarget = Vector3.FromArray(worldBounds.center);
            if (!isFinite(goalRadius)) {
                goalRadius = 1;
                goalTarget.copyFromFloats(0, 0, 0);
            }
        }
        this._camera.alpha = Math.PI / 2;
        this._camera.beta = Math.PI / 2.4;
        this._camera.radius = goalRadius;
        this._camera.target = goalTarget;
        this._camera.lowerRadiusLimit = goalRadius * 0.001;
        this._camera.upperRadiusLimit = goalRadius * 5;
        this._camera.minZ = goalRadius * 0.001;
        this._camera.maxZ = goalRadius * 1000;
        this._camera.wheelDeltaPercentage = 0.01;
        this._camera.useNaturalPinchZoom = true;
        this._camera.restoreStateInterpolationFactor = 0.1;
        this._camera.storeState();

        if (interpolate) {
            this._camera.alpha = currentAlpha;
            this._camera.beta = currentBeta;
            this._camera.radius = currentRadius;
            this._camera.target = currentTarget;
            this._camera.interpolateTo(goalAlpha, goalBeta, goalRadius, goalTarget);
        }

        updateSkybox(this._skybox, this._camera);
    }

    private _updateLight() {
        let shouldHaveDefaultLight: boolean;
        if (!this._activeModel) {
            shouldHaveDefaultLight = false;
        } else {
            const hasModelProvidedLights = this._activeModel.assetContainer.lights.length > 0;
            const hasImageBasedLighting = !!this._reflectionTexture;
            const hasMaterials = this._activeModel.assetContainer.materials.length > 0;
            const hasNonPBRMaterials = this._activeModel.assetContainer.materials.some((material) => !(material instanceof PBRMaterial));

            if (hasModelProvidedLights) {
                shouldHaveDefaultLight = false;
            } else {
                shouldHaveDefaultLight = !hasImageBasedLighting || !hasMaterials || hasNonPBRMaterials;
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
