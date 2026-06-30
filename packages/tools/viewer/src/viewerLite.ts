/* eslint-disable @typescript-eslint/naming-convention */
import { type Nullable } from "core/index";
import { AbortError } from "core/Misc/error";
import { Logger } from "core/Misc/logger";

import {
    addToScene,
    attachControl,
    computeMaxExtents,
    createArcRotateCamera,
    createDirectionalLight,
    createDisc,
    createEngine,
    createEsmDirectionalShadowGenerator,
    createPbrMaterial,
    createSceneContext,
    disposeEngine,
    disposeScene,
    getContainerMeshes,
    getVariantNames,
    goToFrame,
    loadEnvironment as liteLoadEnvironment,
    pauseAnimation as litePauseAnimation,
    playAnimation as litePlayAnimation,
    stopAnimation as liteStopAnimation,
    loadGltf,
    loadHdrEnvironment,
    onBeforeRender,
    registerScene,
    resetVariant,
    selectVariant,
    setShadowTaskCasterMeshes,
    startEngine,
    stopEngine,
    unregisterScene,
    type ArcRotateCamera,
    type AssetContainer,
    type EngineContext,
    type AnimationGroup as LiteAnimationGroup,
    type ShadowGenerator as LiteShadowGenerator,
    type SceneContext,
} from "@babylonjs/lite";

import {
    type IViewer,
    type ResolvedLoadEnvironmentOptions,
    type PostProcessing,
    type ShadowParams,
    type ShadowQuality,
    type SSAOOptions,
    type ToneMapping,
    type ViewerBaseOptions,
    type ViewerHotSpotResult,
    type ViewerLoadModelOptions,
    ViewerBase,
    DefaultViewerBaseOptions,
    throwIfAborted,
    observePromise,
} from "./viewerBase";

/**
 * The options for the Lite Viewer.
 */
export type ViewerOptions = ViewerBaseOptions;

/**
 * Options for {@link Viewer.loadModel} on the Lite Viewer.
 */
export type LoadModelOptions = ViewerLoadModelOptions;

/**
 * Options for creating a Lite Viewer bound to a canvas.
 */
export type CanvasViewerOptions = ViewerBaseOptions;

// ── Defaults ──

/**
 * The default options for the Lite Viewer.
 */
export const DefaultViewerOptions = DefaultViewerBaseOptions;

const DefaultCameraAlpha = -Math.PI / 2;
const DefaultCameraBeta = Math.PI / 2.5;
const DefaultCameraRadius = 3;

// ── Helpers ──

function getExtension(url: string, explicitExt?: string): string {
    if (explicitExt) {
        return explicitExt.startsWith(".") ? explicitExt : `.${explicitExt}`;
    }
    const dotIdx = url.lastIndexOf(".");
    return dotIdx >= 0 ? url.substring(dotIdx).toLowerCase() : "";
}

function toneMappingToLiteType(mode: ToneMapping): "standard" | "aces" | undefined {
    switch (mode) {
        case "standard":
            return "standard";
        case "aces":
            return "aces";
        case "neutral":
            Logger.Warn("Viewer: Tone mapping 'neutral' is not supported by Babylon Lite. Falling back to 'aces'.");
            return "aces";
        case "none":
            return undefined;
    }
}

// ── Viewer ──

/**
 * A lightweight implementation of the {@link IViewer} interface built on the Babylon Lite API.
 *
 * @remarks
 * Babylon Lite is a WebGPU-only engine that provides a subset of the full Babylon.js feature set.
 * Features that are not available in Lite (SSAO, "high" shadow quality, hot spots, File/ArrayBufferView model sources)
 * will log warnings and fall back gracefully.
 */
export class Viewer extends ViewerBase implements IViewer {
    // ── Private State ──

    private readonly _scene: SceneContext;
    private readonly _camera: ArcRotateCamera;
    private _detachControl: (() => void) | null = null;
    private _renderLoopRunning = false;

    // Auto-orbit
    private _autoOrbitIdleTime = 0;
    private _lastPointerTime = 0;

    // Environment
    /** The currently-loaded lighting URL ("auto" resolves to the embedded default). null = no lighting loaded. */
    private _currentLightingUrl: string | null = null;
    /** The currently-loaded skybox URL ("auto" resolves to the embedded default). null = no skybox loaded. */
    private _currentSkyboxUrl: string | null = null;

    // Post processing
    private _toneMapping: ToneMapping = this._options?.postProcessing?.toneMapping ?? DefaultViewerOptions.postProcessing.toneMapping;
    private _contrast = this._options?.postProcessing?.contrast ?? DefaultViewerOptions.postProcessing.contrast;
    private _exposure = this._options?.postProcessing?.exposure ?? DefaultViewerOptions.postProcessing.exposure;
    private _ssaoOption: SSAOOptions = this._options?.postProcessing?.ssao ?? DefaultViewerOptions.postProcessing.ssao;

    // Shadows
    private _shadowGenerator: LiteShadowGenerator | null = null;

    // Model
    private _container: AssetContainer | null = null;
    /** The source that was passed to the most recent {@link loadModel} call, for notifications. */
    private _modelSource: Nullable<string | File | ArrayBufferView> = null;
    /** Cached animation-aware model bounds for the current model. Reset on unload. See {@link _computeModelBounds}. */
    private _cachedModelBounds: { min: [number, number, number]; max: [number, number, number]; center: [number, number, number]; radius: number } | null = null;

    // Animation
    private _selectedAnimation = -1;
    private _animationSpeed = this._options?.animationSpeed ?? DefaultViewerOptions.animationSpeed;
    private _wasPlaying = false;
    private _lastProgress = -1;

    // Material variants
    private _selectedMaterialVariant: Nullable<string> = null;

    // Hot spots
    private _camerasAsHotSpots = false;

    // Lifecycle
    private _defaultAlpha: number;
    private _defaultBeta: number;
    private _defaultRadius: number;
    private _defaultTarget = { x: 0, y: 0, z: 0 };

