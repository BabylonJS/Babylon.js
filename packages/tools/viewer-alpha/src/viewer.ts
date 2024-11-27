import type {
    AbstractEngine,
    AnimationGroup,
    AssetContainer,
    AutoRotationBehavior,
    Camera,
    FramingBehavior,
    HotSpotQuery,
    IDisposable,
    ISceneLoaderProgressEvent,
    LoadAssetContainerOptions,
    Mesh,
    Nullable,
    Observer,
    // eslint-disable-next-line import/no-internal-modules
} from "core/index";

import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { loadAssetContainerAsync } from "core/Loading/sceneLoader";
import { ImageProcessingConfiguration } from "core/Materials/imageProcessingConfiguration";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { CubeTexture } from "core/Materials/Textures/cubeTexture";
import { Texture } from "core/Materials/Textures/texture";
import { Clamp } from "core/Maths/math.scalar.functions";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { computeMaxExtents } from "core/Meshes/meshUtils";
import { AsyncLock } from "core/Misc/asyncLock";
import { Observable } from "core/Misc/observable";
import { Scene } from "core/scene";
import { registerBuiltInLoaders } from "loaders/dynamic";
import { Viewport } from "core/Maths/math.viewport";
import { GetHotSpotToRef } from "core/Meshes/abstractMesh.hotSpot";
import { SnapshotRenderingHelper } from "core/Misc/snapshotRenderingHelper";
import { BuildTuple } from "core/Misc/arrayTools";

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

function createSkybox(scene: Scene, camera: Camera, environmentTexture: CubeTexture, blur: number): Mesh {
    const hdrSkybox = CreateBox("hdrSkyBox", undefined, scene);
    const hdrSkyboxMaterial = new PBRMaterial("skyBox", scene);
    // Use the default image processing configuration on the skybox (e.g. don't apply tone mapping, contrast, or exposure).
    hdrSkyboxMaterial.imageProcessingConfiguration = new ImageProcessingConfiguration();
    hdrSkyboxMaterial.backFaceCulling = false;
    hdrSkyboxMaterial.reflectionTexture = environmentTexture.clone();
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
     * Gets the Viewer instance.
     */
    viewer: Viewer;

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
    model: Nullable<AssetContainer>;

    /**
     * Suspends the render loop.
     * @returns A token that should be disposed when the request for suspending rendering is no longer needed.
     */
    suspendRendering(): IDisposable;
};

export type ViewerOptions = Partial<
    Readonly<{
        /**
         * Called once when the viewer is initialized and provides viewer details that can be used for advanced customization.
         */
        onInitialized: (details: Readonly<ViewerDetails>) => void;
    }>
>;

export type EnvironmentOptions = Partial<Readonly<{}>>;

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

