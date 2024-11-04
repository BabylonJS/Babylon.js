import type {
    AbstractEngine,
    AnimationGroup,
    AssetContainer,
    AutoRotationBehavior,
    Camera,
    FramingBehavior,
    HotSpotQuery,
    IDisposable,
    LoadAssetContainerOptions,
    Mesh,
    Nullable,
    Observer,
    // eslint-disable-next-line import/no-internal-modules
} from "core/index";

import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { loadAssetContainerAsync } from "core/Loading/sceneLoader";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import { CubeTexture } from "core/Materials/Textures/cubeTexture";
import { Texture } from "core/Materials/Textures/texture";
import { Clamp } from "core/Maths/math.scalar.functions";
import { TmpVectors, Vector3 } from "core/Maths/math.vector";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { computeMaxExtents } from "core/Meshes/meshUtils";
import { AsyncLock } from "core/Misc/asyncLock";
import { Observable } from "core/Misc/observable";
import { Scene } from "core/scene";
import { registerBuiltInLoaders } from "loaders/dynamic";
import { Viewport } from "core/Maths/math.viewport";
import { GetHotSpotToRef } from "core/Meshes/abstractMesh.hotSpot";
import { SnapshotRenderingHelper } from "core/Misc/snapshotRenderingHelper";

function throwIfAborted(...abortSignals: (Nullable<AbortSignal> | undefined)[]): void {
    for (const signal of abortSignals) {
        signal?.throwIfAborted();
    }
}

