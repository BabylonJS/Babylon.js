import type {
    AbstractEngine,
    AnimationGroup,
    AssetContainer,
    AutoRotationBehavior,
    Camera,
    FramingBehavior,
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
import { Color4 } from "core/Maths/math.color";
import { Scalar } from "core/Maths/math.scalar";
import { Vector3 } from "core/Maths/math.vector";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { AsyncLock } from "core/Misc/asyncLock";
import { Observable } from "core/Misc/observable";
import { Scene } from "core/scene";

// TODO: Dynamic imports?
import "core/Animations/animatable";
import "core/Materials/Textures/Loaders/envTextureLoader";
// eslint-disable-next-line import/no-internal-modules
import "loaders/glTF/2.0/index";

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
    hdrSkybox.ignoreCameraMaxZ = true;

    updateSkybox(hdrSkybox, camera);

    return hdrSkybox;
}

function updateSkybox(skybox: Nullable<Mesh>, camera: Camera): void {
    skybox?.scaling.setAll((camera.maxZ - camera.minZ) / 2);
}

const defaultViewerOptions = {
    backgroundColor: new Color4(0.1, 0.1, 0.2, 1.0),
} as const;

export type ViewerDetails = {
    /**
     * Provides access to the Scene managed by the Viewer.
     */
    scene: Scene;

    /**
     * Provides access to the currently loaded model.
     */
    model: Nullable<AssetContainer>;
};

export type ViewerOptions = Partial<
    typeof defaultViewerOptions &
        Readonly<{
            /**
             * Called once when the viewer is initialized and provides viewer details that can be used for advanced customization.
             */
            onInitialized: (details: Readonly<ViewerDetails>) => void;
        }>
>;

