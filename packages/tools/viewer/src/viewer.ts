import type {
    AbstractEngine,
    AbstractMesh,
    AnimationGroup,
    AssetContainer,
    AutoRotationBehavior,
    Camera,
    FramingBehavior,
    HotSpotQuery,
    IDisposable,
    IMeshDataCache,
    ISceneLoaderProgressEvent,
    LoadAssetContainerOptions,
    Mesh,
    MeshPredicate,
    Nullable,
    Observer,
    PickingInfo,
    // eslint-disable-next-line import/no-internal-modules
} from "core/index";

import type { MaterialVariantsController } from "loaders/glTF/2.0/Extensions/KHR_materials_variants";

import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { PointerEventTypes } from "core/Events/pointerEvents";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { loadAssetContainerAsync } from "core/Loading/sceneLoader";
import { ImageProcessingConfiguration } from "core/Materials/imageProcessingConfiguration";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { CubeTexture } from "core/Materials/Textures/cubeTexture";
import { Texture } from "core/Materials/Textures/texture";
import { Clamp } from "core/Maths/math.scalar.functions";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import { Viewport } from "core/Maths/math.viewport";
import { GetHotSpotToRef } from "core/Meshes/abstractMesh.hotSpot";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { computeMaxExtents } from "core/Meshes/meshUtils";
import { BuildTuple } from "core/Misc/arrayTools";
import { AsyncLock } from "core/Misc/asyncLock";
import { deepMerge } from "core/Misc/deepMerger";
import { Observable } from "core/Misc/observable";
import { SnapshotRenderingHelper } from "core/Misc/snapshotRenderingHelper";
import { Scene } from "core/scene";
import { registerBuiltInLoaders } from "loaders/dynamic";

const toneMappingOptions = ["none", "standard", "aces", "neutral"] as const;
export type ToneMapping = (typeof toneMappingOptions)[number];

export type LoadModelOptions = LoadAssetContainerOptions & {
    /**
     * The default animation index.
     */
    defaultAnimation?: number;
};

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
export function isToneMapping(value: string): value is ToneMapping {
    return toneMappingOptions.includes(value as ToneMapping);
}

function throwIfAborted(...abortSignals: (Nullable<AbortSignal> | undefined)[]): void {
    for (const signal of abortSignals) {
        signal?.throwIfAborted();
    }
}

function createSkybox(scene: Scene, camera: Camera, reflectionTexture: CubeTexture, blur: number): Mesh {
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
}

function updateSkybox(skybox: Nullable<Mesh>, camera: Camera): void {
    skybox?.scaling.setAll((camera.maxZ - camera.minZ) / 2);
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
     * Picks the object at the given screen coordinates.
     * @remarks This function ensures skeletal and morph target animations are up to date before picking, and typically should not be called at high frequency (e.g. every frame, on pointer move, etc.).
     * @param screenX The x coordinate in screen space.
     * @param screenY The y coordinate in screen space.
     * @returns A PickingInfo if an object was picked, otherwise null.
     */
    pick(screenX: number, screenY: number): Promise<Nullable<PickingInfo>>;
};

export type ViewerOptions = Partial<
    Readonly<{
        /**
         * Called once when the viewer is initialized and provides viewer details that can be used for advanced customization.
         */
        onInitialized: (details: Readonly<ViewerDetails>) => void;
    }>
>;

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

export type ModelBoundingInfo = {
    worldExtents: {
        min: Vector3;
        max: Vector3;
    };
    worldSize: Vector3;
    worldCenter: Vector3;
};

export type Model = IDisposable &
    Readonly<{
        /**
         * The asset container representing the model.
         */
        assetContainer: AssetContainer;

        /**
         * The material variants controller for the model.
         */
        materialVariantsController: Nullable<MaterialVariantsController>;

        /**
         * Returns the world position and visibility of a hot spot.
         */
        getHotSpotToRef(query: Readonly<ViewerHotSpotQuery>, result: ViewerHotSpotResult): boolean;
    }> & {
        /**
         * The computed bounding info of the model.
         */
        boundingInfo?: ModelBoundingInfo;
    };