/**
 * @experimental
 * Provides an experience for viewing a single 3D model.
 * @remarks
 * The Viewer is not tied to a specific UI framework and can be used with Babylon.js in a browser or with Babylon Native.
 * Includes (or will include) support for common model viewing requirements such as:
 * - Loading different model formats.
 * - Setting up a camera and providing default behaviors like auto orbit and pose interpolation.
 * - Framing the loaded model in the camera's view.
 * - Setting up the environment, lighting, and tone mapping.
 * - Enumerating and playing (or auto playing) animations.
 * - Enumerating and switching between material variants.
 * - Full screen and XR modes.
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
     */
    public readonly onModelChanged = new Observable<void>();

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

    private readonly _tempVectors = BuildTuple(4, Vector3.Zero);
    private readonly _details: ViewerDetails;
    private readonly _snapshotHelper: SnapshotRenderingHelper;
    private readonly _autoRotationBehavior: AutoRotationBehavior;
    private readonly _imageProcessingConfigurationObserver: Observer<ImageProcessingConfiguration>;
    private _renderLoopController: Nullable<IDisposable> = null;
    private _skybox: Nullable<Mesh> = null;
    private _skyboxBlur: number = 0.3;
    private _light: Nullable<HemisphericLight> = null;
    private _toneMappingEnabled: boolean;
    private _toneMappingType: number;
    private _contrast: number;
    private _exposure: number;

    private _suspendRenderCount = 0;
    private _isDisposed = false;

    private readonly _loadModelLock = new AsyncLock();
    private _loadModelAbortController: Nullable<AbortController> = null;

    private readonly _loadEnvironmentLock = new AsyncLock();
    private _environment: Nullable<IDisposable> = null;
    private _loadEnvironmentAbortController: Nullable<AbortController> = null;

    private _isLoadingModel = false;
    private _modelLoadingProgress: Nullable<number> = null;

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
            this._details = {
                viewer: this,
                scene,
                camera,
                model: null,
                suspendRendering: this._suspendRendering.bind(this),
            };
        }
        this._details.scene.skipFrustumClipping = true;
        this._details.scene.skipPointerMovePicking = true;
        this._snapshotHelper = new SnapshotRenderingHelper(this._details.scene, { morphTargetsNumMaxInfluences: 30 });
        this._details.camera.attachControl();
        this._updateCamera(); // set default camera values
        this._autoRotationBehavior = this._details.camera.getBehaviorByName("AutoRotation") as AutoRotationBehavior;

        // Default to KHR PBR Neutral tone mapping.
        this.postProcessing = {
            toneMapping: "neutral",
        };

        // Load a default light, but ignore errors as the user might be immediately loading their own environment.
        this.resetEnvironment().catch(() => {});

        this._beginRendering();

        options?.onInitialized?.(this._details);
    }

    /**
     * The camera auto orbit configuration.
     */
    public get cameraAutoOrbit(): Readonly<CameraAutoOrbit> {
        return {
            enabled: this._details.camera.behaviors.includes(this._autoRotationBehavior),
            speed: this._autoRotationBehavior.idleRotationSpeed,
            delay: this._autoRotationBehavior.idleRotationWaitTime,
        };
    }

    public set cameraAutoOrbit(value: Partial<Readonly<CameraAutoOrbit>>) {
        if (value.enabled !== undefined && value.enabled !== this.cameraAutoOrbit.enabled) {
            if (value.enabled) {
                this._details.camera.addBehavior(this._autoRotationBehavior);
            } else {
                this._details.camera.removeBehavior(this._autoRotationBehavior);
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
                this._details.scene.imageProcessingConfiguration.toneMappingEnabled = false;
            } else {
                switch (value.toneMapping) {
                    case "standard":
                        this._details.scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_STANDARD;
                        break;
                    case "aces":
                        this._details.scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
                        break;
                    case "neutral":
                        this._details.scene.imageProcessingConfiguration.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_KHR_PBR_NEUTRAL;
                        break;
                }
                this._details.scene.imageProcessingConfiguration.toneMappingEnabled = true;
            }
        }

        if (value.contrast !== undefined) {
            this._details.scene.imageProcessingConfiguration.contrast = value.contrast;
        }

        if (value.exposure !== undefined) {
            this._details.scene.imageProcessingConfiguration.exposure = value.exposure;
        }

        this._details.scene.imageProcessingConfiguration.isEnabled = this._toneMappingEnabled || this._contrast !== 1 || this._exposure !== 1;

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
        if (this._isLoadingModel) {
            return this._modelLoadingProgress ?? true;
        }

        return false;
    }

    /**
     * The list of animation names for the currently loaded model.
     */
    public get animations(): readonly string[] {
        return this._details.model?.animationGroups.map((group) => group.name) ?? [];
    }

    /**
     * The currently selected animation index.
     */
    public get selectedAnimation(): number {
        return this._selectedAnimation;
    }

    public set selectedAnimation(value: number) {
        value = Math.round(Clamp(value, -1, this.animations.length - 1));
        if (value !== this._selectedAnimation) {
            const startAnimation = this.isAnimationPlaying;
            if (this._activeAnimation) {
                this._activeAnimationObservers.forEach((observer) => observer.remove());
                this._activeAnimationObservers = [];
                this._activeAnimation.pause();
                this._activeAnimation.goToFrame(0);
            }

            this._selectedAnimation = value;

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

                this._updateCamera(!this._isLoadingModel);
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
        return this._details.model?.animationGroups[this._selectedAnimation] ?? null;
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

    private async _updateModel(source: string | File | ArrayBufferView | undefined, options?: LoadModelOptions, abortSignal?: AbortSignal): Promise<void> {
        this._throwIfDisposedOrAborted(abortSignal);

        const originalOnProgress = options?.onProgress;
        const onProgress = (event: ISceneLoaderProgressEvent) => {
            originalOnProgress?.(event);
            if (this._isLoadingModel) {
                this._modelLoadingProgress = event.lengthComputable ? event.loaded / event.total : null;
                this.onLoadingProgressChanged.notifyObservers();
            }
        };

        // Enable transparency as coverage by default to be 3D Commerce compliant by default.
        // https://doc.babylonjs.com/setup/support/3D_commerce_certif
        if (!options?.pluginOptions?.gltf?.transparencyAsCoverage) {
            options = {
                ...options,
                pluginOptions: {
                    ...options?.pluginOptions,
                    gltf: {
                        ...options?.pluginOptions?.gltf,
                        transparencyAsCoverage: true,
                    },
                },
                onProgress,
            };
        }

        this._loadModelAbortController?.abort("New model is being loaded before previous model finished loading.");
        const abortController = (this._loadModelAbortController = new AbortController());

        await this._loadModelLock.lockAsync(async () => {
            throwIfAborted(abortSignal, abortController.signal);
            this._snapshotHelper.disableSnapshotRendering();
            this._details.model?.dispose();
            this._details.model = null;
            this.selectedAnimation = -1;

            try {
                if (source) {
                    this._isLoadingModel = true;
                    this._modelLoadingProgress = 0;
                    this.onLoadingProgressChanged.notifyObservers();
                    this._details.model = await loadAssetContainerAsync(source, this._details.scene, options);
                    this._details.model.animationGroups.forEach((group) => {
                        group.start(true, this.animationSpeed);
                        group.pause();
                    });
                    this.selectedAnimation = options?.defaultAnimation ?? 0;
                    this._snapshotHelper.fixMeshes(this._details.model.meshes);
                    this._details.model.addAllToScene();
                }

                this._updateCamera();
                this._updateLight();
                this._applyAnimationSpeed();
                this.onModelChanged.notifyObservers();
            } catch (e) {
                this.onModelError.notifyObservers(e);
                throw e;
            } finally {
                this._isLoadingModel = false;
                this.onLoadingProgressChanged.notifyObservers();
                this._snapshotHelper.enableSnapshotRendering();
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
     * @param abortSignal An optional signal that can be used to abort the reset.
     */
    public async resetEnvironment(abortSignal?: AbortSignal): Promise<void> {
        await this._updateEnvironment(undefined, undefined, abortSignal);
    }

    private async _updateEnvironment(url: Nullable<string | undefined>, options?: EnvironmentOptions, abortSignal?: AbortSignal): Promise<void> {
        this._throwIfDisposedOrAborted(abortSignal);

        this._loadEnvironmentAbortController?.abort("New environment is being loaded before previous environment finished loading.");
        const abortController = (this._loadEnvironmentAbortController = new AbortController());

        await this._loadEnvironmentLock.lockAsync(async () => {
            throwIfAborted(abortSignal, abortController.signal);
            this._snapshotHelper.disableSnapshotRendering();
            this._environment?.dispose();
            this._environment = null;
            this._details.scene.autoClear = true;

            const disposeActions: (() => void)[] = [];
            try {
                if (url) {
                    const cubeTexture = CubeTexture.CreateFromPrefilteredData(url, this._details.scene);
                    disposeActions.push(() => cubeTexture.dispose());

                    const skybox = createSkybox(this._details.scene, this._details.camera, cubeTexture, this.skyboxBlur);
                    disposeActions.push(() => skybox.dispose());
                    this._snapshotHelper.fixMeshes([skybox]);

                    this._details.scene.environmentTexture = cubeTexture;
                    disposeActions.push(() => (this._details.scene.environmentTexture = null));
                    this._skybox = skybox;
                    disposeActions.push(() => (this._skybox = null));

                    this._details.scene.autoClear = false;
                    disposeActions.push(() => (this._details.scene.autoClear = true));

                    const dispose = () => disposeActions.forEach((dispose) => dispose());

                    this._environment = await new Promise<IDisposable>((resolve, reject) => {
                        const successObserver = cubeTexture.onLoadObservable.addOnce(() => {
                            successObserver.remove();
                            errorObserver.remove();
                            resolve({
                                dispose,
                            });
                        });

                        const errorObserver = Texture.OnTextureLoadErrorObservable.add((texture) => {
                            if (texture === cubeTexture) {
                                successObserver.remove();
                                errorObserver.remove();
                                dispose();
                                reject(new Error("Failed to load environment texture."));
                            }
                        });
                    });
                }

                this._updateLight();
                this.onEnvironmentChanged.notifyObservers();
            } catch (e) {
                disposeActions.forEach((dispose) => dispose());
                this.onEnvironmentError.notifyObservers(e);
                throw e;
            } finally {
                this._snapshotHelper.enableSnapshotRendering();
            }
        });
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
     * Disposes of the resources held by the Viewer.
     */
    public dispose(): void {
        this.selectedAnimation = -1;
        this.animationProgress = 0;

        this._loadEnvironmentAbortController?.abort("Thew viewer is being disposed.");
        this._loadModelAbortController?.abort("Thew viewer is being disposed.");

        this._renderLoopController?.dispose();
        this._details.scene.dispose();

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
     * retrun world and canvas coordinates of an hot spot
     * @param query mesh index and surface information to query the hot spot positions
     * @param result Query a Hot Spot and does the conversion for Babylon Hot spot to a more generic HotSpotPositions, without Vector types
     * @returns true if hotspot found
     */
    public getHotSpotToRef(query: Readonly<ViewerHotSpotQuery>, result: ViewerHotSpotResult): boolean {
        if (!this._details.model) {
            return false;
        }

        const worldNormal = this._tempVectors[2];
        const worldPos = this._tempVectors[1];
        const screenPos = this._tempVectors[0];

        if (query.type === "surface") {
            const mesh = this._details.model.meshes[query.meshIndex];
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

        const viewportWidth = this._details.camera.viewport.width * renderWidth;
        const viewportHeight = this._details.camera.viewport.height * renderHeight;
        const scene = this._details.scene;

        Vector3.ProjectToRef(worldPos, Matrix.IdentityReadOnly, scene.getTransformMatrix(), new Viewport(0, 0, viewportWidth, viewportHeight), screenPos);
        result.screenPosition[0] = screenPos.x;
        result.screenPosition[1] = screenPos.y;
        result.worldPosition[0] = worldPos.x;
        result.worldPosition[1] = worldPos.y;
        result.worldPosition[2] = worldPos.z;

        // visibility
        const eyeToSurface = this._tempVectors[3];
        eyeToSurface.copyFrom(this._details.camera.globalPosition);
        eyeToSurface.subtractInPlace(worldPos);
        eyeToSurface.normalize();
        result.visibility = Vector3.Dot(eyeToSurface, worldNormal);

        return true;
    }

    private _suspendRendering(): IDisposable {
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
                this._details.scene.render();
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
        // Enable camera's behaviors
        this._details.camera.useFramingBehavior = true;
        const framingBehavior = this._details.camera.getBehaviorByName("Framing") as FramingBehavior;
        framingBehavior.framingTime = 0;
        framingBehavior.elevationReturnTime = -1;

        const currentAlpha = this._details.camera.alpha;
        const currentBeta = this._details.camera.beta;
        const currentRadius = this._details.camera.radius;
        const currentTarget = this._details.camera.target;

        const goalAlpha = Math.PI / 2;
        const goalBeta = Math.PI / 2.4;
        let goalRadius = 1;
        let goalTarget = currentTarget;

        if (this._details.model?.meshes.length) {
            // get bounds and prepare framing/camera radius from its values
            this._details.camera.lowerRadiusLimit = null;

            const maxExtents = computeMaxExtents(this._details.model.meshes, this._activeAnimation);
            const worldExtents = {
                min: new Vector3(Math.min(...maxExtents.map((e) => e.minimum.x)), Math.min(...maxExtents.map((e) => e.minimum.y)), Math.min(...maxExtents.map((e) => e.minimum.z))),
                max: new Vector3(Math.max(...maxExtents.map((e) => e.maximum.x)), Math.max(...maxExtents.map((e) => e.maximum.y)), Math.max(...maxExtents.map((e) => e.maximum.z))),
            };
            framingBehavior.zoomOnBoundingInfo(worldExtents.min, worldExtents.max);

            const worldSize = worldExtents.max.subtract(worldExtents.min);
            const worldCenter = worldExtents.min.add(worldSize.scale(0.5));

            goalRadius = worldSize.length() * 1.1;

            if (!isFinite(goalRadius)) {
                goalRadius = 1;
                worldCenter.copyFromFloats(0, 0, 0);
            }

            goalTarget = worldCenter;
        }
        this._details.camera.lowerRadiusLimit = goalRadius * 0.01;
        this._details.camera.wheelPrecision = 100 / goalRadius;
        this._details.camera.alpha = Math.PI / 2;
        this._details.camera.beta = Math.PI / 2.4;
        this._details.camera.radius = goalRadius;
        this._details.camera.target = goalTarget;
        this._details.camera.minZ = goalRadius * 0.01;
        this._details.camera.maxZ = goalRadius * 1000;
        this._details.camera.speed = goalRadius * 0.2;
        this._details.camera.useAutoRotationBehavior = true;
        this._details.camera.pinchPrecision = 200 / this._details.camera.radius;
        this._details.camera.upperRadiusLimit = 5 * this._details.camera.radius;
        this._details.camera.wheelDeltaPercentage = 0.01;
        this._details.camera.pinchDeltaPercentage = 0.01;
        this._details.camera.restoreStateInterpolationFactor = 0.1;
        this._details.camera.storeState();

        if (interpolate) {
            this._details.camera.alpha = currentAlpha;
            this._details.camera.beta = currentBeta;
            this._details.camera.radius = currentRadius;
            this._details.camera.target = currentTarget;
            this._details.camera.interpolateTo(goalAlpha, goalBeta, goalRadius, goalTarget);
        }

        updateSkybox(this._skybox, this._details.camera);
    }

    private _updateLight() {
        let shouldHaveDefaultLight: boolean;
        if (!this._details.model) {
            shouldHaveDefaultLight = false;
        } else {
            const hasModelProvidedLights = this._details.model.lights.length > 0;
            const hasImageBasedLighting = !!this._environment;
            const hasMaterials = this._details.model.materials.length > 0;
            const hasNonPBRMaterials = this._details.model.materials.some((material) => !(material instanceof PBRMaterial));

            if (hasModelProvidedLights) {
                shouldHaveDefaultLight = false;
            } else {
                shouldHaveDefaultLight = !hasImageBasedLighting || !hasMaterials || hasNonPBRMaterials;
            }
        }

        if (shouldHaveDefaultLight) {
            if (!this._light) {
                this._light = new HemisphericLight("defaultLight", Vector3.Up(), this._details.scene);
            }
        } else {
            this._light?.dispose();
            this._light = null;
        }
    }

    private _applyAnimationSpeed() {
        this._details.model?.animationGroups.forEach((group) => (group.speedRatio = this._animationSpeed));
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
