import type { FramingBehavior } from "core/Behaviors/Cameras/framingBehavior";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import type { AbstractEngine } from "core/Engines";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import { SceneLoader } from "core/Loading/sceneLoader";
import { CubeTexture } from "core/Materials/Textures/cubeTexture";
import { Texture } from "core/Materials/Textures/texture";
import { Color4 } from "core/Maths/math";
import { Vector3 } from "core/Maths/math.vector";
import { AsyncLock } from "core/Misc/asyncLock";
import type { AssetContainer } from "core/assetContainer";
import type { IDisposable } from "core/scene";
import { Scene } from "core/scene";
import type { Nullable } from "core/types";

// TODO: Dynamic imports?
import "core/Animations/animatable";
import "core/Materials/Textures/Loaders/envTextureLoader";
import "core/Helpers/sceneHelpers";
// eslint-disable-next-line import/no-internal-modules
import "loaders/glTF/2.0/index";

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
    private readonly _details: ViewerDetails;
    private readonly _camera: ArcRotateCamera;

    private _isDisposed = false;

    private readonly _loadModelLock = new AsyncLock();
    private _loadModelAbortController: Nullable<AbortController> = null;

    private readonly _loadEnvironmentLock = new AsyncLock();
    private _environment: Nullable<IDisposable> = null;
    private _loadEnvironmentAbortController: Nullable<AbortController> = null;

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
        this._reframeCamera(); // set default camera values

        // Load a default light, but ignore errors as the user might be immediately loading their own environment.
        this.loadEnvironmentAsync(undefined).catch(() => {});

        // TODO: render at least back ground. Maybe we can only run renderloop when a mesh is loaded. What to render until then?
        this._engine.runRenderLoop(() => {
            this._details.scene.render();
        });

        options?.onInitialized?.(this._details);
    }

    /**
     * Loads a 3D model from the specified URL.
     * @remarks
     * If a model is already loaded, it will be unloaded before loading the new model.
     * @param url The URL of the model to load.
     * @param abortSignal An optional signal that can be used to abort the loading process.
     */
    public async loadModelAsync(url: string, abortSignal?: AbortSignal): Promise<void> {
        this._throwIfDisposedOrAborted(abortSignal);

        this._loadModelAbortController?.abort("New model is being loaded before previous model finished loading.");
        const abortController = (this._loadModelAbortController = new AbortController());

        await this._loadModelLock.lockAsync(async () => {
            this._throwIfDisposedOrAborted(abortSignal, abortController.signal);
            this._details.model?.dispose();
            this._details.model = await SceneLoader.LoadAssetContainerAsync("", url, this._details.scene);
            this._details.model.addAllToScene();
            this._reframeCamera();
        });
    }

    /**
     * Loads an environment texture from the specified URL and sets up a corresponding skybox.
     * @remarks
     * If no URL is provided, a default hemispheric light will be created.
     * If an environment is already loaded, it will be unloaded before loading the new environment.
     * @param url The URL of the environment texture to load.
     * @param abortSignal An optional signal that can be used to abort the loading process.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async loadEnvironmentAsync(url: Nullable<string | undefined>, abortSignal?: AbortSignal): Promise<void> {
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
                    const skybox = this._details.scene.createDefaultSkybox(cubeTexture, true, (this._camera.maxZ - this._camera.minZ) / 2, 0.3);
                    this._details.scene.autoClear = false;

                    const successObserver = cubeTexture.onLoadObservable.addOnce(() => {
                        successObserver.remove();
                        errorObserver.remove();
                        resolve({
                            dispose() {
                                cubeTexture.dispose();
                                skybox?.dispose();
                            },
                        });
                    });

                    const errorObserver = Texture.OnTextureLoadErrorObservable.add((texture) => {
                        if (texture === cubeTexture) {
                            successObserver.remove();
                            errorObserver.remove();
                            reject(new Error("Failed to load environment texture."));
                        }
                    });
                }
            });
        });
    }

    /**
     * Disposes of the resources held by the Viewer.
     */
    public dispose(): void {
        this._details.scene.dispose();
        this._isDisposed = true;
    }

    // copy/paste from sandbox and scene helpers
    private _reframeCamera(): void {
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