/**
 * Provides the information of alpha, beta, radius and target of the camera.
 */
export type ViewerArcRotateCameraInfos = { alpha: number; beta: number; radius: number; target: Vector3 };

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
     * Fired when the environment has changed.
     */
    public readonly onEnvironmentChanged = new Observable<void>();

    /**
     * Fired when an error occurs while loading the environment.
     */
    public readonly onEnvironmentError = new Observable<unknown>();

    /**
     * Fired when the skybox blur changes.
     */
    public readonly onSkyboxBlurChanged = new Observable<void>();

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

    private readonly _tempVectors = BuildTuple(4, Vector3.Zero);
    private readonly _meshDataCache = new Map<AbstractMesh, IMeshDataCache>();
    private readonly _autoRotationBehavior: AutoRotationBehavior;
    private readonly _imageProcessingConfigurationObserver: Observer<ImageProcessingConfiguration>;
    private _renderLoopController: Nullable<IDisposable> = null;
    private _modelInfo: Nullable<Model> = null;
    private _skybox: Nullable<Mesh> = null;
    private _skyboxBlur: number = 0.3;
    private _light: Nullable<HemisphericLight> = null;
    private _toneMappingEnabled: boolean;
    private _toneMappingType: number;
    private _contrast: number;
    private _exposure: number;
    private _modelWorldCenter: Nullable<Vector3> = null;

    private _suspendRenderCount = 0;
    private _isDisposed = false;

    private readonly _loadModelLock = new AsyncLock();
    private _loadModelAbortController: Nullable<AbortController> = null;

    private readonly _loadEnvironmentLock = new AsyncLock();
    private _loadEnvironmentAbortController: Nullable<AbortController> = null;

    private readonly _loadSkyboxLock = new AsyncLock();
    private _loadSkyboxAbortController: Nullable<AbortController> = null;

    private readonly _loadOperations = new Set<Readonly<{ progress: Nullable<number> }>>();

    private _selectedAnimation = -1;
    private _activeAnimationObservers: Observer<AnimationGroup>[] = [];
    private _animationSpeed = 1;

    public constructor(
        private readonly _engine: AbstractEngine,
        options?: ViewerOptions
    ) {
        {
            const scene = new Scene(this._engine);

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
        this._camera.attachControl();
        this._updateCamera(); // set default camera values
        this._autoRotationBehavior = this._camera.getBehaviorByName("AutoRotation") as AutoRotationBehavior;

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
                return viewer._modelInfo ?? null;
            },
            suspendRendering: () => this._suspendRendering(),
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
     * A value between 0 and 1 that specifies how much to blur the skybox.
     */
    public get skyboxBlur(): number {
        return this._skyboxBlur;
    }

    public set skyboxBlur(value: number) {
        if (value !== this._skyboxBlur) {
            this._skyboxBlur = value;
            if (this._skybox) {
                const material = this._skybox.material;
                if (material instanceof PBRMaterial) {
                    this._snapshotHelper.disableSnapshotRendering();
                    material.microSurface = 1.0 - value;
                    this._snapshotHelper.enableSnapshotRendering();
                }
            }
            this.onSkyboxBlurChanged.notifyObservers();
        }
    }

    /**
     * The post processing configuration.
     */
    public get postProcessing(): PostProcessing {
        let toneMapping: ToneMapping;
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
            default:
                toneMapping = "none";
                break;
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

    protected get _model(): Nullable<Model> {
        return this._modelInfo;
    }

    protected _setModel(...args: [model: null] | [model: Model, source?: string | File | ArrayBufferView]): void {
        const [model, source] = args;
        if (model !== this._modelInfo) {
            this._modelInfo = model;
            this._updateModelBoundingInfo();
            this._updateCamera(true);
            this._updateLight();
            this._applyAnimationSpeed();
            this.onSelectedMaterialVariantChanged.notifyObservers();
            this.onModelChanged.notifyObservers(source ?? null);
        }
    }

    /**
     * The list of animation names for the currently loaded model.
     */
    public get animations(): readonly string[] {
        return this._modelInfo?.assetContainer.animationGroups.map((group) => group.name) ?? [];
    }

    /**
     * The currently selected animation index.
     */
    public get selectedAnimation(): number {
        return this._selectedAnimation;
    }

    public set selectedAnimation(value: number) {
        this._selectAnimation(value, this._loadOperations.size === 0);
    }

    protected _selectAnimation(index: number, interpolateCamera = true) {
        index = Math.round(Clamp(index, -1, this.animations.length - 1));
        if (index !== this._selectedAnimation) {
            const startAnimation = this.isAnimationPlaying;
            if (this._activeAnimation) {
                this._activeAnimationObservers.forEach((observer) => observer.remove());
                this._activeAnimationObservers = [];
                this._activeAnimation.pause();
                this._activeAnimation.goToFrame(0);
            }

            this._selectedAnimation = index;

            if (this._activeAnimation) {
                this._activeAnimation.goToFrame(0);
                this._activeAnimation.play(true);

                if (!startAnimation) {
                    this.pauseAnimation();
                }

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

                this._updateModelBoundingInfo();
                this._updateCamera(interpolateCamera);
            }

            this.onSelectedAnimationChanged.notifyObservers();
            this.onAnimationProgressChanged.notifyObservers();
        }
    }

    /**
     * True if an animation is currently playing.
     */
    public get isAnimationPlaying(): boolean {
        return this._activeAnimation?.isPlaying ?? false;
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
        }
    }

    private get _activeAnimation(): Nullable<AnimationGroup> {
        return this._modelInfo?.assetContainer.animationGroups[this._selectedAnimation] ?? null;
    }

    /**
     * The list of material variant names for the currently loaded model.
     */
    public get materialVariants(): readonly string[] {
        return this._modelInfo?.materialVariantsController?.variants ?? [];
    }

    /**
     * The currently selected material variant.
     */
    public get selectedMaterialVariant(): Nullable<string> {
        return this._modelInfo?.materialVariantsController?.selectedVariant ?? null;
    }

    public set selectedMaterialVariant(value: string) {
        if (value !== this.selectedMaterialVariant && this._modelInfo?.materialVariantsController?.variants.includes(value)) {
            this._snapshotHelper.disableSnapshotRendering();
            this._modelInfo.materialVariantsController.selectedVariant = value;
            this._snapshotHelper.enableSnapshotRendering();
            this.onSelectedMaterialVariantChanged.notifyObservers();
        }
    }

    /**
     * Updates the bounding info for the model by computing its maximum extents, size, and center considering animation, skeleton, and morph targets.
     */
    private _updateModelBoundingInfo(): void {
        if (this._modelInfo?.assetContainer.meshes.length) {
            const maxExtents = computeMaxExtents(this._modelInfo.assetContainer.meshes, this._activeAnimation);
            const min = new Vector3(
                Math.min(...maxExtents.map((e) => e.minimum.x)),
                Math.min(...maxExtents.map((e) => e.minimum.y)),
                Math.min(...maxExtents.map((e) => e.minimum.z))
            );
            const max = new Vector3(
                Math.max(...maxExtents.map((e) => e.maximum.x)),
                Math.max(...maxExtents.map((e) => e.maximum.y)),
                Math.max(...maxExtents.map((e) => e.maximum.z))
            );
            const size = max.subtract(min);
            const center = min.add(size.scale(0.5));

            this._modelInfo.boundingInfo = {
                worldExtents: {
                    min,
                    max,
                },
                worldSize: size,
                worldCenter: center,
            };
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
            const assetContainer = await loadAssetContainerAsync(source, this._scene, options);
            assetContainer.animationGroups.forEach((group) => {
                group.start(true, this.animationSpeed);
                group.pause();
            });
            assetContainer.addAllToScene();
            this._snapshotHelper.fixMeshes(assetContainer.meshes);

            return {
                assetContainer,
                materialVariantsController,
                getHotSpotToRef: (query, result) => {
                    return this._getHotSpotToRef(assetContainer, query, result);
                },
                dispose: () => {
                    this._snapshotHelper.disableSnapshotRendering();
                    assetContainer.meshes.forEach((mesh) => this._meshDataCache.delete(mesh));
                    assetContainer.dispose();
                    this._snapshotHelper.enableSnapshotRendering();
                },
            };
        } catch (e) {
            this.onModelError.notifyObservers(e);
            throw e;
        } finally {
            loadOperation.dispose();
            this._snapshotHelper.enableSnapshotRendering();
        }
    }

    private async _updateModel(source: string | File | ArrayBufferView | undefined, options?: LoadModelOptions, abortSignal?: AbortSignal): Promise<void> {
        this._throwIfDisposedOrAborted(abortSignal);

        this._loadModelAbortController?.abort("New model is being loaded before previous model finished loading.");
        const abortController = (this._loadModelAbortController = new AbortController());

        await this._loadModelLock.lockAsync(async () => {
            throwIfAborted(abortSignal, abortController.signal);
            this._model?.dispose();
            this._setModel(null);
            this.selectedAnimation = -1;

            if (source) {
                this._setModel(await this._loadModel(source, options, abortController.signal), source);
                this._selectAnimation(options?.defaultAnimation ?? 0, false);
            }
        });
    }

    /**
     * Loads an environment texture from the specified url and sets up a corresponding skybox.
     * @remarks
     * If an environment is already loaded, it will be unloaded before loading the new environment.
     * @param url The url of the environment texture to load.
     * @param options The options to use when loading the environment.
     * @param abortSignal An optional signal that can be used to abort the loading process.
     */
    public async loadEnvironment(url: string, options?: EnvironmentOptions, abortSignal?: AbortSignal): Promise<void> {
        await this._updateEnvironment(url, options, abortSignal);
    }

    /**
     * Unloads the current environment if one is loaded.
     * @param options The options to use when resetting the environment.
     * @param abortSignal An optional signal that can be used to abort the reset.
     */
    public async resetEnvironment(options?: EnvironmentOptions, abortSignal?: AbortSignal): Promise<void> {
        await this._updateEnvironment(undefined, options, abortSignal);
    }

    private async _updateEnvironment(url: Nullable<string | undefined>, options?: EnvironmentOptions, abortSignal?: AbortSignal): Promise<void> {
        this._throwIfDisposedOrAborted(abortSignal);

        options = options ?? defaultLoadEnvironmentOptions;
        if (!options.lighting && !options.skybox) {
            return;
        }

        const locks: AsyncLock[] = [];
        if (options.lighting) {
            this._loadEnvironmentAbortController?.abort("New environment lighting is being loaded before previous environment lighting finished loading.");
            locks.push(this._loadEnvironmentLock);
        }
        if (options.skybox) {
            this._loadSkyboxAbortController?.abort("New environment skybox is being loaded before previous environment skybox finished loading.");
            locks.push(this._loadSkyboxLock);
        }

        const environmentAbortController = (this._loadEnvironmentAbortController = options.lighting ? new AbortController() : null);
        const skyboxAbortController = (this._loadSkyboxAbortController = options.skybox ? new AbortController() : null);

        await AsyncLock.LockAsync(async () => {
            throwIfAborted(abortSignal, environmentAbortController?.signal, skyboxAbortController?.signal);
            this._snapshotHelper.disableSnapshotRendering();

            const dispose = () => {
                if (options.lighting) {
                    this._scene.environmentTexture?.dispose();
                    this._scene.environmentTexture = null;
                }
                if (options.skybox) {
                    this._skybox?.dispose(undefined, true);
                    this._skybox = null;
                    this._scene.autoClear = true;
                }
            };

            // First dispose the current environment and/or skybox.
            dispose();

            try {
                if (url) {
                    const cubeTexture = CubeTexture.CreateFromPrefilteredData(url, this._scene);

                    if (options.lighting) {
                        this._scene.environmentTexture = cubeTexture;
                    }

                    if (options.skybox) {
                        const reflectionTexture = options.lighting ? cubeTexture.clone() : cubeTexture;
                        this._skybox = createSkybox(this._scene, this._camera, reflectionTexture, this.skyboxBlur);
                        this._snapshotHelper.fixMeshes([this._skybox]);
                        this._scene.autoClear = false;
                    }

                    await new Promise<void>((resolve, reject) => {
                        const successObserver = cubeTexture.onLoadObservable.addOnce(() => {
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

        this._loadEnvironmentAbortController?.abort("Thew viewer is being disposed.");
        this._loadModelAbortController?.abort("Thew viewer is being disposed.");

        this._renderLoopController?.dispose();
        this._scene.dispose();

        this.onEnvironmentChanged.clear();
        this.onEnvironmentError.clear();
        this.onSkyboxBlurChanged.clear();
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

        this._isDisposed = true;
    }

    /**
     * Return world and canvas coordinates of an hot spot
     * @param query mesh index and surface information to query the hot spot positions
     * @param result Query a Hot Spot and does the conversion for Babylon Hot spot to a more generic HotSpotPositions, without Vector types
     * @returns true if hotspot found
     */
    public getHotSpotToRef(query: Readonly<ViewerHotSpotQuery>, result: ViewerHotSpotResult): boolean {
        return this._modelInfo?.getHotSpotToRef(query, result) ?? false;
    }

    protected _getHotSpotToRef(assetContainer: Nullable<AssetContainer>, query: Readonly<ViewerHotSpotQuery>, result: ViewerHotSpotResult): boolean {
        if (!assetContainer) {
            return false;
        }

        const worldNormal = this._tempVectors[2];
        const worldPos = this._tempVectors[1];
        const screenPos = this._tempVectors[0];

        if (query.type === "surface") {
            const mesh = assetContainer.meshes[query.meshIndex];
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

        const renderWidth = this._engine.getRenderWidth(); // Get the canvas width
        const renderHeight = this._engine.getRenderHeight(); // Get the canvas height

        const viewportWidth = this._camera.viewport.width * renderWidth;
        const viewportHeight = this._camera.viewport.height * renderHeight;
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
     * Refresh bounding info to ensure morph target and skeletal animations are taken into account.
     * @param model The AssetContainer to refresh.
     */
    private _refreshBoundingInfo(model: AssetContainer): void {
        model.meshes.forEach((mesh) => {
            let cache = this._meshDataCache.get(mesh);
            if (!cache) {
                cache = {};
                this._meshDataCache.set(mesh, cache);
            }
            mesh.refreshBoundingInfo({ applyMorph: true, applySkeleton: true, cache });
        });
    }

    /**
     * Calculates the `alpha`, `beta`, and `radius` angles, along with the target point.
     * The target point is determined based on the camera's forward ray:
     *   - If an intersection with the main model is found, the first hit point is used as the target.
     *   - If no intersection is detected, a fallback target is calculated by projecting
     *     the distance between the camera and the main model's center along the forward ray.
     *
     * @param camera The reference camera used to computes infos.
     * @param predicate Used to define predicate for selecting meshes and instances (if exist)
     * @returns An object containing the `alpha`, `beta`, `radius`, and `target` properties, or `null` if no model found.
     */
    public async getArcRotateCameraInfos(camera: Camera, predicate?: MeshPredicate): Promise<Nullable<ViewerArcRotateCameraInfos>> {
        if (camera instanceof ArcRotateCamera) {
            return { alpha: camera.alpha, beta: camera.beta, radius: camera.radius, target: camera.target.clone() };
        }

        await import("core/Culling/ray");
        const ray = camera.getForwardRay(100, camera.getWorldMatrix(), camera.globalPosition); // set starting point to camera global position
        const comGlobalPos = camera.globalPosition.clone();

        if (this._modelWorldCenter) {
            // Target and radius
            let radius: number = 0.0001; // Just to avoid division by zero
            const targetPoint = Vector3.Zero();
            const pickingInfo = this._scene.pickWithRay(ray, predicate);
            if (pickingInfo && pickingInfo.hit) {
                targetPoint.copyFrom(pickingInfo.pickedPoint!);
                radius = Vector3.Distance(comGlobalPos, targetPoint);
            } else {
                const direction = ray.direction.clone();
                targetPoint.copyFrom(comGlobalPos);
                radius = Vector3.Distance(comGlobalPos, this._modelWorldCenter);
                direction.scaleAndAddToRef(radius, targetPoint);
            }

            const computationVector = this._tempVectors[0];
            comGlobalPos.subtractToRef(targetPoint, computationVector);

            // Alpha
            let alpha = Math.PI / 2;
            if (!(computationVector.x === 0 && computationVector.z === 0)) {
                alpha = Math.acos(computationVector.x / Math.sqrt(Math.pow(computationVector.x, 2) + Math.pow(computationVector.z, 2)));
            }
            if (computationVector.z < 0) {
                alpha = 2 * Math.PI - alpha;
            }

            // Beta
            const beta = Math.acos(computationVector.y / radius);

            return { alpha, beta, radius, target: targetPoint };
        }

        return null;
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
            const render = () => {
                this._scene.render();

                // Update the camera panning sensitivity related properties based on the camera's distance from the target.
                this._camera.panningSensibility = 5000 / this._camera.radius;
                this._camera.speed = this._camera.radius * 0.2;

                if (this.isAnimationPlaying) {
                    this.onAnimationProgressChanged.notifyObservers();
                    this._autoRotationBehavior.resetLastInteractionTime();
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
                    }
                },
            };
        }
    }

    private _updateCamera(interpolate = false): void {
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

        if (this._modelInfo?.boundingInfo) {
            // get bounds and prepare framing/camera radius from its values
            this._camera.lowerRadiusLimit = null;

            const boundingInfo = this._modelInfo.boundingInfo;
            const worldExtents = boundingInfo.worldExtents;
            framingBehavior.zoomOnBoundingInfo(worldExtents.min, worldExtents.max);

            goalRadius = boundingInfo.worldSize.length() * 1.1;
            goalTarget = boundingInfo.worldCenter.clone();
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
        if (!this._modelInfo) {
            shouldHaveDefaultLight = false;
        } else {
            const hasModelProvidedLights = this._modelInfo.assetContainer.lights.length > 0;
            const hasImageBasedLighting = !!this._scene.environmentTexture;
            const hasMaterials = this._modelInfo.assetContainer.materials.length > 0;
            const hasNonPBRMaterials = this._modelInfo.assetContainer.materials.some((material) => !(material instanceof PBRMaterial));

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
        this._modelInfo?.assetContainer.animationGroups.forEach((group) => (group.speedRatio = this._animationSpeed));
    }

    protected async _pick(screenX: number, screenY: number): Promise<Nullable<PickingInfo>> {
        await import("core/Culling/ray");
        if (this._modelInfo) {
            const model = this._modelInfo?.assetContainer;
            this._refreshBoundingInfo(model);

            const pickingInfo = this._scene.pick(screenX, screenY, (mesh) => model.meshes.includes(mesh));
            if (pickingInfo.hit) {
                return pickingInfo;
            }
        }

        return null;
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
