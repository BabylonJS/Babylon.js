/* eslint-disable @typescript-eslint/naming-convention */
import { type HotSpotQuery, type IColor4Like, type IDisposable, type Nullable, type IReadonlyObservable } from "core/index";
import { AbortError } from "core/Misc/error";
import { Logger } from "core/Misc/logger";
import { Observable } from "core/Misc/observable";

/**
 * Throws if any of the supplied abort signals is aborted.
 * @param abortSignals The signals to check.
 */
export function throwIfAborted(...abortSignals: (Nullable<AbortSignal> | undefined)[]): void {
    for (const signal of abortSignals) {
        signal?.throwIfAborted();
    }
}

/**
 * Fire-and-forget wrapper for a promise that logs non-abort errors.
 * @param promise The promise to observe.
 */
export function observePromise(promise: Promise<unknown>): void {
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
 * Flags for selectively resetting parts of the viewer state.
 */
export type ResetFlag = "source" | "environment" | "camera" | "animation" | "post-processing" | "material-variant" | "shadow";

const shadowQualityOptions = ["none", "normal", "high"] as const;

/**
 * Shadow quality levels.
 */
export type ShadowQuality = (typeof shadowQualityOptions)[number];

const toneMappingOptions = ["none", "standard", "aces", "neutral"] as const;

/**
 * Tone mapping modes.
 */
export type ToneMapping = (typeof toneMappingOptions)[number];

const ssaoOptions = ["enabled", "disabled", "auto"] as const;

/**
 * Screen-space ambient occlusion options.
 */
export type SSAOOptions = (typeof ssaoOptions)[number];

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
export function IsSSAOOptions(value: string): value is SSAOOptions {
    return ssaoOptions.includes(value as SSAOOptions);
}

/**
 * Camera orbit as [alpha, beta, radius].
 */
export type CameraOrbit = [alpha: number, beta: number, radius: number];

/**
 * Camera target as [x, y, z].
 */
export type CameraTarget = [x: number, y: number, z: number];

/**
 * Camera auto-orbit configuration.
 */
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

/**
 * Environment configuration parameters.
 */
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

/**
 * Shadow configuration parameters.
 */
export type ShadowParams = {
    /**
     * The quality of shadow being used.
     */
    quality: ShadowQuality;
};

/**
 * Post-processing configuration.
 */
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

/**
 * Options for controlling which parts of the environment to update.
 */
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

/**
 * Options for loading an environment.
 */
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

/**
 * A hot spot query specifying either a surface point or a fixed world position.
 */
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
 * A hot spot definition with an optional camera pose.
 */
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
     * 2D canvas position in pixels.
     */
    public readonly screenPosition: [x: number, y: number] = [NaN, NaN];

    /**
     * 3D world coordinates.
     */
    public readonly worldPosition: [x: number, y: number, z: number] = [NaN, NaN, NaN];

    /**
     * Visibility range is [-1..1]. A value of 0 means camera eye is on the plane.
     */
    public visibility: number = NaN;
}

/**
 * Bounding information for a model.
 */
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

/**
 * Backend-agnostic options for loading a model.
 * @remarks
 * The full Viewer accepts the wider LoadAssetContainerOptions from core.
 * This type captures the subset that both backends support.
 */
export type ViewerLoadModelOptions = Partial<
    Readonly<{
        /**
         * The file extension to use for determining the loader plugin (e.g. ".glb", ".gltf").
         */
        pluginExtension: string;
    }>
>;

/**
 * Backend-agnostic options shared by all viewer implementations.
 */
export type ViewerBaseOptions = Partial<{
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

    /**
     * Called when a fatal error occurs that prevents the viewer from functioning.
     */
    onFaulted: (error: Error) => void;
}>;

/**
 * The default values for {@link ViewerBaseOptions}. Used as fallbacks by both the full Viewer
 * and the Lite Viewer; each re-exports this as its own `DefaultViewerOptions`.
 */
export const DefaultViewerBaseOptions = {
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
} as const satisfies ViewerBaseOptions;

