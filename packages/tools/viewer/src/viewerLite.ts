/* eslint-disable @typescript-eslint/naming-convention */
import { type Nullable } from "core/index";
import { AbortError } from "core/Misc/error";
import { Logger } from "core/Misc/logger";

import {
    addToScene,
    attachControl,
    createArcRotateCamera,
    createDirectionalLight,
    createEngine,
    createSceneContext,
    createShadowGenerator,
    disposeEngine,
    disposeScene,
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
    startEngine,
    stopEngine,
    unregisterScene,
    type ArcRotateCamera,
    type AssetContainer,
    type DirectionalLight,
    type EngineContext,
    type AnimationGroup as LiteAnimationGroup,
    type ShadowGenerator as LiteShadowGenerator,
    type Mesh,
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
    /** Retained reference to the shadow directional light for cleanup when shadows are reconfigured. */
    private _shadowLight: DirectionalLight | null = null;

    // Model
    private _container: AssetContainer | null = null;
    /** The source that was passed to the most recent {@link loadModel} call, for notifications. */
    private _modelSource: Nullable<string | File | ArrayBufferView> = null;

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

        this._detachControl = attachControl(this._camera, this._engine.canvas, this._scene);

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

        // Post processing — apply user-provided overrides to the scene's image processing
        if (_options?.postProcessing) {
            this._applyPostProcessing(_options.postProcessing);
        }

        // Shadow config — route through updateShadows so unsupported "high" is normalized to "normal"
        if (_options?.shadowConfig?.quality) {
            observePromise(this.updateShadows({ quality: _options.shadowConfig.quality }));
        }

        // Per-frame callback
        onBeforeRender(this._scene, (_deltaMs) => {
            if (this._isDisposed) {
                return;
            }

            this._updateAutoOrbit(_deltaMs);
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
        this._camera.target = { x: this._defaultTarget.x, y: this._defaultTarget.y, z: this._defaultTarget.z };

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
        const meshes = this._scene.meshes;
        if (!meshes || meshes.length === 0) {
            return;
        }

        // Compute aggregate bounding box from scene meshes
        let minX = Infinity,
            minY = Infinity,
            minZ = Infinity;
        let maxX = -Infinity,
            maxY = -Infinity,
            maxZ = -Infinity;
        let hasBounds = false;

        for (const mesh of meshes) {
            const m = mesh as any;
            if (m.boundMin && m.boundMax) {
                minX = Math.min(minX, m.boundMin[0]);
                minY = Math.min(minY, m.boundMin[1]);
                minZ = Math.min(minZ, m.boundMin[2]);
                maxX = Math.max(maxX, m.boundMax[0]);
                maxY = Math.max(maxY, m.boundMax[1]);
                maxZ = Math.max(maxZ, m.boundMax[2]);
                hasBounds = true;
            }
        }

        if (!hasBounds) {
            return;
        }

        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const cz = (minZ + maxZ) / 2;
        const sx = maxX - minX;
        const sy = maxY - minY;
        const sz = maxZ - minZ;
        const size = Math.sqrt(sx * sx + sy * sy + sz * sz);
        const radius = size * 1.5;

        this._camera.target = { x: cx, y: cy, z: cz };
        this._camera.radius = radius;
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
        this._applyPostProcessing(value);
        this.onPostProcessingChanged.notifyObservers();
    }

    private _applyPostProcessing(value: Partial<Readonly<PostProcessing>>): void {
        if (value.toneMapping !== undefined) {
            this._toneMapping = value.toneMapping;
            const liteType = toneMappingToLiteType(value.toneMapping);
            this._scene.imageProcessing.toneMappingEnabled = liteType !== undefined;
            if (liteType !== undefined) {
                this._scene.imageProcessing.toneMappingType = liteType;
            }
        }
        if (value.exposure !== undefined) {
            this._exposure = value.exposure;
            this._scene.imageProcessing.exposure = value.exposure;
        }
        if (value.contrast !== undefined) {
            this._contrast = value.contrast;
            this._scene.imageProcessing.contrast = value.contrast;
        }
        if (value.ssao !== undefined) {
            this._ssaoOption = value.ssao;
            if (value.ssao !== "disabled") {
                Logger.Warn("Viewer: SSAO is not supported by Babylon Lite.");
            }
        }
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

    /** @internal */
    protected override async _updateShadowsImpl(
        quality: ShadowQuality,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        abortSignal: AbortSignal | undefined,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        internalAbortSignal: AbortSignal
    ): Promise<void> {
        // Tear down existing shadow state
        if (this._shadowLight !== null) {
            this._shadowLight = null;
        }
        this._shadowGenerator = null;

        if (quality === "normal" && this._container) {
            this._setupShadows();
        }
    }

    private _setupShadows(): void {
        if (!this._container || this._shadowQuality === "none") {
            return;
        }

        const light = createDirectionalLight([0.5, -1, 0.5], 1);
        addToScene(this._scene, light);
        this._shadowLight = light;

        // Collect caster meshes from the container
        const casterMeshes = this._container.entities.filter((e): e is Mesh => "vertices" in e);

        if (casterMeshes.length > 0) {
            this._shadowGenerator = createShadowGenerator(this._engine, light, casterMeshes);
            addToScene(this._scene, this._shadowGenerator);
        }
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

            await this._beginRendering();

            // Apply clear color from model if present
            if (container.clearColor) {
                this._scene.clearColor = container.clearColor;
                this.onClearColorChanged.notifyObservers();
            }

            // Setup shadows if configured
            if (this._shadowQuality !== "none") {
                this._setupShadows();
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
        this._shadowLight = null;

        this._container = null;
        this._modelSource = null;
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
        // currentFrame is in seconds; duration is also in seconds
        return Math.min(group.currentFrame / group.duration, 1);
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
     * non-selected animation group (`_stopped = true`, blocks subsequent ticks) and pausing the
     * selected one (`ctrl.playing = false`, but tick still runs and applies its time-0 pose).
     *
     * Lite's `tickAnimation` writes bone TRS every frame regardless of `playing`, so a merely
     * paused non-selected group would still pollute the mesh transforms with its current frame's
     * pose. Only `_stopped = true` blocks tick entirely.
     */
    private _isolateSelectedAnimation(): void {
        const groups = this._container?.animationGroups;
        if (!groups) {
            return;
        }
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            if (i === this._selectedAnimation) {
                // Pause and ensure tick is allowed (clearing `_stopped` from any prior `stopAnimation`).
                // Lite's `pauseAnimation` only sets `ctrl.playing = false` — it does not clear `_stopped`,
                // so a selected group that was previously stopped (because it was non-selected) wouldn't
                // tick and apply its frame-0 pose without this.
                group._stopped = false;
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
            const progress = group.duration > 0 ? group.currentFrame / group.duration : 0;
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
        this._applyPostProcessing({
            toneMapping: this._options?.postProcessing?.toneMapping ?? DefaultViewerOptions.postProcessing.toneMapping,
            contrast: this._options?.postProcessing?.contrast ?? DefaultViewerOptions.postProcessing.contrast,
            exposure: this._options?.postProcessing?.exposure ?? DefaultViewerOptions.postProcessing.exposure,
            ssao: this._options?.postProcessing?.ssao ?? DefaultViewerOptions.postProcessing.ssao,
        });
        this.onPostProcessingChanged.notifyObservers();
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
            unregisterScene(this._engine, this._scene);
            this._renderLoopRunning = false;
        }
        await registerScene(this._engine, this._scene);
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
        unregisterScene(this._engine, this._scene);
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