    /**
     * Creates a new Viewer instance.
     * @param _engine The Babylon Lite engine context.
     * @param _options Optional viewer configuration.
     */
    constructor(
        private readonly _engine: EngineContext,
        protected readonly _options?: ViewerOptions
    ) {
        super();
        this._shadowQuality = this._options?.shadowConfig?.quality ?? DefaultViewerOptions.shadowConfig.quality;
        this._environmentIntensity = this._options?.environmentConfig?.intensity ?? DefaultViewerOptions.environmentConfig.intensity;
        this._environmentBlur = this._options?.environmentConfig?.blur ?? DefaultViewerOptions.environmentConfig.blur;
        this._environmentRotation = this._options?.environmentConfig?.rotation ?? DefaultViewerOptions.environmentConfig.rotation;
        this._autoOrbitEnabled = this._options?.cameraAutoOrbit?.enabled ?? DefaultViewerOptions.cameraAutoOrbit.enabled;
        this._autoOrbitSpeed = this._options?.cameraAutoOrbit?.speed ?? DefaultViewerOptions.cameraAutoOrbit.speed;
        this._autoOrbitDelay = this._options?.cameraAutoOrbit?.delay ?? DefaultViewerOptions.cameraAutoOrbit.delay;
        if (this._options?.hotSpots) {
            this.hotSpots = this._options.hotSpots;
        }
        // Create scene internally (matching how full Viewer owns its scene)
        this._scene = createSceneContext(_engine);
        // Camera — NaN means "auto" (will be recomputed when model loads)
        const orbitAlpha = _options?.cameraOrbit?.[0];
        const orbitBeta = _options?.cameraOrbit?.[1];
        const orbitRadius = _options?.cameraOrbit?.[2];
        const alpha = orbitAlpha != null && !isNaN(orbitAlpha) ? orbitAlpha : DefaultCameraAlpha;
        const beta = orbitBeta != null && !isNaN(orbitBeta) ? orbitBeta : DefaultCameraBeta;
        const radius = orbitRadius != null && !isNaN(orbitRadius) ? orbitRadius : DefaultCameraRadius;
        this._defaultAlpha = alpha;
        this._defaultBeta = beta;
        this._defaultRadius = radius;

        if (_options?.cameraTarget) {
            const tx = _options.cameraTarget[0];
            const ty = _options.cameraTarget[1];
            const tz = _options.cameraTarget[2];
            this._defaultTarget = {
                x: tx != null && !isNaN(tx) ? tx : 0,
                y: ty != null && !isNaN(ty) ? ty : 0,
                z: tz != null && !isNaN(tz) ? tz : 0,
            };
        }

        this._camera = createArcRotateCamera(alpha, beta, radius, this._defaultTarget);
        this._scene.camera = this._camera;

        this._detachControl = attachControl(this._camera, this._engine.canvas as HTMLCanvasElement, this._scene);

        // Track pointer activity for auto-orbit idle detection
        const onPointerActivity = () => {
            this._lastPointerTime = performance.now();
        };
        this._engine.canvas.addEventListener("pointerdown", onPointerActivity);
        this._engine.canvas.addEventListener("pointermove", onPointerActivity);
        this._engine.canvas.addEventListener("wheel", onPointerActivity);

        // Clear color — initialize base field from options, then push to engine.
        this._clearColor.r = _options?.clearColor?.[0] ?? 0;
        this._clearColor.g = _options?.clearColor?.[1] ?? 0;
        this._clearColor.b = _options?.clearColor?.[2] ?? 0;
        this._clearColor.a = _options?.clearColor?.[3] ?? 0;
        this._applyClearColor();

        // Auto-orbit, environment config, animation speed, and hot spots are initialized
        // inline at the field declarations.

        // Post processing — apply the initial Viewer state (loaded from options at field init
        // time above) to `scene.imageProcessing`, which still holds Lite's defaults until we
        // push our values. We bypass the public setter because the fields are already at the
        // target values, so the setter would dedup and skip the scene apply.
        this._applyImageProcessingToScene();

        // Shadow config — route through updateShadows so unsupported "high" is normalized to "normal"
        if (_options?.shadowConfig?.quality) {
            observePromise(this.updateShadows({ quality: _options.shadowConfig.quality }));
        }

        // Per-frame callback
        onBeforeRender(this._scene, (deltaMs) => {
            if (this._isDisposed) {
                return;
            }

            this._updateAutoOrbit(deltaMs);
            this._pollAnimationState();

            this.onAfterRenderObservable.notifyObservers();
        });

        // Start the render loop immediately (empty scene renders clear color)
        observePromise(this._beginRendering());

        // Initial loads — each will restart the render loop to pick up new renderables
        const initialLightingUrl = _options?.environmentLighting ?? DefaultViewerOptions.environmentLighting;
        const initialSkyboxUrl = _options?.environmentSkybox ?? DefaultViewerOptions.environmentSkybox;

        // If lighting and skybox URLs are the same, do one combined load. Otherwise do them separately.
        if (initialLightingUrl === initialSkyboxUrl) {
            if (initialLightingUrl !== "none") {
                observePromise(this.loadEnvironment(initialLightingUrl));
            }
        } else {
            if (initialLightingUrl !== "none") {
                observePromise(this.loadEnvironment(initialLightingUrl, { lighting: true, skybox: false }));
            }
            if (initialSkyboxUrl !== "none") {
                observePromise(this.loadEnvironment(initialSkyboxUrl, { lighting: false, skybox: true }));
            }
        }

        if (_options?.source) {
            observePromise(this.loadModel(_options.source));
        }
    }

    // ── Clear Color ──

    /** @internal */
    protected override _applyClearColor(): void {
        const cc = this._scene.clearColor;
        cc.r = this._clearColor.r;
        cc.g = this._clearColor.g;
        cc.b = this._clearColor.b;
        cc.a = this._clearColor.a;
    }

    // ── Camera ──

    /** @internal Lite stores auto-orbit state on the base class fields and consults them in its idle loop. No engine push needed. */
    protected override _applyCameraAutoOrbitEnabled(): void {}

    /** @internal Lite stores auto-orbit state on the base class fields. */
    protected override _applyCameraAutoOrbitSpeed(): void {}

    /** @internal Lite stores auto-orbit state on the base class fields. */
    protected override _applyCameraAutoOrbitDelay(): void {}