/**
 * The subset of the Viewer API that ViewerElementBase depends on.
 * Both the full Babylon.js Viewer and ViewerLite implement this contract.
 */
export interface IViewer extends IDisposable {
    // ── Events ──

    /**
     * Fired when the environment has changed.
     */
    readonly onEnvironmentChanged: IReadonlyObservable<void>;

    /**
     * Fired when the environment configuration has changed.
     */
    readonly onEnvironmentConfigurationChanged: IReadonlyObservable<void>;

    /**
     * Fired when an error occurs while loading the environment.
     */
    readonly onEnvironmentError: IReadonlyObservable<unknown>;

    /**
     * Fired when the shadows configuration changes.
     */
    readonly onShadowsConfigurationChanged: IReadonlyObservable<void>;

    /**
     * Fired when the post processing state changes.
     */
    readonly onPostProcessingChanged: IReadonlyObservable<void>;

    /**
     * Fired when a model is loaded into the viewer (or unloaded from the viewer).
     */
    readonly onModelChanged: IReadonlyObservable<Nullable<string | File | ArrayBufferView>>;

    /**
     * Fired when an error occurs while loading a model.
     */
    readonly onModelError: IReadonlyObservable<unknown>;

    /**
     * Fired when progress changes on loading activity.
     */
    readonly onLoadingProgressChanged: IReadonlyObservable<void>;

    /**
     * Fired when the camera auto orbit state changes.
     */
    readonly onCameraAutoOrbitChanged: IReadonlyObservable<void>;

    /**
     * Fired when the selected animation changes.
     */
    readonly onSelectedAnimationChanged: IReadonlyObservable<void>;

    /**
     * Fired when the animation speed changes.
     */
    readonly onAnimationSpeedChanged: IReadonlyObservable<void>;

    /**
     * Fired when the selected animation is playing or paused.
     */
    readonly onIsAnimationPlayingChanged: IReadonlyObservable<void>;

    /**
     * Fired when the current point on the selected animation timeline changes.
     */
    readonly onAnimationProgressChanged: IReadonlyObservable<void>;

    /**
     * Fired when the selected material variant changes.
     */
    readonly onSelectedMaterialVariantChanged: IReadonlyObservable<void>;

    /**
     * Fired when the hot spots object changes to a complete new object instance.
     */
    readonly onHotSpotsChanged: IReadonlyObservable<void>;

    /**
     * Fired when the cameras as hot spots property changes.
     */
    readonly onCamerasAsHotSpotsChanged: IReadonlyObservable<void>;

    /**
     * Fired after each frame is rendered.
     */
    readonly onAfterRenderObservable: IReadonlyObservable<void>;

    /**
     * Fired when the clear color changes.
     */
    readonly onClearColorChanged: IReadonlyObservable<void>;

    // ── Clear Color ──

    /**
     * Gets or sets the clear color (background color) of the viewer.
     */
    clearColor: IColor4Like;

    // ── Camera ──

    /**
     * Gets the camera auto-orbit configuration.
     */
    get cameraAutoOrbit(): Readonly<CameraAutoOrbit>;
    /**
     * Sets the camera auto-orbit configuration. Only specified fields are updated.
     */
    set cameraAutoOrbit(value: Partial<Readonly<CameraAutoOrbit>>);

    /**
     * Resets the camera to its default state.
     * @param reframe If true, reframes the camera to fit the model. If undefined, automatically determined.
     */
    resetCamera(reframe?: boolean): void;

    /**
     * Updates the camera pose.
     * @param pose The new pose of the camera. Any unspecified values are left unchanged.
     */
    updateCamera(pose: { alpha?: number; beta?: number; radius?: number; targetX?: number; targetY?: number; targetZ?: number }): void;

    // ── Environment ──

    /**
     * Gets the environment configuration.
     */
    get environmentConfig(): Readonly<EnvironmentParams>;
    /**
     * Sets the environment configuration. Only specified fields are updated.
     */
    set environmentConfig(value: Partial<Readonly<EnvironmentParams>>);