function createSkybox(scene: Scene, camera: Camera, environmentTexture: CubeTexture, blur: number): Mesh {
    const hdrSkybox = CreateBox("hdrSkyBox", undefined, scene);
    const hdrSkyboxMaterial = new PBRMaterial("skyBox", scene);
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

export type ViewerHotSpotQuery = {
    /**
     * The index of the mesh within the loaded model.
     */
    meshIndex: number;
} & HotSpotQuery;

/**
 * Information computed from the hot spot surface data, canvas and mesh datas
 */
export type ViewerHotSpot = {
    /**
     * 2D canvas position in pixels
     */
    screenPosition: [number, number];
    /**
     * 3D world coordinates
     */
    worldPosition: [number, number, number];
};

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
     * Fired when a model is loaded into the viewer (or unloaded from the viewer).
     */
    public readonly onModelChanged = new Observable<void>();

    /**
     * Fired when an error occurs while loading a model.
     */
    public readonly onModelError = new Observable<unknown>();

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

    private readonly _details: ViewerDetails;
    private readonly _snapshotHelper: SnapshotRenderingHelper;
    private readonly _autoRotationBehavior: AutoRotationBehavior;
    private readonly _renderLoopController: IDisposable;
    private _skybox: Nullable<Mesh> = null;
    private _skyboxBlur: number = 0.3;
    private _light: Nullable<HemisphericLight> = null;

    private _isDisposed = false;

    private readonly _loadModelLock = new AsyncLock();
    private _loadModelAbortController: Nullable<AbortController> = null;

    private readonly _loadEnvironmentLock = new AsyncLock();
    private _environment: Nullable<IDisposable> = null;
    private _loadEnvironmentAbortController: Nullable<AbortController> = null;

    private _selectedAnimation = -1;
    private _activeAnimationObservers: Observer<AnimationGroup>[] = [];
    private _animationSpeed = 1;

    public constructor(
        private readonly _engine: AbstractEngine,
        options?: ViewerOptions
    ) {
        {
            const scene = new Scene(this._engine);
            const camera = new ArcRotateCamera("Viewer Default Camera", 0, 0, 1, Vector3.Zero(), scene);
            this._details = {
                viewer: this,
                scene,
                camera,
                model: null,
            };
        }
        this._details.scene.skipFrustumClipping = true;
        this._details.scene.skipPointerMovePicking = true;
        this._snapshotHelper = new SnapshotRenderingHelper(this._details.scene, { morphTargetsNumMaxInfluences: 30 });
        this._details.camera.attachControl();
        this._updateCamera(); // set default camera values
        this._autoRotationBehavior = this._details.camera.getBehaviorByName("AutoRotation") as AutoRotationBehavior;

        // Load a default light, but ignore errors as the user might be immediately loading their own environment.
        this.resetEnvironment().catch(() => {});

        // TODO: render at least back ground. Maybe we can only run renderloop when a mesh is loaded. What to render until then?
        const render = () => {
            this._details.scene.render();
            if (this.isAnimationPlaying) {
                this.onAnimationProgressChanged.notifyObservers();
                this._autoRotationBehavior.resetLastInteractionTime();
            }
        };

        this._engine.runRenderLoop(render);
        this._renderLoopController = {
            dispose: () => this._engine.stopRenderLoop(render),
        };

        options?.onInitialized?.(this._details);
    }

    /**
     * Enables or disables camera auto orbit.
     */
    public get cameraAutoOrbit(): boolean {
        return this._details.camera.behaviors.includes(this._autoRotationBehavior);
    }

    public set cameraAutoOrbit(value: boolean) {
        if (value !== this.cameraAutoOrbit) {
            if (value) {
                this._details.camera.addBehavior(this._autoRotationBehavior);
            } else {
                this._details.camera.removeBehavior(this._autoRotationBehavior);
            }
            this.onCameraAutoOrbitChanged.notifyObservers();
        }
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
            }

            this._updateCamera();
            this.onSelectedAnimationChanged.notifyObservers();
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
    public async loadModel(source: string | File | ArrayBufferView, options?: LoadAssetContainerOptions, abortSignal?: AbortSignal): Promise<void> {
        await this._updateModel(source, options, abortSignal);
    }

    /**
     * Unloads the current 3D model if one is loaded.
     * @param abortSignal An optional signal that can be used to abort the reset.
     */
    public async resetModel(abortSignal?: AbortSignal): Promise<void> {
        await this._updateModel(undefined, undefined, abortSignal);
    }

    private async _updateModel(source: string | File | ArrayBufferView | undefined, options?: LoadAssetContainerOptions, abortSignal?: AbortSignal): Promise<void> {
        this._throwIfDisposedOrAborted(abortSignal);

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
                    this._details.model = await loadAssetContainerAsync(source, this._details.scene, options);
                    this._details.model.animationGroups.forEach((group) => {
                        group.start(true, this.animationSpeed);
                        group.pause();
                    });
                    this.selectedAnimation = 0;
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

            try {
                if (url) {
                    this._environment = await new Promise<IDisposable>((resolve, reject) => {
                        const cubeTexture = CubeTexture.CreateFromPrefilteredData(url, this._details.scene);
                        this._details.scene.environmentTexture = cubeTexture;

                        const skybox = createSkybox(this._details.scene, this._details.camera, cubeTexture, this.skyboxBlur);
                        this._snapshotHelper.fixMeshes([skybox]);
                        this._skybox = skybox;

                        this._details.scene.autoClear = false;

                        const dispose = () => {
                            cubeTexture.dispose();
                            skybox.dispose();
                            this._skybox = null;
                        };

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

        this._renderLoopController.dispose();
        this._details.scene.dispose();

        this.onEnvironmentChanged.clear();
        this.onEnvironmentError.clear();
        this.onSkyboxBlurChanged.clear();
        this.onModelChanged.clear();
        this.onModelError.clear();
        this.onCameraAutoOrbitChanged.clear();
        this.onSelectedAnimationChanged.clear();
        this.onAnimationSpeedChanged.clear();
        this.onIsAnimationPlayingChanged.clear();
        this.onAnimationProgressChanged.clear();

        this._isDisposed = true;
    }

    /**
     * retrun world and canvas coordinates of an hot spot
     * @param hotSpotQuery mesh index and surface information to query the hot spot positions
     * @param res Query a Hot Spot and does the conversion for Babylon Hot spot to a more generic HotSpotPositions, without Vector types
     * @returns true if hotspot found
     */
    public getHotSpotToRef(hotSpotQuery: Readonly<ViewerHotSpotQuery>, res: ViewerHotSpot): boolean {
        if (!this._details.model) {
            return false;
        }
        const worldPos = TmpVectors.Vector3[1];
        const screenPos = TmpVectors.Vector3[0];
        const mesh = this._details.model.meshes[hotSpotQuery.meshIndex];
        if (!mesh) {
            return false;
        }
        GetHotSpotToRef(mesh, hotSpotQuery, worldPos);

        const renderWidth = this._engine.getRenderWidth(); // Get the canvas width
        const renderHeight = this._engine.getRenderHeight(); // Get the canvas height

        const viewportWidth = this._details.camera.viewport.width * renderWidth;
        const viewportHeight = this._details.camera.viewport.height * renderHeight;
        const scene = this._details.scene;

        Vector3.ProjectToRef(worldPos, mesh.getWorldMatrix(), scene.getTransformMatrix(), new Viewport(0, 0, viewportWidth, viewportHeight), screenPos);
        res.screenPosition = [screenPos.x, screenPos.y];
        res.worldPosition = [worldPos.x, worldPos.y, worldPos.z];
        return true;
    }

    private _updateCamera(): void {
        // Enable camera's behaviors
        this._details.camera.useFramingBehavior = true;
        const framingBehavior = this._details.camera.getBehaviorByName("Framing") as FramingBehavior;
        framingBehavior.framingTime = 0;
        framingBehavior.elevationReturnTime = -1;

        let radius = 1;
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

            radius = worldSize.length() * 1.1;

            if (!isFinite(radius)) {
                radius = 1;
                worldCenter.copyFromFloats(0, 0, 0);
            }

            this._details.camera.setTarget(worldCenter);
        }
        this._details.camera.lowerRadiusLimit = radius * 0.01;
        this._details.camera.wheelPrecision = 100 / radius;
        this._details.camera.alpha = Math.PI / 2;
        this._details.camera.beta = Math.PI / 2.4;
        this._details.camera.radius = radius;
        this._details.camera.minZ = radius * 0.01;
        this._details.camera.maxZ = radius * 1000;
        this._details.camera.speed = radius * 0.2;
        this._details.camera.useAutoRotationBehavior = true;
        this._details.camera.pinchPrecision = 200 / this._details.camera.radius;
        this._details.camera.upperRadiusLimit = 5 * this._details.camera.radius;
        this._details.camera.wheelDeltaPercentage = 0.01;
        this._details.camera.pinchDeltaPercentage = 0.01;
        this._details.camera.restoreStateInterpolationFactor = 0.1;
        this._details.camera.storeState();

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