    public resetCamera(reframe?: boolean): void {
        this._camera.alpha = this._defaultAlpha;
        this._camera.beta = this._defaultBeta;
        this._camera.radius = this._defaultRadius;
        // Mutate the existing target ObservableVec3 in place — replacing it with a plain object
        // would silently lose Lite's ObservableVec3 dirty-tracking, which is what notifies the
        // camera that its world matrix needs to recompute when target changes.
        this._camera.target.x = this._defaultTarget.x;
        this._camera.target.y = this._defaultTarget.y;
        this._camera.target.z = this._defaultTarget.z;

        if (reframe) {
            // TODO: compute bounds from loaded meshes when Lite exposes bounding info
        }
    }

    public updateCamera(pose: { alpha?: number; beta?: number; radius?: number; targetX?: number; targetY?: number; targetZ?: number }): void {
        if (pose.alpha !== undefined) {
            this._camera.alpha = pose.alpha;
        }
        if (pose.beta !== undefined) {
            this._camera.beta = pose.beta;
        }
        if (pose.radius !== undefined) {
            this._camera.radius = pose.radius;
        }

        const target = this._camera.target;
        if (pose.targetX !== undefined) {
            target.x = pose.targetX;
        }
        if (pose.targetY !== undefined) {
            target.y = pose.targetY;
        }
        if (pose.targetZ !== undefined) {
            target.z = pose.targetZ;
        }
    }

    private _frameCameraToModel(): void {
        const bounds = this._computeModelBounds();
        if (!bounds) {
            return;
        }
        // Mutate the existing target ObservableVec3 in place — replacing it with a plain object
        // would silently lose Lite's ObservableVec3 dirty-tracking, which is what notifies the
        // camera that its world matrix needs to recompute when target changes.
        this._camera.target.x = bounds.center[0];
        this._camera.target.y = bounds.center[1];
        this._camera.target.z = bounds.center[2];
        // Camera radius (= distance from target) sized to the bounding-sphere diameter * 1.5,
        // matching the previous size*1.5 framing distance.
        this._camera.radius = bounds.radius * 3;
        // Scale near/far planes to the model size. Lite's arc-rotate defaults (0.1 / 1000) clip
        // models that are much smaller (camera ends up inside the near plane) or much larger
        // (model extends beyond the far plane) than ~1 unit. Mirrors Lite's
        // `frameSceneToActiveCamera` heuristic: near = radius * 0.01, far = radius * 1000.
        this._camera.nearPlane = bounds.radius * 0.01;
        this._camera.farPlane = bounds.radius * 1000;
    }

    /**
     * Compute the aggregate world-space bounding box of the loaded model, accounting for
     * animation.
     *
     * Delegates to Lite's {@link computeMaxExtents}, which steps through the currently-selected
     * animation group and unions every sampled pose. This captures the full swept volume of
     * node (TRS), skeletal, and morph-target animation — so skinned models like the
     * acrobaticPlane glTF frame correctly instead of reporting their (much smaller) bind-pose
     * AABB. Meshes are gathered with {@link getContainerMeshes} so Viewer-added meshes (e.g. the
     * shadow-receiver disc) are excluded.
     *
     * The result is cached for the lifetime of the loaded model (reset in
     * `_unloadCurrentModel`) so the two consumers — `_frameCameraToModel` (camera target +
     * radius + near/far planes) and `_setupShadows` (light positioning, ground placement,
     * frustum sizing) — share a single animation sweep rather than stepping it twice.
     *
     * @returns aggregate `min`, `max`, `center`, and bounding-sphere `radius`
     *   (= half the diagonal), or `null` if the model has no bounds info.
     */
    private _computeModelBounds(): { min: [number, number, number]; max: [number, number, number]; center: [number, number, number]; radius: number } | null {
        if (!this._container) {
            return null;
        }
        if (this._cachedModelBounds) {
            return this._cachedModelBounds;
        }

        const meshes = getContainerMeshes(this._container);
        if (meshes.length === 0) {
            return null;
        }

        // Sample the selected animation so the bounds cover the model's full motion.
        const animationGroup = this._getActiveAnimationGroup();
        const extents = computeMaxExtents(meshes, animationGroup, this._engine);

        let minX = Infinity,
            minY = Infinity,
            minZ = Infinity;
        let maxX = -Infinity,
            maxY = -Infinity,
            maxZ = -Infinity;
        for (const extent of extents) {
            // Skip meshes that contributed no geometry (inverted extent).
            if (extent.minimum[0] > extent.maximum[0]) {
                continue;
            }
            if (extent.minimum[0] < minX) {
                minX = extent.minimum[0];
            }
            if (extent.minimum[1] < minY) {
                minY = extent.minimum[1];
            }
            if (extent.minimum[2] < minZ) {
                minZ = extent.minimum[2];
            }
            if (extent.maximum[0] > maxX) {
                maxX = extent.maximum[0];
            }
            if (extent.maximum[1] > maxY) {
                maxY = extent.maximum[1];
            }
            if (extent.maximum[2] > maxZ) {
                maxZ = extent.maximum[2];
            }
        }
        if (minX > maxX) {
            return null;
        }

        const dx = maxX - minX;
        const dy = maxY - minY;
        const dz = maxZ - minZ;
        const radius = Math.sqrt(dx * dx + dy * dy + dz * dz) / 2;
        this._cachedModelBounds = {
            min: [minX, minY, minZ],
            max: [maxX, maxY, maxZ],
            center: [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2],
            radius,
        };
        return this._cachedModelBounds;
    }

    // ── Environment ──

    /** @internal Lite has no engine state for intensity. */
    protected override _applyEnvironmentIntensity(): void {}

    /** @internal Lite has no engine state for blur. */
    protected override _applyEnvironmentBlur(): void {}

    /** @internal */
    protected override _applyEnvironmentRotation(): void {
        if (this._scene.envRotationY !== undefined) {
            this._scene.envRotationY = this._environmentRotation;
        }
    }