    /**
     * Loads an environment from the specified URL.
     * @param url The URL of the environment to load.
     * @param options The options for loading the environment.
     * @param abortSignal An optional signal that can be used to abort the load.
     */
    loadEnvironment(url: string, options?: LoadEnvironmentOptions, abortSignal?: AbortSignal): Promise<void>;

    /**
     * Resets the environment to its default state.
     * @param options The options to use when resetting the environment.
     * @param abortSignal An optional signal that can be used to abort the reset.
     */
    resetEnvironment(options?: EnvironmentOptions, abortSignal?: AbortSignal): Promise<void>;

    // ── Post Processing ──

    /**
     * Gets the post-processing configuration.
     */
    get postProcessing(): Readonly<PostProcessing>;
    /**
     * Sets the post-processing configuration. Only specified fields are updated.
     */
    set postProcessing(value: Partial<Readonly<PostProcessing>>);

    // ── Shadows ──

    /**
     * Gets the current shadow configuration.
     */
    readonly shadowConfig: Readonly<ShadowParams>;

    /**
     * Updates the shadow configuration.
     * @param value The new shadow configuration.
     */
    updateShadows(value: Partial<Readonly<ShadowParams>>): Promise<void>;

    // ── Model Loading ──

    /**
     * Loads a 3D model from the specified source.
     * @param source The source of the model to load.
     * @param options The options for loading the model.
     * @param abortSignal An optional signal that can be used to abort the load.
     */
    loadModel(source: string | File | ArrayBufferView, options?: ViewerLoadModelOptions, abortSignal?: AbortSignal): Promise<void>;

    /**
     * Unloads the current 3D model if one is loaded.
     * @param abortSignal An optional signal that can be used to abort the reset.
     */
    resetModel(abortSignal?: AbortSignal): Promise<void>;

    // ── Animation ──

    /**
     * The list of animation names for the currently loaded model.
     */
    readonly animations: readonly string[];

    /**
     * Gets or sets the index of the selected animation.
     */
    selectedAnimation: number;

    /**
     * Gets or sets the speed scale at which animations are played.
     */
    animationSpeed: number;

    /**
     * True if an animation is currently playing.
     */
    readonly isAnimationPlaying: boolean;

    /**
     * Gets or sets the current point on the selected animation timeline, normalized between 0 and 1.
     */
    animationProgress: number;

    /**
     * Toggles between playing and pausing the selected animation.
     */
    toggleAnimation(): void;

    /**
     * Plays the selected animation.
     */
    playAnimation(): void;

    /**
     * Pauses the selected animation.
     */
    pauseAnimation(): Promise<void>;

    // ── Material Variants ──

    /**
     * The list of material variant names for the currently loaded model.
     */
    readonly materialVariants: readonly string[];

    /**
     * Gets or sets the selected material variant.
     */
    selectedMaterialVariant: Nullable<string>;

    // ── Hot Spots ──

    /**
     * Gets or sets the hot spots configuration.
     */
    hotSpots: Record<string, HotSpot>;

    /**
     * Gets or sets whether cameras embedded in the model should be exposed as hot spots.
     */
    camerasAsHotSpots: boolean;

    /**
     * Queries a named hot spot and returns its screen and world positions.
     * @param name The name of the hot spot to query.
     * @param result The result object to populate.
     * @returns True if the hot spot was found.
     */
    queryHotSpot(name: string, result: ViewerHotSpotResult): boolean;

    /**
     * Updates the camera to focus on a named hotspot.
     * @param name The name of the hotspot to focus on.
     * @returns True if the hotspot was found and the camera was updated.
     */
    focusHotSpot(name: string): boolean;

    // ── State ──

    /**
     * True if a model is currently loaded.
     */
    readonly isModelLoaded: boolean;

    /**
     * The current loading progress. False when not loading, true when loading with indeterminate progress, or a number between 0 and 1.
     */
    readonly loadingProgress: boolean | number;