/**
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
    /**
     * Fired when a model is loaded into the viewer.
     */
    public readonly onModelLoaded = new Observable<void>();

    /**
     * Fired when an error occurs while loading a model.
     */
    public readonly onModelError = new Observable<unknown>();

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
    private readonly _camera: ArcRotateCamera;
    private readonly _autoRotationBehavior: AutoRotationBehavior;
    private readonly _renderLoopController: IDisposable;
    private _skybox: Nullable<Mesh> = null;

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
        const finalOptions = { ...defaultViewerOptions, ...options };
        this._details = {
            scene: new Scene(this._engine),
            model: null,
        };
        this._details.scene.clearColor = finalOptions.backgroundColor;
        this._camera = new ArcRotateCamera("camera1", 0, 0, 1, Vector3.Zero(), this._details.scene);
        this._camera.attachControl();
        this._updateCamera(); // set default camera values
        this._autoRotationBehavior = this._camera.getBehaviorByName("AutoRotation") as AutoRotationBehavior;

        // Load a default light, but ignore errors as the user might be immediately loading their own environment.
        this.loadEnvironmentAsync(undefined).catch(() => {});

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
        value = Math.round(Scalar.Clamp(value, -1, this.animations.length - 1));
        if (value !== this._selectedAnimation) {
            const startAnimation = this.isAnimationPlaying;
            if (this._activeAnimation) {
                this._activeAnimation.goToFrame(0);
                this._activeAnimation.stop();
                this._activeAnimationObservers.forEach((observer) => observer.remove());
                this._activeAnimationObservers = [];
            }

            this._selectedAnimation = value;

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

                this._activeAnimation.start(true, this._animationSpeed);

                if (!startAnimation) {
                    this.pauseAnimation();
                }
            }

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
    public async loadModelAsync(source: string | File | ArrayBufferView, options?: LoadAssetContainerOptions, abortSignal?: AbortSignal): Promise<void> {
        this._throwIfDisposedOrAborted(abortSignal);

        this._loadModelAbortController?.abort("New model is being loaded before previous model finished loading.");
        const abortController = (this._loadModelAbortController = new AbortController());

        // TODO: Disable audio for now, later figure out how to re-introduce it through dynamic imports.
        options = {
            ...options,
            pluginOptions: {
                ...options?.pluginOptions,
                gltf: {
                    ...options?.pluginOptions?.gltf,
                    extensionOptions: {
                        ...options?.pluginOptions?.gltf?.extensionOptions,
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        KHR_audio: {
                            enabled: false,
                        },
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        MSFT_audio_emitter: {
                            enabled: false,
                        },
                    },
                },
            },
        };

        await this._loadModelLock.lockAsync(async () => {
            this._throwIfDisposedOrAborted(abortSignal, abortController.signal);
            this._details.model?.dispose();
            this.selectedAnimation = -1;

            try {
                this._details.model = await loadAssetContainerAsync(source, this._details.scene, options);
                this._details.model.animationGroups.forEach((group) => group.stop());
                this.selectedAnimation = 0;
                this._details.model.addAllToScene();

                this._updateCamera();
                this._applyAnimationSpeed();
                this.onModelLoaded.notifyObservers();
            } catch (e) {
                this.onModelError.notifyObservers(e);
                throw e;
            }
        });
    }

    /**
     * Loads an environment texture from the specified url and sets up a corresponding skybox.
     * @remarks
     * If no url is provided, a default hemispheric light will be created.
     * If an environment is already loaded, it will be unloaded before loading the new environment.
     * @param url The url of the environment texture to load.
     * @param options The options to use when loading the environment.
     * @param abortSignal An optional signal that can be used to abort the loading process.
     */
    public async loadEnvironmentAsync(url: Nullable<string | undefined>, options?: {}, abortSignal?: AbortSignal): Promise<void> {
        this._throwIfDisposedOrAborted(abortSignal);

        this._loadEnvironmentAbortController?.abort("New environment is being loaded before previous environment finished loading.");
        const abortController = (this._loadEnvironmentAbortController = new AbortController());

        await this._loadEnvironmentLock.lockAsync(async () => {
            this._throwIfDisposedOrAborted(abortSignal, abortController.signal);
            this._environment?.dispose();
            this._environment = await new Promise<IDisposable>((resolve, reject) => {
                if (!url) {
                    const light = new HemisphericLight("hemilight", Vector3.Up(), this._details.scene);
                    this._details.scene.autoClear = true;
                    resolve(light);
                } else {
                    const cubeTexture = CubeTexture.CreateFromPrefilteredData(url, this._details.scene);
                    this._details.scene.environmentTexture = cubeTexture;

                    const skybox = createSkybox(this._details.scene, this._camera, cubeTexture, 0.3);
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
                }
            });
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

        this._renderLoopController.dispose();
        this._details.scene.dispose();

        this.onModelLoaded.clear();
        this.onModelError.clear();
        this.onSelectedAnimationChanged.clear();
        this.onAnimationSpeedChanged.clear();
        this.onIsAnimationPlayingChanged.clear();
        this.onAnimationProgressChanged.clear();

        this._isDisposed = true;
    }

    // copy/paste from sandbox and scene helpers
    private _updateCamera(): void {
        // Enable camera's behaviors
        this._camera.useFramingBehavior = true;
        const framingBehavior = this._camera.getBehaviorByName("Framing") as FramingBehavior;
        framingBehavior.framingTime = 0;
        framingBehavior.elevationReturnTime = -1;

        let radius = 1;
        if (this._details.scene.meshes.length) {
            // get bounds and prepare framing/camera radius from its values
            this._camera.lowerRadiusLimit = null;

            const worldExtends = this._details.scene.getWorldExtends((mesh) => {
                return mesh.isVisible && mesh.isEnabled();
            });
            framingBehavior.zoomOnBoundingInfo(worldExtends.min, worldExtends.max);

            const worldSize = worldExtends.max.subtract(worldExtends.min);
            const worldCenter = worldExtends.min.add(worldSize.scale(0.5));

            radius = worldSize.length() * 1.2;

            if (!isFinite(radius)) {
                radius = 1;
                worldCenter.copyFromFloats(0, 0, 0);
            }

            this._camera.setTarget(worldCenter);
        }
        this._camera.lowerRadiusLimit = radius * 0.01;
        this._camera.wheelPrecision = 100 / radius;
        this._camera.alpha = Math.PI / 2;
        this._camera.beta = Math.PI / 2;
        this._camera.radius = radius;
        this._camera.minZ = radius * 0.01;
        this._camera.maxZ = radius * 1000;
        this._camera.speed = radius * 0.2;
        this._camera.useAutoRotationBehavior = true;
        this._camera.pinchPrecision = 200 / this._camera.radius;
        this._camera.upperRadiusLimit = 5 * this._camera.radius;
        this._camera.wheelDeltaPercentage = 0.01;
        this._camera.pinchDeltaPercentage = 0.01;
        this._camera.restoreStateInterpolationFactor = 0.1;

        updateSkybox(this._skybox, this._camera);
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

        for (const signal of abortSignals) {
            signal?.throwIfAborted();
        }
    }
}