    /** @internal */
    protected override async _loadEnvironmentImpl(
        url: Nullable<string | undefined>,
        options: ResolvedLoadEnvironmentOptions,
        abortSignal: AbortSignal | undefined,
        compositeAbortSignal: AbortSignal
    ): Promise<void> {
        const updateLighting = options.lighting;
        const updateSkybox = options.skybox;

        // Resolve the target URLs for lighting and skybox after applying the update.
        const targetLightingUrl = updateLighting ? (url ?? null) : this._currentLightingUrl;
        const targetSkyboxUrl = updateSkybox ? (url ?? null) : this._currentSkyboxUrl;

        // No-op: nothing actually changes.
        if (targetLightingUrl === this._currentLightingUrl && targetSkyboxUrl === this._currentSkyboxUrl) {
            return;
        }

        try {
            // Babylon Lite's current public API has no way to remove or replace existing env state:
            // - `liteLoadEnvironment` and `loadHdrEnvironment` always set `scene._envTextures` and push
            //   skybox/ground builders, but they don't remove anything that's already there.
            // - There's no PBR-scene-compatible standalone skybox loader.
            // We allow ADDING new state where there was none, but throw on any REPLACEMENT.
            if (this._currentLightingUrl !== null && targetLightingUrl !== this._currentLightingUrl) {
                const action = targetLightingUrl === null ? "remove" : "replace";
                throw new Error(
                    `Babylon Lite cannot ${action} the loaded environment lighting ("${this._currentLightingUrl}"${targetLightingUrl === null ? "" : ` → "${targetLightingUrl}"`}). ` +
                        `Recreate the Viewer to change the environment.`
                );
            }
            if (this._currentSkyboxUrl !== null && targetSkyboxUrl !== this._currentSkyboxUrl) {
                const action = targetSkyboxUrl === null ? "remove" : "replace";
                throw new Error(
                    `Babylon Lite cannot ${action} the loaded environment skybox ("${this._currentSkyboxUrl}"${targetSkyboxUrl === null ? "" : ` → "${targetSkyboxUrl}"`}). ` +
                        `Recreate the Viewer to change the environment.`
                );
            }

            // Skybox-only addition with no lighting yet: Lite's env loader requires a lighting URL,
            // and we cannot pick a default lighting silently — that would change a side the caller
            // didn't ask to change.
            if (!updateLighting && updateSkybox && this._currentLightingUrl === null) {
                throw new Error("Babylon Lite cannot add a skybox before lighting has been loaded. " + "Load lighting first, or update lighting and skybox together.");
            }

            const effectiveLightingUrl = targetLightingUrl ?? "auto";
            const resolvedLightingUrl = effectiveLightingUrl === "auto" ? (await import("./defaultEnvironment")).default : effectiveLightingUrl;
            const ext = getExtension(resolvedLightingUrl, options.extension);

            // Lite's `loadHdrEnvironment` cannot suppress its skybox build. So:
            // - `lighting: true, skybox: false` with .hdr → would build an unwanted skybox. Throw.
            // - `lighting: true, skybox: true` (or skybox-only with same URL) → fine.
            if (ext === ".hdr" && !updateSkybox) {
                throw new Error(
                    "Babylon Lite cannot load only the lighting from a .hdr URL — `loadHdrEnvironment` always builds a skybox. " +
                        "Update lighting and skybox together, or use a .env URL."
                );
            }

            if (ext === ".hdr") {
                await loadHdrEnvironment(this._scene, resolvedLightingUrl, {
                    skipGround: true,
                    skyboxSize: 20,
                });
                this._currentLightingUrl = effectiveLightingUrl;
                this._currentSkyboxUrl = effectiveLightingUrl;
            } else {
                const resolvedSkyboxUrl = targetSkyboxUrl === "auto" ? (await import("./defaultEnvironment")).default : (targetSkyboxUrl ?? undefined);
                // Note: when skybox-only is requested but lighting already exists, we still call
                // liteLoadEnvironment with the existing lighting URL — this re-fetches and re-uploads
                // the cubemap (wasteful) but correctly builds the requested skybox. Per the contract
                // ("honoring by re-loading is OK"), this is acceptable.
                await liteLoadEnvironment(this._scene, resolvedLightingUrl, {
                    brdfUrl: (await import("./defaultBRDF")).default,
                    skyboxUrl: resolvedSkyboxUrl,
                    skipSkybox: !updateSkybox,
                    skipGround: true,
                    skyboxSize: 20,
                });
                this._currentLightingUrl = effectiveLightingUrl;
                if (updateSkybox) {
                    this._currentSkyboxUrl = targetSkyboxUrl;
                }
            }

            if (this._environmentRotation !== 0) {
                this._scene.envRotationY = this._environmentRotation;
            }

            // Lite's env loader unconditionally overwrites `scene.imageProcessing` (toneMappingEnabled,
            // exposure, contrast) with its own defaults — clobbering whatever the Viewer set during
            // construction or via subsequent `postProcessing` setter calls. Re-push our committed
            // values so the user-facing post-processing state survives env loads.
            this._applyImageProcessingToScene();

            // Re-register the scene so that the env loader's deferred builders are processed
            // and the new skybox/ground renderables land in the draw buckets. Lite only fills
            // `_opaqueRenderables` etc. at registerScene() time.
            if (this._renderLoopRunning) {
                await this._beginRendering();
            }

            throwIfAborted(abortSignal, compositeAbortSignal);

            this.onEnvironmentChanged.notifyObservers();
        } catch (e) {
            if (!(e instanceof AbortError)) {
                this.onEnvironmentError.notifyObservers(e);
            }
            throw e;
        }
    }

    // ── Post Processing ──

    public get postProcessing(): Readonly<PostProcessing> {
        return {
            toneMapping: this._toneMapping,
            contrast: this._contrast,
            exposure: this._exposure,
            ssao: this._ssaoOption,
        };
    }

    public set postProcessing(value: Partial<Readonly<PostProcessing>>) {
        let changed = false;
        if (value.toneMapping !== undefined && value.toneMapping !== this._toneMapping) {
            this._toneMapping = value.toneMapping;
            changed = true;
        }
        if (value.exposure !== undefined && value.exposure !== this._exposure) {
            this._exposure = value.exposure;
            changed = true;
        }
        if (value.contrast !== undefined && value.contrast !== this._contrast) {
            this._contrast = value.contrast;
            changed = true;
        }
        if (value.ssao !== undefined && value.ssao !== this._ssaoOption) {
            this._ssaoOption = value.ssao;
            if (value.ssao !== "disabled") {
                Logger.Warn("Viewer: SSAO is not supported by Babylon Lite.");
            }
            changed = true;
        }
        if (changed) {
            this._applyImageProcessingToScene();
            this.onPostProcessingChanged.notifyObservers();
        }
    }