    /**
     * Resets the viewer to its initial state based on the options passed in to the constructor.
     * @param flags The flags that specify which parts of the viewer to reset. If no flags are provided, all parts will be reset.
     */
    reset(...flags: ResetFlag[]): void;

    /**
     * Disposes the viewer and releases all resources.
     */
    dispose(): void;
}

/**
 * Common base for the full Babylon.js {@link Viewer} and the lite Viewer.
 *
 * Encapsulates the pieces that are identical between both engine backends:
 * - The 18 public observables exposed by the viewer surface area
 * - In-flight load operation tracking (used to compute aggregate `loadingProgress`)
 * - The `_throwIfDisposedOrAborted` helper used at the start of every async operation
 * - The disposed flag and observable teardown in `dispose()`
 *
 * Subclasses are responsible for everything engine-specific (scene/engine creation,
 * model + environment loading orchestration, camera, post-processing, shadows, etc.)
 * and for declaring `implements IViewer` themselves so the public API contract is
 * verified at the leaf class level.
 */
export abstract class ViewerBase {
    // ── Observables ──
    // Concrete `Observable<T>` is exposed publicly (it satisfies `IReadonlyObservable<T>`
    // for the `IViewer` interface contract). Subclasses notify directly via `this.onXxx.notifyObservers()`.

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

    /**
     * Fired after each frame is rendered.
     */
    public readonly onAfterRenderObservable = new Observable<void>();

    /**
     * Fired when the clear color changes.
     */
    public readonly onClearColorChanged = new Observable<void>();

    /**
     * @internal Tracks in-flight load operations (model + environment + shadows) so that
     * `loadingProgress` can return either an aggregate progress number, `true` (indeterminate),
     * or `false` (no operations in flight).
     */
    protected readonly _loadOperations = new Set<Readonly<{ progress: Nullable<number> }>>();

    /** @internal True after `dispose()` has been called. */
    protected _isDisposed = false;

    /**
     * The current loading progress. False when no load is in flight, true when at least one
     * load is in flight with indeterminate progress, or a number between 0 and 1 representing
     * the average of all in-flight loads' progress.
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

    /**
     * @internal Begin tracking a new load operation. Subclasses call this at the start of
     * an async load and dispose the returned handle when it completes (or fails). The handle
     * exposes a `progress` setter that, when assigned, fires `onLoadingProgressChanged`.
     */
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
     * @internal Throws if the viewer has been disposed or any of the supplied abort signals
     * are aborted. Used at the start of every async operation to bail out early.
     * @param abortSignals Optional abort signals to check.
     */
    protected _throwIfDisposedOrAborted(...abortSignals: (Nullable<AbortSignal> | undefined)[]): void {
        if (this._isDisposed) {
            throw new Error("Viewer is disposed.");
        }

        throwIfAborted(...abortSignals);
    }

    /**
     * Disposes the viewer and releases shared resources (observables, disposed flag).
     * Subclasses MUST override this method to dispose their own engine-specific state
     * (engine, scene, abort controllers, models, etc.) and call `super.dispose()` last
     * so observable consumers see the engine-specific notifications before observables clear.
     *
     * Subclasses should also early-return if `_isDisposed` is already true.
     */
    public dispose(): void {
        this.onEnvironmentChanged.clear();
        this.onEnvironmentConfigurationChanged.clear();
        this.onEnvironmentError.clear();
        this.onShadowsConfigurationChanged.clear();
        this.onPostProcessingChanged.clear();
        this.onModelChanged.clear();
        this.onModelError.clear();
        this.onLoadingProgressChanged.clear();
        this.onCameraAutoOrbitChanged.clear();
        this.onSelectedAnimationChanged.clear();
        this.onAnimationSpeedChanged.clear();
        this.onIsAnimationPlayingChanged.clear();
        this.onAnimationProgressChanged.clear();
        this.onSelectedMaterialVariantChanged.clear();
        this.onHotSpotsChanged.clear();
        this.onCamerasAsHotSpotsChanged.clear();
        this.onAfterRenderObservable.clear();
        this.onClearColorChanged.clear();
        this._isDisposed = true;
    }
}
