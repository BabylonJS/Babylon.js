/* eslint-disable @typescript-eslint/naming-convention */
import { type HotSpotQuery, type IColor4Like, type IDisposable, type Nullable, type IReadonlyObservable } from "core/index";
import { AbortError } from "core/Misc/error";
import { AsyncLock } from "core/Misc/asyncLock";
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
 * @internal `LoadEnvironmentOptions` after the base class has resolved the optional `lighting` and
 * `skybox` flags to definite booleans (defaults to `true` for both when omitted, otherwise honors the
 * caller's choice). Engine-specific extras such as `extension` are forwarded as-is. Passed to the
 * subclass `_loadEnvironmentImpl` so it doesn't repeat the default-resolution logic.
 */
export type ResolvedLoadEnvironmentOptions = Omit<LoadEnvironmentOptions, "lighting" | "skybox"> & {
    readonly lighting: boolean;
    readonly skybox: boolean;
};

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
     * @param abortSignal Optional signal that can be used to abort the update.
     */
    updateShadows(value: Partial<Readonly<ShadowParams>>, abortSignal?: AbortSignal): Promise<void>;

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
     * @internal Backend-agnostic viewer options stored at construction time. Subclasses declare this
     * with their own (narrower) options type that extends {@link ViewerBaseOptions} and assign it from
     * their own constructor (typically via a parameter property).
     */
    protected abstract readonly _options?: Readonly<ViewerBaseOptions>;

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
     * Begin tracking a new load operation. Subclasses call this at the start of an async load
     * and dispose the returned handle when it completes (or fails). The handle exposes a
     * `progress` setter that, when assigned, fires `onLoadingProgressChanged`.
     * @returns A handle that can be disposed when the operation completes; the `progress` setter
     *   updates the aggregate `loadingProgress` as the operation runs.
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

    // ──────────────────────────────────────────────────────────────────────────
    // Environment loading orchestration
    // ──────────────────────────────────────────────────────────────────────────

    /** Lock guarding lighting-side environment loads. */
    private readonly _loadEnvironmentLightingLock = new AsyncLock();
    /** Abort controller for the currently in-flight lighting-side load (null when none). */
    private _loadEnvironmentLightingAbortController: Nullable<AbortController> = null;

    /** Lock guarding skybox-side environment loads. */
    private readonly _loadEnvironmentSkyboxLock = new AsyncLock();
    /** Abort controller for the currently in-flight skybox-side load (null when none). */
    private _loadEnvironmentSkyboxAbortController: Nullable<AbortController> = null;

    /**
     * @internal The abort signal of the currently in-flight lighting-side load, or `undefined` if
     * none. Subclasses can use this in `_throwIfDisposedOrAborted` to bail out of dependent async
     * work (shadows, post-processing, etc.) when the user starts a new lighting load.
     */
    protected get _loadEnvironmentLightingAbortSignal(): AbortSignal | undefined {
        return this._loadEnvironmentLightingAbortController?.signal;
    }

    /**
     * @internal The abort signal of the currently in-flight skybox-side load, or `undefined` if
     * none. Subclasses can use this in `_throwIfDisposedOrAborted` to bail out of dependent async
     * work (shadows, post-processing, etc.) when the user starts a new skybox load.
     */
    protected get _loadEnvironmentSkyboxAbortSignal(): AbortSignal | undefined {
        return this._loadEnvironmentSkyboxAbortController?.signal;
    }

    /**
     * Loads an environment from the specified URL. The lighting and skybox sides have
     * independent locks and abort controllers so concurrent requests for one side don't
     * cancel an in-flight load for the other.
     * @param url The URL of the environment to load.
     * @param options Selects which sides to update (defaults to both) and forwards engine-specific extras.
     * @param abortSignal Optional signal that can be used to abort the load externally.
     * @returns A promise that resolves when the environment has finished loading.
     */
    public async loadEnvironment(url: string, options?: LoadEnvironmentOptions, abortSignal?: AbortSignal): Promise<void> {
        return await this._updateEnvironment(url, options, abortSignal);
    }

    /**
     * Removes the loaded environment. By default removes both lighting and skybox; pass `options`
     * to remove only one side. Subclasses (notably the full Viewer) may override to add backend-specific
     * fallback behavior such as substituting a default environment for lighting when the scene contains
     * PBR materials.
     * @param options Selects which sides to remove (defaults to both).
     * @param abortSignal Optional signal that can be used to abort the operation externally.
     * @returns A promise that resolves when the environment has finished resetting.
     */
    public async resetEnvironment(options?: EnvironmentOptions, abortSignal?: AbortSignal): Promise<void> {
        return await this._updateEnvironment(undefined, options, abortSignal);
    }

    /**
     * @internal Internal helper exposing the dual-lock orchestration with a nullable URL.
     * Used by the public `loadEnvironment` (with a string URL) and by subclass `resetEnvironment`
     * implementations (which pass `undefined` to clear or `"auto"` to load defaults).
     *
     * Subclasses should NOT override this — override the abstract `_loadEnvironmentImpl` instead.
     */
    protected async _updateEnvironment(url: Nullable<string | undefined>, options?: LoadEnvironmentOptions, abortSignal?: AbortSignal): Promise<void> {
        this._throwIfDisposedOrAborted(abortSignal);

        // Default semantics: omitting `options` updates both; passing `options` updates only
        // the sides whose flag is truthy. `{ lighting: true }` alone updates only lighting,
        // `{ skybox: true }` alone updates only skybox.
        const updateLighting = options ? !!options.lighting : true;
        const updateSkybox = options ? !!options.skybox : true;
        if (!updateLighting && !updateSkybox) {
            return;
        }

        // Resolved options object — `lighting` and `skybox` are guaranteed booleans here, while
        // engine-specific extras (e.g. `extension`) are forwarded as-is. Passed to the impl so
        // it can use both the resolved flags and the original extras without duplicating the
        // default-resolution logic.
        const resolvedOptions: ResolvedLoadEnvironmentOptions = { ...options, lighting: updateLighting, skybox: updateSkybox };

        const locks: AsyncLock[] = [];
        const internalAbortControllers: AbortController[] = [];

        if (updateLighting) {
            this._loadEnvironmentLightingAbortController?.abort(new AbortError("New environment lighting is being loaded before previous environment lighting finished loading."));
            const lightingAbortController = (this._loadEnvironmentLightingAbortController = new AbortController());
            locks.push(this._loadEnvironmentLightingLock);
            internalAbortControllers.push(lightingAbortController);
        }
        if (updateSkybox) {
            this._loadEnvironmentSkyboxAbortController?.abort(new AbortError("New environment skybox is being loaded before previous environment skybox finished loading."));
            const skyboxAbortController = (this._loadEnvironmentSkyboxAbortController = new AbortController());
            locks.push(this._loadEnvironmentSkyboxLock);
            internalAbortControllers.push(skyboxAbortController);
        }

        // Composite abort fires only when ALL relevant internal aborts fire — a skybox-only
        // re-request shouldn't cancel an in-progress lighting load when both were requested
        // together.
        const compositeAbortController = new AbortController();
        const checkAllAborted = () => {
            if (internalAbortControllers.every((c) => c.signal.aborted)) {
                compositeAbortController.abort(new AbortError(internalAbortControllers.map((controller) => controller.signal.reason).join(" | ")));
            }
        };
        for (const controller of internalAbortControllers) {
            controller.signal.addEventListener("abort", checkAllAborted);
        }

        try {
            await AsyncLock.LockAsync(async () => {
                throwIfAborted(abortSignal, compositeAbortController.signal);
                await this._loadEnvironmentImpl(url?.trim() ?? url, resolvedOptions, abortSignal, compositeAbortController.signal);
            }, locks);
        } finally {
            for (const controller of internalAbortControllers) {
                controller.signal.removeEventListener("abort", checkAllAborted);
            }
        }
    }

    /**
     * @internal Engine-specific environment loading. Subclasses implement this with their actual
     * texture loading / scene mutation logic. The base class handles only the surrounding lock +
     * abort-prev orchestration and the composite abort signal; everything else (`onEnvironmentChanged` /
     * `onEnvironmentError` notifications, snapshot-helper bracketing, etc.) is the impl's responsibility.
     *
     * Implementations should:
     * - Throw on failure. They should fire `onEnvironmentError` themselves before throwing if they
     *   want external observers to be notified.
     * - Fire `onEnvironmentChanged` on success.
     * - Periodically re-check abort by calling `throwIfAborted(abortSignal, compositeAbortSignal)`
     *   at safe points within the load (e.g. after long-running awaits).
     *
     * @param url Trimmed URL string, `undefined` (caller asked to clear), or `null`.
     * @param options Resolved options — `lighting` and `skybox` are guaranteed booleans indicating
     *   which sides the caller is updating; engine-specific extras (e.g. `extension`) are forwarded as-is.
     * @param abortSignal The caller's external abort signal (or `undefined`).
     * @param compositeAbortSignal Signal that fires when ALL relevant internal load operations have aborted.
     */
    protected abstract _loadEnvironmentImpl(
        url: Nullable<string | undefined>,
        options: ResolvedLoadEnvironmentOptions,
        abortSignal: AbortSignal | undefined,
        compositeAbortSignal: AbortSignal
    ): Promise<void>;

    // ── Environment configuration (intensity / blur / rotation) ──

    /** @internal Current environment intensity. Initialized from options in subclass constructors. */
    protected _environmentIntensity: number = DefaultViewerBaseOptions.environmentConfig.intensity;
    /** @internal Current environment skybox blur. Initialized from options in subclass constructors. */
    protected _environmentBlur: number = DefaultViewerBaseOptions.environmentConfig.blur;
    /** @internal Current environment rotation in radians. Initialized from options in subclass constructors. */
    protected _environmentRotation: number = DefaultViewerBaseOptions.environmentConfig.rotation;

    public get environmentConfig(): Readonly<EnvironmentParams> {
        return {
            intensity: this._environmentIntensity,
            blur: this._environmentBlur,
            rotation: this._environmentRotation,
        };
    }

    public set environmentConfig(value: Partial<Readonly<EnvironmentParams>>) {
        if (value.blur !== undefined && value.blur !== this._environmentBlur) {
            this._environmentBlur = value.blur;
            this._applyEnvironmentBlur();
        }
        if (value.intensity !== undefined && value.intensity !== this._environmentIntensity) {
            this._environmentIntensity = value.intensity;
            this._applyEnvironmentIntensity();
        }
        if (value.rotation !== undefined && value.rotation !== this._environmentRotation) {
            this._environmentRotation = value.rotation;
            this._applyEnvironmentRotation();
        }
        this.onEnvironmentConfigurationChanged.notifyObservers();
    }

    /**
     * @internal Push the current `_environmentIntensity` value into the engine's environment state.
     * Called by the public `environmentConfig` setter only when the value changes.
     */
    protected abstract _applyEnvironmentIntensity(): void;

    /**
     * @internal Push the current `_environmentBlur` value into the engine's environment state.
     * Called by the public `environmentConfig` setter only when the value changes.
     */
    protected abstract _applyEnvironmentBlur(): void;

    /**
     * @internal Push the current `_environmentRotation` value into the engine's environment state.
     * Called by the public `environmentConfig` setter only when the value changes.
     */
    protected abstract _applyEnvironmentRotation(): void;

    // ──────────────────────────────────────────────────────────────────────────
    // Model loading orchestration
    // ──────────────────────────────────────────────────────────────────────────

    /** Lock guarding model loads (and resets). */
    private readonly _loadModelLock = new AsyncLock();
    /** Abort controller for the currently in-flight model load (null when none). */
    private _loadModelAbortController: Nullable<AbortController> = null;

    /**
     * @internal The abort signal of the currently in-flight model load, or `undefined` if none.
     * Subclasses can use this in `_throwIfDisposedOrAborted` to bail out of dependent async work
     * (shadows, environment fallback, etc.) when the user starts a new model load.
     */
    protected get _loadModelAbortSignal(): AbortSignal | undefined {
        return this._loadModelAbortController?.signal;
    }

    /**
     * Loads a 3D model from the specified source.
     * @param source The source of the model to load.
     * @param options Engine-specific options for loading the model.
     * @param abortSignal Optional signal that can be used to abort the load externally.
     * @returns A promise that resolves when the model has finished loading.
     */
    public async loadModel(source: string | File | ArrayBufferView, options?: ViewerLoadModelOptions, abortSignal?: AbortSignal): Promise<void> {
        return await this._updateModel(source, options, abortSignal);
    }

    /**
     * Unloads the current 3D model if one is loaded.
     * @param abortSignal Optional signal that can be used to abort the reset.
     * @returns A promise that resolves when the current model has been unloaded.
     */
    public async resetModel(abortSignal?: AbortSignal): Promise<void> {
        return await this._updateModel(undefined, undefined, abortSignal);
    }

    /**
     * @internal Internal helper exposing the model load orchestration with `source: undefined` meaning
     * "unload the current model". Subclasses should NOT override this — override `_loadModelImpl` instead.
     */
    protected async _updateModel(source: string | File | ArrayBufferView | undefined, options?: ViewerLoadModelOptions, abortSignal?: AbortSignal): Promise<void> {
        this._throwIfDisposedOrAborted(abortSignal);

        this._loadModelAbortController?.abort(new AbortError("New model is being loaded before previous model finished loading."));
        const internalAbortController = (this._loadModelAbortController = new AbortController());

        await this._loadModelLock.lockAsync(async () => {
            throwIfAborted(abortSignal, internalAbortController.signal);
            await this._loadModelImpl(source, options, abortSignal, internalAbortController.signal);
        });

        // Post-lock follow-up (e.g. operations that need other locks). Skip if a newer model load
        // has already aborted us — the new load owns the post-load work for its own state.
        if (!internalAbortController.signal.aborted) {
            await this._afterLoadModel(source, options, abortSignal, internalAbortController.signal);
        }
    }

    /**
     * @internal Engine-specific model loading. Subclasses implement this with their actual model
     * loading logic. The base class handles only the surrounding lock + abort-prev orchestration;
     * everything else (load-operation progress tracking, `onModelChanged` / `onModelError`
     * notifications, snapshot-helper bracketing) is the impl's responsibility.
     *
     * Implementations should:
     * - Throw on failure. They should fire `onModelError` themselves before throwing if they want
     *   external observers to be notified.
     * - Fire `onModelChanged` on success.
     * - Manage their own `_beginLoadOperation` / dispose pair if they want to contribute to
     *   `loadingProgress`.
     * - Periodically re-check abort by calling `throwIfAborted(abortSignal, internalAbortSignal)`
     *   at safe points within the load (e.g. after long-running awaits).
     * - Treat `source === undefined` as "unload the current model" — this is how `resetModel` flows
     *   through. They should still fire `onModelChanged(null)` so consumers see the unload.
     *
     * @param source Source URL/File/ArrayBufferView, or `undefined` to unload the current model.
     * @param options Caller's options (or undefined). May contain engine-specific extras.
     * @param abortSignal The caller's external abort signal (or `undefined`).
     * @param internalAbortSignal Signal that fires when a NEWER model load supersedes this one.
     */
    protected abstract _loadModelImpl(
        source: string | File | ArrayBufferView | undefined,
        options: ViewerLoadModelOptions | undefined,
        abortSignal: AbortSignal | undefined,
        internalAbortSignal: AbortSignal
    ): Promise<void>;

    /**
     * @internal Optional post-lock hook invoked AFTER the model load lock is released, allowing
     * subclasses to do follow-up work that needs other locks (e.g. environment fallback). The base
     * skips this hook if the load was superseded by a newer one before we got here.
     *
     * Implementations that await additional work should re-check `internalAbortSignal.aborted`
     * after each await to avoid acting on stale state (a newer load may have started during the
     * await window).
     *
     * Default: no-op.
     */
    protected async _afterLoadModel(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        source: string | File | ArrayBufferView | undefined,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        options: ViewerLoadModelOptions | undefined,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        abortSignal: AbortSignal | undefined,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        internalAbortSignal: AbortSignal
    ): Promise<void> {
        // Default: no-op.
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Shadow update orchestration
    // ──────────────────────────────────────────────────────────────────────────

    /** Lock guarding shadow updates. */
    private readonly _updateShadowsLock = new AsyncLock();
    /** Abort controller for the currently in-flight shadow update (null when none). */
    private _shadowsAbortController: Nullable<AbortController> = null;

    /**
     * @internal The abort signal of the currently in-flight shadow update, or `undefined` if none.
     * Subclasses can use this in `_throwIfDisposedOrAborted` to bail out of dependent async work
     * when the user starts a new shadow update.
     */
    protected get _shadowsAbortSignal(): AbortSignal | undefined {
        return this._shadowsAbortController?.signal;
    }

    /**
     * @internal The currently committed shadow quality. Subclasses initialize this from their
     * options in their constructor and read it in their `_loadModelImpl` etc. The base class
     * commits a new value here only after `_updateShadowsImpl` succeeds, so failed/aborted
     * shadow updates don't leave this field out of sync with engine state.
     */
    protected _shadowQuality: ShadowQuality = DefaultViewerBaseOptions.shadowConfig.quality;

    // ── Material variants (abstract — subclasses provide engine-specific implementations) ──

    /** @internal */
    public abstract get selectedMaterialVariant(): Nullable<string>;
    /** @internal */
    public abstract set selectedMaterialVariant(value: Nullable<string>);

    /**
     * Gets the current shadow configuration.
     */
    public get shadowConfig(): Readonly<ShadowParams> {
        return { quality: this._shadowQuality };
    }

    /**
     * Updates the shadow configuration. Skips work if the requested value matches the currently
     * committed one. Subclasses can override this to validate the requested quality (e.g. throw on
     * unsupported combinations) before delegating to `super.updateShadows(value, abortSignal)`.
     * @param value The new shadow configuration.
     * @param abortSignal Optional signal that can be used to abort the update externally.
     * @returns A promise that resolves when the shadow update completes.
     */
    public async updateShadows(value: Partial<Readonly<ShadowParams>>, abortSignal?: AbortSignal): Promise<void> {
        if (value.quality === undefined || value.quality === this._shadowQuality) {
            return;
        }

        // Commit `_shadowQuality` BEFORE running the impl: the engine-specific shadow setup may
        // read `this._shadowQuality` internally as a sanity check ("did the user change quality
        // while I was initializing?"), so the new value needs to be visible during the impl.
        this._shadowQuality = value.quality;
        await this._updateShadows(this._shadowQuality, abortSignal);
        this.onShadowsConfigurationChanged.notifyObservers();
    }

    /**
     * Runs the engine-specific shadow update at the given quality under the shared lock, with
     * abort-prev semantics. Subclasses should call this (rather than `_updateShadowsImpl` directly)
     * when they need to re-run the shadow setup (e.g. after a model change or environment change).
     * The public `updateShadows` also routes through this helper.
     * @param quality The shadow quality to apply. Defaults to the currently committed quality
     *   (`this._shadowQuality`), which is the right choice for re-running shadow setup without
     *   changing the committed quality. The public `updateShadows` passes a resolved new quality.
     * @param abortSignal Optional external abort signal.
     * @returns A promise that resolves when the shadow update completes.
     */
    protected async _updateShadows(quality: ShadowQuality = this._shadowQuality, abortSignal?: AbortSignal): Promise<void> {
        this._throwIfDisposedOrAborted(abortSignal);

        this._shadowsAbortController?.abort(new AbortError("Shadows quality is being changed before previous shadows finished initializing."));
        const internalAbortController = (this._shadowsAbortController = new AbortController());

        await this._updateShadowsLock.lockAsync(async () => {
            throwIfAborted(abortSignal, internalAbortController.signal);
            await this._updateShadowsImpl(quality, abortSignal, internalAbortController.signal);
        });
    }

    /**
     * @internal Engine-specific shadow setup. Subclasses implement this with their actual shadow
     * generation logic. The base class handles all surrounding orchestration: lock acquisition,
     * abort-prev semantics, quality resolution, and the success-only commit of `_shadowQuality`.
     *
     * Implementations should:
     * - Throw on failure; the base class propagates the error to the caller without committing the new quality.
     * - Use `quality` (not `this._shadowQuality`, which still holds the pre-update value) to drive the setup.
     * - Periodically re-check abort by calling `throwIfAborted(abortSignal, internalAbortSignal)` at safe points.
     */
    protected abstract _updateShadowsImpl(quality: ShadowQuality, abortSignal: AbortSignal | undefined, internalAbortSignal: AbortSignal): Promise<void>;

    /**
     * Disposes the viewer and releases shared resources (observables, disposed flag).
     * Subclasses MUST override this method to dispose their own engine-specific state
     * (engine, scene, abort controllers, models, etc.) and call `super.dispose()` last
     * so observable consumers see the engine-specific notifications before observables clear.
     *
     * Subclasses should also early-return if `_isDisposed` is already true.
     */
    public dispose(): void {
        this._loadEnvironmentLightingAbortController?.abort(new AbortError("The viewer is being disposed."));
        this._loadEnvironmentLightingAbortController = null;
        this._loadEnvironmentSkyboxAbortController?.abort(new AbortError("The viewer is being disposed."));
        this._loadEnvironmentSkyboxAbortController = null;
        this._loadModelAbortController?.abort(new AbortError("The viewer is being disposed."));
        this._loadModelAbortController = null;
        this._shadowsAbortController?.abort(new AbortError("The viewer is being disposed."));
        this._shadowsAbortController = null;

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

    // ── Reset orchestration ──

    /**
     * Resets the viewer to its initial state based on the options passed in to the constructor.
     * @param flags The flags that specify which parts of the viewer to reset. If no flags are provided, all parts will be reset.
     * - "source": Reset the loaded model.
     * - "environment": Reset environment related state.
     * - "shadow": Reset shadow related state.
     * - "animation": Reset animation related state.
     * - "camera": Reset camera related state.
     * - "post-processing": Reset post-processing related state.
     * - "material-variant": Reset material variant related state.
     */
    public reset(...flags: ResetFlag[]): void {
        this._reset(true, ...flags);
    }

    /**
     * @internal
     * Orchestrates the reset operation in canonical flag order. The {@link interpolate} parameter is
     * forwarded to per-flag hooks (currently only `_resetCamera`) so internal callers can reset
     * without camera animation.
     */
    protected _reset(interpolate: boolean, ...flags: ResetFlag[]): void {
        const all = flags.length === 0;

        if (all || flags.includes("source")) {
            this._resetModel();
        }
        if (all || flags.includes("environment")) {
            this._resetEnvironment();
        }
        if (all || flags.includes("shadow")) {
            this._resetShadows();
        }
        if (all || flags.includes("animation")) {
            this._resetAnimation();
        }
        if (all || flags.includes("camera")) {
            this._resetCamera(interpolate);
        }
        if (all || flags.includes("post-processing")) {
            this._resetPostProcessing();
        }
        if (all || flags.includes("material-variant")) {
            this._resetMaterialVariant();
        }
    }

    /**
     * @internal Resets the loaded model to the source specified at construction (or no model if no source was specified).
     */
    protected _resetModel(): void {
        observePromise(this._updateModel(this._options?.source));
    }

    /** @internal */
    protected abstract _resetEnvironment(): void;

    /**
     * @internal Resets the shadow configuration to the value specified at construction.
     */
    protected _resetShadows(): void {
        observePromise(this.updateShadows({ quality: this._options?.shadowConfig?.quality ?? DefaultViewerBaseOptions.shadowConfig.quality }));
    }

    /** @internal */
    protected abstract _resetAnimation(): void;

    /**
     * @internal
     * @param interpolate If true, animate camera transitions when supported. Subclasses without bounds-based
     * reframing may ignore this parameter.
     */
    protected abstract _resetCamera(interpolate: boolean): void;

    /** @internal */
    protected abstract _resetPostProcessing(): void;

    /**
     * @internal Resets the selected material variant to the value specified at construction (or null if not specified).
     */
    protected _resetMaterialVariant(): void {
        this.selectedMaterialVariant = this._options?.selectedMaterialVariant ?? null;
    }
}