    /**
     * Push the Viewer's committed post-processing state (`_toneMapping`, `_exposure`,
     * `_contrast`) into `scene.imageProcessing`. Called from the `postProcessing` setter
     * whenever the user-facing state actually changes, and again after env loads (Lite's env
     * loader overwrites `scene.imageProcessing` with its own defaults, so we have to re-push
     * our values).
     *
     * SSAO has no `scene.imageProcessing` slot in Lite — it's tracked in `_ssaoOption` but
     * doesn't render anything yet (Lite has no SSAO support).
     */
    private _applyImageProcessingToScene(): void {
        const liteType = toneMappingToLiteType(this._toneMapping);
        this._scene.imageProcessing.toneMappingEnabled = liteType !== undefined;
        if (liteType !== undefined) {
            this._scene.imageProcessing.toneMappingType = liteType;
        }
        this._scene.imageProcessing.exposure = this._exposure;
        this._scene.imageProcessing.contrast = this._contrast;
    }

    // ── Shadows ──

    /**
     * Updates the shadow configuration.
     * @param value The new shadow configuration.
     * @param abortSignal Optional signal that can be used to abort the update externally.
     * @returns A promise that resolves when the shadow update completes.
     */
    public override async updateShadows(value: Partial<Readonly<ShadowParams>>, abortSignal?: AbortSignal): Promise<void> {
        if (value.quality === "high") {
            throw new Error("Babylon Lite does not support 'high' shadow quality. Use 'normal' or 'none'.");
        }
        return await super.updateShadows(value, abortSignal);
    }

    /**
     * @internal
     * Lite cannot cleanly add or remove shadow infrastructure (light, ground disc, shadow generator)
     * after the scene has been registered. Adding meshes post-register requires re-running deferred
     * GPU builders, which corrupts the existing model's pipeline state. Reloading the model breaks
     * for similar reasons (the previous scene state isn't fully torn down).
     *
     * For now, shadow quality is effectively fixed at the value provided in the initial constructor
     * options: `_setupShadows` runs once during `_loadModelImpl` (before `addToScene` and the first
     * `registerScene`), so initial setup works correctly. Subsequent calls to `updateShadows` change
     * the committed `_shadowQuality` field but do not re-run shadow setup. Callers that need to
     * change shadow quality should recreate the viewer.
     */
    protected override async _updateShadowsImpl(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        quality: ShadowQuality,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        abortSignal: AbortSignal | undefined,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        internalAbortSignal: AbortSignal
    ): Promise<void> {
        Logger.Warn(
            "Babylon Lite cannot toggle shadow quality after the model is loaded. " +
                "Set `shadowConfig.quality` in the viewer constructor options instead, or recreate the viewer to change shadow rendering."
        );
    }

    private _setupShadows(): void {
        if (!this._container || this._shadowQuality === "none") {
            return;
        }

        // Caster meshes: snapshot the scene's flat mesh list BEFORE we add the ground disc, so the
        // disc isn't itself treated as a shadow caster. (`container.entities` for glTF only
        // contains the root TransformNode, so filtering entities directly always returns empty.)
        const casterMeshes = [...this._scene.meshes];
        if (casterMeshes.length === 0) {
            return;
        }

        // Bounds for ground placement, ground sizing, and shadow light positioning. Falls back
        // to a unit cube if no mesh has bounds info — shadows still set up sensibly.
        const bounds = this._computeModelBounds() ?? {
            min: [-1, -1, -1],
            max: [1, 1, 1],
            center: [0, 0, 0],
            radius: 1,
        };
        const minY = bounds.min[1];
        const [cx, cy, cz] = bounds.center;
        const radius = bounds.radius;

        // Directional light. Position it well outside the model along the negated light direction
        // so Lite's directional shadow camera (placed at light.position looking in light.direction)
        // sees the model in front of it. With the default (0, 0, 0) position, the model — which
        // typically sits with its base at or above origin — would be behind the shadow camera and
        // get clipped, leaving the shadow map empty. (Mirrors the full Viewer's positionFactor
        // logic: light.position = -direction * radius * 3.)
        const lightDir: [number, number, number] = [0.5, -1, 0.5];
        const dirLen = Math.sqrt(lightDir[0] ** 2 + lightDir[1] ** 2 + lightDir[2] ** 2);
        const positionFactor = radius * 3;
        const light = createDirectionalLight(lightDir, 1);
        light.position.set(cx - (lightDir[0] / dirLen) * positionFactor, cy - (lightDir[1] / dirLen) * positionFactor, cz - (lightDir[2] / dirLen) * positionFactor);
        addToScene(this._scene, light);

        // Shadow ground disc. Lite's PBR pipeline requires `baseColorTexture` and `ormTexture` on
        // every PBR material (even if unused), so we provide tiny 1×1 solid textures. The
        // `shadowOnly: true` flag enables Lite's shadow-only shader path, which mirrors BJS's
        // `BackgroundMaterial.shadowOnly`: the surface is invisible everywhere except where shadow
        // falls on it, where it appears in `shadowOnlyColor`.
        //
        // Disc radius is intentionally enormous (~1000× the model radius) so the disc is
        // effectively an infinite ground plane. Animated models can move/translate well outside
        // a tightly-fit ground without the cast shadow clipping at the disc edge. The disc itself
        // is alpha-zero outside the shadow region, so the visible scene is unchanged.
        const groundRadius = radius * 1000;
        const ground = createDisc(this._engine, { radius: groundRadius, tessellation: 64 });
        ground.rotation.x = Math.PI / 2;
        ground.position.y = minY;
        ground.receiveShadows = true;
        ground.material = createPbrMaterial({
            // TODO: This was based on the babylon lite shadow-only branch.
            //       Revisit when we have settled on a shadow approach.
            // mode: "shadowOnly",
            // color: [0, 0, 0],
            // // Use the natural ESM falloff (falloff = 1) so the penumbra fades smoothly. With
            // // a tight model-fit frustum the ESM gradient is already at the right scale; values
            // // > 1 collapse the gradient into a hard aliased edge. Cap the maximum darkness via
            // // `alpha` so the shadow looks soft rather than pitch black.
            // falloff: 1,
            alpha: 0.5,
            alphaBlend: true,
        });
        addToScene(this._scene, ground);

        // Shadow generator. Lite drives shadow rendering from `light.shadowGenerator`, not from a
        // separate scene-level list — so attaching to the light is the load-bearing step here.
        // Casters are registered separately via `setShadowTaskCasterMeshes`: pass only the model
        // meshes, since including the ground disc would cause the disc to occlude itself in the
        // shadow map.
        //
        // ESM (exponential shadow map) FP16 precision and scale invariance both pivot on the
        // caster's NDC-depth fraction. The shader stores `exp(-depthScale * NDC_depth)` per
        // texel; with depthScale=50 (Lite default), values for NDC > ~0.2 underflow to zero in
        // FP16, collapsing the soft penumbra into a binary silhouette → hard aliased shadow
        // edge.
        //
        // Counter-intuitively, the fix is to make orthoMaxZ much LARGER than the model + light
        // distance, not smaller: a wide depth range puts the entire caster at small NDC depth
        // where ESM exp values stay near 1 and FP16 has plenty of precision. The blur kernel
        // (fixed in texels) then produces the visible penumbra by smearing those near-1 values
        // toward zero across the silhouette boundary.
        //
        // Setting orthoMaxZ = positionFactor * 100 makes the caster's NDC-depth fraction (~0.7%)
        // invariant to model scale, so the shadow looks identical for a 16 cm airplane and a
        // 5 m UFO.
        const orthoMinZ = 0;
        const orthoMaxZ = positionFactor * 100;
        this._shadowGenerator = createEsmDirectionalShadowGenerator(this._engine, light, {
            orthoMinZ,
            orthoMaxZ,
        });
        setShadowTaskCasterMeshes(this._shadowGenerator, casterMeshes);
        light.shadowGenerator = this._shadowGenerator ?? undefined;
    }

    // ── Model Loading ──

    /** @internal */
    protected override async _loadModelImpl(
        source: string | File | ArrayBufferView | undefined,
        options: ViewerLoadModelOptions | undefined,
        abortSignal: AbortSignal | undefined,
        internalAbortSignal: AbortSignal
    ): Promise<void> {
        // Source `undefined` flows through from `resetModel`. Treat as "unload, no new load".
        if (source === undefined) {
            const hadModel = this._modelSource !== null;
            this._unloadCurrentModel();
            if (hadModel) {
                this.onModelChanged.notifyObservers(null);
            }
            return;
        }

        const loadOperation = this._beginLoadOperation();
        try {
            if (typeof source !== "string") {
                Logger.Warn("Viewer: Only string URLs are supported for model loading. File and ArrayBufferView sources are not supported.");
                throw new Error("Unsupported model source type");
            }

            // Unload previous model
            this._unloadCurrentModel();

            // Load new model
            const url = source;
            if (options?.pluginExtension) {
                // Append extension hint if provided
                const ext = options.pluginExtension.startsWith(".") ? options.pluginExtension : `.${options.pluginExtension}`;
                if (!url.toLowerCase().endsWith(ext.toLowerCase())) {
                    // The Lite loader determines format from URL extension;
                    // for now we just trust the URL.
                }
            }

            const container = await loadGltf(this._engine, url);

            throwIfAborted(abortSignal, internalAbortSignal);

            this._container = container;
            this._modelSource = source;

            // Set up animation state BEFORE `addToScene` registers the tick callback. This way the
            // very first tick of the new render loop sees only the selected group as eligible to
            // tick — preventing any "wrong animation" flash on the first rendered frame.
            // (Lite's `createAnimationGroups` sets every clip to auto-play; we need exactly one to
            // be active at all times.)
            this._setupAnimations();

            // Add to scene and rebuild renderables
            addToScene(this._scene, container);

            // Frame the camera to the model BEFORE the first rendered frame, so the model never
            // appears briefly at the previous (default) camera position.
            this._frameCameraToModel();

            // Setup shadows BEFORE the first rendered frame so the shadow ground's deferred GPU
            // builder is processed by the upcoming `registerScene` (Lite only runs deferred builders
            // during `registerScene`; meshes added afterwards stay invisible until re-registration).
            if (this._shadowQuality !== "none") {
                this._setupShadows();
            }

            await this._beginRendering();

            // Apply clear color from model if present
            if (container.clearColor) {
                this._scene.clearColor = container.clearColor;
                this.onClearColorChanged.notifyObservers();
            }

            // Apply material variant from options
            if (this._options?.selectedMaterialVariant) {
                this.selectedMaterialVariant = this._options.selectedMaterialVariant;
            }

            this.onModelChanged.notifyObservers(source);
        } catch (e) {
            if (!(e instanceof AbortError)) {
                this.onModelError.notifyObservers(e);
            }
            throw e;
        } finally {
            loadOperation.dispose();
        }
    }

    private _unloadCurrentModel(): void {
        // Reset animation state
        this._selectedAnimation = -1;
        this._wasPlaying = false;
        this._lastProgress = -1;

        // Reset material variant
        if (this._container && this._selectedMaterialVariant !== null) {
            resetVariant(this._container);
            this._selectedMaterialVariant = null;
        }

        // Remove shadows
        this._shadowGenerator = null;

        this._container = null;
        this._modelSource = null;
        this._cachedModelBounds = null;
    }

    // ── Animation ──

    public get animations(): readonly string[] {
        const groups = this._container?.animationGroups;
        if (!groups || groups.length === 0) {
            return [];
        }
        return groups.map((g) => g.name);
    }

    public get selectedAnimation(): number {
        return this._selectedAnimation;
    }

    public set selectedAnimation(index: number) {
        const groups = this._container?.animationGroups;
        if (!groups || groups.length === 0) {
            this._selectedAnimation = -1;
            this.onSelectedAnimationChanged.notifyObservers();
            return;
        }

        const newIndex = index >= 0 && index < groups.length ? index : -1;
        if (newIndex === this._selectedAnimation) {
            return;
        }

        // Capture whether the previously-active animation was playing so we can preserve play state
        // across selection (matches full Viewer's behavior).
        const previousActive = this._getActiveAnimationGroup();
        const wasPlaying = previousActive?.isPlaying ?? false;

        this._selectedAnimation = newIndex;
        this._isolateSelectedAnimation();

        this.onSelectedAnimationChanged.notifyObservers();

        if (wasPlaying) {
            this.playAnimation();
        }
    }

    public get animationSpeed(): number {
        return this._animationSpeed;
    }

    public set animationSpeed(value: number) {
        this._animationSpeed = value;

        const group = this._getActiveAnimationGroup();
        if (group) {
            group.speedRatio = value;
        }

        this.onAnimationSpeedChanged.notifyObservers();
    }

    public get isAnimationPlaying(): boolean {
        const group = this._getActiveAnimationGroup();
        return group ? group.isPlaying : false;
    }

    public get animationProgress(): number {
        const group = this._getActiveAnimationGroup();
        if (!group || group.duration <= 0) {
            return 0;
        }
        // currentTime is in seconds; duration is also in seconds
        return Math.min(group.currentTime / group.duration, 1);
    }

    public set animationProgress(value: number) {
        const group = this._getActiveAnimationGroup();
        if (!group || group.duration <= 0) {
            return;
        }

        // goToFrame expects a frame number at 60 fps
        const targetSeconds = value * group.duration;
        const frameAt60fps = targetSeconds * 60;
        goToFrame(group, frameAt60fps);

        this.onAnimationProgressChanged.notifyObservers();
    }

    public toggleAnimation(): void {
        if (this.isAnimationPlaying) {
            observePromise(this.pauseAnimation());
        } else {
            this.playAnimation();
        }
    }

    public playAnimation(): void {
        const group = this._getActiveAnimationGroup();
        if (group) {
            group.speedRatio = this._animationSpeed;
            group.loopAnimation = true;
            litePlayAnimation(group);
            this.onIsAnimationPlayingChanged.notifyObservers();
        }
    }

    public async pauseAnimation(): Promise<void> {
        const group = this._getActiveAnimationGroup();
        if (group) {
            litePauseAnimation(group);
            this.onIsAnimationPlayingChanged.notifyObservers();
        }
    }

    private _getActiveAnimationGroup(): LiteAnimationGroup | null {
        const groups = this._container?.animationGroups;
        if (!groups || this._selectedAnimation < 0 || this._selectedAnimation >= groups.length) {
            return null;
        }
        return groups[this._selectedAnimation];
    }

    /**
     * Enforces the "only the selected animation may be playing" invariant by stopping every
     * non-selected animation group (`stopAnimation` blocks subsequent ticks) and pausing the
     * selected one (so its tick still runs and applies the current-time pose).
     *
     * Lite's `tickAnimation` writes bone TRS every frame regardless of `playing`, so a merely
     * paused non-selected group would still pollute the mesh transforms with its current frame's
     * pose. Only `stopAnimation` blocks tick entirely.
     *
     * The selected group's tick must be allowed to run (so switching between animations updates
     * the pose). Lite's `pauseAnimation` doesn't un-stop a previously-stopped group, so we run
     * `playAnimation` then `pauseAnimation` to clear the stopped flag while ending up paused —
     * the tick fires next frame and applies the time-0 pose.
     */
    private _isolateSelectedAnimation(): void {
        const groups = this._container?.animationGroups;
        if (!groups) {
            return;
        }
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            if (i === this._selectedAnimation) {
                litePlayAnimation(group);
                litePauseAnimation(group);
            } else {
                liteStopAnimation(group);
            }
        }
    }

    private _setupAnimations(): void {
        const groups = this._container?.animationGroups;
        if (!groups || groups.length === 0) {
            this._selectedAnimation = -1;
            return;
        }

        // Select the first animation by default, or the one specified in options
        const defaultIndex = this._options?.selectedAnimation ?? 0;
        this._selectedAnimation = defaultIndex >= 0 && defaultIndex < groups.length ? defaultIndex : 0;

        // Stop every non-selected group; pause the selected one. See `_isolateSelectedAnimation`.
        this._isolateSelectedAnimation();

        this.onSelectedAnimationChanged.notifyObservers();

        // Auto-play if configured
        if (this._options?.animationAutoPlay) {
            this.playAnimation();
        }
    }

    private _pollAnimationState(): void {
        const group = this._getActiveAnimationGroup();
        if (!group) {
            return;
        }

        const isPlaying = group.isPlaying;
        if (isPlaying !== this._wasPlaying) {
            this._wasPlaying = isPlaying;
            this.onIsAnimationPlayingChanged.notifyObservers();
        }

        if (isPlaying) {
            const progress = group.duration > 0 ? group.currentTime / group.duration : 0;
            if (progress !== this._lastProgress) {
                this._lastProgress = progress;
                this.onAnimationProgressChanged.notifyObservers();
            }
        }
    }

    // ── Material Variants ──

    public get materialVariants(): readonly string[] {
        if (!this._container) {
            return [];
        }
        return getVariantNames(this._container);
    }

    public get selectedMaterialVariant(): Nullable<string> {
        return this._selectedMaterialVariant;
    }

    public set selectedMaterialVariant(value: Nullable<string>) {
        if (value === this._selectedMaterialVariant) {
            return;
        }
        this._selectedMaterialVariant = value;

        if (this._container) {
            if (value === null) {
                resetVariant(this._container);
            } else {
                selectVariant(this._container, value);
            }
        }

        this.onSelectedMaterialVariantChanged.notifyObservers();
    }

    // ── Hot Spots ──

    public get camerasAsHotSpots(): boolean {
        return this._camerasAsHotSpots;
    }

    public set camerasAsHotSpots(value: boolean) {
        if (value === this._camerasAsHotSpots) {
            return;
        }
        this._camerasAsHotSpots = value;
        this.onCamerasAsHotSpotsChanged.notifyObservers();
    }

    public queryHotSpot(_name: string, _result: ViewerHotSpotResult): boolean {
        Logger.Warn("Viewer: Hot spot queries are not supported by Babylon Lite.");
        return false;
    }

    public focusHotSpot(_name: string): boolean {
        Logger.Warn("Viewer: Hot spot focus is not supported by Babylon Lite.");
        return false;
    }

    // ── State ──

    public get isModelLoaded(): boolean {
        return this._container !== null;
    }

    /** @internal */
    /** @internal */
    protected override _resetEnvironment(): void {
        // Reset scalar env config to defaults (matches full Viewer's reset hook). The setter fires
        // `onEnvironmentConfigurationChanged` and is independent of the URL state.
        this.environmentConfig = {
            intensity: this._options?.environmentConfig?.intensity ?? DefaultViewerOptions.environmentConfig.intensity,
            blur: this._options?.environmentConfig?.blur ?? DefaultViewerOptions.environmentConfig.blur,
            rotation: this._options?.environmentConfig?.rotation ?? DefaultViewerOptions.environmentConfig.rotation,
        };
        observePromise(this.resetEnvironment());
        const initialLightingUrl = this._options?.environmentLighting ?? DefaultViewerOptions.environmentLighting;
        const initialSkyboxUrl = this._options?.environmentSkybox ?? DefaultViewerOptions.environmentSkybox;
        if (initialLightingUrl === initialSkyboxUrl) {
            if (initialLightingUrl !== "none") {
                observePromise(this.loadEnvironment(initialLightingUrl));
            }
        } else {
            if (initialLightingUrl !== "none") {
                observePromise(this.loadEnvironment(initialLightingUrl, { lighting: true, skybox: false }));
            }
            if (initialSkyboxUrl !== "none") {
                observePromise(this.loadEnvironment(initialSkyboxUrl, { lighting: false, skybox: true }));
            }
        }
    }

    /** @internal */
    protected override _resetAnimation(): void {
        const groups = this._container?.animationGroups;
        if (groups && groups.length > 0) {
            this._selectedAnimation = this._options?.selectedAnimation ?? 0;
            this._animationSpeed = this._options?.animationSpeed ?? 1;
            this._isolateSelectedAnimation();
            this.onSelectedAnimationChanged.notifyObservers();
            this.onAnimationSpeedChanged.notifyObservers();

            if (this._options?.animationAutoPlay) {
                this.playAnimation();
            }
        }
    }

    /**
     * @internal
     * Lite currently does not support bounds-based reframing or interpolated camera transitions, so the
     * `interpolate` parameter is ignored. Once Lite gains those capabilities, the canonical reset order
     * inherited from `ViewerBase` will produce the same behavior as the full Viewer.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    protected override _resetCamera(interpolate: boolean): void {
        this.resetCamera();
        this.cameraAutoOrbit = this._options?.cameraAutoOrbit
            ? {
                  enabled: this._options.cameraAutoOrbit.enabled ?? DefaultViewerOptions.cameraAutoOrbit.enabled,
                  speed: this._options.cameraAutoOrbit.speed ?? DefaultViewerOptions.cameraAutoOrbit.speed,
                  delay: this._options.cameraAutoOrbit.delay ?? DefaultViewerOptions.cameraAutoOrbit.delay,
              }
            : { ...DefaultViewerOptions.cameraAutoOrbit };
    }

    /** @internal */
    protected override _resetPostProcessing(): void {
        // Route through the public setter so we get free dedup + observable-notify-on-change
        // semantics, matching what the user-facing API does.
        this.postProcessing = {
            toneMapping: this._options?.postProcessing?.toneMapping ?? DefaultViewerOptions.postProcessing.toneMapping,
            contrast: this._options?.postProcessing?.contrast ?? DefaultViewerOptions.postProcessing.contrast,
            exposure: this._options?.postProcessing?.exposure ?? DefaultViewerOptions.postProcessing.exposure,
            ssao: this._options?.postProcessing?.ssao ?? DefaultViewerOptions.postProcessing.ssao,
        };
    }

    /**
     * Registers the scene with the engine and starts the render loop.
     * Safe to call multiple times — stops and re-registers if already running.
     */
    private async _beginRendering(): Promise<void> {
        if (this._isDisposed) {
            return;
        }
        if (this._renderLoopRunning) {
            stopEngine(this._engine);
            unregisterScene(this._scene);
            this._renderLoopRunning = false;
        }
        await registerScene(this._scene);
        await startEngine(this._engine);
        this._renderLoopRunning = true;
    }

    public override dispose(): void {
        if (this._isDisposed) {
            return;
        }

        // Detach camera controls
        this._detachControl?.();
        this._detachControl = null;

        // Clean up pointer listeners
        this._engine.canvas.removeEventListener("pointerdown", this._onPointerActivity);
        this._engine.canvas.removeEventListener("pointermove", this._onPointerActivity);
        this._engine.canvas.removeEventListener("wheel", this._onPointerActivity);

        // Unload model
        this._unloadCurrentModel();

        // Stop and dispose engine/scene
        stopEngine(this._engine);
        unregisterScene(this._scene);
        disposeScene(this._scene);
        disposeEngine(this._engine);

        // Base disposes observables and sets _isDisposed = true
        super.dispose();
    }

    // ── Private Helpers ──

    private _onPointerActivity = (): void => {
        this._lastPointerTime = performance.now();
    };

    private _updateAutoOrbit(deltaMs: number): void {
        if (!this._autoOrbitEnabled) {
            this._autoOrbitIdleTime = 0;
            return;
        }

        const now = performance.now();
        const idleMs = now - this._lastPointerTime;

        if (idleMs < this._autoOrbitDelay) {
            this._autoOrbitIdleTime = 0;
            return;
        }

        this._autoOrbitIdleTime += deltaMs;

        // Rotate alpha based on speed (radians per second)
        const rotationAmount = (this._autoOrbitSpeed * deltaMs) / 1000;
        this._camera.alpha += rotationAmount;
    }
}

/**
 * Creates a new {@link Viewer} instance for the given canvas element.
 * @param canvas The HTML canvas element to render into.
 * @param options Optional viewer configuration.
 * @returns A promise that resolves to the initialized Viewer.
 */
export async function CreateViewerForCanvas(canvas: HTMLCanvasElement, options?: CanvasViewerOptions): Promise<Viewer> {
    const engine = await createEngine(canvas, { alphaMode: "premultiplied" });
    return new Viewer(engine, options);
}
